import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function JoinRoom() {
  const [formData, setFormData] = useState({
    roomId: '',
    playerName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.toUpperCase() // Room IDs are uppercase
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.roomId.trim() || !formData.playerName.trim()) {
        throw new Error('Please fill in all fields');
      }

      // Check if room exists first
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/games/room/${formData.roomId.trim()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error('Room not found');
      }

      // Store room data for the game room (no playerId = new player)
      localStorage.setItem('gameData', JSON.stringify({
        roomId: formData.roomId.trim(),
        playerId: null, // Will be assigned when joining via socket
        playerName: formData.playerName.trim(),
        isHost: false
      }));

      console.log('Room found, joining:', data);
      navigate(`/room/${formData.roomId.trim()}`);

    } catch (error) {
      console.error('Error joining room:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>🚪 Join Existing Room</h2>
      <p>Enter the room code and your name to join the story</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Room Code:</label><br/>
          <input
            type="text"
            name="roomId"
            value={formData.roomId}
            onChange={handleInputChange}
            placeholder="Enter room code (e.g. ABC123DE)"
            maxLength={8}
            style={{ 
              width: '100%', 
              padding: '12px', 
              marginTop: '5px',
              fontSize: '18px',
              fontFamily: 'monospace',
              textAlign: 'center',
              letterSpacing: '2px'
            }}
            required
          />
          <small style={{ color: '#666' }}>
            8-character room code provided by the host
          </small>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Your Name:</label><br/>
          <input
            type="text"
            name="playerName"
            value={formData.playerName}
            onChange={(e) => setFormData(prev => ({ ...prev, playerName: e.target.value }))}
            placeholder="Enter your name..."
            maxLength={20}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            required
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '15px', padding: '10px', background: '#ffeaea', border: '1px solid #ffcccc' }}>
            ❌ {error}
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={loading}
            style={{ 
              marginRight: '10px', 
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              background: loading ? '#ccc' : '#28a745', 
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Joining...' : '🚀 Join Room'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: '30px', padding: '15px', background: '#f8f9fa', border: '1px solid #dee2e6' }}>
        <h4>💡 How to join:</h4>
        <ol>
          <li>Get the room code from your host</li>
          <li>Enter the 8-character code above</li>
          <li>Choose your display name</li>
          <li>Click "Join Room" to enter the story</li>
        </ol>
      </div>
    </div>
  );
}

export default JoinRoom;