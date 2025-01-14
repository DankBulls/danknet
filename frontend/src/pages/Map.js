import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl';
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
import 'mapbox-gl/dist/mapbox-gl.css';
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

const PredictionOverlay = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  maxWidth: 300
}));

const PredictionCard = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1]
}));

const ControlPanel = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  left: theme.spacing(2),
  zIndex: 1
}));

const MapButton = styled(Fab)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const LegendContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1]
}));

const LegendItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1)
}));

const LegendColor = styled(Box)(({ theme, color }) => ({
  width: 20,
  height: 20,
  borderRadius: theme.shape.borderRadius / 2,
  marginRight: theme.spacing(1),
  backgroundColor: color
}));

const TipText = styled(Typography)(({ theme }) => ({
  color: theme.palette.secondary.dark,
  fontStyle: 'italic',
  marginTop: theme.spacing(1),
  fontSize: '0.9em'
}));

const EmergencyAlert = styled(Alert)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 1000,
  minWidth: 300
}));

const MessagePanel = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  maxWidth: 300,
  maxHeight: 200,
  overflowY: 'auto'
}));

const MessageBubbleNew = styled(Box)(({ theme, isEmergency, isNew }) => ({
  backgroundColor: isEmergency ? theme.palette.primary.main : theme.palette.background.paper,
  color: isEmergency ? theme.palette.primary.contrastText : theme.palette.text.primary,
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  animation: isNew ? 'fadeIn 0.3s ease-in' : 'none'
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.background.paper,
  padding: '8px',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const LayerToggle = styled(Button)(({ theme, active }) => ({
  margin: theme.spacing(1) + ' 0',
  backgroundColor: active ? theme.palette.primary.main : theme.palette.secondary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : theme.palette.secondary.dark
  }
}));

const PopupContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),

  '& h6': {
    color: theme.palette.secondary.main,
    marginBottom: theme.spacing(1)
  },
  
  '& p': {
    color: theme.palette.text.primary,
    fontSize: '0.9rem',
    margin: 0
  }
}));

const Legend = styled(LegendContainer)(({ theme }) => ({
  minWidth: 200
}));

const LegendText = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column'
}));

const LegendSubtext = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary
}));

const gmu511Boundary = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-106.4742, 39.7403],
      [-106.2742, 39.7403],
      [-106.2742, 39.5403],
      [-106.4742, 39.5403],
      [-106.4742, 39.7403]
    ]]
  }
};

const locations = [
  {
    id: 1,
    name: 'Two Elk Trail',
    coordinates: [-106.3742, 39.6403],
    description: 'Popular elk migration route and hunting area',
    type: 'trail'
  },
  {
    id: 2,
    name: 'Red and White Mountain',
    coordinates: [-106.3542, 39.6603],
    description: 'High elevation area with good visibility',
    type: 'viewpoint'
  },
  {
    id: 3,
    name: 'Game Creek Bowl',
    coordinates: [-106.3642, 39.6203],
    description: 'Dense forest area with elk bedding spots',
    type: 'hunting'
  },
  {
    id: 4,
    name: 'Trail Camera #1',
    coordinates: [-106.3842, 39.6303],
    description: 'Active game trail with recent elk sightings',
    type: 'camera'
  }
];

