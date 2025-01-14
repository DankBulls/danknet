import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { AppBar, Toolbar, Button, IconButton, Box } from '@mui/material';
import { 
  Map as MapIcon, 
  PhotoCamera, 
  Person, 
  ExitToApp,
  CalendarMonth
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}) !important`,
  boxShadow: '0 2px 10px rgba(0,0,0,0.1) !important'
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  justifyContent: 'space-between',
  padding: `${theme.spacing(2)} !important`
}));

const NavButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2)
}));

const StyledLink = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.background.default,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  transition: 'all 0.3s ease',

  '&:hover': {
    color: theme.palette.action.hover
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  color: `${theme.palette.background.default} !important`,
  fontFamily: theme.typography.h6.fontFamily,
  fontWeight: 'bold !important',
  padding: `${theme.spacing(1)} ${theme.spacing(2)} !important`,
  borderRadius: `${theme.shape.borderRadius}px !important`,
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
    transform: 'translateY(-2px)'
  }
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: `${theme.palette.background.default} !important`,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
    transform: 'translateY(-2px)'
  }
}));

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  if (location.pathname === '/login') return null;

  return (
    <StyledAppBar position="static">
      <StyledToolbar>
        <Logo />
        {user && (
          <NavButtons>
            <StyledButton component={Link} to="/">
              <CalendarMonth sx={{ mr: 1 }} /> Calendar
            </StyledButton>
            <StyledButton component={Link} to="/map">
              <MapIcon sx={{ mr: 1 }} /> Map
            </StyledButton>
            <StyledButton component={Link} to="/photos">
              <PhotoCamera sx={{ mr: 1 }} /> Photos
            </StyledButton>
            <StyledIconButton component={Link} to="/profile">
              <Person />
            </StyledIconButton>
            <StyledIconButton onClick={handleLogout}>
              <ExitToApp />
            </StyledIconButton>
          </NavButtons>
        )}
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Navigation;
