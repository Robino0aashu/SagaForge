import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';

function MyStories() {
    const [stories, setStories] = useState([]);
    const { token } = useAuth();

    useEffect(() => {
        const fetchStories = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/users/stories`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setStories(data.stories);
                }
            } catch (error) {
                console.error("Failed to fetch stories", error);
            }
        };

        if (token) {
            fetchStories();
        }
    }, [token]);

    return (
        <div style={{ padding: '20px' }}>
            <h2>My Stories</h2>
            {stories.length > 0 ? (
                <ul>
                    {stories.map(story => (
                        <li key={story.id}>
                            <h3>{story.title}</h3>
                            <p>{story.summary}</p>
                            <small>Created on: {new Date(story.created_at).toLocaleDateString()}</small>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>You have no saved stories yet.</p>
            )}
        </div>
    );
}

export default MyStories;