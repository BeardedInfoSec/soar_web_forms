// Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Send a POST request to the backend login endpoint
      const response = await axios.post('http://localhost:5000/login', {
        username,
        password,
      });

      // Get the token from the response
      const { token } = response.data;

      // Store the token in localStorage for session management
      localStorage.setItem('token', token);

      // Clear any previous error
      setError('');

      // Call the onLogin callback to update the authenticated state in App
      onLogin();
    } catch (err) {
      console.error('Login failed:', err);

      // Check if the error response is available
      if (err.response) {
        if (err.response.data && err.response.data.message) {
          // Server responded with a message
          setError(err.response.data.message);
        } else {
          // No specific message, return a general error
          setError('Error: ' + err.response.status + ' ' + err.response.statusText);
        }
      } else if (err.request) {
        // The request was made, but no response was received
        setError('No response from server. Please try again later.');
      } else {
        // Something else happened
        setError('Unexpected error: ' + err.message);
      }
    }
  };

  return (
    <div className="auth-form">
      <h2>SOAR Web Forms</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
