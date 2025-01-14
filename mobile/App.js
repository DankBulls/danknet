import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import MapScreen from './src/screens/MapScreen';
import SightingsScreen from './src/screens/SightingsScreen';
import RegulationsScreen from './src/screens/RegulationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';

// Context
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { MeshProvider } from './src/context/MeshContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        switch (route.name) {
          case 'Map':
            iconName = focused ? 'map' : 'map-outline';
            break;
          case 'Sightings':
            iconName = focused ? 'deer' : 'deer';
            break;
          case 'Regulations':
            iconName = focused ? 'book-open-variant' : 'book-open-outline';
            break;
          case 'Profile':
            iconName = focused ? 'account' : 'account-outline';
            break;
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#FF4D00',
      tabBarInactiveTintColor: '#8B4513',
      tabBarStyle: {
        backgroundColor: '#FFF5E1',
      }
    })}
  >
    <Tab.Screen 
      name="Map" 
      component={MapScreen}
      options={{
        headerShown: false
      }}
    />
    <Tab.Screen 
      name="Sightings" 
      component={SightingsScreen}
      options={{
        title: 'Game Sightings'
      }}
    />
    <Tab.Screen 
      name="Regulations" 
      component={RegulationsScreen}
      options={{
        title: 'Hunting Guide'
      }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{
        title: 'My Profile'
      }}
    />
  </Tab.Navigator>
);

const App = () => {
  return (
    <AuthProvider>
      <LocationProvider>
        <MeshProvider>
          <PaperProvider>
            <NavigationContainer>
              <Stack.Navigator>
                <Stack.Screen
                  name="Login"
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Main"
                  component={TabNavigator}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </PaperProvider>
        </MeshProvider>
      </LocationProvider>
    </AuthProvider>
  );
};

export default App;
