import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import logo from '../assets/logo.svg';

const LogoImage = styled('img')(({ theme, size = 'medium' }) => {
  const sizes = {
    small: 40,
    medium: 60,
    large: 120,
    xlarge: 200
  };
  
  return {
    width: sizes[size],
    height: sizes[size],
    transition: 'transform 0.3s ease-in-out',
    '&:hover': {
      transform: 'scale(1.05)'
    }
  };
});

const Logo = ({ size = 'medium', sx = {} }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...sx }}>
      <LogoImage
        src={logo}
        alt="Dank Bulls Logo"
        size={size}
      />
    </Box>
  );
};

export default Logo;