const SPECIES_COLORS = {
  elk: {
    base: [255, 0, 0], // Red
    gradient: [
      [0, 'rgba(255, 0, 0, 0)'],
      [0.2, 'rgba(255, 0, 0, 0.2)'],
      [0.4, 'rgba(255, 0, 0, 0.4)'],
      [0.6, 'rgba(255, 0, 0, 0.6)'],
      [0.8, 'rgba(255, 0, 0, 0.8)'],
      [1, 'rgba(255, 0, 0, 1)']
    ]
  },
  mule_deer: {
    base: [0, 255, 0], // Green
    gradient: [
      [0, 'rgba(0, 255, 0, 0)'],
      [0.2, 'rgba(0, 255, 0, 0.2)'],
      [0.4, 'rgba(0, 255, 0, 0.4)'],
      [0.6, 'rgba(0, 255, 0, 0.6)'],
      [0.8, 'rgba(0, 255, 0, 0.8)'],
      [1, 'rgba(0, 255, 0, 1)']
    ]
  },
  turkey: {
    base: [0, 0, 255], // Blue
    gradient: [
      [0, 'rgba(0, 0, 255, 0)'],
      [0.2, 'rgba(0, 0, 255, 0.2)'],
      [0.4, 'rgba(0, 0, 255, 0.4)'],
      [0.6, 'rgba(0, 0, 255, 0.6)'],
      [0.8, 'rgba(0, 0, 255, 0.8)'],
      [1, 'rgba(0, 0, 255, 1)']
    ]
  }
};

const createPredictionLayer = (species) => ({
  id: `predictions-${species}`,
  type: 'heatmap',
  filter: ['==', ['get', 'type'], species],
  paint: {
    'heatmap-weight': ['get', 'probability'],
    'heatmap-intensity': 1,
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      ...SPECIES_COLORS[species].gradient
    ],
    'heatmap-radius': 30
  }
});

