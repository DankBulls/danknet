import React from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Modal, Card, Title, Paragraph, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EmergencyAlert = ({ visible, onDismiss, emergency }) => {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Card style={styles.card}>
          <Card.Content>
            <Icon 
              name="alert" 
              size={48} 
              color="#FF0000" 
              style={styles.icon} 
            />
            <Title style={styles.title}>Emergency Alert Sent</Title>
            <Paragraph style={styles.paragraph}>
              Your emergency alert has been broadcast to all nearby hunters via Meshtastic.
              Stay where you are if possible and wait for assistance.
            </Paragraph>
            {emergency && (
              <>
                <Title style={styles.subtitle}>Location Details</Title>
                <Paragraph>
                  Latitude: {emergency.latitude}
                  {'\n'}
                  Longitude: {emergency.longitude}
                </Paragraph>
              </>
            )}
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button 
              mode="contained" 
              onPress={onDismiss}
              style={styles.button}
            >
              OK
            </Button>
          </Card.Actions>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    color: '#FF0000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5,
  },
  paragraph: {
    textAlign: 'center',
    marginBottom: 10,
  },
  actions: {
    justifyContent: 'center',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#FF4D00',
  },
});

export default EmergencyAlert;
