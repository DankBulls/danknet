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
  Alert,
  Paper
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  WbSunny as SunIcon,
  Cloud as CloudIcon,
  Opacity as RainIcon,
  Air as WindIcon
} from '@mui/icons-material';
import { analysisContent } from './AnalysisContent';

const EnvironmentalAnalysis = ({ gmuId, date }) => {
  const [envData, setEnvData] = useState(null);
  const [optimalTimes, setOptimalTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [envRes, timesRes] = await Promise.all([
          fetch(`/api/analysis/environment?gmu_id=${gmuId}&date=${date}`),
          fetch(`/api/analysis/optimal-times?gmu_id=${gmuId}&date=${date}`)
        ]);

        if (!envRes.ok || !timesRes.ok) {
          throw new Error('Failed to fetch environmental data');
        }

        const [environment, times] = await Promise.all([
          envRes.json(),
          timesRes.json()
        ]);

        setEnvData(environment);
        setOptimalTimes(times);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gmuId, date]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!envData || !optimalTimes) return null;

  const getConditionColor = (rating) => {
    switch (rating) {
      case 'ideal':
        return 'success';
      case 'acceptable':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConditionIcon = (condition) => {
    switch (condition) {
      case 'temperature':
        return <SunIcon />;
      case 'cloud_cover':
        return <CloudIcon />;
      case 'precipitation':
        return <RainIcon />;
      case 'wind_speed':
        return <WindIcon />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {analysisContent.environmental.title}
        </Typography>
        {analysisContent.environmental.paragraphs.map((paragraph, index) => (
          <Typography key={index} paragraph>
            {paragraph}
          </Typography>
        ))}
      </Paper>
      <Grid container spacing={3}>
        {/* Current Conditions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Current Conditions</Typography>
              <List>
                {Object.entries(envData.current_conditions).map(([condition, analysis]) => (
                  <ListItem key={condition}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getConditionIcon(condition)}
                          <Typography sx={{ ml: 1 }}>
                            {condition.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            label={`${analysis.value} ${condition === 'temperature' ? '°F' : 
                                    condition === 'wind_speed' ? 'mph' : '%'}`}
                            color={getConditionColor(analysis.rating)}
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={analysis.rating.toUpperCase()}
                            color={getConditionColor(analysis.rating)}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Hunting Scores */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Hunting Conditions</Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1">Overall Score</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={envData.hunting_scores.current_score * 100}
                    sx={{ mr: 2 }}
                  />
                  <Typography>
                    {Math.round(envData.hunting_scores.current_score * 100)}%
                  </Typography>
                </Box>
              </Box>
              <Alert
                severity={envData.hunting_scores.forecast_trend === 'improving' ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              >
                Conditions are {envData.hunting_scores.forecast_trend}
              </Alert>
              <Typography variant="subtitle2" color="text.secondary">
                Confidence: {Math.round(envData.hunting_scores.confidence * 100)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pressure Trend */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pressure Trend</Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={envData.pressure_trend.trend.toUpperCase()}
                  color={envData.pressure_trend.trend === 'rising' ? 'success' : 
                         envData.pressure_trend.trend === 'stable' ? 'primary' : 'warning'}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2">
                  {envData.pressure_trend.implications}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recommendations</Typography>
              <List>
                {envData.recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={rec} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Optimal Times */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Optimal Hunting Times</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={optimalTimes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 1]} />
                    <Tooltip />
                    <Bar
                      dataKey="score"
                      fill="#8884d8"
                      name="Hunting Score"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnvironmentalAnalysis;
