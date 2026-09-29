import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from celery import Celery
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="DeepSlick-AIS API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("deepslick", broker=redis_url, backend=redis_url)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

@app.get("/")
def health_check():
    return {"status": "online", "service": "DeepSlick-AIS Backend"}

@app.get("/api/v1/incidents")
def get_incidents():
    # Return minimal metadata for dashboard
    return {
        "incidents": [
            {
                "id": "994A",
                "lat": 19.0760,
                "lon": 72.8777,
                "area_km2": 4.2,
                "confidence": "High",
                "time_ago": "2 MINS AGO"
            },
            {
                "id": "993B",
                "lat": 15.3173,
                "lon": 73.7136,
                "area_km2": 1.8,
                "confidence": "Medium",
                "time_ago": "4 HRS AGO"
            }
        ]
    }

@app.get("/api/v1/incidents/{incident_id}")
def get_incident_data(incident_id: str):
    """
    Returns the heavy GeoJSON slick polygon and the raw AIS tracks for the specific incident.
    """
    if incident_id not in ["994A", "993B"]:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    try:
        if incident_id == "994A":
            slick_file = os.path.join(DATA_DIR, "slick_incident.json")
            ais_file = os.path.join(DATA_DIR, "ais_tracks.json")
        else:
            slick_file = os.path.join(DATA_DIR, "slick_993B.json")
            ais_file = os.path.join(DATA_DIR, "ais_993B.json")
            
        with open(slick_file, "r") as f:
            slick_data = json.load(f)
            
        with open(ais_file, "r") as f:
            ais_data = json.load(f)

        # Run RK4 Drift Engine Hindcast & Forecast
        from shapely.geometry import shape
        from services.drift_engine import DriftEngine
        
        geom = slick_data['features'][0]['geometry'] if slick_data.get('type') == 'FeatureCollection' else slick_data['geometry']
        polygon = shape(geom)
        engine = DriftEngine()
        
        # Hindcast (Past 36 hours)
        hindcast_history = engine.hindcast(polygon, num_particles=150, hours=36, dt_minutes=30)
        hindcast_particles = []
        for step_idx, positions in enumerate(hindcast_history):
            for lon, lat in positions:
                hindcast_particles.append([float(lon), float(lat), step_idx])

        # Forecast (Future 36 hours)
        forecast_history = engine.forecast(polygon, num_particles=150, hours=36, dt_minutes=30)
        forecast_particles = []
        for step_idx, positions in enumerate(forecast_history):
            for lon, lat in positions:
                forecast_particles.append([float(lon), float(lat), step_idx])
            
        return {
            "id": incident_id,
            "slick": slick_data,
            "ais": ais_data,
            "drift_particles": hindcast_particles, # Legacy naming, keeping for backward compatibility
            "hindcast_particles": hindcast_particles,
            "forecast_particles": forecast_particles
        }
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Data files not found")

@app.post("/api/v1/ingest")
def run_ingestion_hindcast():
    # Placeholder for kicking off celery tasks
    return {"status": "started", "job_id": "12345"}
