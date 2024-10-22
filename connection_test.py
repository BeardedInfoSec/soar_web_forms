import React, { useState } from 'react';

const Configuration = () => {
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sslVerification, setSslVerification] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');

  const saveConfiguration = () => {
    const config = {
      url,
      username,
      password,
      sslVerification,
    };

    localStorage.setItem('soarConfig', JSON.stringify(config));
    alert('Configuration saved successfully!');
  };

  const testConnection = async () => {
    setConnectionStatus(''); // Reset status message on each attempt

    const config = JSON.parse(localStorage.getItem('soarConfig')) || {};
    const { url, username, password } = config;

    try {
      const apiUrl = `${url}/rest/version`;
      const headers = new Headers();
      headers.set('Authorization', `Basic ${btoa(`${username}:${password}`)}`);
      headers.set('Content-Type', 'application/json');

      console.log(`Sending request to ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers,
        mode: 'cors', // Ensure it's cors to access the response
        credentials: 'include', // If your server requires it
        cache: 'no-cache',
      });

      console.log(`Response Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus(`Connection successful: Version ${data.version}`);
      } else {
        throw new Error(`Connection failed: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setConnectionStatus(`Connection failed: ${error.message}`);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
      }}
    >
      <div
        style={{
          backgroundColor: '#2e2e2e',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
          width: '400px',
        }}
      >
        <h2 style={{ color: 'white', marginBottom: '20px' }}>Configuration</h2>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ color: 'white' }}>SOAR URL/IP:</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://<SOAR_IP>"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ced4da',
              marginTop: '5px',
            }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ color: 'white' }}>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ced4da',
              marginTop: '5px',
            }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ color: 'white' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ced4da',
              marginTop: '5px',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <input
            type="checkbox"
            checked={sslVerification}
            onChange={(e) => setSslVerification(e.target.checked)}
            style={{ marginRight: '10px' }}
          />
          <label style={{ color: 'white' }}>Disable SSL Verification</label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={saveConfiguration}
            style={{
              backgroundColor: '#4285f4',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              marginRight: '10px',
            }}
          >
            Save Configuration
          </button>

          <button
            onClick={testConnection}
            style={{
              backgroundColor: '#34a853',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Test Connection
          </button>
        </div>

        {connectionStatus && (
          <p style={{ color: 'white', marginTop: '10px' }}>{connectionStatus}</p>
        )}
      </div>
    </div>
  );
};

export default Configuration;
