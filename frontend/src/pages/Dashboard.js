import React from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DashboardCard from '../components/DashboardCard';
import HuntingConditions from '../components/HuntingConditions';
import GameSightings from '../components/GameSightings';
import RegulationsGuide from '../components/RegulationsGuide';

const DashboardContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const Dashboard = () => {
  return (
    <DashboardContainer maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Hunting Conditions */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <HuntingConditions />
          </Paper>
        </Grid>

        {/* Recent Game Sightings */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <GameSightings />
          </Paper>
        </Grid>

        {/* Regulations Guide */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <RegulationsGuide />
          </Paper>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard;
