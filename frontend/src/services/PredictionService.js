import axios from 'axios';

// Animal-specific behavior patterns
const ANIMAL_PATTERNS = {
  elk: {
    elevation: {
      optimal: [6000, 10000],
      weight: 0.6
    },
    cover: {
      optimal: 0.7,
      weight: 0.7
    },
    waterDistance: {
      optimal: 500, // meters
      weight: 0.8
    },
    temperature: {
      optimal: [45, 65],
      weight: 0.7
    }
  },
  mule_deer: {
    elevation: {
      optimal: [4000, 8000],
      weight: 0.5
    },
    cover: {
      optimal: 0.5,
      weight: 0.8
    },
    waterDistance: {
      optimal: 800, // meters
      weight: 0.7
    },
    temperature: {
      optimal: [40, 70],
      weight: 0.6
    }
  },
  turkey: {
    elevation: {
      optimal: [2000, 6000],
      weight: 0.4
    },
    cover: {
      optimal: 0.6,
      weight: 0.9
    },
    waterDistance: {
      optimal: 400, // meters
      weight: 0.6
    },
    temperature: {
      optimal: [50, 75],
      weight: 0.5
    }
  }
};

// Time of day preferences by species
const TIME_WEIGHTS = {
  elk: {
    DAWN: 1.0,
    MORNING: 0.8,
    MIDDAY: 0.3,
    AFTERNOON: 0.5,
    DUSK: 1.0,
    NIGHT: 0.4
  },
  mule_deer: {
    DAWN: 1.0,
    MORNING: 0.7,
    MIDDAY: 0.2,
    AFTERNOON: 0.4,
    DUSK: 1.0,
    NIGHT: 0.6
  },
  turkey: {
    DAWN: 1.0,
    MORNING: 0.9,
    MIDDAY: 0.5,
    AFTERNOON: 0.4,
    DUSK: 0.8,
    NIGHT: 0.0 // Turkeys roost at night
  }
};

// Weather condition impacts by species
const WEATHER_IMPACTS = {
  elk: {
    WIND_TOLERANCE: 15, // mph
    RAIN_TOLERANCE: 0.3, // inches
    PRESSURE_SENSITIVITY: 0.4
  },
  mule_deer: {
    WIND_TOLERANCE: 12,
    RAIN_TOLERANCE: 0.2,
    PRESSURE_SENSITIVITY: 0.5
  },
  turkey: {
    WIND_TOLERANCE: 8,
    RAIN_TOLERANCE: 0.1,
    PRESSURE_SENSITIVITY: 0.6
  }
};

// Seasonal patterns by species
const SEASONAL_PATTERNS = {
  elk: {
    SPRING: {
      elevation: [5000, 8000],
      foodSources: ['grass', 'forbs', 'shrubs'],
      breeding: false,
      migration: 'upward',
      migrationFactor: 0.8
    },
    SUMMER: {
      elevation: [7000, 10000],
      foodSources: ['grass', 'forbs', 'leaves'],
      breeding: false,
      migration: 'stable',
      migrationFactor: 0.3
    },
    FALL: {
      elevation: [6000, 9000],
      foodSources: ['grass', 'shrubs', 'bark'],
      breeding: true,
      migration: 'downward',
      migrationFactor: 0.9
    },
    WINTER: {
      elevation: [4000, 7000],
      foodSources: ['bark', 'twigs', 'dried grass'],
      breeding: false,
      migration: 'stable',
      migrationFactor: 0.4
    }
  },
  mule_deer: {
    SPRING: {
      elevation: [4000, 7000],
      foodSources: ['grass', 'forbs', 'new growth'],
      breeding: false,
      migration: 'upward',
      migrationFactor: 0.7
    },
    SUMMER: {
      elevation: [6000, 8000],
      foodSources: ['leaves', 'forbs', 'fruits'],
      breeding: false,
      migration: 'stable',
      migrationFactor: 0.3
    },
    FALL: {
      elevation: [5000, 7000],
      foodSources: ['shrubs', 'acorns', 'remaining fruits'],
      breeding: true,
      migration: 'downward',
      migrationFactor: 0.8
    },
    WINTER: {
      elevation: [3000, 6000],
      foodSources: ['twigs', 'bark', 'evergreen leaves'],
      breeding: false,
      migration: 'stable',
      migrationFactor: 0.4
    }
  },
  turkey: {
    SPRING: {
      elevation: [2000, 5000],
      foodSources: ['insects', 'seeds', 'new growth'],
      breeding: true,
      migration: 'upward',
      migrationFactor: 0.5
    },
    SUMMER: {
      elevation: [2500, 6000],
      foodSources: ['insects', 'berries', 'seeds'],
      breeding: false,
      migration: 'stable',
      migrationFactor: 0.2
    },
    FALL: {
      elevation: [2000, 5000],
      foodSources: ['acorns', 'nuts', 'berries'],
      breeding: false,
      migration: 'downward',
      migrationFactor: 0.6
    },
    WINTER: {
      elevation: [1500, 4000],
      foodSources: ['nuts', 'dried berries', 'buds'],
      breeding: false,
      migration: 'stable',
      migrationFactor: 0.3
    }
  }
};

