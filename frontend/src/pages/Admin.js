import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  Map as MapIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useMapSettings } from '../contexts/MapContext';

const AdminContainer = styled.div`
  padding: ${props => props.theme.spacing.large};
`;

const TabPanel = styled.div`
  padding: ${props => props.theme.spacing.large} 0;
`;

const Section = styled(Paper)`
  padding: ${props => props.theme.spacing.large};
  margin-bottom: ${props => props.theme.spacing.large};
`;

const ActionButton = styled(Button)`
  margin-top: ${props => props.theme.spacing.medium} !important;
`;

const StyledAccordion = styled(Accordion)`
  margin-bottom: ${props => props.theme.spacing.medium} !important;
  background: ${props => props.theme.colors.cream} !important;
`;

const Admin = () => {
  const { mapSettings, updateMapSettings } = useMapSettings();
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [seasonDates, setSeasonDates] = useState({
    start: '2025-10-01',
    end: '2025-11-14'
  });

  // Announcements State
  const [announcements, setAnnouncements] = useState([
    {
      id: 1,
      title: 'Elk Season Dates',
      content: 'Elk season runs from October 1st to November 14th, 2025',
      priority: 'high'
    }
  ]);

  // Map Markers State
  const [mapMarkers, setMapMarkers] = useState([
    {
      id: 1,
      name: 'Trail Camera #1',
      latitude: 39.6403,
      longitude: -106.3742,
      type: 'camera'
    }
  ]);

  // User Management State
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'member',
      active: true
    }
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddAnnouncement = () => {
    setDialogType('announcement');
    setOpenDialog(true);
  };

  const handleAddMapMarker = () => {
    setDialogType('marker');
    setOpenDialog(true);
  };

  const handleAddUser = () => {
    setDialogType('user');
    setOpenDialog(true);
  };

  const handleSave = () => {
    setOpenDialog(false);
    setShowSnackbar(true);
    setSnackbarMessage('Changes saved successfully!');
  };

  const handleDateChange = (type) => (event) => {
    setSeasonDates(prev => ({
      ...prev,
      [type]: event.target.value
    }));
  };

  const renderAnnouncementsPanel = () => (
    <TabPanel>
      <Section elevation={3}>
        <Typography variant="h6" gutterBottom>
          Announcements & Notifications
        </Typography>
        <List>
          {announcements.map((announcement) => (
            <StyledAccordion key={announcement.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{announcement.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Title"
                      defaultValue={announcement.title}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Content"
                      defaultValue={announcement.content}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={announcement.priority === 'high'}
                          onChange={() => {}}
                        />
                      }
                      label="High Priority"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </StyledAccordion>
          ))}
        </List>
        <ActionButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAnnouncement}
        >
          Add Announcement
        </ActionButton>
      </Section>

      <Section elevation={3}>
        <Typography variant="h6" gutterBottom>
          Season Dates
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Elk Season Start"
              type="date"
              value={seasonDates.start}
              onChange={handleDateChange('start')}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Elk Season End"
              type="date"
              value={seasonDates.end}
              onChange={handleDateChange('end')}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
        <ActionButton
          variant="contained"
          onClick={() => {
            setShowSnackbar(true);
            setSnackbarMessage('Season dates updated successfully!');
          }}
        >
          Update Season Dates
        </ActionButton>
      </Section>
    </TabPanel>
  );

  const renderMapPanel = () => (
    <TabPanel>
      <Section elevation={3}>
        <Typography variant="h6" gutterBottom>
          Map Settings
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={mapSettings.layers.boundary}
                  onChange={(e) => updateMapSettings({
                    layers: {
                      ...mapSettings.layers,
                      boundary: e.target.checked
                    }
                  })}
                />
              }
              label="Show GMU Boundary"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={mapSettings.layers.terrain}
                  onChange={(e) => updateMapSettings({
                    layers: {
                      ...mapSettings.layers,
                      terrain: e.target.checked
                    }
                  })}
                />
              }
              label="Show Terrain"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={mapSettings.layers.cameras}
                  onChange={(e) => updateMapSettings({
                    layers: {
                      ...mapSettings.layers,
                      cameras: e.target.checked
                    }
                  })}
                />
              }
              label="Show Trail Cameras"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={mapSettings.layers.trails}
                  onChange={(e) => updateMapSettings({
                    layers: {
                      ...mapSettings.layers,
                      trails: e.target.checked
                    }
                  })}
                />
              }
              label="Show Game Trails"
            />
          </Grid>
        </Grid>
      </Section>

      <Section elevation={3}>
        <Typography variant="h6" gutterBottom>
          Map Markers
        </Typography>
        <List>
          {mapMarkers.map((marker) => (
            <ListItem key={marker.id}>
              <ListItemText
                primary={marker.name}
                secondary={`${marker.latitude}, ${marker.longitude}`}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="edit">
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete">
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <ActionButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddMapMarker}
        >
          Add Map Marker
        </ActionButton>
      </Section>

      <Section elevation={3}>
        <Typography variant="h6" gutterBottom>
          GMU Boundaries
        </Typography>
        <TextField
          fullWidth
          label="GMU 511 Coordinates"
          multiline
          rows={4}
          value={JSON.stringify(mapSettings.gmuBoundaries.features[0].geometry.coordinates[0], null, 2)}
          onChange={(e) => {
            try {
              const coordinates = JSON.parse(e.target.value);
              updateMapSettings({
                gmuBoundaries: {
                  ...mapSettings.gmuBoundaries,
                  features: [{
                    ...mapSettings.gmuBoundaries.features[0],
                    geometry: {
                      ...mapSettings.gmuBoundaries.features[0].geometry,
                      coordinates: [coordinates]
                    }
                  }]
                }
              });
            } catch (err) {
              // Handle parse error
            }
          }}
        />
        <ActionButton 
          variant="contained"
          onClick={() => {
            setShowSnackbar(true);
            setSnackbarMessage('GMU boundaries updated successfully!');
          }}
        >
          Update Boundaries
        </ActionButton>
      </Section>
    </TabPanel>
  );

  const renderUsersPanel = () => (
    <TabPanel>
      <Section elevation={3}>
        <Typography variant="h6" gutterBottom>
          User Management
        </Typography>
        <List>
          {users.map((user) => (
            <ListItem key={user.id}>
              <ListItemText
                primary={user.name}
                secondary={`${user.email} - ${user.role}`}
              />
              <ListItemSecondaryAction>
                <FormControlLabel
                  control={
                    <Switch
                      checked={user.active}
                      onChange={() => {}}
                    />
                  }
                  label="Active"
                />
                <IconButton edge="end" aria-label="edit">
                  <EditIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <ActionButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Add User
        </ActionButton>
      </Section>
    </TabPanel>
  );

  return (
    <AdminContainer>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Paper elevation={3}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<NotificationsIcon />} label="Announcements" />
          <Tab icon={<MapIcon />} label="Map Management" />
          <Tab icon={<GroupIcon />} label="Users" />
        </Tabs>

        {tabValue === 0 && renderAnnouncementsPanel()}
        {tabValue === 1 && renderMapPanel()}
        {tabValue === 2 && renderUsersPanel()}
      </Paper>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'announcement' && 'New Announcement'}
          {dialogType === 'marker' && 'New Map Marker'}
          {dialogType === 'user' && 'New User'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'announcement' && (
            <>
              <TextField
                fullWidth
                label="Title"
                margin="normal"
              />
              <TextField
                fullWidth
                label="Content"
                multiline
                rows={4}
                margin="normal"
              />
              <FormControlLabel
                control={<Switch />}
                label="High Priority"
              />
            </>
          )}
          {dialogType === 'marker' && (
            <>
              <TextField
                fullWidth
                label="Name"
                margin="normal"
              />
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                margin="normal"
              />
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                margin="normal"
              />
            </>
          )}
          {dialogType === 'user' && (
            <>
              <TextField
                fullWidth
                label="Name"
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                margin="normal"
              />
              <TextField
                fullWidth
                label="Role"
                margin="normal"
                select
                SelectProps={{
                  native: true
                }}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert onClose={() => setShowSnackbar(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </AdminContainer>
  );
};

export default Admin;
