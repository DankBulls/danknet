import axios from 'axios';

const AI_ENDPOINT = process.env.REACT_APP_AI_ENDPOINT || 'http://localhost:3001/api/ai';

export const predictHuntingConditions = async (gmuData, season, species) => {
    try {
        const response = await axios.post(`${AI_ENDPOINT}/predict`, {
            gmu: gmuData,
            season,
            species,
            timestamp: new Date().toISOString()
        });
        return response.data;
    } catch (error) {
        console.error('AI Prediction Error:', error);
        return null;
    }
};

export const getHistoricalAnalysis = async (gmuNumber, startYear, endYear) => {
    try {
        const response = await axios.post(`${AI_ENDPOINT}/historical`, {
            gmuNumber,
            startYear,
            endYear
        });
        return response.data;
    } catch (error) {
        console.error('Historical Analysis Error:', error);
        return null;
    }
};

export const getSeasonalTrends = async (gmuNumber) => {
    try {
        const response = await axios.post(`${AI_ENDPOINT}/seasonal-trends`, {
            gmuNumber
        });
        return response.data;
    } catch (error) {
        console.error('Seasonal Trends Error:', error);
        return null;
    }
};

export const getEnvironmentalImpact = async (gmuNumber, conditions) => {
    try {
        const response = await axios.post(`${AI_ENDPOINT}/environmental-impact`, {
            gmuNumber,
            conditions
        });
        return response.data;
    } catch (error) {
        console.error('Environmental Impact Error:', error);
        return null;
    }
};

export const getAnimalMovementPrediction = async (gmuNumber, conditions) => {
    try {
        const response = await axios.post(`${AI_ENDPOINT}/movement-prediction`, {
            gmuNumber,
            conditions,
            timestamp: new Date().toISOString()
        });
        return response.data;
    } catch (error) {
        console.error('Movement Prediction Error:', error);
        return null;
    }
};
