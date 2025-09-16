import React from 'react';
import { Card, CardContent, Avatar, Typography, Box, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const PlayerCard = ({ player }) => (
  <Card variant="outlined" sx={{ bgcolor: player.isHost ? 'action.hover' : 'background.default' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
      <Avatar sx={{ bgcolor: player.isHost ? 'primary.main' : 'secondary.main' }}>
        {player.name.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body1" fontWeight="bold">
          {player.name} {player.isHost && '👑'}
        </Typography>
        <Chip
          icon={player.socketId ? <CheckCircleIcon /> : <CancelIcon />}
          label={player.socketId ? 'Online' : 'Offline'}
          color={player.socketId ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      </Box>
    </CardContent>
  </Card>
);

export default PlayerCard;