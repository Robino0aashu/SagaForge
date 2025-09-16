import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

function JoinRoom() {
  const [formData, setFormData] = useState({
    roomId: '',
    playerName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'roomId' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.roomId.trim() || !formData.playerName.trim()) {
        throw new Error('Please fill in all fields');
      }

      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/games/room/${formData.roomId.trim()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error('Room not found. Please check the code and try again.');
      }

      localStorage.setItem('gameData', JSON.stringify({
        roomId: formData.roomId.trim(),
        playerId: null,
        playerName: formData.playerName.trim(),
        isHost: false,
      }));

      navigate(`/room/${formData.roomId.trim()}`);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={6} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <MeetingRoomIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography component="h1" variant="h4" sx={{ mt: 2 }}>
            Join an Existing Story
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enter the room code and your name to join the adventure.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="roomId"
            label="Room Code"
            name="roomId"
            placeholder="e.g. ABC123DE"
            value={formData.roomId}
            onChange={handleInputChange}
            inputProps={{
              maxLength: 8,
              style: {
                fontFamily: 'monospace',
                textAlign: 'center',
                fontSize: '1.25rem',
                letterSpacing: '3px',
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="playerName"
            label="Your Name"
            name="playerName"
            placeholder="Enter your display name"
            value={formData.playerName}
            onChange={handleInputChange}
            inputProps={{ maxLength: 20 }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/home')}
              disabled={loading}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={loading}
              loadingIndicator={<CircularProgress size={24} />}
            >
              Join Room
            </LoadingButton>
          </Box>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ mt: 4, p: 3, backgroundColor: 'action.hover' }}>
         <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <LightbulbIcon color="primary" sx={{ mr: 1 }} /> How to Join
          </Typography>
        <List dense>
          {[
            'Get the 8-character room code from your host.',
            'Enter the code and your desired display name above.',
            'Click "Join Room" to enter the story!',
          ].map((text, index) => (
            <ListItem key={index}>
              <ListItemIcon sx={{ minWidth: '30px' }}>
                <ArrowForwardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Container>
  );
}

export default JoinRoom;