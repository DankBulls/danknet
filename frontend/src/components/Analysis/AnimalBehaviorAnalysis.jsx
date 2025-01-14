import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { analysisContent } from './AnalysisContent';

const AnimalBehaviorAnalysis = ({ gmuId, animalType, date }) => {
  const [behaviorData, setBehaviorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBehaviorData = async () => {
      try {
        const response = await fetch(
          `/api/analysis/behavior?animal_type=${animalType}&gmu_id=${gmuId}&date=${date}`
        );
        if (!response.ok) throw new Error('Failed to fetch behavior data');
        const data = await response.json();
        setBehaviorData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBehaviorData();
  }, [gmuId, animalType, date]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!behaviorData) return null;

  const behaviorFactors = [
    { factor: 'Breeding', value: behaviorData.breeding_factor },
    { factor: 'Birth Season', value: behaviorData.birth_season_factor },
    { factor: 'Migration', value: behaviorData.migration_factor },
    { factor: 'Elevation', value: behaviorData.elevation_factor },
    { factor: 'Activity', value: behaviorData.activity_factor }
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {analysisContent.behavior.title}
        </Typography>
        {analysisContent.behavior.paragraphs.map((paragraph, index) => (
          <Typography key={index} paragraph>
            {paragraph}
          </Typography>
        ))}
      </Paper>

      <Grid container spacing={3}>
        {/* Behavior Factors Radar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Behavior Factors</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <RadarChart data={behaviorFactors}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="factor" />
                    <PolarRadiusAxis domain={[0, 1]} />
                    <Radar
                      name="Behavior Factors"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Behavior Scores */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Behavior Scores</Typography>
              {behaviorFactors.map((factor) => (
                <Box key={factor.factor} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">{factor.factor}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={factor.value * 100}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: '#8884d8'
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(factor.value * 100)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnimalBehaviorAnalysis;
