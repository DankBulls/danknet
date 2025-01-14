import React, { useState } from 'react';
import {
  Box,
  Container,
  Tab,
  Tabs,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AnimalBehaviorAnalysis from './AnimalBehaviorAnalysis';
import MovementPatternAnalysis from './MovementPatternAnalysis';
import EnvironmentalAnalysis from './EnvironmentalAnalysis';
import { analysisContent } from './AnalysisContent';

const Analysis = ({ gmuId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [animalType, setAnimalType] = useState('elk');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAnimalTypeChange = (event) => {
    setAnimalType(event.target.value);
  };

  const TabPanel = ({ children, value, index }) => (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      sx={{ mt: 2 }}
    >
      {value === index && children}
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>Hunt Analysis</Typography>
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {analysisContent.success.title}
          </Typography>
          {analysisContent.success.paragraphs.map((paragraph, index) => (
            <Typography key={index} paragraph>
              {paragraph}
            </Typography>
          ))}
        </Paper>

        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {analysisContent.optimal.title}
          </Typography>
          {analysisContent.optimal.paragraphs.map((paragraph, index) => (
            <Typography key={index} paragraph>
              {paragraph}
            </Typography>
          ))}
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Animal Type</InputLabel>
            <Select
              value={animalType}
              onChange={handleAnimalTypeChange}
              label="Animal Type"
            >
              <MenuItem value="elk">Elk</MenuItem>
              <MenuItem value="deer">Deer</MenuItem>
              <MenuItem value="moose">Moose</MenuItem>
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Analysis Date"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
        </Box>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Environmental Analysis" />
          <Tab label="Movement Patterns" />
          <Tab label="Animal Behavior" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <EnvironmentalAnalysis
          gmuId={gmuId}
          date={selectedDate.toISOString()}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <MovementPatternAnalysis
          gmuId={gmuId}
          animalType={animalType}
          date={selectedDate.toISOString()}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <AnimalBehaviorAnalysis
          gmuId={gmuId}
          animalType={animalType}
          date={selectedDate.toISOString()}
        />
      </TabPanel>
    </Container>
  );
};

export default Analysis;
