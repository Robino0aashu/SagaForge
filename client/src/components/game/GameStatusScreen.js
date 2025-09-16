import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, CircularProgress, Alert } from '@mui/material';

const GameStatusScreen = ({ loading, error, connectionStatus, roomId, gameData }) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        {loading && (
          <Box>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              {connectionStatus}
            </Typography>
            <Typography color="text.secondary">Room ID: {roomId}</Typography>
            {gameData && <Typography color="text.secondary">Player: {gameData.playerName} {gameData.isHost ? '(Host)' : ''}</Typography>}
          </Box>
        )}

        {error && (
          <Box>
            <Alert severity="error" variant="filled" sx={{ mb: 3 }}>
              <Typography variant="h6">Connection Error</Typography>
              {error}
            </Alert>
            <Button variant="contained" onClick={() => navigate('/home')}>
              Return Home
            </Button>
          </Box>
        )}

        {!loading && !error && (
           <Box>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Waiting for room data...
            </Typography>
            <Typography color="text.secondary">Status: {connectionStatus}</Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default GameStatusScreen;