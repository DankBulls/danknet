import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GlobalStyles } from '@mui/material';
import theme from './theme';
import Navbar from './components/Navbar';
import PageTransition from './components/PageTransition';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import Calendar from './pages/Calendar';
import Photos from './pages/Photos';
import Analyze from './pages/Analyze';
import Messaging from './pages/Messaging';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminSettings from './pages/AdminSettings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MapProvider } from './contexts/MapContext';
import ErrorBoundary from './components/ErrorBoundary';

const globalStyles = {
  '*': {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },
  body: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
  }
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <PageTransition show={true} />;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <PageTransition show={true} />;
  }
  
  return user && isAdmin ? children : <Navigate to="/" />;
};

const AppContent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Simulate minimum loading time for splash screen
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || authLoading) {
    return <PageTransition show={true} />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/map" element={<PrivateRoute><Map /></PrivateRoute>} />
        <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
        <Route path="/photos" element={<PrivateRoute><Photos /></PrivateRoute>} />
        <Route path="/analyze" element={<PrivateRoute><Analyze /></PrivateRoute>} />
        <Route path="/messaging" element={<PrivateRoute><Messaging /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const AppRoutes = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 1000); // Adjust this duration as needed

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <PageTransition show={isTransitioning} />
      <AppContent />
    </>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={globalStyles} />
        <AuthProvider>
          <MapProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </MapProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
