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
  const [, setError] = useState(null);

  // Initialize auth state from localStorage on app start
  useEffect(() => {
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
    try {
      // Step 1: Log in to get the token (This part is correct)
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);

      // Step 2: Use the token to get the user's profile
      // We will fix the fetch call here.
      const profileResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/users/profile`, {
        // The 'method' defaults to 'GET', which is what we want.
        headers: {
          'Authorization': `Bearer ${data.token}`,
        },
        // DO NOT include a 'body' here. GET requests cannot have one.
      });

      const profileData = await profileResponse.json();
      if (profileData.success) {
        setUser(profileData.user);
      } else {
        // If profile fetch fails, clear the token
        logout();
        throw new Error(profileData.error || 'Could not fetch profile');
      }

      setLoading(false);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      setLoading(false);
      return false;
    }
  };

  const register = async (username, email, password, displayName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, displayName })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store auth data
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      localStorage.removeItem('guestMode');

      setToken(data.token);
      setUser(data.user);
      setIsGuest(false);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
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