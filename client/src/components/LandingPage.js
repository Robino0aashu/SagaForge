import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { Box, Typography, Button, Container } from '@mui/material';
import { keyframes } from '@emotion/react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Animation for the background gradient text
const textGradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleButtonClick = () => {
        if (isAuthenticated) {
            navigate('/home');
        } else {
            navigate('/auth');
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
                background: 'linear-gradient(45deg, #121212 30%, #281a3d 90%)',
                color: 'white',
                textAlign: 'center',
                px: 2, // Add some horizontal padding for very small screens
            }}
        >
            <Container maxWidth="md">
                <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                        fontWeight: 'bold',
                        // CHANGED: Responsive font size
                        fontSize: { xs: '3rem', sm: '4.5rem', md: '6rem' }, 
                        mb: { xs: 3, md: 2 }, // CHANGED: Responsive margin
                        background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
                        backgroundSize: '400% 400%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: `${textGradientAnimation} 15s ease infinite`,
                    }}
                >
                    SagaForge
                </Typography>
                <Typography variant="h5" component="p" sx={{ 
                    // CHANGED: Responsive font size and margin
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    mb: { xs: 4, md: 4 },
                    color: 'rgba(255, 255, 255, 0.7)' 
                }}>
                    Welcome to a world where your words weave the story. SagaForge is a collaborative storytelling game where you and your friends decide the fate of your characters, one choice at a time.
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleButtonClick}
                    sx={{
                        // CHANGED: Responsive font size and padding
                        fontSize: { xs: '1rem', md: '1.2rem' },
                        py: { xs: 1, md: 1.5 },
                        px: { xs: 3, md: 4 },
                        borderRadius: '50px',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                            transform: 'scale(1.05)'
                        }
                    }}
                >
                    Let's Forge Stories
                </Button>
            </Container>
        </Box>
    );
}

export default LandingPage;