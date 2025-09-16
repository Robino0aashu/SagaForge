import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Tabs, 
  Tab, 
  Box, 
  Avatar,
  Grid,
  Link as MuiLink // Renaming to avoid conflict with React Router's Link
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login, register, continueAsGuest } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error on new submission
    let result;
    if (isLogin) {
      result = await login(username, password);
      if (result) {
        navigate('/home');
      } else {
        setError('Invalid username or password.');
      }
    } else {
      result = await register(username, email, password, displayName);
      if (result.success) {
        navigate('/home');
      } else {
        setError(result.error || 'Registration failed.');
      }
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setIsLogin(newValue === 0);
    setError(''); // Reset errors when switching tabs
  };

  const handleGuest = () => {
    continueAsGuest();
    navigate('/home');
  }

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: 8, mb: 4 }}>
      <Paper 
        elevation={6} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2 // Softer corners
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          {isLogin ? 'Sign In' : 'Create Account'}
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%', mb: 2 }}>
          <Tabs value={isLogin ? 0 : 1} onChange={handleTabChange} centered variant="fullWidth">
            <Tab label="Login" id="login-tab" />
            <Tab label="Register" id="register-tab" />
          </Tabs>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          {/* Fields for Login & Register */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Fields for Register Only */}
          {!isLogin && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                id="displayName"
                label="Display Name"
                name="displayName"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}

          {/* Password Field */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <Typography color="error" variant="body2" align="center" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Button>

          <Grid container>
            <Grid item xs>
              {/* This is a placeholder, you can add functionality later */}
              <MuiLink href="#" variant="body2">
                Forgot password?
              </MuiLink>
            </Grid>
            <Grid item>
              <MuiLink component="button" variant="body2" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
              </MuiLink>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      <Button
          fullWidth
          variant="text"
          onClick={handleGuest}
          sx={{ mt: 2 }}
        >
          Or Continue as a Guest
        </Button>
    </Container>
  );
}

export default AuthPage;