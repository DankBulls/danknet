import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Banner } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const OfflineNotice = () => {
  return (
    <Banner
      visible={true}
      actions={[
        {
          label: 'Learn More',
          onPress: () => console.log('Show offline mode info'),
        },
      ]}
      icon={({size}) => (
        <Icon name="wifi-off" size={size} color="#FF4D00" />
      )}
      style={styles.banner}
    >
      You're offline. DankNet is using Meshtastic for communication and cached data for maps.
    </Banner>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 245, 225, 0.95)',
  },
});

export default OfflineNotice;
