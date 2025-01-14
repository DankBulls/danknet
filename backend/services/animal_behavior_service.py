from datetime import datetime
import numpy as np
from typing import Dict, List, Tuple

class AnimalBehaviorService:
    def __init__(self):
        self.animal_patterns = {
            'elk': {
                'rutting_start': (9, 1),   # September 1
                'rutting_end': (10, 15),   # October 15
                'calving_start': (5, 15),  # May 15
                'calving_end': (6, 30),    # June 30
                'migration_spring': (4, 1), # April 1
                'migration_fall': (11, 1),  # November 1
                'elevation_preference': {
                    'summer': (2000, 3500),  # meters
                    'winter': (1500, 2500)
                },
                'activity_periods': ['dawn', 'dusk']
            },
            'deer': {
                'rutting_start': (10, 15),  # October 15
                'rutting_end': (12, 15),    # December 15
                'fawning_start': (5, 15),   # May 15
                'fawning_end': (6, 30),     # June 30
                'migration_spring': (3, 15), # March 15
                'migration_fall': (10, 15),  # October 15
                'elevation_preference': {
                    'summer': (1500, 3000),
                    'winter': (1000, 2000)
                },
                'activity_periods': ['dawn', 'dusk', 'night']
            },
            'moose': {
                'rutting_start': (9, 15),   # September 15
                'rutting_end': (10, 31),    # October 31
                'calving_start': (5, 1),    # May 1
                'calving_end': (6, 15),     # June 15
                'migration_spring': (4, 15), # April 15
                'migration_fall': (10, 31),  # October 31
                'elevation_preference': {
                    'summer': (2000, 3000),
                    'winter': (1500, 2500)
                },
                'activity_periods': ['dawn', 'dusk', 'day']
            }
        }
        
    def _is_date_between(self, check_date: datetime, start: Tuple[int, int], end: Tuple[int, int]) -> float:
        """Calculate how deep into a period a date is (0-1)"""
        def _to_day_of_year(month, day):
            return datetime(check_date.year, month, day).timetuple().tm_yday
            
        start_day = _to_day_of_year(start[0], start[1])
        end_day = _to_day_of_year(end[0], end[1])
        check_day = check_date.timetuple().tm_yday
        
        # Handle year wraparound (e.g., Nov-Feb period)
        if end_day < start_day:
            end_day += 365
            if check_day < start_day:
                check_day += 365
                
        if start_day <= check_day <= end_day:
            return (check_day - start_day) / (end_day - start_day)
        return 0.0

    def _get_time_of_day_factor(self, current_time: datetime) -> Dict[str, float]:
        """Calculate activity factors for different times of day"""
        hour = current_time.hour + current_time.minute / 60
        
        # Define time periods
        dawn_center = 6.5   # 6:30 AM
        dusk_center = 19.5  # 7:30 PM
        period_width = 2.0  # 2 hours
        
        # Calculate activity factors using gaussian curves
        dawn_factor = np.exp(-((hour - dawn_center) ** 2) / (2 * period_width ** 2))
        dusk_factor = np.exp(-((hour - dusk_center) ** 2) / (2 * period_width ** 2))
        day_factor = np.sin(np.pi * (hour - dawn_center) / (dusk_center - dawn_center)) if dawn_center <= hour <= dusk_center else 0
        night_factor = 1 - day_factor
        
        return {
            'dawn': dawn_factor,
            'dusk': dusk_factor,
            'day': day_factor,
            'night': night_factor
        }

    def get_behavior_factors(self, animal_type: str, date: datetime, elevation: float) -> Dict[str, float]:
        """Get behavior factors for a specific animal type at a given time and elevation"""
        pattern = self.animal_patterns.get(animal_type)
        if not pattern:
            return None
            
        # Calculate breeding season factor
        breeding_factor = self._is_date_between(date, 
                                              pattern['rutting_start'],
                                              pattern['rutting_end'])
                                              
        # Calculate birth season factor
        birth_season = self._is_date_between(date,
                                           pattern['calving_start'] if 'calving_start' in pattern else pattern['fawning_start'],
                                           pattern['calving_end'] if 'calving_end' in pattern else pattern['fawning_end'])
                                           
        # Calculate migration factor
        migration_spring = self._is_date_between(date,
                                               pattern['migration_spring'],
                                               (pattern['migration_spring'][0] + 1, pattern['migration_spring'][1]))
        migration_fall = self._is_date_between(date,
                                             pattern['migration_fall'],
                                             (pattern['migration_fall'][0] + 1, pattern['migration_fall'][1]))
        migration_factor = max(migration_spring, migration_fall)
        
        # Calculate elevation preference
        season = 'summer' if 4 <= date.month <= 9 else 'winter'
        elev_min, elev_max = pattern['elevation_preference'][season]
        elevation_factor = max(0, min(1, (elevation - elev_min) / (elev_max - elev_min)))
        
        # Calculate time of day activity
        time_factors = self._get_time_of_day_factor(date)
        activity_factor = max(time_factors[period] for period in pattern['activity_periods'])
        
        return {
            'breeding_factor': breeding_factor,
            'birth_season_factor': birth_season,
            'migration_factor': migration_factor,
            'elevation_factor': elevation_factor,
            'activity_factor': activity_factor
        }
