import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  Grid,
  Paper,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Box
} from '@mui/material';
import {
  Add as AddIcon,
  PhotoCamera,
  Place as PlaceIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const PhotosContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4)
}));

const UploadButton = styled(Button)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(4),
  right: theme.spacing(4),
  backgroundColor: `${theme.palette.primary.main} !important`,
  color: `${theme.palette.background.default} !important`,
  
  '&:hover': {
    backgroundColor: `${theme.palette.primary.dark} !important`
  }
}));

const PhotoCard = styled(Paper)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  
  '& img': {
    width: '100%',
    height: 200,
    objectFit: 'cover',
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(2)
  }
}));

const PhotoInfo = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
  
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
    fontSize: 20
  }
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(1),
  
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  
  '& .MuiIconButton-root': {
    color: theme.palette.primary.contrastText
  }
}));

const HiddenInput = styled('input')({
  display: 'none'
});

const mockPhotos = [
  {
    id: 1,
    url: 'https://example.com/elk1.jpg',
    location: 'Two Elk Trail',
    date: '2025-01-12',
    description: 'Fresh elk tracks near the creek'
  },
  {
    id: 2,
    url: 'https://example.com/trail1.jpg',
    location: 'Game Creek Bowl',
    date: '2025-01-10',
    description: 'New game trail discovered'
  }
];

const Photos = () => {
  const [photos, setPhotos] = useState(mockPhotos);
  const [openUpload, setOpenUpload] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    location: '',
    description: '',
    file: null
  });
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewPhoto(prev => ({
        ...prev,
        file: file
      }));
    }
  };

  const handleUpload = async () => {
    // In production, this would upload to a server
    const newPhotoObj = {
      id: photos.length + 1,
      url: URL.createObjectURL(newPhoto.file),
      location: newPhoto.location,
      date: new Date().toISOString().split('T')[0],
      description: newPhoto.description
    };

    setPhotos(prev => [newPhotoObj, ...prev]);
    setNewPhoto({
      location: '',
      description: '',
      file: null
    });
    setOpenUpload(false);
    setSnackbarMessage('Photo uploaded successfully!');
    setShowSnackbar(true);
  };

  return (
    <PhotosContainer>
      <Typography variant="h4" gutterBottom>
        Scouting Photos
      </Typography>

      <Grid container spacing={3}>
        {photos.map(photo => (
          <Grid item xs={12} sm={6} md={4} key={photo.id}>
            <PhotoCard elevation={3}>
              <img src={photo.url} alt={photo.description} />
              <DeleteButton onClick={() => console.log('Delete button clicked')}>
                <CloseIcon />
              </DeleteButton>
              <Typography variant="h6">{photo.description}</Typography>
              <PhotoInfo>
                <PlaceIcon />
                <Typography variant="body2">{photo.location}</Typography>
              </PhotoInfo>
              <PhotoInfo>
                <CalendarIcon />
                <Typography variant="body2">{photo.date}</Typography>
              </PhotoInfo>
            </PhotoCard>
          </Grid>
        ))}
      </Grid>

      <UploadButton
        variant="contained"
        component="label"
        startIcon={<AddIcon />}
      >
        Add Photo
        <HiddenInput
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
        />
      </UploadButton>

      <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
        <StyledDialogTitle>
          Upload Scouting Photo
          <IconButton onClick={() => setOpenUpload(false)} size="small">
            <CloseIcon />
          </IconButton>
        </StyledDialogTitle>
        <DialogContent>
          {newPhoto.file && (
            <Box sx={{ mt: 2 }}>
              <img
                src={URL.createObjectURL(newPhoto.file)}
                alt="Preview"
                style={{
                  width: '100%',
                  height: 300,
                  objectFit: 'cover',
                  borderRadius: 8,
                  marginBottom: 16
                }}
              />
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Location"
            fullWidth
            value={newPhoto.location}
            onChange={(e) => setNewPhoto(prev => ({ ...prev, location: e.target.value }))}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={newPhoto.description}
            onChange={(e) => setNewPhoto(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpload(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!newPhoto.file || !newPhoto.location || !newPhoto.description}
          >
            Upload
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
    </PhotosContainer>
  );
};

export default Photos;
