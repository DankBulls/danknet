import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider, createTheme } from '@mui/material';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Lazy load components
const Login = lazy(() => import('./components/Auth/Login'));
const Calendar = lazy(() => import('./components/Calendar/Calendar'));
const Messaging = lazy(() => import('./pages/Messaging'));

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App = () => {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider theme={theme}>
        <Router>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Messaging route */}
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <Messaging />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected routes */}
              <Route
                path="/calendar"
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                }
              />
              
              {/* Redirect root to login */}
              <Route
                path="/"
                element={<Navigate to="/login" replace />}
              />
              
              {/* Catch all redirect to login */}
              <Route
                path="*"
                element={<Navigate to="/login" replace />}
              />
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
