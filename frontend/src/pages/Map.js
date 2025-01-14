import React, { useState, useEffect, useRef } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Fab, 
  Menu, 
  MenuItem, 
  Snackbar, 
  Alert, 
  IconButton 
} from '@mui/material';
import { GoogleMap, LoadScript, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  Warning as WarningIcon, 
  Message as MessageIcon,
  Menu as MenuIcon,
  MyLocation,
  Terrain,
  PhotoCamera,
  Route
} from '@mui/icons-material';
import HuntingConditions from '../components/HuntingConditions';
import GameSightings from '../components/GameSightings';
import RegulationsGuide from '../components/RegulationsGuide';
import { useMapSettings } from '../contexts/MapContext';
import PredictionService from '../services/PredictionService';

const MapContainer = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 64px)',
  width: '100%',
  position: 'relative'
}));

const MessageBubble = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  maxWidth: 200,
  backgroundColor: theme.palette.background.paper
}));

const MessageBubbleNew = styled(Box)(({ theme, isEmergency, isNew }) => ({
  backgroundColor: isEmergency ? theme.palette.primary.main : theme.palette.background.paper,
  color: isEmergency ? theme.palette.primary.contrastText : theme.palette.text.primary,
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  animation: isNew ? 'fadeIn 0.3s ease-in' : 'none'
}));

const MessagePanel = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  maxWidth: 300,
  maxHeight: '50vh',
  overflowY: 'auto',
  padding: theme.spacing(2),
  zIndex: 1000
}));

const Legend = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: theme.spacing(2),
  padding: theme.spacing(2),
  minWidth: 200,
  maxHeight: '50vh',
  overflowY: 'auto'
}));

const MapView = () => {
  const theme = useTheme();
  const mapRef = useRef(null);
  const { mapSettings } = useMapSettings();
  const [viewState, setViewState] = useState({
    latitude: 40.0,
    longitude: -105.35,
    zoom: 11
  });
  
  const [messages, setMessages] = useState([]);
  const [emergency, setEmergency] = useState(null);
  const [selectedHunter, setSelectedHunter] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState('elk');
  const [showConditions, setShowConditions] = useState(true);
  const [showRegulations, setShowRegulations] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    // Initialize map settings
    if (mapRef.current) {
      // Map initialization code
    }
  }, [mapRef]);

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleEmergencyClose = () => {
    setEmergency(null);
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  return (
    <MapContainer>
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}>
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
          center={{ lat: viewState.latitude, lng: viewState.longitude }}
          zoom={viewState.zoom}
          onLoad={handleMapLoad}
          options={{
            mapTypeId: mapSettings.mapType,
            mapTypeControl: true,
            zoomControl: true,
            streetViewControl: false
          }}
        >
          {selectedHunter && (
            <InfoWindow
              position={{
                lat: selectedHunter.latitude,
                lng: selectedHunter.longitude
              }}
              onCloseClick={() => setSelectedHunter(null)}
            >
              <div>
                <Typography variant="subtitle1">{selectedHunter.name}</Typography>
                <Typography variant="body2">Status: {selectedHunter.status}</Typography>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      <MessagePanel>
        {messages.map((msg, index) => (
          <MessageBubbleNew
            key={index}
            isEmergency={msg.type === 'emergency'}
            isNew={msg.isNew}
          >
            <Typography variant="body2">
              {msg.text}
            </Typography>
          </MessageBubbleNew>
        ))}
      </MessagePanel>

      {emergency && (
        <Alert 
          severity="error"
          onClose={handleEmergencyClose}
          sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)' }}
        >
          <Typography variant="h6">Emergency Alert!</Typography>
          <Typography variant="body1">
            Hunter needs assistance at: {emergency.position.lat}, {emergency.position.lng}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setViewState({
                latitude: emergency.position.lat,
                longitude: emergency.position.lng,
                zoom: 15
              });
            }}
          >
            View Location
          </Button>
        </Alert>
      )}

      {showLegend && (
        <Legend>
          <Typography variant="subtitle2" gutterBottom>
            Map Legend
          </Typography>
          {/* Add legend content here */}
        </Legend>
      )}

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </MapContainer>
  );
};

export default MapView;
