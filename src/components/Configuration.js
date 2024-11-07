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
      const configWithSSL = { ...parsedConfig, sslVerification };
    
      // Save to localStorage as before
      localStorage.setItem('soarConfig', JSON.stringify(configWithSSL));
    
      // Use the IP address of the Linux server instead of localhost
      const linuxServerUrl = 'http://localhost:5000/configuration'; // Replace with your Linux server IP
  
      // Save to backend
      await axios.post(linuxServerUrl, {
        server: parsedConfig.server,
        ph_auth_token: parsedConfig['ph-auth-token'],
        ssl_verification: sslVerification,
      }, {
        headers: {
          'Authorization': `Bearer <your_jwt_token>` // Ensure you pass the JWT if needed
        }
      });
  
      alert('Configuration saved successfully!');
    } catch (error) {
      if (error instanceof SyntaxError) {
        alert('Invalid JSON. Please check your input.');
        console.error('JSON parsing error:', error.message);
      } else {
        alert(`Failed to save configuration: ${error.message}`);
        console.error('Error during save configuration:', error);
      }
    }
  };
  

  const testConnection = async () => {
    setConnectionStatus('Testing connection...');
    try {
      // Retrieve configuration from localStorage
      const config = JSON.parse(localStorage.getItem('soarConfig')) || {};
      const { server, 'ph-auth-token': authToken } = config;

      // Ensure required fields are provided
      if (!server || !authToken) {
        throw new Error('Missing server URL or auth token in configuration');
      }

      const apiUrl = `${server}/rest/version`;
      console.log('Sending request to', apiUrl);

      // Perform a test connection to the server
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'ph-auth-token': authToken,
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
            label="Save Configuration"
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
