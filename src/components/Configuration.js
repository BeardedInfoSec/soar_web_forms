import React, { useState } from 'react';

const Configuration = () => {
  const [jsonConfig, setJsonConfig] = useState(''); // JSON input state
  const [sslVerification, setSslVerification] = useState(true); // SSL checkbox state
  const [connectionStatus, setConnectionStatus] = useState('');

  const saveConfiguration = () => {
    try {
      const parsedConfig = JSON.parse(jsonConfig);
      const configWithSSL = { ...parsedConfig, sslVerification };
      localStorage.setItem('soarConfig', JSON.stringify(configWithSSL));
      alert('Configuration saved successfully!');
    } catch (error) {
      alert('Invalid JSON. Please check your input.');
      console.error('JSON parsing error:', error);
    }
  };

  const testConnection = async () => {
    setConnectionStatus('Testing connection...');

    try {
      const config = JSON.parse(localStorage.getItem('soarConfig')) || {};
      const { url, username, password, sslVerification } = config;

      const apiUrl = sslVerification
        ? `${url}/rest/version`
        : `http://localhost:3001/proxy/rest/version`;

      console.log('Sending request to', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (response.status === 200) {
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

        <textarea
          value={jsonConfig}
          onChange={(e) => setJsonConfig(e.target.value)}
          placeholder='Enter JSON configuration here...'
          style={{
            width: '100%',
            height: '200px',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ced4da',
            marginTop: '5px',
            marginBottom: '10px',
            backgroundColor: '#1a1a1a',
            color: 'white',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="checkbox"
            checked={!sslVerification}
            onChange={(e) => setSslVerification(!e.target.checked)}
            style={{ marginRight: '10px' }}
          />
          <label style={{ color: 'white' }}>Disable SSL Verification</label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
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
