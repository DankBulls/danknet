import React from 'react';
import { styled } from '@mui/material/styles';
import { Paper, Typography, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import MooseIllustration from './MooseIllustration';
import {
  Map as MapIcon,
  CalendarToday as CalendarIcon,
  PhotoCamera as PhotoIcon,
  Message as MessageIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const Card = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.standard
  }),
  position: 'relative',
  overflow: 'hidden',
  cursor: 'pointer',
  
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    background: theme.palette.primary.main
  }
}));

const CardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  
  '& .MuiSvgIcon-root': {
    fontSize: 32,
    marginRight: theme.spacing(2),
    color: theme.palette.primary.main
  }
}));

const CardContent = styled(Box)(({ theme }) => ({
  '& .MuiTypography-root': {
    color: theme.palette.text.secondary
  }
}));

const StyledLink = styled(Link)({
  textDecoration: 'none',
  color: 'inherit'
});

const DashboardCard = ({ title, content, stats, icon }) => {
  const getIcon = () => {
    switch (icon) {
      case 'map':
        return <MapIcon />;
      case 'calendar':
        return <CalendarIcon />;
      case 'photo':
        return <PhotoIcon />;
      case 'message':
        return <MessageIcon />;
      case 'person':
        return <PersonIcon />;
      default:
        return null;
    }
  };

  return (
    <Card elevation={1}>
      <CardHeader>
        {getIcon()}
        <Typography variant="h6">{title}</Typography>
      </CardHeader>
      <CardContent>
        <Typography variant="body2">{content}</Typography>
      </CardContent>
      {stats && (
        <Typography variant="h4" color="primary">
          {stats}
        </Typography>
      )}
      <Box sx={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.1, pointerEvents: 'none' }}>
        <MooseIllustration width="150px" />
      </Box>
    </Card>
  );
};

export default DashboardCard;
