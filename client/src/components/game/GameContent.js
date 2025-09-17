import React from 'react';
import { Paper, Typography, Box, Button, Grid, Divider } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import ReactMarkdown from 'react-markdown';

// Icons
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SaveIcon from '@mui/icons-material/Save';

const GameContent = ({ roomState, gameData, onStartGame, onVote, onSaveAndEnd, isSaving, isGuest }) => {

    const lastTwoStoryParts = roomState.story?.slice(-2) || [];

    // --- WAITING VIEW ---
    if (roomState.status === 'waiting') {
        return (
            <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'action.hover' }}>
                <HourglassEmptyIcon sx={{ fontSize: 48, color: 'warning.main' }} />
                <Typography variant="h5" sx={{ mt: 2 }}>
                    Waiting to Start
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, p: 2, fontStyle: 'italic' }}>
                    "{roomState.storyPrompt}"
                </Typography>
                {gameData?.isHost ? (
                    <LoadingButton
                        onClick={onStartGame}
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrowIcon />}
                        sx={{ mt: 2 }}
                    >
                        Start Game
                    </LoadingButton>
                ) : (
                    <Typography sx={{ mt: 2 }}>Waiting for the host to begin the adventure...</Typography>
                )}
            </Paper>
        );
    }

    // --- VOTING / PLAYING VIEW ---
    if (roomState.status === 'playing' || roomState.status === 'voting') {
        const choicePart = lastTwoStoryParts.length > 0 ? lastTwoStoryParts[0] : null;
        const narrativePart = lastTwoStoryParts.length > 1 ? lastTwoStoryParts[1] : null;

        return (
            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <MenuBookIcon sx={{ mr: 1 }} /> The Story So Far...
                </Typography>
                <Box sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: '100px' }}>

                    {/* Display the winning choice with its new label */}
                    {choicePart && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" color="text.secondary">
                                <strong>Winning Choice:</strong>
                            </Typography>
                            <Typography component="div">
                                <ReactMarkdown>{choicePart.content}</ReactMarkdown>
                            </Typography>
                        </Box>
                    )}

                    {/* Display the next part of the story with its new label */}
                    {narrativePart && (
                        <Box>
                            <Typography variant="subtitle1" color="text.secondary">
                                <strong>Next Part:</strong>
                            </Typography>
                            <Typography component="div">
                                <ReactMarkdown>{narrativePart.content}</ReactMarkdown>
                            </Typography>
                        </Box>
                    )}

                </Box>

                {roomState.status === 'voting' && roomState.currentChoices && (
                    <>
                        <Divider sx={{ my: 3 }} />
                        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <HowToVoteIcon sx={{ mr: 1 }} /> Vote for the Next Action
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {roomState.currentChoices.map((choice, index) => (
                                <Grid item xs={12} sm={6} key={index}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        onClick={() => onVote(index)}
                                        sx={{ p: 2, height: '100%', justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none' }}
                                    >
                                        <strong>Option {index + 1}:</strong>&nbsp;{choice}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Paper>
        );
    }

    // --- COMPLETED VIEW ---
    if (roomState.status === 'completed') {
        // DEBUG: Log the final story content to the console
        console.log('[DEBUG] Final Story Content:', roomState.finalStory);

        return (
            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h5" gutterBottom>📜 The Full Saga</Typography>
                <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: '400px', overflowY: 'auto' }}>
                    <Typography component="div">
                        <ReactMarkdown>{roomState.finalStory || 'The story has concluded.'}</ReactMarkdown>
                    </Typography>
                </Box>
                {!isGuest && (
                    <LoadingButton
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={onSaveAndEnd}
                        loading={isSaving}
                        loadingPosition="start"
                        sx={{ mt: 2 }}
                    >
                        {isSaving ? 'Saving...' : 'Save Story and End Game'}
                    </LoadingButton>
                )}
            </Paper>
        );
    }

    return null; // Fallback for any unknown state
};

export default GameContent;