import React from 'react';
import { Paper, Typography, Button, Box, Chip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

const GameHeader = ({ roomId, roomState, onLeave }) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 // margin-bottom to space it from the content below
      }}
    >
      <Box>
        <Typography variant="h5" component="h1">
          🏰 Room: {roomId}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Chip label={`Status: ${roomState.status}`} color="primary" size="small" />
          <Chip label={`Players: ${roomState.players?.length || 0}`} color="secondary" size="small" />
        </Box>
      </Box>
      <Button
        variant="contained"
        color="error"
        startIcon={<LogoutIcon />}
        onClick={onLeave}
      >
        Leave Room
      </Button>
    </Paper>
  );
};

export default GameHeader;