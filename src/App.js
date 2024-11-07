import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SplunkThemeProvider } from '@splunk/themes';
import Navbar from './components/Navbar';
import FormBuilder from './components/FormBuilder';
import ViewForms from './components/ViewForms';
import Configuration from './components/Configuration';
import FormDisplay from './components/FormDisplay'; // Import FormDisplay
import Login from './components/login'; // Import Login component
import Register from './components/register'; // Import Register component

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <SplunkThemeProvider family="enterprise" density="comfortable">
      <Router>
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} /> {/* Pass authentication props */}
        <div className="content">
          <Routes>
            {/* Authentication Routes */}
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />

            {/* Main App Routes */}
            <Route path="/" element={<FormBuilder />} />
            <Route path="/view-forms" element={<ViewForms />} />
            <Route path="/configuration" element={<Configuration />} />
            <Route path="/forms/:formName" element={<FormDisplay />} /> {/* Route for dynamic form */}
          </Routes>
        </div>
      </Router>
    </SplunkThemeProvider>
  );
};

export default App;
