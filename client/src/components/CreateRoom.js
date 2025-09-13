import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateRoom() {
  const [formData, setFormData] = useState({
    hostName: '',
    storyPrompt: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      if (!formData.hostName.trim() || !formData.storyPrompt.trim()) {
        throw new Error('Please fill in all fields');
      }

      const response = await fetch('http://localhost:5000/api/games/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostName: formData.hostName.trim(),
          storyPrompt: formData.storyPrompt.trim()
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create room');
      }

      // Store room data for the game room
      localStorage.setItem('gameData', JSON.stringify({
        roomId: data.roomId,
        playerId: data.hostId,
        playerName: formData.hostName.trim(),
        isHost: true
      }));

      console.log('Room created successfully:', data);
      navigate(`/room/${data.roomId}`);

    } catch (error) {
      console.error('Error creating room:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const storyPromptExamples = [
    "You wake up in a mysterious castle...",
    "A strange portal opens in your backyard...",
    "The last human on Earth receives a message...",
    "Magic is forbidden, but you have powers...",
    "A time traveler arrives with a warning..."
  ];

  const selectExample = (example) => {
    setFormData(prev => ({
      ...prev,
      storyPrompt: example
    }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🏗️ Create New Story</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Your Name:</label><br/>
          <input
            type="text"
            name="hostName"
            value={formData.hostName}
            onChange={handleInputChange}
            placeholder="Enter your name..."
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Story Prompt:</label><br/>
          <textarea
            name="storyPrompt"
            value={formData.storyPrompt}
            onChange={handleInputChange}
            placeholder="Set the scene for your story..."
            rows={4}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <p>💡 Example prompts:</p>
          {storyPromptExamples.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => selectExample(example)}
              style={{ 
                display: 'block', 
                margin: '5px 0', 
                padding: '5px 10px',
                background: '#f0f0f0',
                border: '1px solid #ccc',
                cursor: 'pointer'
              }}
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '15px' }}>
            ❌ {error}
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={loading}
            style={{ marginRight: '10px', padding: '10px 20px' }}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px 20px', background: '#007bff', color: 'white' }}
          >
            {loading ? '⏳ Creating...' : '🚀 Create Room'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateRoom;