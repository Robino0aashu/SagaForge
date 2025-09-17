import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import {
    Container,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Box,
    Skeleton,
    Alert,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Fab,
    Divider,
    Avatar
} from '@mui/material';
import {
    MenuBook,
    MoreVert,
    Visibility,
    Edit,
    Delete,
    Share,
    Public,
    Lock,
    Add,
    CalendarToday,
    Group,
    Psychology
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';


function MyStories() {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStory, setSelectedStory] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedStoryForMenu, setSelectedStoryForMenu] = useState(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [storyToDelete, setStoryToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/users/stories`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setStories(data.stories);
                }
            } catch (error) {
                console.error("Failed to fetch stories", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchStories();
        }
    }, [token]);

    const handleStoryClick = (story) => {
        setSelectedStory(story);
        setIsViewModalOpen(true);
    };

    const handleMenuClick = (event, story) => {
        event.stopPropagation();
        setMenuAnchor(event.currentTarget);
        setSelectedStoryForMenu(story);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setSelectedStoryForMenu(null);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedStory(null);
    };

    const handleDeleteClick = (story) => {
        setStoryToDelete(story);
        setDeleteConfirmOpen(true);
        handleMenuClose();
    };

    const handleDeleteConfirm = async () => {
        if (!storyToDelete) return;

        setDeleting(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/games/story/${storyToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setStories(prevStories => prevStories.filter(story => story.id !== storyToDelete.id));
                setDeleteConfirmOpen(false);
                setStoryToDelete(null);
                console.log('Story deleted successfully:', data.deletedStory.title);
            } else {
                throw new Error(data.error || 'Failed to delete story');
            }
        } catch (error) {
            console.error('Error deleting story:', error);
            alert('Failed to delete story: ' + error.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setStoryToDelete(null);
    };

    const getStoryColor = (isPublic) => {
        return isPublic ? 'success' : 'default';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderSkeletonCards = () => (
        <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                        <CardContent>
                            <Skeleton variant="text" width="60%" height={32} />
                            <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                            <Skeleton variant="text" width="100%" height={20} />
                            <Skeleton variant="text" width="80%" height={20} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Skeleton variant="rectangular" width={60} height={24} />
                                <Skeleton variant="rectangular" width={80} height={24} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );

    const renderEmptyState = () => (
        <Box sx={{ textAlign: 'center', py: 8 }}>
            <MenuBook sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h4" color="text.secondary" gutterBottom>
                No Stories Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
                Start your storytelling journey by creating your first collaborative saga.
                Every great adventure begins with a single story.
            </Typography>
            <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => navigate('/create')}
                sx={{ borderRadius: '50px' }}
            >
                Create Your First Story
            </Button>
        </Box>
    );

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                    <MenuBook sx={{ mr: 2 }} />
                    My Stories
                </Typography>
                {renderSkeletonCards()}
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
                    <MenuBook sx={{ mr: 2 }} />
                    My Stories
                </Typography>
                <Chip
                    label={`${stories.length} ${stories.length === 1 ? 'Story' : 'Stories'}`}
                    color="primary"
                    variant="outlined"
                />
            </Box>

            {stories.length === 0 ? renderEmptyState() : (
                <>
                    {/* Stories Grid */}
                    <Grid container spacing={3}>
                        {stories.map((story) => (
                            <Grid item xs={12} sm={6} md={4} key={story.id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative', // Add this
                                        transition: 'all 0.3s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: 4
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <CardActionArea
                                            onClick={() => handleStoryClick(story)}
                                            sx={{ flexGrow: 1 }}
                                        >
                                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                {/* Story Title */}
                                                <Typography
                                                    variant="h6"
                                                    gutterBottom
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        mb: 2
                                                    }}
                                                >
                                                    {story.title}
                                                </Typography>

                                                {/* Story Summary */}
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{
                                                        flexGrow: 1,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        mb: 2
                                                    }}
                                                >
                                                    {story.summary || 'No summary available for this story.'}
                                                </Typography>

                                                {/* Stats Row */}
                                                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                    {story.total_choices && (
                                                        <Chip
                                                            icon={<Psychology />}
                                                            label={`${story.total_choices} choices`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                    {story.participants && (
                                                        <Chip
                                                            icon={<Group />}
                                                            label={`${story.participants.length} players`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Box>

                                                {/* Bottom Row - Date and Privacy */}
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDate(story.created_at)}
                                                        </Typography>
                                                    </Box>
                                                    <Chip

                                                        icon={story.is_public ? <Public /> : <Lock />}
                                                        label={story.is_public ? 'Public' : 'Private'}
                                                        size="small"
                                                        color={getStoryColor(story.is_public)}
                                                    />
                                                </Box>
                                            </CardContent>
                                        </CardActionArea>

                                        {/* Menu Button - Outside of CardActionArea */}
                                        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => handleMenuClick(e, story)}
                                                sx={{
                                                    backgroundColor: 'action.hover', // Same as default chip background
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    '&:hover': {
                                                        backgroundColor: 'action.selected',
                                                        borderColor: 'primary.main'
                                                    }
                                                }}
                                            >
                                                <MoreVert />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Floating Action Button */}
                    <Fab
                        color="primary"
                        aria-label="create new story"
                        onClick={() => navigate('/create')}
                        sx={{
                            position: 'fixed',
                            bottom: 32,
                            right: 32,
                        }}
                    >
                        <Add />
                    </Fab>
                </>
            )}

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleStoryClick(selectedStoryForMenu)}>
                    <ListItemIcon>
                        <Visibility fontSize="small" />
                    </ListItemIcon>
                    View Story
                </MenuItem>
                {/* <MenuItem onClick={handleMenuClose}>
                    <ListItemIcon>
                        <Share fontSize="small" />
                    </ListItemIcon>
                    Share
                </MenuItem> */}
                <Divider />
                <MenuItem onClick={() => {
                    handleDeleteClick(selectedStoryForMenu)
                }} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                        <Delete fontSize="small" color="error" />
                    </ListItemIcon>
                    Delete
                </MenuItem>
            </Menu>

            {/* Story View Modal */}
            {selectedStory && (
                <Dialog
                    open={isViewModalOpen}
                    onClose={handleCloseViewModal}
                    fullWidth
                    maxWidth="md"
                    scroll="paper"
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MenuBook />
                        {selectedStory.title}
                    </DialogTitle>
                    <DialogContent dividers>
                        {/* Story Metadata */}
                        <Box sx={{ mb: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CalendarToday sx={{ fontSize: 16 }} />
                                        <Typography variant="body2">
                                            {formatDate(selectedStory.created_at)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Chip
                                        icon={selectedStory.is_public ? <Public /> : <Lock />}
                                        label={selectedStory.is_public ? 'Public' : 'Private'}
                                        size="small"
                                        color={getStoryColor(selectedStory.is_public)}
                                    />
                                </Grid>
                                {selectedStory.participants && selectedStory.participants.length > 0 && (
                                    <Grid item xs={12}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Participants:
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {selectedStory.participants.map((participant, index) => (
                                                <Avatar
                                                    key={index}
                                                    sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
                                                    title={participant.name || `Player ${index + 1}`}
                                                >
                                                    {(participant.name || `P${index + 1}`).charAt(0).toUpperCase()}
                                                </Avatar>
                                            ))}
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        {/* Story Content */}
                        <Typography
                            variant="body1"
                            sx={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: 1.6,
                                fontFamily: 'Georgia, serif'
                            }}
                        >
                            {selectedStory.summary || 'No content available for this story.'}
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseViewModal}>Close</Button>
                        {/* <Button variant="contained" startIcon={<Share />}>
                            Share Story
                        </Button> */}
                    </DialogActions>
                </Dialog>
            )}
            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={handleDeleteCancel}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Delete />
                    Delete Story
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This action cannot be undone!
                    </Alert>
                    <Typography>
                        Are you sure you want to delete "<strong>{storyToDelete?.title}</strong>"?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This will permanently remove the story and all its content from your library.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} disabled={deleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={deleting ? null : <Delete />}
                    >
                        {deleting ? 'Deleting...' : 'Delete Story'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default MyStories;