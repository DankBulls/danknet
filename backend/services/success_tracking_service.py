from datetime import datetime
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
import os
from services.gmu_service import GMUService

class SuccessTrackingService:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.gmu_service = GMUService()
        
    def record_hunt(self, data: Dict) -> bool:
        """Record a hunting trip result"""
        try:
            # Create hunt record
            hunt_query = text("""
                INSERT INTO hunts (
                    user_id, start_date, end_date, gmu_id, 
                    success, animal_type, weapon_type, 
                    weather_conditions, notes
                ) VALUES (
                    :user_id, :start_date, :end_date, :gmu_id,
                    :success, :animal_type, :weapon_type,
                    :weather_conditions, :notes
                ) RETURNING id
            """)
            
            result = self.db.execute(hunt_query, {
                'user_id': data['user_id'],
                'start_date': data['start_date'],
                'end_date': data['end_date'],
                'gmu_id': data['gmu_id'],
                'success': data['success'],
                'animal_type': data['animal_type'],
                'weapon_type': data.get('weapon_type', 'rifle'),
                'weather_conditions': data.get('weather_conditions', {}),
                'notes': data.get('notes', '')
            })
            hunt_id = result.fetchone()[0]
            
            # If successful, record harvest details
            if data['success']:
                harvest_query = text("""
                    INSERT INTO harvests (
                        hunt_id, lat, lon, elevation,
                        time_of_day, distance_meters
                    ) VALUES (
                        :hunt_id, :lat, :lon, :elevation,
                        :time_of_day, :distance_meters
                    )
                """)
                
                self.db.execute(harvest_query, {
                    'hunt_id': hunt_id,
                    'lat': data['harvest_lat'],
                    'lon': data['harvest_lon'],
                    'elevation': data['harvest_elevation'],
                    'time_of_day': data['harvest_time'],
                    'distance_meters': data.get('harvest_distance', 0)
                })
            
            self.db.commit()
            return True
            
        except Exception as e:
            print(f"Error recording hunt: {e}")
            self.db.rollback()
            return False
    
    def get_success_rate(self, 
                        gmu_id: Optional[str] = None,
                        animal_type: Optional[str] = None,
                        date_range: Optional[Tuple[datetime, datetime]] = None,
                        weapon_type: Optional[str] = None) -> Dict:
        """Get success rate statistics with optional filters"""
        query = """
            SELECT 
                COUNT(*) as total_hunts,
                SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_hunts,
                animal_type,
                weapon_type,
                gmu_id
            FROM hunts
            WHERE 1=1
        """
        params = {}
        
        if gmu_id:
            query += " AND gmu_id = :gmu_id"
            params['gmu_id'] = gmu_id
            
        if animal_type:
            query += " AND animal_type = :animal_type"
            params['animal_type'] = animal_type
            
        if date_range:
            query += " AND start_date BETWEEN :start_date AND :end_date"
            params['start_date'] = date_range[0]
            params['end_date'] = date_range[1]
            
        if weapon_type:
            query += " AND weapon_type = :weapon_type"
            params['weapon_type'] = weapon_type
            
        query += " GROUP BY animal_type, weapon_type, gmu_id"
        
        result = self.db.execute(text(query), params)
        
        stats = {
            'total_hunts': 0,
            'successful_hunts': 0,
            'success_rate': 0.0,
            'by_animal': {},
            'by_weapon': {},
            'by_gmu': {}
        }
        
        for row in result:
            stats['total_hunts'] += row.total_hunts
            stats['successful_hunts'] += row.successful_hunts
            
            # Track by animal type
            if row.animal_type not in stats['by_animal']:
                stats['by_animal'][row.animal_type] = {
                    'total': 0, 'success': 0, 'rate': 0.0
                }
            stats['by_animal'][row.animal_type]['total'] += row.total_hunts
            stats['by_animal'][row.animal_type]['success'] += row.successful_hunts
            
            # Track by weapon type
            if row.weapon_type not in stats['by_weapon']:
                stats['by_weapon'][row.weapon_type] = {
                    'total': 0, 'success': 0, 'rate': 0.0
                }
            stats['by_weapon'][row.weapon_type]['total'] += row.total_hunts
            stats['by_weapon'][row.weapon_type]['success'] += row.successful_hunts
            
            # Track by GMU
            if row.gmu_id not in stats['by_gmu']:
                stats['by_gmu'][row.gmu_id] = {
                    'total': 0, 'success': 0, 'rate': 0.0
                }
            stats['by_gmu'][row.gmu_id]['total'] += row.total_hunts
            stats['by_gmu'][row.gmu_id]['success'] += row.successful_hunts
        
        # Calculate success rates
        if stats['total_hunts'] > 0:
            stats['success_rate'] = stats['successful_hunts'] / stats['total_hunts']
            
        for category in ['by_animal', 'by_weapon', 'by_gmu']:
            for key in stats[category]:
                if stats[category][key]['total'] > 0:
                    stats[category][key]['rate'] = (
                        stats[category][key]['success'] / 
                        stats[category][key]['total']
                    )
        
        return stats
    
    def get_harvest_heatmap(self,
                           gmu_id: Optional[str] = None,
                           animal_type: Optional[str] = None,
                           date_range: Optional[Tuple[datetime, datetime]] = None) -> List[Dict]:
        """Get heatmap data of successful harvests"""
        query = """
            SELECT 
                h.lat, h.lon, h.elevation, h.time_of_day,
                hu.animal_type, hu.gmu_id,
                COUNT(*) as harvest_count
            FROM harvests h
            JOIN hunts hu ON h.hunt_id = hu.id
            WHERE 1=1
        """
        params = {}
        
        if gmu_id:
            query += " AND hu.gmu_id = :gmu_id"
            params['gmu_id'] = gmu_id
            
        if animal_type:
            query += " AND hu.animal_type = :animal_type"
            params['animal_type'] = animal_type
            
        if date_range:
            query += " AND hu.start_date BETWEEN :start_date AND :end_date"
            params['start_date'] = date_range[0]
            params['end_date'] = date_range[1]
            
        query += " GROUP BY h.lat, h.lon, h.elevation, h.time_of_day, hu.animal_type, hu.gmu_id"
        
        result = self.db.execute(text(query), params)
        
        heatmap_data = []
        for row in result:
            heatmap_data.append({
                'lat': float(row.lat),
                'lon': float(row.lon),
                'elevation': float(row.elevation),
                'time_of_day': row.time_of_day,
                'animal_type': row.animal_type,
                'gmu_id': row.gmu_id,
                'weight': int(row.harvest_count)
            })
            
        return heatmap_data
    
    def get_success_factors(self,
                          gmu_id: Optional[str] = None,
                          animal_type: Optional[str] = None) -> Dict:
        """Analyze factors contributing to hunting success"""
        # Get harvest data
        query = """
            SELECT 
                h.elevation, h.time_of_day,
                hu.weather_conditions,
                EXTRACT(MONTH FROM hu.start_date) as month
            FROM harvests h
            JOIN hunts hu ON h.hunt_id = hu.id
            WHERE hu.success = true
        """
        params = {}
        
        if gmu_id:
            query += " AND hu.gmu_id = :gmu_id"
            params['gmu_id'] = gmu_id
            
        if animal_type:
            query += " AND hu.animal_type = :animal_type"
            params['animal_type'] = animal_type
            
        result = self.db.execute(text(query), params)
        
        # Analyze success factors
        elevations = []
        times = []
        months = []
        weather_temps = []
        weather_conditions = []
        
        for row in result:
            elevations.append(row.elevation)
            times.append(row.time_of_day)
            months.append(row.month)
            
            if isinstance(row.weather_conditions, dict):
                weather = row.weather_conditions
                weather_temps.append(weather.get('temperature', None))
                weather_conditions.append(weather.get('conditions', None))
        
        # Calculate statistics
        factors = {
            'elevation': {
                'mean': np.mean(elevations) if elevations else None,
                'std': np.std(elevations) if elevations else None,
                'range': (min(elevations), max(elevations)) if elevations else None
            },
            'time_of_day': {
                'most_common': pd.Series(times).mode().iloc[0] if times else None,
                'distribution': pd.Series(times).value_counts().to_dict() if times else {}
            },
            'month': {
                'most_common': pd.Series(months).mode().iloc[0] if months else None,
                'distribution': pd.Series(months).value_counts().to_dict() if months else {}
            },
            'weather': {
                'avg_temp': np.mean(weather_temps) if weather_temps else None,
                'conditions': pd.Series(weather_conditions).value_counts().to_dict() if weather_conditions else {}
            }
        }
        
        return factors
