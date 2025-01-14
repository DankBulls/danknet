module.exports = {
    apps: [{
        name: 'danknet-backend',
        script: 'server.js',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 4000
        },
        error_file: '/home/username/app.dankbulls.com/backend/logs/err.log',
        out_file: '/home/username/app.dankbulls.com/backend/logs/out.log',
        time: true
    }]
};
