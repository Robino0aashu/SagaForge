import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Button, Typography, Container, Grid, Card, CardContent, Box, Paper, Skeleton, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, CardActionArea
} from '@mui/material'; // Import Dialog components and CardActionArea
import { keyframes } from '@emotion/react';

// Icons
import BuildIcon from '@mui/icons-material/Build';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import GroupIcon from '@mui/icons-material/Group';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import BoltIcon from '@mui/icons-material/Bolt';

// Animation for the hero section
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// --- UPDATED COMPONENT FOR THE PUBLIC STORIES SECTION ---
const PublicStories = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStory, setSelectedStory] = useState(null); // State for the selected story
    const [isModalOpen, setIsModalOpen] = useState(false);   // State for modal visibility

    useEffect(() => {
        const fetchPublicStories = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/games/stories/public?limit=10`);
                const data = await response.json();
                if (data.success) {
                    setStories(data.stories);
                }
            } catch (error) {
                console.error("Failed to fetch public stories", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicStories();
    }, []);

    // --- HANDLERS FOR THE DIALOG ---
    const handleStoryClick = (story) => {
        setSelectedStory(story);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStory(null);
    };

    if (loading) {
        return (
            <Grid container spacing={2} sx={{ flexWrap: 'nowrap' }}>
                {[...Array(3)].map((_, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Skeleton variant="rectangular" width={345} height={150} />
                    </Grid>
                ))}
            </Grid>
        )
    }

    if (stories.length === 0) {
        return null; // Don't show the section if there are no stories
    }

    return (
        <>
            <Box
              sx={{
                  display: 'flex',
                  overflowX: 'auto',
                  py: 2,
                  '&::-webkit-scrollbar': { height: '8px' },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px' }
              }}
            >
                {stories.map(story => (
                    <Card
                      key={story.id}
                      sx={{
                          flex: '0 0 auto',
                          width: 345,
                          mr: 2,
                          bgcolor: 'rgba(0,0,0,0.2)'
                      }}
                    >
                        {/* CardActionArea makes the entire card clickable */}
                        <CardActionArea onClick={() => handleStoryClick(story)}>
                            <CardContent>
                                <Typography gutterBottom variant="h6" component="div" noWrap>
                                    {story.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ height: 60, overflow: 'hidden' }}>
                                    {story.summary || 'No summary available.'}
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </Box>

            {/* --- DIALOG FOR DISPLAYING THE STORY --- */}
            {selectedStory && (
                <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="md">
                    <DialogTitle>{selectedStory.title}</DialogTitle>
                    <DialogContent dividers>
                        {/* Make sure your API response includes a 'content' field for the full story */}
                        <Typography style={{ whiteSpace: 'pre-wrap' }}>
                            {selectedStory.summary || 'Full story content not available.'}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal}>Close</Button>
                    </DialogActions>
                </Dialog>
            )}
        </>
    );
};


function Home() {
  return (
    <Box>
      {/* Hero Section (Unchanged) */}
      <Paper 
        sx={{
          py: 10,
          textAlign: 'center',
          position: 'relative',
          color: 'white',
          background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)',
          backgroundSize: '400% 400%',
          animation: `${gradientAnimation} 15s ease infinite`,
          borderRadius: 0,
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
            Create Epic Stories Together
          </Typography>
          <Typography variant="h5" component="p" color="rgba(255, 255, 255, 0.9)" sx={{ mb: 4 }}>
            Join friends in collaborative storytelling adventures where every choice matters.
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button component={Link} to="/create" variant="contained" size="large" startIcon={<BuildIcon />} sx={{ backgroundColor: 'white', color: 'black', '&:hover': { backgroundColor: '#f0f0f0' } }}>
                Create New Story
              </Button>
            </Grid>
            <Grid item>
              <Button component={Link} to="/join" variant="outlined" size="large" startIcon={<MeetingRoomIcon />} sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#f0f0f0', backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}>
                Join Existing Room
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* --- NEW PUBLIC STORIES SECTION --- */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
          Explore Public Sagas
        </Typography>
        <PublicStories />
      </Container>
      
      {/* --- DIVIDER TO SEPARATE THE SECTIONS --- */}
      <Divider sx={{ my: 4 }} />

      {/* Features Section (Unchanged) */}
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Typography variant="h4" component="h2" align="center" gutterBottom sx={{ mb: 6, fontWeight: 'bold' }}>
          Why SagaForge?
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {[
            { icon: <GroupIcon fontSize="large" color="primary" />, title: 'Collaborative Writing', description: 'Work together to craft unique stories with multiple plot paths.' },
            { icon: <HowToVoteIcon fontSize="large" color="primary" />, title: 'Democratic Choices', description: 'Vote on story directions and see your collective narrative unfold.' },
            { icon: <BoltIcon fontSize="large" color="primary" />, title: 'Real-time Magic', description: 'Experience live storytelling with instant updates and reactions.' },
          ].map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 2, transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out', '&:hover': { transform: 'translateY(-10px)', boxShadow: (theme) => `0 20px 25px -5px ${theme.palette.primary.main}33`, }, }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h5" component="div" fontWeight="medium">{feature.title}</Typography>
                  <Typography sx={{ mt: 1.5 }} color="text.secondary">{feature.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default Home;