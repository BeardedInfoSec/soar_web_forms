import React, { useState } from 'react';
import axios from 'axios';
import './AdminPage.css';

const AdminPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5050/admin/create-user', {
        username,
        password,
        role,
      });
      setMessage(response.data.message);
      setUsername('');
      setPassword('');
      setRole('');
    } catch (error) {
      setMessage(error.response.data.message || 'Error creating user');
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5050/admin/reset-password', {
        username,
        newPassword,
      });
      setMessage(response.data.message);
      setNewPassword('');
    } catch (error) {
      setMessage(error.response.data.message || 'Error resetting password');
    }
  };

  const grantPermissions = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5050/admin/grant-permissions', {
        username,
        newRole: role,
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response.data.message || 'Error granting permissions');
    }
  };

  return (
    <div className="admin-page">
      <h2>Admin Page</h2>
      <form onSubmit={createUser}>
        <h3>Create User</h3>
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
          <option value="">Select Role</option>
          <option value="admin_user">Admin</option>
          <option value="dev_user">Developer</option>
          <option value="read_user">Read Only</option>
        </select>
        <button type="submit">Create User</button>
      </form>

      <form onSubmit={resetPassword}>
        <h3>Reset Password</h3>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="New Password" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
          required 
        />
        <button type="submit">Reset Password</button>
      </form>

      <form onSubmit={grantPermissions}>
        <h3>Grant Permissions</h3>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="">Select Role</option>
          <option value="admin_user">Admin</option>
          <option value="dev_user">Developer</option>
          <option value="read_user">Read Only</option>
        </select>
        <button type="submit">Grant Permissions</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default AdminPage;
