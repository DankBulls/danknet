import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Grid, Typography, CircularProgress } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const GMUAnalysis = ({ gmuId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/gmu/${gmuId}/analysis`);
        if (!response.ok) throw new Error('Failed to fetch GMU analysis');
        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [gmuId]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!analysis) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Success Prediction Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Success Prediction</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={analysis.success_prediction.success_probability * 100}
                  sx={{ mr: 2 }}
                />
                <Typography>
                  {Math.round(analysis.success_prediction.success_probability * 100)}% Success Rate
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Confidence Level: {Math.round(analysis.success_prediction.confidence_level * 100)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Hourly Activity Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Hourly Activity Prediction</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={analysis.hourly_activity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="activity_level" 
                      stroke="#8884d8" 
                      name="Activity Level"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Terrain Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Terrain Analysis</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Elevation Range</Typography>
                <Typography>
                  {analysis.terrain_analysis.elevation_range.min} - 
                  {analysis.terrain_analysis.elevation_range.max} ft
                </Typography>
              </Box>
              <Typography variant="subtitle2" gutterBottom>Terrain Types</Typography>
              {Object.entries(analysis.terrain_analysis.terrain_types).map(([type, percentage]) => (
                <Box key={type} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: `${percentage * 100}%`,
                      height: 20,
                      bgcolor: 'primary.main',
                      mr: 1,
                    }}
                  />
                  <Typography>{type}: {Math.round(percentage * 100)}%</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Weather Impact */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Weather Impact</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Overall Impact</Typography>
                <Typography color={
                  analysis.weather_impact.overall_impact === 'favorable' 
                    ? 'success.main' 
                    : 'warning.main'
                }>
                  {analysis.weather_impact.overall_impact}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Wind</Typography>
                  <Typography>
                    {analysis.weather_impact.wind_conditions.speed} mph 
                    {analysis.weather_impact.wind_conditions.direction}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Temperature</Typography>
                  <Typography>
                    {analysis.weather_impact.temperature.current}°F
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Hotspots Map */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Hunting Hotspots</Typography>
              <Box sx={{ height: 400 }}>
                <MapContainer
                  center={[analysis.terrain_analysis.hotspots[0].lat, 
                          analysis.terrain_analysis.hotspots[0].lon]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {analysis.terrain_analysis.hotspots.map((hotspot, index) => (
                    <GeoJSON
                      key={index}
                      data={{
                        type: 'Feature',
                        geometry: {
                          type: 'Point',
                          coordinates: [hotspot.lon, hotspot.lat]
                        },
                        properties: {
                          name: hotspot.name,
                          rating: hotspot.rating,
                          features: hotspot.features
                        }
                      }}
                    />
                  ))}
                </MapContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GMUAnalysis;
