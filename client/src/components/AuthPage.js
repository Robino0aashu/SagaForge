import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext.js';
import './AuthPage.css';

function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      
      if (mode === 'login') {
        if (!formData.username || !formData.password) {
          throw new Error('Please fill in all fields');
        }
        result = await login(formData.username, formData.password);
      } else {
        if (!formData.username || !formData.email || !formData.password) {
          throw new Error('Please fill in all fields');
        }
        result = await register(
          formData.username, 
          formData.email, 
          formData.password, 
          formData.displayName
        );
      }

      if (result.success) {
        navigate('/home');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestContinue = () => {
    continueAsGuest();
    navigate('/home');
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({
      username: '',
      email: '',
      password: '',
      displayName: ''
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🏰 SagaForge</h1>
          <p>Collaborative Storytelling Adventures</p>
        </div>

        <div className="auth-content">
          {/* Guest Option */}
          <div className="guest-section">
            <h2>🚀 Quick Start</h2>
            <p>Jump right into collaborative storytelling</p>
            <button 
              onClick={handleGuestContinue}
              className="btn btn-guest"
              disabled={loading}
            >
              Continue as Guest
            </button>
            <small>Note: Stories won't be saved to your profile as a guest</small>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          {/* Login/Register Form */}
          <div className="auth-form-section">
            <h2>
              {mode === 'login' ? '🔐 Sign In' : '📝 Create Account'}
            </h2>
            <p>
              {mode === 'login' 
                ? 'Access your saved stories and profile'
                : 'Join the community and save your adventures'
              }
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {mode === 'register' && (
                <>
                  <div className="form-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="displayName"
                      placeholder="Display Name (Optional)"
                      value={formData.displayName}
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? '⏳ Please wait...' : 
                 mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-toggle">
              <button 
                onClick={toggleMode}
                className="btn btn-link"
                disabled={loading}
              >
                {mode === 'login' 
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </div>
        </div>

        <div className="auth-footer">
          <div className="features-preview">
            <div className="feature-item">
              <span>🎭</span>
              <small>Collaborative Writing</small>
            </div>
            <div className="feature-item">
              <span>🗳️</span>
              <small>Democratic Choices</small>
            </div>
            <div className="feature-item">
              <span>⚡</span>
              <small>Real-time Magic</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;