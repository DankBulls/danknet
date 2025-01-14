import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Paper
} from '@mui/material';
import {
  AddLocation,
  Camera,
  Delete,
  Share,
  EmojiNature
} from '@mui/icons-material';

const SightingButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(6),
  right: theme.spacing(6),
  backgroundColor: `${theme.palette.primary.main} !important`,
  color: `${theme.palette.common.white} !important`
}));

const SightingCard = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[1],
  position: 'relative',
  transition: theme.transitions.create(['transform', 'box-shadow'], {
    duration: theme.transitions.duration.standard
  }),

  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4]
  }
}));

const SightingImage = styled('img')(({ theme }) => ({
  width: '100%',
  height: 150,
  objectFit: 'cover',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2)
}));

const SightingMeta = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  color: theme.palette.text.secondary
}));

const SightingActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(1)
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.contrastText
  }
}));

const GameSightings = ({ onAddSighting, currentLocation }) => {
  const [open, setOpen] = useState(false);
  const [sightings, setSightings] = useState([]);
  const [newSighting, setNewSighting] = useState({
    type: '',
    count: 1,
    notes: '',
    image: null,
    timestamp: null,
    location: null
  });

  const handleOpen = () => {
    setOpen(true);
    setNewSighting({
      ...newSighting,
      location: currentLocation,
      timestamp: new Date()
    });
  };

  const handleClose = () => {
    setOpen(false);
    setNewSighting({
      type: '',
      count: 1,
      notes: '',
      image: null,
      timestamp: null,
      location: null
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewSighting({
        ...newSighting,
        image: file
      });
    }
  };

  const handleSubmit = () => {
    const sighting = {
      ...newSighting,
      id: Date.now()
    };
    setSightings([...sightings, sighting]);
    if (onAddSighting) {
      onAddSighting(sighting);
    }
    handleClose();
  };

  const handleDelete = (id) => {
    setSightings(sightings.filter(sighting => sighting.id !== id));
  };

  return (
    <>
      <SightingButton
        variant="contained"
        startIcon={<AddLocation />}
        onClick={handleOpen}
      >
        Add Sighting
      </SightingButton>

      {sightings.map(sighting => (
        <SightingCard key={sighting.id}>
          {sighting.image && (
            <SightingImage
              src={URL.createObjectURL(sighting.image)}
              alt={sighting.type}
            />
          )}
          <SightingMeta>
            <EmojiNature />
            <StyledChip
              label={sighting.type}
              size="small"
            />
            <StyledChip
              label={`Count: ${sighting.count}`}
              size="small"
            />
          </SightingMeta>
          <SightingActions>
            <Button
              startIcon={<Share />}
              size="small"
              color="primary"
            >
              Share
            </Button>
            <Button
              startIcon={<Delete />}
              size="small"
              color="error"
              onClick={() => handleDelete(sighting.id)}
            >
              Delete
            </Button>
          </SightingActions>
        </SightingCard>
      ))}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <StyledDialogTitle>
          Add Game Sighting
        </StyledDialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Game Type</InputLabel>
            <Select
              value={newSighting.type}
              onChange={(e) => setNewSighting({...newSighting, type: e.target.value})}
              label="Game Type"
            >
              <MenuItem value="Moose">Moose</MenuItem>
              <MenuItem value="Deer">Deer</MenuItem>
              <MenuItem value="Elk">Elk</MenuItem>
              <MenuItem value="Bear">Bear</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Count"
            value={newSighting.count}
            onChange={(e) => setNewSighting({...newSighting, count: parseInt(e.target.value)})}
            margin="normal"
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={newSighting.notes}
            onChange={(e) => setNewSighting({...newSighting, notes: e.target.value})}
            margin="normal"
          />
          <Button
            variant="outlined"
            component="label"
            startIcon={<Camera />}
            fullWidth
            sx={{ mt: 2 }}
          >
            Upload Photo
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageUpload}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">Add Sighting</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GameSightings;
