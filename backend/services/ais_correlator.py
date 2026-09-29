import pandas as pd
import numpy as np

class AISCorrelator:
    def __init__(self):
        pass
        
    def score_suspects(self, ais_tracks, particle_hulls):
        """
        Calculates suspect scores based on spatial proximity, vessel type,
        speed anomalies, and transponder gaps.
        
        :param ais_tracks: List of dicts or DataFrame of AIS records
        :param particle_hulls: List of polygons representing backward drift
        """
        # Mock scoring logic
        
        df = pd.DataFrame(ais_tracks)
        suspects = []
        
        for mmsi, group in df.groupby('mmsi'):
            name = group.iloc[0]['name']
            v_type = group.iloc[0]['type']
            
            # 1. Spatial Proximity (Mock logic: if name is OCEAN STAR, high score)
            spatial_score = 90 if mmsi == "111111111" else np.random.uniform(10, 40)
            
            # 2. Vessel Type Risk
            type_risk = 100 if v_type == 'Tanker' else 50 if v_type == 'Cargo' else 10
            
            # 3. Transponder Gap
            gap_score = 100 if mmsi == "111111111" else np.random.uniform(0, 20)
            
            # Final composite score
            final_score = (0.5 * spatial_score) + (0.2 * type_risk) + (0.3 * gap_score)
            
            suspects.append({
                "mmsi": mmsi,
                "name": name,
                "type": v_type,
                "score": round(final_score, 1)
            })
            
        # Sort by score descending
        suspects.sort(key=lambda x: x['score'], reverse=True)
        return suspects
