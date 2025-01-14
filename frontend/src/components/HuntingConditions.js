import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import { Box, Paper, Typography } from '@mui/material';
import { 
  WbSunny, 
  Air, 
  Opacity, 
  Thermostat,
  NorthWest,
  Timeline,
  EmojiNature,
  Terrain
} from '@mui/icons-material';

const ConditionsPanel = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(3),
  left: theme.spacing(3),
  background: 'rgba(255, 255, 255, 0.9)',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  maxWidth: 300,
  fontFamily: theme.typography.fontFamily
}));

const ConditionRow = styled(Box)(({ theme, optimal }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  background: optimal ? theme.palette.background.default : 'transparent',
  borderLeft: `4px solid ${optimal ? theme.palette.success.main : 'transparent'}`,
  '& svg': {
    marginRight: theme.spacing(1),
    color: theme.palette.secondary.main
  }
}));

const OptimalBadge = styled(Box)(({ theme }) => ({
  background: theme.palette.success.main,
  color: theme.palette.success.contrastText,
  padding: '2px 6px',
  borderRadius: '12px',
  fontSize: '0.8em',
  marginLeft: 'auto'
}));

const ScoreIndicator = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(3),
  background: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  '& h2': {
    color: theme.palette.primary.main,
    margin: 0
  },
  '& p': {
    margin: '5px 0 0',
    color: theme.palette.text.secondary
  }
}));

const HuntingConditions = ({ latitude, longitude, animalType }) => {
  const [conditions, setConditions] = useState({
    temperature: 0,
    windSpeed: 0,
    windDirection: 0,
    humidity: 0,
    pressure: 0,
    moonPhase: 0,
    score: 0
  });

  const [optimalConditions] = useState({
    elk: {
      temperature: { min: 30, max: 60 },
      windSpeed: { min: 0, max: 10 },
      humidity: { min: 40, max: 70 }
    },
    deer: {
      temperature: { min: 35, max: 65 },
      windSpeed: { min: 0, max: 12 },
      humidity: { min: 45, max: 75 }
    },
    moose: {
      temperature: { min: 25, max: 55 },
      windSpeed: { min: 0, max: 8 },
      humidity: { min: 50, max: 80 }
    }
  });

  useEffect(() => {
    // In production, this would fetch real weather data
    // For now, using mock data
    const mockData = {
      temperature: 45,
      windSpeed: 8,
      windDirection: 315,
      humidity: 65,
      pressure: 1015,
      moonPhase: 0.25,
      score: 85
    };
    setConditions(mockData);
  }, [latitude, longitude]);

  const isOptimal = (value, range) => {
    return value >= range.min && value <= range.max;
  };

  const getWindDirection = (degrees) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const getMoonPhase = (phase) => {
    if (phase < 0.25) return 'New Moon';
    if (phase < 0.5) return 'First Quarter';
    if (phase < 0.75) return 'Full Moon';
    return 'Last Quarter';
  };

  const animalOptimal = optimalConditions[animalType] || optimalConditions.deer;

  return (
    <ConditionsPanel elevation={3}>
      <Typography variant="h6" gutterBottom>
        Hunting Conditions
      </Typography>

      <ScoreIndicator>
        <Typography variant="h2">{conditions.score}</Typography>
        <Typography variant="body2" color="textSecondary">
          Hunting Score
        </Typography>
      </ScoreIndicator>

      <ConditionRow optimal={isOptimal(conditions.temperature, animalOptimal.temperature)}>
        <Thermostat />
        <Typography variant="body2">
          {conditions.temperature}°F
        </Typography>
        {isOptimal(conditions.temperature, animalOptimal.temperature) && (
          <OptimalBadge>Optimal</OptimalBadge>
        )}
      </ConditionRow>

      <ConditionRow optimal={isOptimal(conditions.windSpeed, animalOptimal.windSpeed)}>
        <Air />
        <Typography variant="body2">
          {conditions.windSpeed} mph {getWindDirection(conditions.windDirection)}
        </Typography>
        {isOptimal(conditions.windSpeed, animalOptimal.windSpeed) && (
          <OptimalBadge>Optimal</OptimalBadge>
        )}
      </ConditionRow>

      <ConditionRow optimal={isOptimal(conditions.humidity, animalOptimal.humidity)}>
        <Opacity />
        <Typography variant="body2">
          {conditions.humidity}% Humidity
        </Typography>
        {isOptimal(conditions.humidity, animalOptimal.humidity) && (
          <OptimalBadge>Optimal</OptimalBadge>
        )}
      </ConditionRow>

      <ConditionRow>
        <Timeline />
        <Typography variant="body2">
          {conditions.pressure} hPa
        </Typography>
      </ConditionRow>

      <ConditionRow>
        <WbSunny />
        <Typography variant="body2">
          {getMoonPhase(conditions.moonPhase)}
        </Typography>
      </ConditionRow>
    </ConditionsPanel>
  );
};

export default HuntingConditions;
