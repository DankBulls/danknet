from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime

@dataclass
class GMUBoundary:
    coordinates: List[Dict[str, float]]  # List of lat/long coordinates
    elevation_range: Dict[str, float]    # min and max elevation

@dataclass
class GMUStats:
    success_rate: float
    total_hunters: int
    total_harvest: int
    year: int

@dataclass
class GMU:
    id: int
    name: str
    region: str
    boundary: GMUBoundary
    area_acres: float
    public_land_percentage: float
    terrain_types: Dict[str, float]  # percentage breakdown of terrain types
    stats: Dict[int, GMUStats]  # yearly statistics
    access_points: List[Dict[str, float]]  # major access point coordinates
    water_sources: List[Dict[str, float]]  # water source locations
    
    def get_success_rate(self, year: Optional[int] = None) -> float:
        """Get success rate for a specific year or latest available"""
        if year is None:
            year = max(self.stats.keys())
        return self.stats.get(year, GMUStats(0, 0, 0, year)).success_rate

    def get_historical_trend(self, years: int = 5) -> List[GMUStats]:
        """Get historical statistics for specified number of years"""
        current_year = datetime.now().year
        return [self.stats.get(year, GMUStats(0, 0, 0, year)) 
                for year in range(current_year - years, current_year + 1)]
