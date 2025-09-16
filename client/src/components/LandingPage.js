import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import './LandingPage.css';

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
        <div className="landing-container">
            <div className="landing-overlay"></div>
            <div className="landing-content">
                <h1 className="landing-title">🏰 SagaForge</h1>
                <p className="landing-description">
                    Welcome to a world where your words weave the story. SagaForge is a collaborative storytelling game where you and your friends decide the fate of your characters, one choice at a time. Every round brings new challenges and unexpected turns.
                </p>
                <button className="landing-button" onClick={handleButtonClick}>
                    Let's Forge Stories
                </button>
            </div>
        </div>
    );
}

export default LandingPage;