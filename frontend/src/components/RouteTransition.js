import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Fade } from '@mui/material';
import SplashScreen from './SplashScreen';

const RouteTransition = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);
    setShowContent(false);
    
    // Show splash screen
    const splashTimer = setTimeout(() => {
      setIsLoading(false);
      // After splash screen fades out, show content
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 300); // Start showing content as splash fades out
      return () => clearTimeout(contentTimer);
    }, 1000); // Show splash for 1 second

    return () => clearTimeout(splashTimer);
  }, [location.pathname]); // Reset on route change

  return (
    <>
      <Fade in={isLoading} timeout={300}>
        <div style={{ display: isLoading ? 'block' : 'none' }}>
          <SplashScreen />
        </div>
      </Fade>
      <Fade in={showContent} timeout={300}>
        <div style={{ display: showContent ? 'block' : 'none' }}>
          {children}
        </div>
      </Fade>
    </>
  );
};

export default RouteTransition;
