import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { FAB, Card, Title, Paragraph, Button, Modal, Portal } from 'react-native-paper';
import { RNCamera } from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SightingsScreen = () => {
  const [sightings, setSightings] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedSighting, setSelectedSighting] = useState(null);

  useEffect(() => {
    loadSightings();
  }, []);

  const loadSightings = async () => {
    try {
      const stored = await AsyncStorage.getItem('sightings');
      if (stored) {
        setSightings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading sightings:', error);
    }
  };

  const handleAddSighting = async (sighting) => {
    const newSighting = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...sighting,
    };

    const updatedSightings = [newSighting, ...sightings];
    setSightings(updatedSightings);
    
    try {
      await AsyncStorage.setItem('sightings', JSON.stringify(updatedSightings));
    } catch (error) {
      console.error('Error saving sighting:', error);
    }
  };

  const renderSighting = ({ item }) => (
    <Card style={styles.card} onPress={() => setSelectedSighting(item)}>
      {item.photo && (
        <Card.Cover source={{ uri: item.photo }} style={styles.cardImage} />
      )}
      <Card.Content>
        <Title>{item.animalType}</Title>
        <Paragraph>Count: {item.count}</Paragraph>
        <Paragraph>
          {new Date(item.timestamp).toLocaleDateString()} at{' '}
          {new Date(item.timestamp).toLocaleTimeString()}
        </Paragraph>
        {item.notes && <Paragraph>Notes: {item.notes}</Paragraph>}
      </Card.Content>
      <Card.Actions>
        <Button 
          icon="share" 
          onPress={() => {/* Handle sharing */}}
        >
          Share
        </Button>
        <Button 
          icon="map-marker" 
          onPress={() => {/* Navigate to location */}}
        >
          View on Map
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={sightings}
        renderItem={renderSighting}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowForm(true)}
      />

      <Portal>
        <Modal
          visible={showCamera}
          onDismiss={() => setShowCamera(false)}
          contentContainerStyle={styles.cameraContainer}
        >
          <RNCamera
            style={styles.camera}
            type={RNCamera.Constants.Type.back}
            captureAudio={false}
          />
          <FAB
            style={styles.captureButton}
            icon="camera"
            onPress={() => {/* Handle photo capture */}}
          />
        </Modal>

        <Modal
          visible={showForm}
          onDismiss={() => setShowForm(false)}
          contentContainerStyle={styles.formContainer}
        >
          {/* Add Sighting Form */}
        </Modal>

        <Modal
          visible={!!selectedSighting}
          onDismiss={() => setSelectedSighting(null)}
          contentContainerStyle={styles.detailContainer}
        >
          {/* Sighting Details */}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E1',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardImage: {
    height: 200,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF4D00',
  },
  cameraContainer: {
    flex: 1,
    margin: 0,
  },
  camera: {
    flex: 1,
  },
  captureButton: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  detailContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
});

export default SightingsScreen;
