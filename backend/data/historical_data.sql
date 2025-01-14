-- Create tables for historical data

CREATE TABLE IF NOT EXISTS harvest_records (
    id SERIAL PRIMARY KEY,
    gmu_id VARCHAR(10) NOT NULL,
    year INTEGER NOT NULL,
    season VARCHAR(20) NOT NULL,
    total_hunters INTEGER NOT NULL,
    total_harvest INTEGER NOT NULL,
    success_rate FLOAT NOT NULL,
    avg_days_hunted FLOAT NOT NULL,
    weather_conditions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_harvest_record UNIQUE (gmu_id, year, season)
);

CREATE INDEX idx_harvest_gmu_year ON harvest_records(gmu_id, year);

CREATE TABLE IF NOT EXISTS animal_movements (
    id SERIAL PRIMARY KEY,
    gmu_id VARCHAR(10) NOT NULL,
    date TIMESTAMP NOT NULL,
    location_lat FLOAT NOT NULL,
    location_lon FLOAT NOT NULL,
    elevation FLOAT NOT NULL,
    terrain_type VARCHAR(50) NOT NULL,
    weather_conditions JSONB,
    activity_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movements_gmu_date ON animal_movements(gmu_id, date);
CREATE INDEX idx_movements_location ON animal_movements USING GIST (
    ST_SetSRID(ST_MakePoint(location_lon, location_lat), 4326)
);

CREATE TABLE IF NOT EXISTS weather_history (
    id SERIAL PRIMARY KEY,
    gmu_id VARCHAR(10) NOT NULL,
    date TIMESTAMP NOT NULL,
    temperature_high FLOAT NOT NULL,
    temperature_low FLOAT NOT NULL,
    precipitation FLOAT NOT NULL,
    snow_depth FLOAT NOT NULL,
    wind_speed FLOAT NOT NULL,
    wind_direction VARCHAR(10) NOT NULL,
    pressure FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_weather_record UNIQUE (gmu_id, date)
);

CREATE INDEX idx_weather_gmu_date ON weather_history(gmu_id, date);

-- Create views for common queries

CREATE OR REPLACE VIEW gmu_success_rates AS
SELECT 
    gmu_id,
    year,
    season,
    success_rate,
    total_hunters,
    total_harvest
FROM harvest_records
ORDER BY year DESC, season;

CREATE OR REPLACE VIEW daily_movement_patterns AS
SELECT 
    gmu_id,
    date::date as movement_date,
    terrain_type,
    activity_type,
    COUNT(*) as activity_count,
    AVG(elevation) as avg_elevation
FROM animal_movements
GROUP BY gmu_id, date::date, terrain_type, activity_type
ORDER BY movement_date DESC;

CREATE OR REPLACE VIEW weather_summary AS
SELECT 
    gmu_id,
    date::date as weather_date,
    AVG(temperature_high) as avg_high_temp,
    AVG(temperature_low) as avg_low_temp,
    SUM(precipitation) as total_precipitation,
    AVG(snow_depth) as avg_snow_depth,
    AVG(wind_speed) as avg_wind_speed,
    MODE() WITHIN GROUP (ORDER BY wind_direction) as predominant_wind
FROM weather_history
GROUP BY gmu_id, date::date
ORDER BY weather_date DESC;

-- Create functions for analysis

CREATE OR REPLACE FUNCTION calculate_success_factors(
    p_gmu_id VARCHAR,
    p_date DATE
)
RETURNS TABLE (
    factor VARCHAR,
    correlation FLOAT,
    confidence FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH weather_success AS (
        SELECT 
            w.temperature_high,
            w.temperature_low,
            w.precipitation,
            w.snow_depth,
            w.wind_speed,
            h.success_rate
        FROM weather_history w
        JOIN harvest_records h ON h.gmu_id = w.gmu_id 
            AND w.date::date = p_date
        WHERE w.gmu_id = p_gmu_id
    )
    SELECT 
        f.factor,
        f.correlation,
        f.confidence
    FROM (
        VALUES 
            ('temperature', CORR(temperature_high, success_rate), 0.8),
            ('precipitation', CORR(precipitation, success_rate), 0.7),
            ('wind', CORR(wind_speed, success_rate), 0.6)
    ) AS f(factor, correlation, confidence)
    FROM weather_success;
END;
$$ LANGUAGE plpgsql;
