module.exports = {
    port: process.env.PORT || 4000,
    mongoUri: process.env.MONGODB_URI,
    corsOptions: {
        origin: 'https://app.dankbulls.com',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },
    modelStorage: process.env.MODEL_STORAGE_PATH || '/home/username/app.dankbulls.com/backend/models',
    weatherApi: {
        key: process.env.WEATHER_API_KEY,
        baseUrl: 'https://api.weatherapi.com/v1'
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY
    },
    logging: {
        level: 'info',
        file: '/home/username/app.dankbulls.com/backend/logs/app.log'
    }
};
