// CreateUser.js
import React, { useState } from 'react';
import axios from 'axios';
import './CreateUser.css';

const CreateUser = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Select Role');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'Select Role') {
      setError('Please select a role.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5050/admin/create-user', {
        firstName,
        lastName,
        email,
        username,
        password,
        role,
      });

      setSuccess('User created successfully!');
      setError('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setUsername('');
      setPassword('');
      setRole('Select Role');
    } catch (err) {
      setError('Error creating user: ' + err.response?.data?.message || err.message);
      setSuccess('');
    }
  };

  return (
    <div className="create-user-container">
      <div className="create-user-box">
        <h2>Create User</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="Select Role" disabled>Select Role</option>
            <option value="admin">Admin</option>
            <option value="developer">Developer</option>
            <option value="read-only">Read-Only</option>
          </select>
          <button type="submit" className="create-user-button">Create User</button>
        </form>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </div>
    </div>
  );
};

export default CreateUser;
