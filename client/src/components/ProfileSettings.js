import React from 'react';
import { useAuth } from '../context/authContext'; // We still need this for the token
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { Person, AlternateEmail, Event } from '@mui/icons-material';

function ProfileSettings() {
  const { user } = useAuth(); // Get the full user object from the context

  // If the user object is not available yet, show a loading state.
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="sm" sx={{ my: 4 }}>
      <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mb: 2,
              bgcolor: user.avatarColor || 'primary.main',
              fontSize: '2.5rem'
            }}
          >
            {user.displayName?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography component="h1" variant="h4">
            {user.displayName}
          </Typography>
          <Typography color="text.secondary">
            @{user.username}
          </Typography>
        </Box>

        <Divider />

        <List sx={{ mt: 2 }}>
          <ListItem>
            <ListItemIcon>
              <AlternateEmail />
            </ListItemIcon>
            <ListItemText primary="Email" secondary={user.email} />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <Event />
            </ListItemIcon>
            <ListItemText primary="Joined On" secondary={new Date(user.createdAt).toLocaleDateString()} />
          </ListItem>
        </List>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Alert severity="info" variant="outlined">
            Editing functionality is coming soon!
          </Alert>
        </Box>
      </Paper>
    </Container>
  );
}

export default ProfileSettings;