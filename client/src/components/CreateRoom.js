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
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

function CreateRoom() {
  const [formData, setFormData] = useState({
    hostName: '',
    storyPrompt: '',
    numberOfRounds: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'numberOfRounds') {
      processedValue = value === '' ? '' : parseInt(value, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleRoundChange = (amount) => {
    setFormData(prev => {
        const newRounds = Math.max(3, Math.min(15, prev.numberOfRounds + amount));
        return { ...prev, numberOfRounds: newRounds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... (rest of the submit logic remains the same)
    setLoading(true);
    setError('');

    try {
      if (!formData.hostName.trim() || !formData.storyPrompt.trim()) {
        throw new Error('Please fill in all required fields.');
      }
      if (formData.numberOfRounds < 3 || formData.numberOfRounds > 15) {
        throw new Error('Number of rounds must be between 3 and 15.');
      }
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/games/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostName: formData.hostName.trim(),
          storyPrompt: formData.storyPrompt.trim(),
          numberOfRounds: formData.numberOfRounds,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to create room.');
      }
      localStorage.setItem('gameData', JSON.stringify({
        roomId: data.roomId,
        playerId: data.hostId,
        playerName: formData.hostName.trim(),
        isHost: true,
      }));
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const storyPromptExamples = [
    "You wake up in a mysterious castle...",
    "A strange portal opens in a backyard...",
    "The last human on Earth gets a message...",
    "Magic is forbidden, but you have powers...",
    "A time traveler arrives with a warning...",
  ];

  return (
    <Container component="main" maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={6} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}> {/* Responsive padding */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AddCircleOutlineIcon color="primary" sx={{ fontSize: 40 }} />
          <Typography component="h1" variant="h4" sx={{ mt: 2, textAlign: 'center' }}>
            Create a New Story
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Set the stage for your next great adventure.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          {/* ... Other TextFields remain the same ... */}
          <TextField margin="normal" required fullWidth id="hostName" label="Your Host Name" name="hostName" value={formData.hostName} onChange={handleInputChange}/>
          <TextField margin="normal" required fullWidth id="storyPrompt" label="Story Prompt" name="storyPrompt" multiline rows={4} placeholder="Set the scene for your story..." value={formData.storyPrompt} onChange={handleInputChange}/>

          {/* --- RESPONSIVE FIX STARTS HERE --- */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ maxWidth: '200px' }}> {/* More compact max-width */}
              <Typography gutterBottom sx={{ fontWeight: 'medium', textAlign: 'center' }}>
                  Number of Rounds
              </Typography>
              <TextField
                  required
                  name="numberOfRounds"
                  type="number"
                  value={formData.numberOfRounds}
                  onChange={handleInputChange}
                  // Removed fullWidth to let it size naturally
                  InputProps={{
                      inputProps: { min: 3, max: 15, style: { textAlign: 'center' }},
                      startAdornment: (
                          <InputAdornment position="start">
                              <IconButton size="small" onClick={() => handleRoundChange(-1)} disabled={formData.numberOfRounds <= 3}>
                                  <RemoveIcon />
                              </IconButton>
                          </InputAdornment>
                      ),
                      endAdornment: (
                          <InputAdornment position="end">
                              <IconButton size="small" onClick={() => handleRoundChange(1)} disabled={formData.numberOfRounds >= 15}>
                                  <AddIcon />
                              </IconButton>
                          </InputAdornment>
                      ),
                  }}
              />
            </Box>
          </Box>
          {/* --- FIX ENDS HERE --- */}
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
               <AutoFixHighIcon fontSize="small" sx={{ mr: 1 }} /> Need inspiration? Try a prompt:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {storyPromptExamples.map((example) => (
                    <Chip key={example} label={example} onClick={() => setFormData(prev => ({ ...prev, storyPrompt: example }))} variant="outlined"/>
                ))}
            </Box>
          </Box>

          {error && ( <Alert severity="error" sx={{ mt: 3 }}> {error} </Alert> )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 1 }}>
            <Button variant="outlined" onClick={() => navigate('/home')} disabled={loading}>
              Cancel
            </Button>
            <LoadingButton type="submit" variant="contained" loading={loading} loadingIndicator={<CircularProgress size={24} />}>
              Create Room
            </LoadingButton>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default CreateRoom;