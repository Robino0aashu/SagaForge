import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState(null); // Now used and exposed

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    // ... (no changes here, this part is perfect)
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('userData');
    const guestMode = localStorage.getItem('guestMode');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else if (guestMode === 'true') {
      setIsGuest(true);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null); // Reset error on new attempt
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) { // A more robust check for HTTP errors
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('authToken', data.token);
      setToken(data.token);

      const profileResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${data.token}` },
      });

      const profileData = await profileResponse.json();
      if (profileData.success) {
        setUser(profileData.user);
        localStorage.setItem('userData', JSON.stringify(profileData.user));
        setIsGuest(false);
        return true;
      } else {
        logout();
        throw new Error(profileData.error || 'Could not fetch profile');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return false;
    } finally {
      // ADDED: finally block to guarantee loading is set to false
      setLoading(false);
    }
  };

  const register = async (username, email, password, displayName) => {
    // ADDED: Loading state and error reset
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, displayName }),
      });

      const data = await response.json();
      if (!response.ok) { // A more robust check for HTTP errors
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.removeItem('guestMode');

      setToken(data.token);
      setUser(data.user);
      setIsGuest(false);
      return { success: true };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message); // Set the error state
      return { success: false, error: err.message };
    } finally {
      // ADDED: finally block
      setLoading(false);
    }
  };

  const continueAsGuest = () => {
    localStorage.setItem('guestMode', 'true');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');

    setIsGuest(true);
    setUser(null);
    setToken(null);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('guestMode');

    setUser(null);
    setToken(null);
    setIsGuest(false);
  };

  const value = {
    user,
    token,
    isGuest,
    loading,
    error,
    clearError,
    login,
    register,
    continueAsGuest,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
