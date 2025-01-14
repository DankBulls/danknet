import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import Logo from './Logo';

const SplashContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.palette.background.default,
  zIndex: 9999,
  gap: theme.spacing(4)
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  color: theme.palette.text.secondary,
  animation: 'pulse 1.5s infinite',
  '@keyframes pulse': {
    '0%': {
      opacity: 0.6,
    },
    '50%': {
      opacity: 1,
    },
    '100%': {
      opacity: 0.6,
    },
  },
}));

const SplashScreen = () => {
  return (
    <SplashContainer>
      <Logo size="xlarge" />
      <CircularProgress 
        size={40}
        thickness={4}
        sx={{ color: 'primary.main' }}
      />
      <LoadingText variant="h6">
        Loading your hunting companion...
      </LoadingText>
    </SplashContainer>
  );
};

export default SplashScreen;
