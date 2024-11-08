// GrantPermissions.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GrantPermissions.css';

const GrantPermissions = () => {
  const [users, setUsers] = useState([]); // Store the list of users
  const [selectedUser, setSelectedUser] = useState(''); // Selected user
  const [role, setRole] = useState('Select Role');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch users from the backend on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/users'); // Adjust endpoint as needed
        setUsers(response.data); // Set users to the fetched data
      } catch (err) {
        setError('Error fetching users: ' + err.message);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === 'Select Role') {
      setError('Please select a role.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/grant-permissions', {
        username: selectedUser, // Use selectedUser for username
        role,
      });

      setSuccess('Permissions granted successfully!');
      setError('');
      // Clear the fields
      setSelectedUser('');
      setRole('Select Role');
    } catch (err) {
      setError('Error granting permissions: ' + err.response?.data?.message || err.message);
      setSuccess('');
    }
  };

  return (
    <div className="grant-permissions-container">
      <div className="grant-permissions-box">
        <h2>Grant Permissions</h2>
        <form onSubmit={handleSubmit}>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} required>
            <option value="" disabled>Select User</option>
            {users.map(user => (
              <option key={user.username} value={user.username}>{user.username}</option> // Use username as value
            ))}
          </select>
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="Select Role" disabled>Select Role</option>
            <option value="admin">Admin</option>
            <option value="dev_user">Developer</option>
            <option value="read_user">Read-Only</option>
          </select>
          <button type="submit" className="grant-permissions-button">Grant Permissions</button>
        </form>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </div>
    </div>
  );
};

export default GrantPermissions;
