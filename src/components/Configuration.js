import React, { useState } from 'react';
import Button from '@splunk/react-ui/Button'; // Import Splunk UI Button
import './Configuration.css';
import axios from 'axios';

const Configuration = () => {
  const [jsonConfig, setJsonConfig] = useState('');
  const [sslVerification, setSslVerification] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('');

  const saveConfiguration = async () => {
    try {
      const parsedConfig = JSON.parse(jsonConfig);

      // Ensure required fields are present
      if (!parsedConfig.server || !parsedConfig['ph-auth-token']) {
        throw new Error('Missing required fields: server or ph-auth-token');
      }

      // Backend URL (replace with your actual backend IP/domain)
      const backendUrl = 'http://localhost:5000/configuration';

      // Send data to the backend
      const response = await axios.post(backendUrl, {
        server: parsedConfig.server,
        ph_auth_token: parsedConfig['ph-auth-token'],
        ssl_verification: sslVerification,
      });

      if (response.status === 200) {
        alert('Configuration sent successfully!');
      } else {
        throw new Error(`Failed with status code: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        alert('Invalid JSON. Please check your input.');
        console.error('JSON parsing error:', error.message);
      } else if (error.response) {
        // Server responded with a status outside the 2xx range
        alert(`Failed to send configuration: ${error.response.data.message || error.response.statusText}`);
        console.error('Server error:', error.response);
      } else if (error.request) {
        // Request was made but no response received
        alert('No response received from server. Please check the server status.');
        console.error('Network error:', error.request);
      } else {
        alert(`Failed to send configuration: ${error.message}`);
        console.error('Error during save configuration:', error);
      }
    }
  };

  const testConnection = async () => {
    setConnectionStatus('Testing connection...');
    try {
      // Fetch the server and ph_auth_token from the backend
      const configResponse = await axios.get('http://localhost:5000/test_connection');
  
      if (configResponse.status !== 200) {
        throw new Error('Failed to fetch configuration for test connection');
      }
  
      const { server, ph_auth_token } = configResponse.data;
  
      // Ensure required fields are present
      if (!server || !ph_auth_token) {
        throw new Error('Missing server URL or auth token in configuration');
      }
  
      const apiUrl = `${server}/rest/version`;
      console.log('Sending request to', apiUrl);
  
      // Perform a test connection to the server
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'ph-auth-token': ph_auth_token,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
  
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(`Connection successful: Version ${data.version}`);
      } else {
        throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setConnectionStatus(`Connection failed: ${error.message}`);
    }
  };
  

  return (
    <div className="configuration-container">
      <div className="configuration-box">
        <h2>Configuration</h2>
        <textarea
          value={jsonConfig}
          onChange={(e) => setJsonConfig(e.target.value)}
          placeholder="Enter JSON configuration here..."
          className="configuration-textarea"
        />

        <div className="ssl-checkbox-container">
          <input
            type="checkbox"
            checked={!sslVerification}
            onChange={(e) => setSslVerification(!e.target.checked)}
          />
          <label>Disable SSL Verification</label>
        </div>

        <div className="button-container">
          <Button
            label="Send Configuration"
            appearance="primary"
            onClick={saveConfiguration}
            style={{ backgroundColor: '#007BFF', color: '#ffffff' }} // Inline style for custom color
          />
          <Button
            label="Test Connection"
            appearance="secondary"
            onClick={testConnection}
          />
        </div>

        {connectionStatus && <p className="connection-status">{connectionStatus}</p>}
      </div>
    </div>
  );
};

export default Configuration;