// Food source ratings by type
const FOOD_SOURCE_RATINGS = {
  grass: { spring: 0.9, summer: 0.8, fall: 0.6, winter: 0.3 },
  forbs: { spring: 0.9, summer: 0.7, fall: 0.4, winter: 0.1 },
  shrubs: { spring: 0.6, summer: 0.7, fall: 0.8, winter: 0.5 },
  bark: { spring: 0.3, summer: 0.2, fall: 0.4, winter: 0.7 },
  leaves: { spring: 0.8, summer: 0.9, fall: 0.5, winter: 0.1 },
  acorns: { spring: 0.1, summer: 0.1, fall: 0.9, winter: 0.6 },
  insects: { spring: 0.8, summer: 0.9, fall: 0.6, winter: 0.1 },
  berries: { spring: 0.2, summer: 0.9, fall: 0.7, winter: 0.3 },
  nuts: { spring: 0.2, summer: 0.1, fall: 0.9, winter: 0.7 },
  seeds: { spring: 0.7, summer: 0.8, fall: 0.9, winter: 0.5 }
};

class PredictionService {
  constructor() {
    this.weatherApi = axios.create({
      baseURL: 'https://api.openweathermap.org/data/2.5',
      params: {
        appid: process.env.REACT_APP_OPENWEATHER_API_KEY
      }
    });
  }

