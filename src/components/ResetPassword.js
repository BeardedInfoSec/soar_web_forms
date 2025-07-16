import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ResetPassword.css';

const ResetPassword = () => {
  const [users, setUsers] = useState([]); // State to hold the list of users
  const [selectedUser, setSelectedUser] = useState(''); // State for the selected user
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Fetch the list of users when the component mounts
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5001/users'); // Adjust the endpoint as necessary
        setUsers(response.data); // Assuming response.data is an array of user objects
      } catch (err) {
        setError('Error fetching users: ' + err.message);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure a user is selected
    if (!selectedUser) {
      setError('Please select a user.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/admin/reset-password', {
        username: selectedUser, // Use the selected user from the dropdown
        newPassword,
      });

      setSuccess('Password reset successfully!');
      setError('');
      // Clear the fields
      setSelectedUser('');
      setNewPassword('');
    } catch (err) {
      setError('Error resetting password: ' + (err.response?.data?.message || err.message));
      setSuccess('');
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-box">
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} required>
            <option value="" disabled>Select User</option>
            {users.map((user) => (
              <option key={user.username} value={user.username}>
                {user.username} {/* Display the username */}
              </option>
            ))}
          </select>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" className="reset-password-button">Reset Password</button>
        </form>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
