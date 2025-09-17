import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/authContext';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import Home from './components/Home';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import GameRoom from './components/GameRoom';
import MyStories from './components/MyStories';
import Profile from './components/ProfileSettings';
import LandingPage from './components/LandingPage';
import './App.css';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Protected Route component
function ProtectedRoute({ children }) {
  // CHANGED: Use `initialLoading` to prevent this from showing during login/register actions.
  // We rename it to `loading` here for convenience within this component.
  const { initialLoading: loading, isAuthenticated, isGuest } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>⏳ Loading...</h2>
      </div>
    );
  }

  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AppContent() {
  // CHANGED: Use `initialLoading` here as well.
  const { initialLoading: loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>⏳ Loading...</h2>
      </div>
    );
  }
  
  const showNavbar = location.pathname !== '/';

  return (
    <div className="App">
      {showNavbar && <Navbar />}
      
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/home" replace /> : <AuthPage />} />

        {/* --- Protected Routes --- */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateRoom /></ProtectedRoute>} />
        <Route path="/join" element={<ProtectedRoute><JoinRoom /></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><GameRoom /></ProtectedRoute>} />
        <Route path="/stories" element={<ProtectedRoute><MyStories /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;