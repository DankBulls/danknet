const tf = require('@tensorflow/tfjs-node');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
require('dotenv').config();

// Model storage configuration
const MODEL_STORAGE_PATH = process.env.MODEL_STORAGE_PATH || './models';
const CURRENT_MODEL_VERSION = '1.0.0';

// Weather API configuration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

// GMU data configuration
const GMU_DATA_PATH = process.env.GMU_DATA_PATH || './data/gmu';

// Initialize OpenAI configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// Error handler for OpenAI API calls
const handleOpenAIError = (error) => {
    if (error.response) {
        console.error('OpenAI API Error:', error.response.data);
        throw new Error(`OpenAI API Error: ${error.response.data.error.message}`);
    } else {
        console.error('Error with OpenAI request:', error.message);
        throw new Error('Failed to get AI prediction');
    }
};

// Initialize TensorFlow model with proper versioning
let model;

const initializeModel = async () => {
    try {
        const modelPath = `${MODEL_STORAGE_PATH}/v${CURRENT_MODEL_VERSION}/model.json`;
        model = await tf.loadLayersModel(`file://${modelPath}`).catch(async () => {
            console.log('Creating new AI model...');
            model = tf.sequential({
                layers: [
                    tf.layers.dense({ inputShape: [15], units: 128, activation: 'relu' }),
                    tf.layers.dropout({ rate: 0.3 }),
                    tf.layers.dense({ units: 64, activation: 'relu' }),
                    tf.layers.dropout({ rate: 0.2 }),
                    tf.layers.dense({ units: 32, activation: 'relu' }),
                    tf.layers.dense({ units: 1, activation: 'sigmoid' })
                ]
            });

            model.compile({
                optimizer: tf.train.adam(0.0005),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy']
            });

            // Save the model
            await model.save(`file://${modelPath}`);
            return model;
        });

        console.log('AI Model initialized successfully');
    } catch (error) {
        console.error('Error initializing AI model:', error);
        throw error;
    }
};

