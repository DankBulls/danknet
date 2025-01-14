import React, { createContext, useState, useEffect } from 'react';
import BleManager from 'react-native-ble-manager';
import BackgroundTimer from 'react-native-background-timer';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MeshContext = createContext();

export const MeshProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [nodes, setNodes] = useState([]);
  const [messages, setMessages] = useState([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Initialize BLE
    BleManager.start({ showAlert: false });

    // Load cached data
    loadCachedData();

    // Start periodic scanning
    const scanInterval = BackgroundTimer.setInterval(() => {
      if (!scanning) {
        scanForDevices();
      }
    }, 30000); // Scan every 30 seconds

    return () => {
      BackgroundTimer.clearInterval(scanInterval);
      BleManager.stopScan();
    };
  }, []);

  const loadCachedData = async () => {
    try {
      const cachedNodes = await AsyncStorage.getItem('cachedNodes');
      const cachedMessages = await AsyncStorage.getItem('cachedMessages');

      if (cachedNodes) setNodes(JSON.parse(cachedNodes));
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  const scanForDevices = async () => {
    try {
      setScanning(true);
      await BleManager.scan([], 5, true); // Scan for 5 seconds

      BleManager.stopScan().then(() => {
        setScanning(false);
      });
    } catch (error) {
      console.error('Scanning failed:', error);
      setScanning(false);
    }
  };

  const sendMessage = async (message) => {
    try {
      // Format message for Meshtastic protocol
      const formattedMessage = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...message,
      };

      // Store message locally
      const updatedMessages = [...messages, formattedMessage];
      setMessages(updatedMessages);
      await AsyncStorage.setItem('cachedMessages', JSON.stringify(updatedMessages));

      // Send to connected nodes
      nodes.forEach(async (node) => {
        try {
          await BleManager.write(
            node.id,
            'SERVICE_UUID',
            'CHARACTERISTIC_UUID',
            Array.from(new TextEncoder().encode(JSON.stringify(formattedMessage)))
          );
        } catch (error) {
          console.error(`Failed to send to node ${node.id}:`, error);
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  };

  const handleNewNode = async (node) => {
    const updatedNodes = [...nodes, node];
    setNodes(updatedNodes);
    await AsyncStorage.setItem('cachedNodes', JSON.stringify(updatedNodes));
  };

  const handleNodeDisconnect = async (nodeId) => {
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    setNodes(updatedNodes);
    await AsyncStorage.setItem('cachedNodes', JSON.stringify(updatedNodes));
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.multiRemove(['cachedNodes', 'cachedMessages']);
      setNodes([]);
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  return (
    <MeshContext.Provider
      value={{
        isConnected,
        nodes,
        messages,
        scanning,
        sendMessage,
        scanForDevices,
        clearCache,
      }}
    >
      {children}
    </MeshContext.Provider>
  );
};
