import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <div className="hero-section">
        <h2>Create Epic Stories Together</h2>
        <p>Join friends in collaborative storytelling adventures where every choice matters</p>
      </div>

      <div className="action-buttons">
        <Link to="/create" className="btn btn-primary">
          🏗️ Create New Story
        </Link>
        
        <Link to="/join" className="btn btn-secondary">
          🚪 Join Existing Room
        </Link>
      </div>

      <div className="features">
        <div className="feature">
          <h3>🎭 Collaborative Writing</h3>
          <p>Work together to craft unique stories with multiple plot paths</p>
        </div>
        
        <div className="feature">
          <h3>🗳️ Democratic Choices</h3>
          <p>Vote on story directions and see your collective narrative unfold</p>
        </div>
        
        <div className="feature">
          <h3>⚡ Real-time Magic</h3>
          <p>Experience live storytelling with instant updates and reactions</p>
        </div>
      </div>
    </div>
  );
}

export default Home;