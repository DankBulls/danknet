import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to calendar
      navigate('/calendar');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      setLoading(true);
      setError('');

      try {
        // Send Google token to backend
        const backendResponse = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: response.access_token }),
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
          throw new Error(data.error || 'Google login failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to calendar
        navigate('/calendar');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed');
    },
  });

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            Welcome to DankNet
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" paragraph>
            Sign in to continue to your account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Button
            fullWidth
            variant="outlined"
            color="primary"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={() => googleLogin()}
            disabled={loading}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
