import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setIsAuthenticated(true);
            return;
          }
        }

        // If we get here, token is invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
      }
    };

    verifyToken();
  }, []);

  if (isAuthenticated === null) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
