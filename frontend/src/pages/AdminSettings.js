import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ padding: '20px 0' }}>
      {value === index && children}
    </div>
  );
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [gmus, setGmus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState({ open: false, type: '', data: null });
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    fetchData();
    fetchInvitations();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users
      const usersResponse = await fetch(`${process.env.REACT_APP_API_URL}/users.php`);
      const usersData = await usersResponse.json();
      setUsers(usersData);

      // Fetch GMUs
      const gmusResponse = await fetch(`${process.env.REACT_APP_API_URL}/gmus.php`);
      const gmusData = await gmusResponse.json();
      setGmus(gmusData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/auth.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_invitations'
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setInvitations(data.invitations);
      } else {
        setMessage(data.error || 'Failed to fetch invitations');
        setSeverity('error');
        setOpen(true);
      }
    } catch (error) {
      setMessage('Failed to fetch invitations');
      setSeverity('error');
      setOpen(true);
    }
  };

  const handleEditUser = (user) => {
    setEditDialog({ open: true, type: 'user', data: user });
  };

  const handleEditGMU = (gmu) => {
    setEditDialog({ open: true, type: 'gmu', data: gmu });
  };

  const handleSave = async () => {
    try {
      const { type, data } = editDialog;
      const endpoint = type === 'user' ? 'users.php' : 'gmus.php';
      
      await fetch(`${process.env.REACT_APP_API_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      setEditDialog({ open: false, type: '', data: null });
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_invitation',
          email
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Invitation sent successfully');
        setSeverity('success');
        setEmail('');
        // Refresh invitations list
        fetchInvitations();
      } else {
        setMessage(data.error || 'Failed to send invitation');
        setSeverity('error');
      }
    } catch (error) {
      setMessage('Failed to send invitation');
      setSeverity('error');
    }
    
    setOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4">Unauthorized Access</Typography>
        <Typography>You do not have permission to view this page.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Admin Settings
        </Typography>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Users" />
          <Tab label="GMUs" />
          <Tab label="System Settings" />
          <Tab label="Invitations" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <List>
            {users.map((user) => (
              <ListItem key={user.id}>
                <ListItemText
                  primary={user.username}
                  secondary={`Role: ${user.role} | Email: ${user.email}`}
                />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => handleEditUser(user)}>
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <List>
            {gmus.map((gmu) => (
              <ListItem key={gmu.id}>
                <ListItemText
                  primary={`GMU ${gmu.gmu_number}: ${gmu.name}`}
                  secondary={gmu.description}
                />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => handleEditGMU(gmu)}>
                    <EditIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleEditGMU({ id: null, gmu_number: '', name: '', description: '' })}
            sx={{ mt: 2 }}
          >
            Add GMU
          </Button>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <List>
            <ListItem>
              <ListItemText
                primary="Enable Public Registration"
                secondary="Allow users to register without admin approval"
              />
              <Switch />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Debug Mode"
                secondary="Enable detailed error logging"
              />
              <Switch />
            </ListItem>
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Invite New User
            </Typography>
            <Box component="form" onSubmit={handleInvite} sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ flexGrow: 1 }}
              />
              <Button type="submit" variant="contained">
                Send Invitation
              </Button>
            </Box>
          </Paper>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow
                    key={invitation.email}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {invitation.email}
                    </TableCell>
                    <TableCell align="right">{invitation.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, type: '', data: null })}>
        <DialogTitle>
          {editDialog.type === 'user' ? 'Edit User' : 'Edit GMU'}
        </DialogTitle>
        <DialogContent>
          {editDialog.type === 'user' && (
            <>
              <TextField
                fullWidth
                label="Username"
                value={editDialog.data?.username || ''}
                onChange={(e) => setEditDialog({
                  ...editDialog,
                  data: { ...editDialog.data, username: e.target.value }
                })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                value={editDialog.data?.email || ''}
                onChange={(e) => setEditDialog({
                  ...editDialog,
                  data: { ...editDialog.data, email: e.target.value }
                })}
                margin="normal"
              />
            </>
          )}
          {editDialog.type === 'gmu' && (
            <>
              <TextField
                fullWidth
                label="GMU Number"
                value={editDialog.data?.gmu_number || ''}
                onChange={(e) => setEditDialog({
                  ...editDialog,
                  data: { ...editDialog.data, gmu_number: e.target.value }
                })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Name"
                value={editDialog.data?.name || ''}
                onChange={(e) => setEditDialog({
                  ...editDialog,
                  data: { ...editDialog.data, name: e.target.value }
                })}
                margin="normal"
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={editDialog.data?.description || ''}
                onChange={(e) => setEditDialog({
                  ...editDialog,
                  data: { ...editDialog.data, description: e.target.value }
                })}
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, type: '', data: null })}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
