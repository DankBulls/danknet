import React, { useContext, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Avatar, 
  Title, 
  List, 
  Switch, 
  Button, 
  Portal, 
  Modal, 
  TextInput 
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AuthContext } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, signOut } = useContext(AuthContext);
  const [offlineMode, setOfflineMode] = useState(false);
  const [meshEnabled, setMeshEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    emergencyContacts: [],
    defaultLocation: null,
    notificationsEnabled: true,
    locationTrackingEnabled: true,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image
          size={100}
          source={user.avatar ? { uri: user.avatar } : require('../assets/default-avatar.png')}
        />
        <Title style={styles.name}>{user.name}</Title>
      </View>

      <List.Section>
        <List.Subheader>App Settings</List.Subheader>
        
        <List.Item
          title="Offline Mode"
          description="Download maps and data for offline use"
          left={props => <List.Icon {...props} icon="wifi-off" />}
          right={() => (
            <Switch
              value={offlineMode}
              onValueChange={setOfflineMode}
              color="#FF4D00"
            />
          )}
        />

        <List.Item
          title="Mesh Network"
          description="Connect with nearby hunters via Meshtastic"
          left={props => <List.Icon {...props} icon="access-point-network" />}
          right={() => (
            <Switch
              value={meshEnabled}
              onValueChange={setMeshEnabled}
              color="#FF4D00"
            />
          )}
        />

        <List.Item
          title="Emergency Contacts"
          description="Manage your emergency contacts"
          left={props => <List.Icon {...props} icon="account-multiple" />}
          onPress={() => setShowSettings(true)}
        />

        <List.Item
          title="Default Location"
          description="Set your hunting area"
          left={props => <List.Icon {...props} icon="map-marker" />}
          onPress={() => {/* Handle location setting */}}
        />
      </List.Section>

      <List.Section>
        <List.Subheader>App Info</List.Subheader>
        
        <List.Item
          title="Version"
          description="1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
        />

        <List.Item
          title="Terms of Service"
          left={props => <List.Icon {...props} icon="file-document" />}
          onPress={() => {/* Show terms */}}
        />

        <List.Item
          title="Privacy Policy"
          left={props => <List.Icon {...props} icon="shield-account" />}
          onPress={() => {/* Show privacy policy */}}
        />
      </List.Section>

      <Button
        mode="contained"
        onPress={handleSignOut}
        style={styles.signOutButton}
        icon="logout"
      >
        Sign Out
      </Button>

      <Portal>
        <Modal
          visible={showSettings}
          onDismiss={() => setShowSettings(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>Emergency Contacts</Title>
          {/* Emergency contacts form */}
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E1',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  name: {
    marginTop: 10,
    color: '#FF4D00',
  },
  signOutButton: {
    margin: 16,
    marginTop: 32,
    backgroundColor: '#FF4D00',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
});

export default ProfileScreen;
