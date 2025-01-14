import React, { useState, useEffect } from 'react';
import { Paper, Typography, Avatar, Grid, Button, Box, CircularProgress } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';

const ProfileContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: 1200,
  margin: '0 auto'
}));

const ProfileCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  position: 'relative',
  overflow: 'hidden'
}));

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  }
}));

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: `4px solid ${theme.palette.primary.main}`
}));

const UserInfo = styled(Box)(({ theme }) => ({
  flexGrow: 1
}));

const EditButton = styled(Button)(({ theme }) => ({
  marginLeft: 'auto',
  [theme.breakpoints.down('sm')]: {
    marginLeft: 0,
    marginTop: theme.spacing(2)
  }
}));

const StatsGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(4)
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText
}));

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch user stats from API
        const response = await fetch(`${process.env.REACT_APP_API_URL}/stats.php?user_id=${user.id}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (!user) {
    return (
      <ProfileContainer>
        <Typography>Please log in to view your profile.</Typography>
      </ProfileContainer>
    );
  }

  if (loading) {
    return (
      <ProfileContainer>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <ProfileCard elevation={3}>
        <Header>
          <LargeAvatar src={user.avatar || '/default-avatar.png'} alt={user.username} />
          <UserInfo>
            <Typography variant="h4" gutterBottom>
              {user.username}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)} User
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Member since {new Date(user.created_at).toLocaleDateString()}
            </Typography>
          </UserInfo>
          <EditButton
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
          >
            Edit Profile
          </EditButton>
        </Header>

        <StatsGrid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard elevation={2}>
              <Typography variant="h4">{stats?.sightings || 0}</Typography>
              <Typography>Animal Sightings</Typography>
            </StatCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard elevation={2}>
              <Typography variant="h4">{stats?.analyses || 0}</Typography>
              <Typography>Analyses Run</Typography>
            </StatCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard elevation={2}>
              <Typography variant="h4">{stats?.predictions || 0}</Typography>
              <Typography>Predictions Made</Typography>
            </StatCard>
          </Grid>
        </StatsGrid>
      </ProfileCard>
    </ProfileContainer>
  );
};

export default Profile;
