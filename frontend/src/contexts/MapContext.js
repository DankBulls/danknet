import React, { createContext, useContext, useState, useCallback } from 'react';

const MapContext = createContext(null);

export const useMapSettings = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapSettings must be used within a MapProvider');
  }
  return context;
};

export const MapProvider = ({ children }) => {
  const [mapSettings, setMapSettings] = useState({
    viewport: {
      longitude: -106.3742,
      latitude: 39.6403,
      zoom: 11,
      pitch: 0,
      bearing: 0,
      padding: { top: 0, bottom: 0, left: 0, right: 0 }
    },
    gmuBoundaries: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-106.4742, 39.7403],
              [-106.2742, 39.7403],
              [-106.2742, 39.5403],
              [-106.4742, 39.5403],
              [-106.4742, 39.7403]
            ]]
          },
          properties: {
            name: 'GMU 511'
          }
        }
      ]
    },
    markers: [
      {
        id: 1,
        name: 'Trail Camera #1',
        latitude: 39.6403,
        longitude: -106.3742,
        type: 'camera'
      },
      {
        id: 2,
        name: 'Two Elk Trail',
        latitude: 39.6789,
        longitude: -106.4389,
        type: 'trail'
      },
      {
        id: 3,
        name: 'Red and White Mountain',
        latitude: 39.5942,
        longitude: -106.2983,
        type: 'vantage'
      }
    ],
    layers: {
      boundary: true,
      terrain: true,
      cameras: true,
      trails: true
    },
    interactiveLayerIds: ['gmu-lines', 'prediction-heat', 'marker-points'],
    cursor: 'default'
  });

  const [mapInstance, setMapInstance] = useState(null);

  const updateMapSettings = useCallback((newSettings) => {
    setMapSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  const setMapRef = useCallback((map) => {
    setMapInstance(map);
  }, []);

  const value = {
    mapSettings,
    updateMapSettings,
    mapInstance,
    setMapRef
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

export default MapContext;