const MapView = () => {
  const theme = useTheme();
  const mapRef = useRef(null);
  const { mapSettings, updateMapSettings, setMapRef } = useMapSettings();
  const [viewState, setViewState] = useState({
    ...mapSettings.viewport,
    width: '100%',
    height: '100%',
    position: 'relative'
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [hunters, setHunters] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedHunter, setSelectedHunter] = useState(null);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [emergency, setEmergency] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState('elk');
  const [showConditions, setShowConditions] = useState(true);
  const [showRegulations, setShowRegulations] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [hoverInfo, setHoverInfo] = useState(null);

  const onMapLoad = useCallback((event) => {
    const map = event.target;
    mapRef.current = map;
    setMapRef(map);
    setMapInstance(map);

    // Disable map rotation using right click + drag and touch rotation gesture
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    // Wait for the style to load before setting loaded state
    map.once('style.load', () => {
      setMapLoaded(true);
    });
  }, [setMapRef]);

  const onMove = useCallback((evt) => {
    if (!mapLoaded) return;
    setViewState(evt.viewState);
    updateMapSettings({ viewport: evt.viewState });
  }, [mapLoaded, updateMapSettings]);

  const onClick = useCallback((event) => {
    if (!mapLoaded || !event.features?.length) {
      setSelectedLocation(null);
      return;
    }

    const feature = event.features[0];
    const { lng: longitude, lat: latitude } = event.lngLat;

    if (feature.layer.id === 'gmu-lines') {
      setSelectedLocation({
        latitude,
        longitude,
        gmu: feature.properties.name
      });
    } else if (feature.layer.id === 'prediction-heat') {
      setSelectedLocation({
        latitude,
        longitude,
        probability: feature.properties.probability,
        species: feature.properties.species
      });
    }
  }, [mapLoaded]);

  const onHover = useCallback((event) => {
    if (!mapLoaded || !mapInstance) return;

    const { features, point: { x, y }, lngLat: { lng, lat } } = event;
    const hoveredFeature = features && features[0];

    // Update cursor style based on feature
    if (hoveredFeature) {
      mapInstance.getCanvas().style.cursor = 'pointer';
    } else {
      mapInstance.getCanvas().style.cursor = '';
    }
    
    setHoverInfo(hoveredFeature ? {
      feature: hoveredFeature,
      x,
      y,
      longitude: lng,
      latitude: lat
    } : null);
  }, [mapLoaded, mapInstance]);

  const handleMenuClick = useCallback((event) => {
    setMenuAnchor(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuAnchor(null);
  }, []);

  const getCursor = ({ isHovering, isDragging }) => {
    if (isDragging) return 'grabbing';
    if (isHovering) return 'pointer';
    return 'default';
  };

  useEffect(() => {
    if (!mapLoaded) return;

    const map = mapRef.current.getMap();
    if (!map) return;

    // Add event listeners for mouse interactions
    map.on('mouseenter', 'gmu-lines', () => {
      if (map.loaded()) {
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    map.on('mouseleave', 'gmu-lines', () => {
      if (map.loaded()) {
        map.getCanvas().style.cursor = '';
      }
    });

    map.on('mouseenter', 'prediction-heat', () => {
      if (map.loaded()) {
        map.getCanvas().style.cursor = 'pointer';
      }
    });

    map.on('mouseleave', 'prediction-heat', () => {
      if (map.loaded()) {
        map.getCanvas().style.cursor = '';
      }
    });

    return () => {
      if (map && map.loaded()) {
        map.off('mouseenter', 'gmu-lines');
        map.off('mouseleave', 'gmu-lines');
        map.off('mouseenter', 'prediction-heat');
        map.off('mouseleave', 'prediction-heat');
      }
    };
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapLoaded) return;

    const socket = io('http://localhost:5000');
    setSocket(socket);

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('message', (data) => {
      setMessages(prev => [...prev, { ...data, isNew: true }]);
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => msg.timestamp === data.timestamp ? { ...msg, isNew: false } : msg)
        );
      }, 300);
    });

    socket.on('emergency', (data) => {
      setEmergency(data);
      setSnackbarMessage(`Emergency alert from ${data.from_id}!`);
      setShowSnackbar(true);
    });

    const fetchPredictions = async () => {
      try {
        const terrainData = {
          waterSources: [
            { lat: 39.6403, lon: -106.3742, type: 'stream' },
            { lat: 39.6789, lon: -106.4389, type: 'pond' }
          ],
          elevation: 8500,
          coverDensity: 0.7,
          foodSources: [
            { lat: 39.5942, lon: -106.2983, type: 'meadow' }
          ]
        };

        const historicalData = [
          {
            lat: 39.6403,
            lon: -106.3742,
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'elk'
          }
        ];

        const bounds = {
          north: viewState.latitude + 0.1,
          south: viewState.latitude - 0.1,
          east: viewState.longitude + 0.1,
          west: viewState.longitude - 0.1
        };

        const newPredictions = await PredictionService.generatePredictions(
          bounds,
          terrainData,
          historicalData
        );

        setPredictions(newPredictions);
      } catch (error) {
        console.error('Error generating predictions:', error);
      }
    };

    fetchPredictions();

    const fetchNodes = async () => {
      try {
        const response = await axios.get('/api/nodes');
        setNodes(response.data.nodes);
      } catch (error) {
        console.error('Failed to fetch nodes:', error);
      }
    };

    fetchNodes();
    const nodeInterval = setInterval(fetchNodes, 10000);

    return () => {
      socket.disconnect();
      clearInterval(nodeInterval);
    };
  }, [viewState.latitude, viewState.longitude, mapLoaded]);

  const handleEmergency = async () => {
    try {
      await axios.post('/api/emergency', {
        type: 'general',
        position: {
          lat: viewState.latitude,
          lng: viewState.longitude
        }
      });
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
    }
  };

  const handleSighting = (sighting) => {
    console.log('New sighting:', sighting);
    setSnackbarMessage('Sighting logged successfully!');
    setShowSnackbar(true);
  };

  const hunterMarkerContent = (hunter) => (
    <MessageBubble>
      <Typography variant="h6">{hunter.username}</Typography>
      <Typography variant="body1">{hunter.lastMessage}</Typography>
      <Typography variant="body2" color="textSecondary">
        {new Date(hunter.lastSeen).toLocaleString()}
      </Typography>
    </MessageBubble>
  );

  const toggleLayer = (layer) => {
    updateMapSettings({ [layer]: !mapSettings[layer] });
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'trail':
        return <Route />;
      case 'viewpoint':
        return <Terrain />;
      case 'camera':
        return <PhotoCamera />;
      default:
        return <MyLocation />;
    }
  };

  if (!mapSettings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MapContainer>
      <Map
        {...viewState}
        ref={mapRef}
        onMove={onMove}
        onClick={onClick}
        onMouseMove={onHover}
        onLoad={onMapLoad}
        interactiveLayerIds={mapSettings.interactiveLayerIds}
        getCursor={getCursor}
        mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        maxZoom={20}
        minZoom={3}
        maxPitch={85}
        dragRotate={false}
        pitchWithRotate={false}
        attributionControl={false}
        renderWorldCopies={false}
        style={{ width: '100%', height: '100%', position: 'relative' }}
        transformRequest={(url, resourceType) => {
          if (resourceType === 'Source' || resourceType === 'Style') {
            return {
              url,
              headers: {
                'Cache-Control': 'no-cache'
              }
            };
          }
        }}
      >
        <NavigationControl position="top-right" />

        {mapLoaded && mapSettings.gmuBoundaries && (
          <Source
            id="gmu-boundaries"
            type="geojson"
            data={mapSettings.gmuBoundaries}
            generateId={true}
          >
            <Layer
              id="gmu-lines"
              type="line"
              paint={{
                'line-color': theme.palette.primary.main,
                'line-width': 2
              }}
            />
          </Source>
        )}

        {mapLoaded && predictions.length > 0 && (
          <Source
            id="predictions"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: predictions.map(p => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [p.longitude, p.latitude]
                },
                properties: {
                  probability: p.probability,
                  species: p.species
                }
              }))
            }}
          >
            <Layer
              id="prediction-heat"
              type="heatmap"
              paint={{
                'heatmap-weight': ['get', 'probability'],
                'heatmap-intensity': 1,
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(0, 0, 255, 0)',
                  0.2, theme.palette.info.light,
                  0.4, theme.palette.warning.light,
                  0.6, theme.palette.warning.main,
                  0.8, theme.palette.error.light,
                  1, theme.palette.error.main
                ],
                'heatmap-radius': 30
              }}
            />
          </Source>
        )}

        {selectedLocation && (
          <Popup
            latitude={selectedLocation.latitude}
            longitude={selectedLocation.longitude}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedLocation(null)}
            anchor="bottom"
            offset={[0, -10]}
          >
            <Box p={1}>
              <Typography variant="subtitle1">
                {selectedLocation.gmu ? `GMU ${selectedLocation.gmu}` : 'Selected Location'}
              </Typography>
              <Typography variant="body2">
                Lat: {selectedLocation.latitude.toFixed(4)}
                <br />
                Lon: {selectedLocation.longitude.toFixed(4)}
                {selectedLocation.probability && (
                  <>
                    <br />
                    Probability: {(selectedLocation.probability * 100).toFixed(1)}%
                    <br />
                    Species: {selectedLocation.species}
                  </>
                )}
              </Typography>
            </Box>
          </Popup>
        )}

        {/* Keep other components the same */}
      </Map>

      <MapButton color="primary" onClick={handleMenuClick}>
        <MenuIcon />
      </MapButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setShowConditions(!showConditions);
          handleMenuClose();
        }}>
          {showConditions ? 'Hide' : 'Show'} Hunting Conditions
        </MenuItem>
        <MenuItem onClick={() => {
          setShowRegulations(!showRegulations);
          handleMenuClose();
        }}>
          {showRegulations ? 'Hide' : 'Show'} Regulations
        </MenuItem>
        <MenuItem onClick={() => {
          setSelectedAnimal(selectedAnimal === 'elk' ? 'deer' : 'elk');
          handleMenuClose();
        }}>
          Switch to {selectedAnimal === 'elk' ? 'Deer' : 'Elk'} Hunting
        </MenuItem>
      </Menu>

      {showConditions && (
        <HuntingConditions 
          latitude={viewState.latitude}
          longitude={viewState.longitude}
          animalType={selectedAnimal}
        />
      )}

      {showRegulations && (
        <RegulationsGuide 
          location={{
            lat: viewState.latitude,
            lng: viewState.longitude
          }}
        />
      )}

      <GameSightings 
        onAddSighting={handleSighting}
        currentLocation={{
          lat: viewState.latitude,
          lng: viewState.longitude
        }}
      />

      <Button
        variant="contained"
        color="error"
        startIcon={<WarningIcon />}
        onClick={handleEmergency}
        sx={{
          position: 'absolute',
          bottom: theme.spacing(4),
          right: theme.spacing(4)
        }}
      >
        Emergency Alert
      </Button>

      <MessagePanel>
        <Box sx={{ marginBottom: theme.spacing(2) }}>
          <MessageIcon /> Messages
        </Box>
        {messages.map((msg, index) => (
          <MessageBubbleNew 
            key={index}
            isEmergency={msg.type === 'emergency'}
            isNew={msg.isNew}
          >
            <Typography variant="body1" fontWeight="bold">{msg.from_id}</Typography>
            <Typography variant="body1">{msg.content}</Typography>
            <Typography variant="body2" color="textSecondary">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </Typography>
          </MessageBubbleNew>
        ))}
      </MessagePanel>

      {selectedHunter && (
        <Popup
          latitude={selectedHunter.latitude}
          longitude={selectedHunter.longitude}
          onClose={() => setSelectedHunter(null)}
        >
          {hunterMarkerContent(selectedHunter)}
        </Popup>
      )}

      {emergency && (
        <EmergencyAlert 
          severity="error"
          onClose={() => setEmergency(null)}
        >
          <Typography variant="h6">Emergency Alert!</Typography>
          <Typography variant="body1">Hunter needs assistance at:</Typography>
          <Typography variant="body1">Lat: {emergency.position.lat}</Typography>
          <Typography variant="body1">Lng: {emergency.position.lng}</Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setViewState({
                ...viewState,
                latitude: emergency.position.lat,
                longitude: emergency.position.lng,
                zoom: 15
              });
            }}
          >
            View Location
          </Button>
        </EmergencyAlert>
      )}

      {showLegend && (
        <Legend>
          <Typography variant="subtitle2" gutterBottom>
            Animal Predictions
          </Typography>
          {Object.entries(SPECIES_COLORS).map(([species, colors]) => {
            const prediction = predictions.find(p => p.type === species);
            const displayName = species.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            return (
              <LegendItem key={species}>
                <LegendColor color={colors.gradient[colors.gradient.length - 1][1]} />
                <LegendText>
                  <Typography variant="body1">{displayName}</Typography>
                  {prediction && (
                    <LegendSubtext>
                      {prediction.breeding ? '🔄 Breeding Season' : ''}
                      {prediction.migration !== 'stable' ? 
                        ` • ${prediction.migration === 'upward' ? '⬆️' : '⬇️'} Migration` : 
                        ''}
                      <br />
                      Food: {prediction.preferredFood.join(', ')}
                    </LegendSubtext>
                  )}
                </LegendText>
              </LegendItem>
            );
          })}
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            Current Season: {predictions[0]?.season || 'Loading...'}
          </Typography>
        </Legend>
      )}
      
      <Button
        sx={{
          position: 'absolute',
          bottom: theme.spacing(4),
          right: showLegend ? theme.spacing(31) : theme.spacing(4),
          zIndex: 1
        }}
        variant="contained"
        color="primary"
        onClick={() => setShowLegend(!showLegend)}
      >
        {showLegend ? 'Hide Legend' : 'Show Legend'}
      </Button>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />
    </MapContainer>
  );
};

export default MapView;
