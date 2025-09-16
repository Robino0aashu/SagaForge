import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const { user, isGuest, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <span className="navbar-logo">🏰</span>
          <span className="navbar-title">SagaForge</span>
        </div>

        <div className="navbar-user">
          {isGuest ? (
            <div className="guest-indicator">
              <span className="user-avatar guest">👤</span>
              <span className="user-name">Guest User</span>
              <button
                className="btn btn-small btn-outline"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </button>
            </div>
          ) : isAuthenticated ? (
            <div className="user-menu">
              <button
                className="user-button"
                onClick={toggleDropdown}
              >
                <span
                  className="user-avatar"
                  style={{ backgroundColor: user?.avatarColor || '#007bff' }}
                >
                  {user?.displayName?.charAt(0).toUpperCase() ||
                    user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="user-name">
                  {user?.displayName || user?.username}
                </span>
                <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div
                      className="user-avatar large"
                      style={{ backgroundColor: user?.avatarColor || '#007bff' }}
                    >
                      {user?.displayName?.charAt(0).toUpperCase() ||
                        user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                      <div className="user-display-name">
                        {user?.displayName || user?.username}
                      </div>
                      <div className="user-username">@{user?.username}</div>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate('/profile');
                      setDropdownOpen(false);
                    }}
                  >
                    <span>📖</span>
                    My Stories
                  </button>

                  <button className="dropdown-item" disabled>
                    <span>⚙️</span>
                    Profile Settings (Coming Soon)
                  </button>

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    <span>🚪</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {dropdownOpen && (
        <div
          className="dropdown-overlay"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </nav>
  );
}

export default Navbar;