import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext'; // We still need this for the token
import { Navigate } from 'react-router-dom';

function ProfileSettings() {
    // We get the token from the context to authorize our API call
    const { token } = useAuth(); 
    
    // Local state for this component to store profile data, loading, and error states
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Function to fetch the profile data from the server
        const fetchProfile = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/users/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (data.success) {
                    setProfileData(data.user);
                } else {
                    setError(data.error || 'Failed to fetch profile');
                }
            } catch (err) {
                setError('An error occurred while fetching profile data.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [token]); // The effect runs whenever the token changes

    // --- Render Logic ---

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
    }

    if (error) {
        return <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Error: {error}</div>;
    }

    // If there's no token or no profile data, the user is not authenticated
    if (!profileData) {
        return <Navigate to="/auth" replace />;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '40px auto' }}>
            <h2>Profile Settings</h2>
            <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#f9f9f9' }}>
                <p><strong>Username:</strong> @{profileData.username}</p>
                <p><strong>Display Name:</strong> {profileData.displayName}</p>
                <p><strong>Email:</strong> {profileData.email}</p>
                <p><strong>Joined:</strong> {new Date(profileData.createdAt).toLocaleDateString()}</p>
            </div>
            <div style={{ marginTop: '20px', color: '#888', textAlign: 'center' }}>
                <p>Editing functionality is coming soon!</p>
            </div>
        </div>
    );
}

export default ProfileSettings;