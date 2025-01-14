import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const mockData = {
  successRates: [
    { month: 'Sep', success: 45, attempts: 100 },
    { month: 'Oct', success: 65, attempts: 120 },
    { month: 'Nov', success: 35, attempts: 80 },
    { month: 'Dec', success: 55, attempts: 90 }
  ],
  topLocations: [
    { name: 'North Ridge', success: 75 },
    { name: 'Valley Creek', success: 68 },
    { name: 'East Basin', success: 62 },
    { name: 'West Peak', success: 58 }
  ],
  animalTypes: {
    elk: { spotted: 245, harvested: 42 },
    deer: { spotted: 312, harvested: 56 },
    moose: { spotted: 89, harvested: 12 }
  }
};

const Analyze = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(mockData);
      } catch (error) {
        console.error('Error fetching analysis data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Hunt Analysis
      </Typography>

      <Grid container spacing={3}>
        {/* Success Rate Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Success Rates
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.successRates}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="success" fill="#2E7D32" name="Success Rate %" />
                <Bar dataKey="attempts" fill="#795548" name="Total Attempts" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Locations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Hunting Locations
            </Typography>
            {data.topLocations.map((location, index) => (
              <Box key={location.name} sx={{ mb: 2 }}>
                <Typography variant="body1">
                  {location.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={location.success}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: 'rgba(46, 125, 50, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#2E7D32'
                        }
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {location.success}%
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Animal Statistics */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Animal Statistics
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(data.animalTypes).map(([animal, stats]) => (
                <Grid item xs={12} key={animal}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                        {animal}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Spotted: {stats.spotted}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Harvested: {stats.harvested}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Success Rate: {((stats.harvested / stats.spotted) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analyze;
