import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8B4513', // Saddle brown color from the logo
      light: '#A0522D',
      dark: '#654321',
    },
    secondary: {
      main: '#1B1B1B', // Dark color from the logo
      light: '#2C2C2C',
      dark: '#000000',
    },
    background: {
      default: '#F5F5DC', // Beige background color
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1B1B1B',
      secondary: '#666666',
    },
    error: {
      main: '#B22222',
    },
    warning: {
      main: '#CD853F',
    },
    success: {
      main: '#2E8B57',
    },
    custom: {
      dankBrown: '#8B4513',
      dankBlack: '#1B1B1B',
      mountainWhite: '#F5F5DC',
    }
  },
  typography: {
    fontFamily: '"Roboto Condensed", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1B1B1B',
        },
      },
    },
  },
});

export default theme;