  // Get current weather conditions for a location
  async getWeatherConditions(lat, lon) {
    try {
      const response = await this.weatherApi.get('/weather', {
        params: {
          lat,
          lon,
          units: 'imperial'
        }
      });

      return {
        temperature: response.data.main.temp,
        windSpeed: response.data.wind.speed,
        precipitation: response.data.rain ? response.data.rain['1h'] || 0 : 0,
        pressure: response.data.main.pressure * 0.02953 // Convert hPa to inHg
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  // Get time of day factor for specific species
  getTimeOfDayFactor(hour, species) {
    const timeWeights = TIME_WEIGHTS[species];
    if (hour >= 5 && hour < 7) return timeWeights.DAWN;
    if (hour >= 7 && hour < 10) return timeWeights.MORNING;
    if (hour >= 10 && hour < 14) return timeWeights.MIDDAY;
    if (hour >= 14 && hour < 17) return timeWeights.AFTERNOON;
    if (hour >= 17 && hour < 19) return timeWeights.DUSK;
    return timeWeights.NIGHT;
  }

  // Calculate weather score for specific species
  calculateWeatherScore(conditions, species) {
    if (!conditions) return 0;

    const impacts = WEATHER_IMPACTS[species];
    let score = 0;
    let weights = 0;

    // Temperature factor
    const pattern = ANIMAL_PATTERNS[species];
    const tempFactor = this.calculateRangeFactor(
      conditions.temperature,
      pattern.temperature.optimal[0],
      pattern.temperature.optimal[1]
    );
    score += tempFactor * pattern.temperature.weight;
    weights += pattern.temperature.weight;

    // Wind speed factor
    const windFactor = this.calculateRangeFactor(
      conditions.windSpeed,
      0,
      impacts.WIND_TOLERANCE
    );
    score += windFactor * 0.6;
    weights += 0.6;

    // Precipitation factor
    const precipFactor = this.calculateRangeFactor(
      conditions.precipitation,
      0,
      impacts.RAIN_TOLERANCE
    );
    score += precipFactor * 0.5;
    weights += 0.5;

    // Pressure factor
    const pressureFactor = this.calculateRangeFactor(
      conditions.pressure,
      29.8,
      30.2
    );
    score += pressureFactor * impacts.PRESSURE_SENSITIVITY;
    weights += impacts.PRESSURE_SENSITIVITY;

    return score / weights;
  }

  // Calculate terrain score for specific species
  calculateTerrainScore(location, terrainData, species) {
    const pattern = ANIMAL_PATTERNS[species];
    let score = 0;
    let weights = 0;

    // Water source proximity
    if (terrainData.waterSources) {
      const waterFactor = this.calculateProximityScore(
        location,
        terrainData.waterSources,
        pattern.waterDistance.optimal
      );
      score += waterFactor * pattern.waterDistance.weight;
      weights += pattern.waterDistance.weight;
    }

    // Elevation suitability
    if (terrainData.elevation) {
      const elevationFactor = this.calculateRangeFactor(
        terrainData.elevation,
        pattern.elevation.optimal[0],
        pattern.elevation.optimal[1]
      );
      score += elevationFactor * pattern.elevation.weight;
      weights += pattern.elevation.weight;
    }

    // Cover density
    if (terrainData.coverDensity) {
      const coverFactor = this.calculateRangeFactor(
        terrainData.coverDensity,
        pattern.cover.optimal * 0.8,
        pattern.cover.optimal * 1.2
      );
      score += coverFactor * pattern.cover.weight;
      weights += pattern.cover.weight;
    }

    return score / weights;
  }

  // Calculate how close a value is to the optimal range
  calculateRangeFactor(value, min, max) {
    if (value >= min && value <= max) return 1;
    
    const midpoint = (min + max) / 2;
    const range = max - min;
    const distance = Math.abs(value - midpoint);
    
    return Math.max(0, 1 - (distance / range));
  }

  // Calculate score based on proximity to points of interest
  calculateProximityScore(location, points, optimalDistance) {
    const distances = points.map(point => 
      this.calculateDistance(location, point)
    );
    const minDistance = Math.min(...distances);
    return Math.max(0, 1 - (minDistance / optimalDistance)); 
  }

  // Calculate distance between two points in meters
  calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lon - point1.lon) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // Calculate historical factor based on past sightings
  calculateHistoricalFactor(location, historicalData) {
    if (!historicalData || historicalData.length === 0) return 0;

    const recentSightings = historicalData.filter(sighting => {
      const sightingDate = new Date(sighting.timestamp);
      const now = new Date();
      const daysDiff = (now - sightingDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30; // Consider sightings from the last 30 days
    });

    if (recentSightings.length === 0) return 0;

    const proximityScores = recentSightings.map(sighting => {
      const distance = this.calculateDistance(location, {
        lat: sighting.lat,
        lon: sighting.lon
      });
      const daysAgo = (new Date() - new Date(sighting.timestamp)) / (1000 * 60 * 60 * 24);
      const timeDecay = Math.exp(-daysAgo / 30); // Exponential decay over 30 days
      return Math.max(0, 1 - (distance / 1000)) * timeDecay;
    });

    return Math.max(...proximityScores);
  }

  // Get current season
  getSeason(date) {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'SPRING';
    if (month >= 5 && month <= 7) return 'SUMMER';
    if (month >= 8 && month <= 10) return 'FALL';
    return 'WINTER';
  }

  // Calculate seasonal adjustment
  calculateSeasonalFactor(location, species, date) {
    const season = this.getSeason(date);
    const pattern = SEASONAL_PATTERNS[species][season];
    
    let score = 0;
    let weights = 0;

    // Elevation adjustment for season
    const elevationFactor = this.calculateRangeFactor(
      location.elevation,
      pattern.elevation[0],
      pattern.elevation[1]
    );
    score += elevationFactor * 0.4;
    weights += 0.4;

    // Migration pattern impact
    if (pattern.migration !== 'stable') {
      score += pattern.migrationFactor * 0.3;
      weights += 0.3;
    }

    // Breeding season impact
    if (pattern.breeding) {
      score += 0.8 * 0.3;
      weights += 0.3;
    }

    return score / weights;
  }

  // Calculate food availability score
  calculateFoodScore(foodSources, species, date) {
    const season = this.getSeason(date).toLowerCase();
    const pattern = SEASONAL_PATTERNS[species][season.toUpperCase()];
    
    let totalScore = 0;
    
    for (const source of foodSources) {
      if (pattern.foodSources.includes(source.type)) {
        const rating = FOOD_SOURCE_RATINGS[source.type][season];
        const distance = this.calculateDistance(source.location, source);
        const proximityFactor = Math.max(0, 1 - (distance / 1000));
        totalScore += rating * proximityFactor;
      }
    }

    return Math.min(1, totalScore / pattern.foodSources.length);
  }

  // Generate predictions for all species
  async generatePredictions(bounds, terrainData, historicalData = []) {
    const predictions = [];
    const now = new Date();
    const hour = now.getHours();

    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLon = (bounds.east + bounds.west) / 2;
    const weather = await this.getWeatherConditions(centerLat, centerLon);

    const species = ['elk', 'mule_deer', 'turkey'];
    const gridSize = 10;
    const latStep = (bounds.north - bounds.south) / gridSize;
    const lonStep = (bounds.east - bounds.west) / gridSize;

    for (const animalType of species) {
      const weatherScore = this.calculateWeatherScore(weather, animalType);
      const timeScore = this.getTimeOfDayFactor(hour, animalType);

      for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
          const lat = bounds.south + (i * latStep);
          const lon = bounds.west + (j * lonStep);
          const location = { lat, lon, elevation: terrainData.elevation };

          const terrainScore = this.calculateTerrainScore(
            location,
            terrainData,
            animalType
          );

          const seasonalFactor = this.calculateSeasonalFactor(
            location,
            animalType,
            now
          );

          const foodScore = this.calculateFoodScore(
            terrainData.foodSources || [],
            animalType,
            now
          );

          const historicalFactor = this.calculateHistoricalFactor(
            location,
            historicalData.filter(h => h.type === animalType)
          );

          const probability = (
            weatherScore * 0.2 +
            timeScore * 0.15 +
            terrainScore * 0.2 +
            seasonalFactor * 0.2 +
            foodScore * 0.15 +
            historicalFactor * 0.1
          );

          const threshold = animalType === 'turkey' ? 0.7 : 0.6;
          if (probability > threshold) {
            predictions.push({
              lat,
              lon,
              probability,
              type: animalType,
              factors: {
                weather: weatherScore,
                time: timeScore,
                terrain: terrainScore,
                seasonal: seasonalFactor,
                food: foodScore,
                historical: historicalFactor
              },
              season: this.getSeason(now),
              breeding: SEASONAL_PATTERNS[animalType][this.getSeason(now)].breeding,
              migration: SEASONAL_PATTERNS[animalType][this.getSeason(now)].migration,
              preferredFood: SEASONAL_PATTERNS[animalType][this.getSeason(now)].foodSources
            });
          }
        }
      }
    }

    return predictions.sort((a, b) => b.probability - a.probability);
  }
}

export default new PredictionService();