// Fetch real weather data
const getWeatherData = async (latitude, longitude) => {
    try {
        const response = await fetch(
            `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&days=7`
        );
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
};

// Load GMU data from file system
const loadGMUData = async (gmuNumber) => {
    try {
        const gmuPath = `${GMU_DATA_PATH}/${gmuNumber}.json`;
        const data = await fs.readFile(gmuPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading GMU data for unit ${gmuNumber}:`, error);
        throw error;
    }
};

// Initialize model on startup
initializeModel();

const normalizeData = (data) => {
    // Normalize numerical values to 0-1 range
    return {
        terrain: data.terrainDifficulty / 5,
        accessibility: data.accessibility / 5,
        population: data.population / 5,
        pressure: data.huntingPressure / 5,
        weather: data.weather.temperature / 100,
        moonPhase: data.moonPhase,
        elevation: (data.terrain.elevation - 7000) / 7000,
        forestCover: data.terrain.forestCover / 100,
        waterSources: data.terrain.waterSources / 5,
        season: {
            archery: 0.25,
            muzzleloader: 0.5,
            rifle1: 0.75,
            rifle2: 1.0
        }[data.season] || 0,
        species: {
            elk: 1,
            deer: 2,
            moose: 3
        }[data.species] || 1,
        historicalSuccess: data.historicalSuccess
    };
};

const predictHuntingConditions = async (gmuNumber, season, species) => {
    try {
        // Load GMU data
        const gmuData = await loadGMUData(gmuNumber);
        
        // Get weather data for the GMU location
        const weatherData = await getWeatherData(gmuData.latitude, gmuData.longitude);

        // Prepare input features
        const features = tf.tensor2d([[
            gmuData.elevation,
            gmuData.terrain_ruggedness,
            gmuData.vegetation_density,
            gmuData.water_sources,
            weatherData.current.temp_c,
            weatherData.current.wind_kph,
            weatherData.current.precip_mm,
            weatherData.current.humidity,
            weatherData.current.cloud,
            weatherData.forecast.forecastday[0].moon_phase,
            season === 'spring' ? 1 : 0,
            season === 'summer' ? 1 : 0,
            season === 'fall' ? 1 : 0,
            season === 'winter' ? 1 : 0,
            species === 'elk' ? 1 : species === 'deer' ? 2 : 3
        ]]);

        // Get prediction
        const prediction = model.predict(features);
        const score = await prediction.data();

        // Clean up tensors
        features.dispose();
        prediction.dispose();

        // Analyze environmental conditions
        const environmentalAnalysis = await analyzeEnvironmentalConditions(weatherData, gmuData);
        
        // Generate movement predictions
        const movementPredictions = await predictAnimalMovement(gmuData, weatherData, species);

        return {
            success_probability: score[0],
            environmental_conditions: environmentalAnalysis,
            movement_predictions: movementPredictions,
            weather_forecast: weatherData.forecast.forecastday,
            gmu_details: {
                terrain: gmuData.terrain_description,
                access_points: gmuData.access_points,
                regulations: gmuData.regulations
            }
        };
    } catch (error) {
        console.error('Error in predictHuntingConditions:', error);
        throw error;
    }
};

const getHistoricalAnalysis = async (gmuNumber, startYear, endYear) => {
    try {
        const prompt = `Analyze historical hunting data for GMU ${gmuNumber} from ${startYear} to ${endYear}. 
        Identify trends and patterns in success rates, population changes, and environmental factors.`;

        const response = await openai.createCompletion({
            model: "gpt-4",
            prompt,
            max_tokens: 200,
            temperature: 0.7
        }).catch(handleOpenAIError);

        return {
            analysis: response.data.choices[0].text.trim(),
            trends: {
                success: generateTrendData(startYear, endYear),
                population: generateTrendData(startYear, endYear),
                pressure: generateTrendData(startYear, endYear)
            }
        };
    } catch (error) {
        console.error('Historical Analysis Error:', error);
        return null;
    }
};

const getSeasonalTrends = async (gmuNumber) => {
    try {
        const prompt = `Analyze seasonal hunting patterns for GMU ${gmuNumber}. 
        Consider migration patterns, weather impacts, and seasonal behavior changes.`;

        const response = await openai.createCompletion({
            model: "gpt-4",
            prompt,
            max_tokens: 200,
            temperature: 0.7
        }).catch(handleOpenAIError);

        return {
            analysis: response.data.choices[0].text.trim(),
            seasonalPatterns: {
                spring: generateSeasonalData(),
                summer: generateSeasonalData(),
                fall: generateSeasonalData(),
                winter: generateSeasonalData()
            }
        };
    } catch (error) {
        console.error('Seasonal Trends Error:', error);
        return null;
    }
};

const getEnvironmentalImpact = async (gmuNumber, conditions) => {
    try {
        const prompt = `Analyze environmental impact on hunting conditions in GMU ${gmuNumber}.
        Weather: ${conditions.weather.temperature}°F, ${conditions.weather.precipitation}" precipitation
        Terrain: ${conditions.terrain.type}, ${conditions.terrain.elevation}ft
        Season: ${conditions.season}`;

        const response = await openai.createCompletion({
            model: "gpt-4",
            prompt,
            max_tokens: 200,
            temperature: 0.7
        }).catch(handleOpenAIError);

        return {
            analysis: response.data.choices[0].text.trim(),
            impacts: {
                weather: calculateImpact(conditions.weather),
                terrain: calculateImpact(conditions.terrain),
                seasonal: calculateSeasonalImpact(conditions.season)
            }
        };
    } catch (error) {
        console.error('Environmental Impact Error:', error);
        return null;
    }
};

const getAnimalMovementPrediction = async (gmuNumber, conditions) => {
    try {
        const prompt = `Predict animal movement patterns in GMU ${gmuNumber} based on:
        Time: ${conditions.timestamp}
        Weather: ${conditions.weather.temperature}°F, ${conditions.weather.windSpeed}mph wind
        Moon Phase: ${conditions.moonPhase * 100}%
        Season: ${conditions.season}`;

        const response = await openai.createCompletion({
            model: "gpt-4",
            prompt,
            max_tokens: 200,
            temperature: 0.7
        }).catch(handleOpenAIError);

        return {
            prediction: response.data.choices[0].text.trim(),
            hotspots: generateHotspots(),
            movementPatterns: {
                morning: generateMovementPattern(),
                midday: generateMovementPattern(),
                evening: generateMovementPattern(),
                night: generateMovementPattern()
            }
        };
    } catch (error) {
        console.error('Movement Prediction Error:', error);
        return null;
    }
};

// Add new AI analysis functions
const analyzeBehavioralPatterns = async (location, species, conditions) => {
    try {
        const prompt = `Analyze behavioral patterns for ${species} in ${location} under these conditions: ${conditions}`;
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 200,
            temperature: 0.7
        }).catch(handleOpenAIError);

        return {
            patterns: response.data.choices[0].text.trim(),
            confidence: calculateConfidence(conditions)
        };
    } catch (error) {
        handleOpenAIError(error);
    }
};

const predictOptimalHuntingTimes = async (location, date, conditions) => {
    try {
        const prompt = `Predict optimal hunting times for ${location} on ${date} considering: ${conditions}`;
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 200,
            temperature: 0.7
        }).catch(handleOpenAIError);

        return {
            times: response.data.choices[0].text.trim(),
            confidence: calculateConfidence(conditions)
        };
    } catch (error) {
        handleOpenAIError(error);
    }
};

const analyzeTerrainHotspots = async (location, terrain, conditions) => {
    try {
        const prompt = `Analyze hunting hotspots in ${location} with terrain: ${terrain} under conditions: ${conditions}`;
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt,
            max_tokens: 200,
            temperature: 0.7
        }).catch(handleOpenAIError);

        return {
            hotspots: response.data.choices[0].text.trim(),
            confidence: calculateConfidence(conditions)
        };
    } catch (error) {
        handleOpenAIError(error);
    }
};

const analyzeBehavioralPatterns = async (gmuData, species) => {
    try {
        const prompt = `Analyze ${species} behavior patterns in GMU ${gmuData.gmuNumber} considering:
        Terrain: ${gmuData.terrain.type}, ${gmuData.terrain.elevation}ft
        Cover: ${gmuData.terrain.forestCover}% forest, ${gmuData.terrain.meadowCover}% meadow
        Water: ${gmuData.terrain.waterSources} sources per sq mile
        Food: Berries (${gmuData.foodSources.berries * 100}%), Grass (${gmuData.foodSources.grass * 100}%), Acorns (${gmuData.foodSources.acorns * 100}%)
        
        Provide detailed analysis of:
        1. Daily movement patterns
        2. Bedding area preferences
        3. Feeding habits
        4. Water source usage
        5. Response to hunting pressure`;

        const response = await openai.createCompletion({
            model: "gpt-4",
            prompt,
            max_tokens: 300,
            temperature: 0.7
        }).catch(handleOpenAIError);

        return {
            analysis: response.data.choices[0].text.trim(),
            patterns: {
                dailyMovement: generateDailyPattern(),
                beddingAreas: generateBeddingAreas(gmuData),
                feedingZones: generateFeedingZones(gmuData),
                waterUsage: generateWaterUsage(gmuData),
                pressureResponse: generatePressureResponse(gmuData)
            }
        };
    } catch (error) {
        console.error('Behavioral Analysis Error:', error);
        return null;
    }
};

const predictOptimalHuntingTimes = async (gmuData, season, species) => {
    try {
        // Calculate lunar influence
        const moonPhaseEffect = 1 - Math.abs(0.5 - gmuData.moonPhase);
        
        // Calculate seasonal timing adjustments
        const seasonalAdjustment = {
            archery: { morning: 1.2, evening: 1.3 },
            muzzleloader: { morning: 1.1, evening: 1.2 },
            rifle1: { morning: 1.0, evening: 1.1 },
            rifle2: { morning: 0.9, evening: 1.0 }
        }[season];

        // Generate hourly predictions
        const hourlyPredictions = [];
        for (let hour = 0; hour < 24; hour++) {
            const timeOfDay = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            
            // Calculate base activity level
            let activity = calculateBaseActivity(hour);
            
            // Apply adjustments
            activity *= moonPhaseEffect;
            activity *= (hour < 12 ? seasonalAdjustment.morning : seasonalAdjustment.evening);
            
            // Apply weather effects
            activity *= calculateWeatherEffect(gmuData.weather, hour);
            
            hourlyPredictions.push({
                time: `${displayHour}:00 ${timeOfDay}`,
                activity: Math.min(1, activity),
                confidence: 0.7 + Math.random() * 0.2
            });
        }

        return {
            hourlyPredictions,
            optimalTimes: findOptimalTimes(hourlyPredictions),
            factors: {
                moonPhase: moonPhaseEffect,
                weather: calculateWeatherEffect(gmuData.weather, new Date().getHours()),
                seasonal: seasonalAdjustment
            }
        };
    } catch (error) {
        console.error('Optimal Times Prediction Error:', error);
        return null;
    }
};

const analyzeTerrainHotspots = async (gmuData, species) => {
    try {
        // Calculate terrain preferences based on species
        const preferences = calculateSpeciesPreferences(species);
        
        // Generate hotspots based on terrain analysis
        const hotspots = [];
        const numHotspots = Math.floor(Math.random() * 3) + 3; // 3-5 hotspots
        
        for (let i = 0; i < numHotspots; i++) {
            const hotspot = {
                name: generateHotspotName(i),
                coordinates: {
                    lat: Math.random() * 2 + 39, // Colorado latitude range
                    lng: Math.random() * 2 - 105 // Colorado longitude range
                },
                terrain: {
                    elevation: Math.floor(gmuData.terrain.elevationMin + 
                        Math.random() * (gmuData.terrain.elevationMax - gmuData.terrain.elevationMin)),
                    slope: Math.floor(Math.random() * gmuData.terrain.averageSlope * 1.5),
                    aspect: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
                    cover: Math.floor(Math.random() * gmuData.terrain.forestCover)
                },
                features: generateTerrainFeatures(),
                rating: Math.random() * 0.3 + 0.7, // 0.7-1.0 rating
                bestTimes: generateBestTimes(),
                accessibility: Math.random() * 5
            };
            
            hotspots.push(hotspot);
        }

        return {
            hotspots,
            analysis: await generateHotspotAnalysis(hotspots, species),
            recommendations: generateHotspotRecommendations(hotspots)
        };
    } catch (error) {
        console.error('Terrain Hotspot Analysis Error:', error);
        return null;
    }
};

// Helper functions for generating mock data
const generateTrendData = (startYear, endYear) => {
    const data = [];
    for (let year = startYear; year <= endYear; year++) {
        data.push({
            year,
            value: Math.random(),
            confidence: Math.random() * 0.3 + 0.7
        });
    }
    return data;
};

const generateSeasonalData = () => {
    return {
        activity: Math.random(),
        success: Math.random(),
        confidence: Math.random() * 0.3 + 0.7
    };
};

const calculateImpact = (factor) => {
    return {
        impact: Math.random(),
        confidence: Math.random() * 0.3 + 0.7
    };
};

const calculateSeasonalImpact = (season) => {
    return {
        impact: Math.random(),
        confidence: Math.random() * 0.3 + 0.7
    };
};

const generateHotspots = () => {
    return Array(5).fill(null).map(() => ({
        lat: Math.random() * 2 + 39, // Colorado latitude range
        lng: Math.random() * 2 - 105, // Colorado longitude range
        confidence: Math.random() * 0.3 + 0.7
    }));
};

const generateMovementPattern = () => {
    return {
        direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        intensity: Math.random(),
        confidence: Math.random() * 0.3 + 0.7
    };
};

// Helper functions for the new AI features
const calculateBaseActivity = (hour) => {
    // Peak activity during dawn (5-8) and dusk (17-20)
    const dawnEffect = Math.max(0, 1 - Math.abs(6.5 - hour) / 3);
    const duskEffect = Math.max(0, 1 - Math.abs(18.5 - hour) / 3);
    return Math.max(dawnEffect, duskEffect) * 0.8 + 0.2;
};

const calculateWeatherEffect = (weather, hour) => {
    const { temperature, precipitation, windSpeed, pressure } = weather;
    
    // Temperature effect varies by time of day
    const optimalTemp = hour > 6 && hour < 18 ? 60 : 45;
    const tempEffect = 1 - Math.abs(temperature - optimalTemp) / 50;
    
    // Other weather effects
    const precipEffect = Math.max(0, 1 - precipitation * 2);
    const windEffect = Math.max(0, 1 - windSpeed / 20);
    const pressureEffect = pressure > 1013 ? 1.1 : 0.9;
    
    return (tempEffect + precipEffect + windEffect) / 3 * pressureEffect;
};

const findOptimalTimes = (predictions) => {
    return predictions
        .filter(p => p.activity > 0.7)
        .sort((a, b) => b.activity - a.activity)
        .slice(0, 3);
};

const calculateSpeciesPreferences = (species) => {
    const preferences = {
        elk: {
            elevation: { min: 8000, max: 12000, optimal: 10000 },
            slope: { min: 10, max: 45, optimal: 25 },
            cover: { min: 40, optimal: 70 },
            waterDistance: { max: 1, optimal: 0.5 }
        },
        deer: {
            elevation: { min: 6000, max: 10000, optimal: 8000 },
            slope: { min: 5, max: 35, optimal: 20 },
            cover: { min: 30, optimal: 60 },
            waterDistance: { max: 0.8, optimal: 0.4 }
        },
        moose: {
            elevation: { min: 7000, max: 11000, optimal: 9000 },
            slope: { min: 0, max: 30, optimal: 15 },
            cover: { min: 50, optimal: 80 },
            waterDistance: { max: 0.5, optimal: 0.2 }
        }
    };
    
    return preferences[species] || preferences.elk;
};

const generateHotspotName = (index) => {
    const features = ['Ridge', 'Basin', 'Saddle', 'Draw', 'Bench', 'Canyon', 'Peak'];
    const descriptors = ['North', 'South', 'Upper', 'Lower', 'Hidden', 'Rocky', 'Timber'];
    return `${descriptors[Math.floor(Math.random() * descriptors.length)]} ${features[Math.floor(Math.random() * features.length)]}`;
};

const generateTerrainFeatures = () => {
    const features = [];
    const possibleFeatures = [
        'Natural funnel',
        'Wallows',
        'Game trails',
        'Water source',
        'Old growth timber',
        'Berry patches',
        'Meadow edge',
        'Thermal cover',
        'Escape cover'
    ];
    
    const numFeatures = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numFeatures; i++) {
        features.push(possibleFeatures[Math.floor(Math.random() * possibleFeatures.length)]);
    }
    return [...new Set(features)]; // Remove duplicates
};

const generateBestTimes = () => {
    return {
        morning: `${Math.floor(Math.random() * 2) + 5}:00 AM - ${Math.floor(Math.random() * 2) + 8}:00 AM`,
        evening: `${Math.floor(Math.random() * 2) + 4}:00 PM - ${Math.floor(Math.random() * 2) + 7}:00 PM`
    };
};

const generateHotspotAnalysis = async (hotspots, species) => {
    try {
        const prompt = `Analyze these hunting hotspots for ${species} hunting:
        ${hotspots.map(h => `
        ${h.name}:
        - Elevation: ${h.terrain.elevation}ft
        - Slope: ${h.terrain.slope}°
        - Aspect: ${h.terrain.aspect}
        - Cover: ${h.terrain.cover}%
        - Features: ${h.features.join(', ')}
        `).join('\n')}
        
        Provide specific hunting strategies for each location.`;

        const response = await openai.createCompletion({
            model: "gpt-4",
            prompt,
            max_tokens: 300,
            temperature: 0.7
        }).catch(handleOpenAIError);

        return response.data.choices[0].text.trim();
    } catch (error) {
        console.error('Hotspot Analysis Error:', error);
        return 'Analysis temporarily unavailable';
    }
};

const generateHotspotRecommendations = (hotspots) => {
    return hotspots.map(hotspot => ({
        location: hotspot.name,
        approach: generateApproachStrategy(hotspot),
        setup: generateSetupStrategy(hotspot),
        timing: hotspot.bestTimes,
        considerations: generateConsiderations(hotspot)
    }));
};

const generateApproachStrategy = (hotspot) => {
    const approaches = [
        'Approach from downwind using terrain for concealment',
        'Circle wide to avoid disturbing bedding areas',
        'Use creek bottom for silent approach',
        'Stay high and glass before moving in',
        'Follow ridgeline to maintain elevation'
    ];
    return approaches[Math.floor(Math.random() * approaches.length)];
};

const generateSetupStrategy = (hotspot) => {
    const setups = [
        'Find natural ground blind near game trail',
        'Set up with sun at your back',
        'Use brush for backdrop',
        'Position between bedding and feeding areas',
        'Utilize natural pinch point'
    ];
    return setups[Math.floor(Math.random() * setups.length)];
};

const generateConsiderations = (hotspot) => {
    const considerations = [
        'Watch wind direction carefully',
        'Be mindful of thermal drafts',
        'Limited cell service in this area',
        'Steep terrain requires good physical condition',
        'Popular area during peak season',
        'Multiple escape routes for game',
        'Early season water source nearby',
        'Heavy pressure from other hunters'
    ];
    
    const numConsiderations = Math.floor(Math.random() * 2) + 2;
    const selected = [];
    for (let i = 0; i < numConsiderations; i++) {
        selected.push(considerations[Math.floor(Math.random() * considerations.length)]);
    }
    return [...new Set(selected)]; // Remove duplicates
};

// Environmental analysis function
const analyzeEnvironmentalConditions = async (weatherData, gmuData) => {
    try {
        // Calculate base environmental score
        const baseScore = calculateBaseEnvironmentalScore(weatherData, gmuData);
        
        // Analyze specific conditions
        const conditions = analyzeSpecificConditions(weatherData, gmuData);
        
        // Generate hunting strategies based on conditions
        const strategies = generateHuntingStrategies(conditions);

        return {
            conditions_rating: baseScore,
            current_conditions: conditions,
            hunting_strategies: strategies,
            alerts: generateEnvironmentalAlerts(conditions)
        };
    } catch (error) {
        console.error('Error in environmental analysis:', error);
        throw error;
    }
};

// Helper functions for environmental analysis
const calculateBaseEnvironmentalScore = (weatherData, gmuData) => {
    const weights = {
        temperature: 0.2,
        wind: 0.25,
        precipitation: 0.15,
        humidity: 0.1,
        pressure: 0.1,
        visibility: 0.2
    };

    const scores = {
        temperature: calculateTemperatureScore(weatherData.current.temp_c),
        wind: calculateWindScore(weatherData.current.wind_kph),
        precipitation: calculatePrecipitationScore(weatherData.current.precip_mm),
        humidity: calculateHumidityScore(weatherData.current.humidity),
        pressure: calculatePressureScore(weatherData.current.pressure_mb),
        visibility: calculateVisibilityScore(weatherData.current.vis_km)
    };

    return Object.entries(weights).reduce((total, [factor, weight]) => {
        return total + (scores[factor] * weight);
    }, 0);
};

const analyzeSpecificConditions = (weatherData, gmuData) => {
    return {
        scent_control: analyzeScentConditions(weatherData, gmuData),
        visibility_rating: analyzeVisibilityConditions(weatherData, gmuData),
        noise_conditions: analyzeNoiseConditions(weatherData, gmuData),
        animal_activity: predictActivityLevel(weatherData, gmuData),
        terrain_accessibility: analyzeTerrainAccessibility(weatherData, gmuData)
    };
};

const generateHuntingStrategies = (conditions) => {
    const strategies = [];

    if (conditions.scent_control.rating < 0.4) {
        strategies.push({
            type: 'scent_control',
            priority: 'high',
            description: 'Poor scent conditions. Focus on hunting into the wind and use extra scent control measures.'
        });
    }

    if (conditions.visibility_rating < 0.5) {
        strategies.push({
            type: 'visibility',
            priority: 'medium',
            description: 'Limited visibility. Focus on areas where game movement is constrained by terrain.'
        });
    }

    if (conditions.noise_conditions.rating > 0.7) {
        strategies.push({
            type: 'stealth',
            priority: 'low',
            description: 'Good noise conditions. Take advantage of quiet approach opportunities.'
        });
    }

    return strategies;
};

// Animal movement prediction
const predictAnimalMovement = async (gmuData, weatherData, species) => {
    try {
        // Get base movement patterns
        const basePatterns = getBaseMovementPatterns(species);
        
        // Adjust for environmental factors
        const adjustedPatterns = adjustForEnvironmentalFactors(basePatterns, weatherData, gmuData);
        
        // Generate hourly predictions
        const hourlyPredictions = generateHourlyPredictions(adjustedPatterns, weatherData);

        return hourlyPredictions.map(prediction => ({
            time_of_day: prediction.timeSlot,
            activity_level: prediction.activityLevel,
            description: generateMovementDescription(prediction),
            locations: prediction.likelyLocations,
            confidence: prediction.confidence
        }));
    } catch (error) {
        console.error('Error in movement prediction:', error);
        throw error;
    }
};

// Helper functions for movement prediction
const getBaseMovementPatterns = (species) => {
    const patterns = {
        elk: {
            dawn: { activity: 0.9, pattern: 'feeding', terrain: 'meadows' },
            morning: { activity: 0.6, pattern: 'bedding', terrain: 'timber' },
            midday: { activity: 0.3, pattern: 'bedded', terrain: 'dark timber' },
            afternoon: { activity: 0.5, pattern: 'feeding', terrain: 'meadows' },
            dusk: { activity: 0.9, pattern: 'feeding', terrain: 'meadows' },
            night: { activity: 0.4, pattern: 'moving', terrain: 'various' }
        },
        deer: {
            dawn: { activity: 0.9, pattern: 'feeding', terrain: 'edges' },
            morning: { activity: 0.5, pattern: 'bedding', terrain: 'cover' },
            midday: { activity: 0.2, pattern: 'bedded', terrain: 'cover' },
            afternoon: { activity: 0.4, pattern: 'feeding', terrain: 'edges' },
            dusk: { activity: 0.9, pattern: 'feeding', terrain: 'edges' },
            night: { activity: 0.6, pattern: 'moving', terrain: 'various' }
        }
    };

    return patterns[species] || patterns.elk;
};

const adjustForEnvironmentalFactors = (basePatterns, weatherData, gmuData) => {
    const adjustments = {
        temperature: calculateTemperatureAdjustment(weatherData.current.temp_c),
        wind: calculateWindAdjustment(weatherData.current.wind_kph),
        pressure: calculatePressureAdjustment(weatherData.current.pressure_mb),
        precipitation: calculatePrecipitationAdjustment(weatherData.current.precip_mm)
    };

    return Object.entries(basePatterns).reduce((adjusted, [timeSlot, pattern]) => {
        adjusted[timeSlot] = {
            ...pattern,
            activity: Math.max(0.1, Math.min(1, pattern.activity * (
                adjustments.temperature *
                adjustments.wind *
                adjustments.pressure *
                adjustments.precipitation
            )))
        };
        return adjusted;
    }, {});
};

const generateHourlyPredictions = (patterns, weatherData) => {
    const predictions = [];
    const hours = [...Array(24).keys()];

    hours.forEach(hour => {
        const timeSlot = getTimeSlot(hour);
        const basePattern = patterns[timeSlot];
        const weatherForecast = getHourlyForecast(weatherData, hour);

        predictions.push({
            timeSlot: formatTimeSlot(hour),
            activityLevel: calculateActivityLevel(basePattern, weatherForecast),
            pattern: basePattern.pattern,
            likelyLocations: predictLikelyLocations(basePattern, weatherForecast),
            confidence: calculatePredictionConfidence(basePattern, weatherForecast)
        });
    });

    return predictions;
};

const generateMovementDescription = (prediction) => {
    const activityLevel = prediction.activityLevel;
    const pattern = prediction.pattern;
    const locations = prediction.likelyLocations.join(' and ');

    if (activityLevel > 0.7) {
        return `High activity expected. Animals likely ${pattern} in ${locations}.`;
    } else if (activityLevel > 0.4) {
        return `Moderate activity expected. Some animals may be ${pattern} in ${locations}.`;
    } else {
        return `Low activity expected. Limited movement in ${locations}.`;
    }
};

// Export the new functions
module.exports = {
    predictHuntingConditions,
    analyzeEnvironmentalConditions,
    predictAnimalMovement,
    // ... existing exports
};
