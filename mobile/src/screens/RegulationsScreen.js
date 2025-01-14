import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, List, Searchbar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegulationsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [regulations, setRegulations] = useState([]);

  useEffect(() => {
    loadRegulations();
  }, []);

  const loadRegulations = async () => {
    try {
      const stored = await AsyncStorage.getItem('regulations');
      if (stored) {
        setRegulations(JSON.parse(stored));
      } else {
        // Load mock data
        setRegulations([
          {
            id: 1,
            category: 'seasons',
            title: 'Elk Hunting Season 2025',
            description: 'Regular rifle season runs October 15 - November 18',
            details: [
              'First Season: Oct 15-19',
              'Second Season: Oct 29-Nov 6',
              'Third Season: Nov 12-18'
            ]
          },
          {
            id: 2,
            category: 'licenses',
            title: 'License Requirements',
            description: 'Required licenses and permits for big game hunting',
            details: [
              'Big Game License',
              'Habitat Stamp',
              'Hunter Education Certificate'
            ]
          },
          {
            id: 3,
            category: 'safety',
            title: 'Safety Requirements',
            description: 'Essential safety guidelines for hunters',
            details: [
              'Wear blaze orange or pink',
              'Properly identify your target',
              'Be aware of your shooting lane'
            ]
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading regulations:', error);
    }
  };

  const filteredRegulations = regulations.filter(reg => {
    const matchesSearch = 
      reg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reg.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', label: 'All', icon: 'view-list' },
    { id: 'seasons', label: 'Seasons', icon: 'calendar' },
    { id: 'licenses', label: 'Licenses', icon: 'license' },
    { id: 'safety', label: 'Safety', icon: 'shield-check' },
    { id: 'limits', label: 'Limits', icon: 'scale-balance' }
  ];

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search regulations..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map(category => (
          <Chip
            key={category.id}
            icon={() => (
              <Icon 
                name={category.icon} 
                size={20} 
                color={selectedCategory === category.id ? 'white' : '#FF4D00'} 
              />
            )}
            selected={selectedCategory === category.id}
            onPress={() => setSelectedCategory(category.id)}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.selectedChip
            ]}
            textStyle={selectedCategory === category.id ? styles.selectedChipText : null}
          >
            {category.label}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {filteredRegulations.map(regulation => (
          <Card key={regulation.id} style={styles.card}>
            <Card.Content>
              <Title>{regulation.title}</Title>
              <Paragraph>{regulation.description}</Paragraph>
              <List.Section>
                {regulation.details.map((detail, index) => (
                  <List.Item
                    key={index}
                    title={detail}
                    left={props => <List.Icon {...props} icon="chevron-right" />}
                  />
                ))}
              </List.Section>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E1',
  },
  searchbar: {
    margin: 16,
    backgroundColor: 'white',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: 'white',
  },
  selectedChip: {
    backgroundColor: '#FF4D00',
  },
  selectedChipText: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 16,
  },
});

export default RegulationsScreen;
