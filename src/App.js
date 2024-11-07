import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { SplunkThemeProvider } from '@splunk/themes';
import Navbar from './components/Navbar';
import FormBuilder from './components/FormBuilder';
import ViewForms from './components/ViewForms';
import Configuration from './components/Configuration';
import FormDisplay from './components/FormDisplay';
import Login from './components/Login';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('token') // Check if token exists in localStorage
  );

  const handleLogin = () => {
    setIsAuthenticated(true);
    console.log('User logged in');
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token to log out
    setIsAuthenticated(false);
    console.log('User logged out');
  };

  return (
    <SplunkThemeProvider family="enterprise" density="comfortable">
      <Router>
        <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <div className="content">
          <Routes>
            {/* Redirect from root to view-forms if authenticated */}
            <Route path="/" element={<Navigate to={isAuthenticated ? "/view-forms" : "/login"} />} />
            
            {/* Authentication Route */}
            <Route path="/login" element={isAuthenticated ? <Navigate to="/view-forms" /> : <Login onLogin={handleLogin} />} />

            {/* Protected Routes */}
            <Route
              path="/view-forms"
              element={isAuthenticated ? <ViewForms /> : <Navigate to="/login" />}
            />
            <Route
              path="/form-builder"
              element={isAuthenticated ? <FormBuilder /> : <Navigate to="/login" />}
            />
            <Route
              path="/configuration"
              element={isAuthenticated ? <Configuration /> : <Navigate to="/login" />}
            />
            <Route
              path="/forms/:formName"
              element={isAuthenticated ? <FormDisplay /> : <Navigate to="/login" />}
            />
          </Routes>
        </div>
      </Router>
    </SplunkThemeProvider>
  );
};

export default App;
