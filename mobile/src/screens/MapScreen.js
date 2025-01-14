import React, { useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { FAB, Portal, Modal, Text, Button, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LocationContext } from '../context/LocationContext';
import { MeshContext } from '../context/MeshContext';
import { AuthContext } from '../context/AuthContext';

import HuntingConditions from '../components/HuntingConditions';
import EmergencyAlert from '../components/EmergencyAlert';
import OfflineNotice from '../components/OfflineNotice';

const MapScreen = () => {
  const [region, setRegion] = useState({
    latitude: 39.7392,
    longitude: -104.9903,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [hunters, setHunters] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const { location } = useContext(LocationContext);
  const { sendMessage, nodes } = useContext(MeshContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Check network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    // Load cached data
    loadCachedData();

    // Update location if available
    if (location) {
      setRegion({
        ...region,
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }

    return () => {
      unsubscribe();
    };
  }, [location]);

  const loadCachedData = async () => {
    try {
      const cachedHunters = await AsyncStorage.getItem('cachedHunters');
      const cachedPredictions = await AsyncStorage.getItem('cachedPredictions');

      if (cachedHunters) setHunters(JSON.parse(cachedHunters));
      if (cachedPredictions) setPredictions(JSON.parse(cachedPredictions));
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency Alert',
      'Are you sure you want to send an emergency alert to all nearby hunters?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Send Alert',
          onPress: () => {
            sendMessage({
              type: 'emergency',
              location: {
                latitude: region.latitude,
                longitude: region.longitude,
              },
              userId: user.id,
            });
            setShowEmergency(true);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderHunterMarker = (hunter) => (
    <Marker
      key={hunter.id}
      coordinate={{
        latitude: hunter.latitude,
        longitude: hunter.longitude,
      }}
    >
      <Icon 
        name="account" 
        size={30} 
        color={hunter.emergency ? '#FF0000' : '#FF4D00'} 
      />
      <Callout>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{hunter.name}</Text>
          <Text>Last seen: {new Date(hunter.lastSeen).toLocaleTimeString()}</Text>
          {hunter.message && (
            <Text style={styles.calloutMessage}>{hunter.message}</Text>
          )}
        </View>
      </Callout>
    </Marker>
  );

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsCompass
      >
        {hunters.map(renderHunterMarker)}
        {predictions.map((pred, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: pred.latitude,
              longitude: pred.longitude,
            }}
            opacity={pred.probability}
          >
            <Icon 
              name={pred.animal_type === 'elk' ? 'deer' : 'deer'} 
              size={30} 
              color="#2E5A1C" 
            />
          </Marker>
        ))}
      </MapView>

      {isOffline && <OfflineNotice />}

      <Portal>
        <FAB.Group
          open={fabOpen}
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'alert',
              label: 'Emergency',
              onPress: handleEmergency,
              style: { backgroundColor: '#FF0000' },
            },
            {
              icon: 'weather-sunny',
              label: 'Conditions',
              onPress: () => setShowConditions(true),
            },
            {
              icon: 'crosshairs-gps',
              label: 'Track Game',
              onPress: () => navigation.navigate('Sightings'),
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          style={styles.fab}
        />
      </Portal>

      <Modal
        visible={showConditions}
        onDismiss={() => setShowConditions(false)}
        contentContainerStyle={styles.modal}
      >
        <HuntingConditions
          latitude={region.latitude}
          longitude={region.longitude}
        />
      </Modal>

      <EmergencyAlert
        visible={showEmergency}
        onDismiss={() => setShowEmergency(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  callout: {
    padding: 10,
    maxWidth: 200,
  },
  calloutTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calloutMessage: {
    fontStyle: 'italic',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
});

export default MapScreen;
