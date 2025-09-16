import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

// Protected Route component that checks if user is authenticated or guest
function ProtectedRoute({ children }) {
  const { loading, isAuthenticated, isGuest } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
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
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>⏳ Loading...</h2>
      </div>
    );
  }
  
  // Always show Navbar if authenticated, otherwise only on non-landing pages
  const showNavbar = isAuthenticated;

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
        <Route path="/settings" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

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
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;