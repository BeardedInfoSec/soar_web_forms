import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { SplunkThemeProvider } from '@splunk/themes';
import Navbar from './components/Navbar';
import FormBuilder from './components/FormBuilder';
import ViewForms from './components/ViewForms';
import Configuration from './components/Configuration';
import FormDisplay from './components/FormDisplay'; // Import FormDisplay

const App = () => {
  return (
    <SplunkThemeProvider family="enterprise" density="comfortable">
      <Router>
        <Navbar /> {/* Navbar stays here */}
        <div className="content">
          <Routes>
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
