import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import GameRoom from './components/GameRoom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>🏰 SagaForge</h1>
          <p>Collaborative Storytelling Game</p>
        </header>
        
        <main className="App-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateRoom />} />
            <Route path="/join" element={<JoinRoom />} />
            <Route path="/room/:roomId" element={<GameRoom />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;