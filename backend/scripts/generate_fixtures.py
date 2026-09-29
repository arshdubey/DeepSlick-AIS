import json
import os
import random
import math
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), '../../data')
os.makedirs(DATA_DIR, exist_ok=True)

def generate_slick_polygon():
    # Mocking a polygon off the coast of Mumbai (approx 19.0 N, 72.8 E)
    center_lon = 72.8
    center_lat = 19.0
    num_points = 20
    coordinates = []
    
    for i in range(num_points):
        angle = (i / num_points) * 2 * math.pi
        # Irregular shape
        radius = 0.05 + random.uniform(0, 0.02)
        lon = center_lon + radius * math.cos(angle)
        lat = center_lat + radius * math.sin(angle) * 0.8 # Flatten a bit
        coordinates.append([lon, lat])
    
    coordinates.append(coordinates[0]) # Close polygon
    
    feature = {
        "type": "Feature",
        "properties": {
            "id": "SLICK-994A",
            "detection_time": datetime.utcnow().isoformat() + "Z",
            "confidence": 0.94,
            "area_km2": 4.2
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [coordinates]
        }
    }
    
    with open(os.path.join(DATA_DIR, 'slick_incident.geojson'), 'w') as f:
        json.dump(feature, f, indent=2)

def generate_ais_tracks():
    # 1 culprit intersecting the backward drift, 5 decoys
    start_time = datetime.utcnow() - timedelta(hours=36)
    
    ships = [
        {"mmsi": "111111111", "name": "M/V OCEAN STAR", "type": "Tanker", "is_culprit": True},
        {"mmsi": "222222222", "name": "SEA TRADER", "type": "Cargo", "is_culprit": False},
        {"mmsi": "333333333", "name": "AQUA MAIDEN", "type": "Fishing", "is_culprit": False},
        {"mmsi": "444444444", "name": "PACIFIC BREEZE", "type": "Tanker", "is_culprit": False},
        {"mmsi": "555555555", "name": "GULF RUNNER", "type": "Pleasure", "is_culprit": False},
        {"mmsi": "666666666", "name": "IRON DUKE", "type": "Cargo", "is_culprit": False}
    ]
    
    records = []
    
    for ship in ships:
        # Starting positions (randomly scattered around the region)
        lon = 72.5 + random.uniform(-1, 1)
        lat = 18.5 + random.uniform(-1, 1)
        
        if ship['is_culprit']:
            # Culprit path heads towards (72.8, 19.0) approx 24 hours ago
            lon = 72.8
            lat = 19.1
            
        for i in range(72): # 36 hours, every 30 mins
            t = start_time + timedelta(minutes=30*i)
            
            # Move ship
            if ship['is_culprit'] and i > 40 and i < 50:
                # Transponder gap simulation
                continue
                
            lon += random.uniform(-0.02, 0.02)
            lat += random.uniform(-0.02, 0.02)
            
            records.append({
                "mmsi": ship["mmsi"],
                "name": ship["name"],
                "type": ship["type"],
                "timestamp": t.isoformat() + "Z",
                "lon": lon,
                "lat": lat,
                "sog": random.uniform(10, 15),
                "cog": random.uniform(0, 360)
            })
            
    # Save as JSON for simplicity, or CSV
    with open(os.path.join(DATA_DIR, 'ais_tracks.json'), 'w') as f:
        json.dump(records, f, indent=2)

if __name__ == "__main__":
    generate_slick_polygon()
    generate_ais_tracks()
    print("Mock data generated in /data directory.")
