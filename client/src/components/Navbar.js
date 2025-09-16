import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Box,
} from '@mui/material';
import {
  Book,
  AccountCircle,
  Settings,
  Logout,
  MenuBook,
} from '@mui/icons-material';

function Navbar() {
  const { user, isGuest, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const dropdownOpen = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    handleClose();
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        {/* Brand/Logo Section */}
        <Button color="inherit" onClick={() => navigate('/home')} sx={{ textTransform: 'none' }}>
          <MenuBook sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            SagaForge
          </Typography>
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />

        {/* User/Guest Section */}
        {isGuest ? (
          <Button color="inherit" variant="outlined" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        ) : isAuthenticated ? (
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ bgcolor: user?.avatarColor || 'secondary.main', width: 32, height: 32 }}>
                {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={dropdownOpen}
              onClose={handleClose}
            >
              <MenuItem onClick={() => handleNavigate('/stories')}>
                <ListItemIcon>
                  <Book fontSize="small" />
                </ListItemIcon>
                My Stories
              </MenuItem>
              <MenuItem onClick={() => handleNavigate('/profile')}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Profile Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Sign Out
              </MenuItem>
            </Menu>
          </div>
        ) : null}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;