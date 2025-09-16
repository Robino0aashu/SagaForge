import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/authContext';
import Navbar from './components/Navbar';
import AuthPage from './components/AuthPage';
import Home from './components/Home';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import GameRoom from './components/GameRoom';
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

  const showNavbar = isAuthenticated || isGuest;

  return (
    <div className="App">
      {showNavbar && <Navbar />}
      
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <>
              <header className="App-header">
                <h1>🏰 SagaForge</h1>
                <p>Collaborative Storytelling Game</p>
              </header>
              <main className="App-main">
                <Home />
              </main>
            </>
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <>
              <header className="App-header">
                <h1>🏰 SagaForge</h1>
                <p>Collaborative Storytelling Game</p>
              </header>
              <main className="App-main">
                <CreateRoom />
              </main>
            </>
          </ProtectedRoute>
        } />
        <Route path="/join" element={
          <ProtectedRoute>
            <>
              <header className="App-header">
                <h1>🏰 SagaForge</h1>
                <p>Collaborative Storytelling Game</p>
              </header>
              <main className="App-main">
                <JoinRoom />
              </main>
            </>
          </ProtectedRoute>
        } />
        <Route path="/room/:roomId" element={
          <ProtectedRoute>
            <GameRoom />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/auth" replace />} />
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