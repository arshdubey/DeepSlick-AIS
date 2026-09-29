import json
import random
from datetime import datetime, timedelta

# Center coordinates for SLICK-993B
lat_center = 15.3173
lon_center = 73.7136

# Generate a small polygon (GeoJSON) around the center
num_points = 8
radius_deg = 0.015 # ~1.5 km
polygon_coords = []
import math
for i in range(num_points):
    angle = (i / num_points) * 2 * math.pi
    # slight randomization
    r = radius_deg * random.uniform(0.8, 1.2)
    lat = lat_center + r * math.sin(angle)
    lon = lon_center + r * math.cos(angle)
    polygon_coords.append([lon, lat])
# Close the polygon
polygon_coords.append(polygon_coords[0])

geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "id": "SLICK-993B",
                "confidence": 0.65,
                "area_km2": 1.8
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon_coords]
            }
        }
    ]
}

with open("slick_993B.json", "w") as f:
    json.dump(geojson, f, indent=2)

# Generate AIS tracks around the area
ais_records = []
vessels = [
    {"mmsi": "222222222", "name": "M/V CORAL", "type": "Cargo", "is_culprit": True},
    {"mmsi": "333333333", "name": "F/V SEA GULL", "type": "Fishing", "is_culprit": False},
    {"mmsi": "444444444", "name": "M/T NEPTUNE", "type": "Tanker", "is_culprit": False}
]

start_time = datetime.utcnow() - timedelta(hours=36)
for ship in vessels:
    # Random starting point within 0.5 degrees
    ship_lat = lat_center + random.uniform(-0.5, 0.5)
    ship_lon = lon_center + random.uniform(-0.5, 0.5)
    
    # Culprit passes exactly through the slick
    if ship["is_culprit"]:
        ship_lat = lat_center - 0.2
        ship_lon = lon_center - 0.2

    for hour in range(36):
        # Move ship
        if ship["is_culprit"]:
            ship_lat += (lat_center - ship_lat) / (36 - hour) + random.uniform(-0.01, 0.01)
            ship_lon += (lon_center - ship_lon) / (36 - hour) + random.uniform(-0.01, 0.01)
        else:
            ship_lat += random.uniform(-0.05, 0.05)
            ship_lon += random.uniform(-0.05, 0.05)

        # 6 pings per hour
        for ping in range(6):
            ping_time = start_time + timedelta(hours=hour, minutes=ping*10)
            ais_records.append({
                "mmsi": ship["mmsi"],
                "name": ship["name"],
                "type": ship["type"],
                "timestamp": ping_time.isoformat() + "Z",
                "lon": ship_lon + random.uniform(-0.005, 0.005),
                "lat": ship_lat + random.uniform(-0.005, 0.005),
                "sog": random.uniform(8, 14),
                "cog": random.uniform(0, 360),
                "is_culprit": ship["is_culprit"]
            })

with open("ais_993B.json", "w") as f:
    json.dump(ais_records, f, indent=2)

print("Generated SLICK-993B mock data.")
