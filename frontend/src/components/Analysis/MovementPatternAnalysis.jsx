import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { analysisContent } from './AnalysisContent';

const MovementPatternAnalysis = ({ gmuId, animalType, date }) => {
  const [movementData, setMovementData] = useState(null);
  const [dailyPattern, setDailyPattern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [movementRes, patternRes] = await Promise.all([
          fetch(`/api/analysis/movement?animal_type=${animalType}&gmu_id=${gmuId}&date=${date}`),
          fetch(`/api/analysis/daily-pattern?animal_type=${animalType}&gmu_id=${gmuId}&date=${date}`)
        ]);

        if (!movementRes.ok || !patternRes.ok) {
          throw new Error('Failed to fetch movement data');
        }

        const [movement, pattern] = await Promise.all([
          movementRes.json(),
          patternRes.json()
        ]);

        setMovementData(movement);
        setDailyPattern(pattern);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gmuId, animalType, date]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!movementData || !dailyPattern) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {analysisContent.movement.title}
        </Typography>
        {analysisContent.movement.paragraphs.map((paragraph, index) => (
          <Typography key={index} paragraph>
            {paragraph}
          </Typography>
        ))}
      </Paper>

      <Grid container spacing={3}>
        {/* Current Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Current Activity</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Primary Activity</Typography>
                <Chip
                  label={movementData.primary_activity}
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Confidence Score</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={movementData.confidence_score * 100}
                    sx={{ mr: 2 }}
                  />
                  <Typography>
                    {Math.round(movementData.confidence_score * 100)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Movement Vectors */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Movement Pattern</Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Movement Range"
                    secondary={`${Math.round(movementData.movement_vectors.range.min)}m - ${Math.round(movementData.movement_vectors.range.max)}m`}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Primary Direction"
                    secondary={movementData.movement_vectors.direction}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Preferred Terrain"
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {movementData.movement_vectors.terrain_preference_order.map(([terrain, score]) => (
                          <Chip
                            key={terrain}
                            label={`${terrain} (${Math.round(score * 100)}%)`}
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Daily Activity Pattern */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>24-Hour Activity Pattern</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={dailyPattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="current_time" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="activity_factor"
                      stroke="#8884d8"
                      name="Activity Level"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Movement Map */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Movement Map</Typography>
              <Box sx={{ height: 400 }}>
                <MapContainer
                  center={[movementData.location.lat, movementData.location.lon]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {movementData.movement_vectors.terrain_preference_order.map(([terrain, score], index) => (
                    <Circle
                      key={terrain}
                      center={[
                        movementData.location.lat + index * 0.001,
                        movementData.location.lon + index * 0.001
                      ]}
                      radius={score * 1000}
                      pathOptions={{
                        color: '#8884d8',
                        fillColor: '#8884d8',
                        fillOpacity: 0.4
                      }}
                    >
                      <Popup>
                        <Typography>{terrain}</Typography>
                        <Typography>Preference: {Math.round(score * 100)}%</Typography>
                      </Popup>
                    </Circle>
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

export default MovementPatternAnalysis;
