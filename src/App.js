import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { SplunkThemeProvider } from '@splunk/themes';
import Cookies from 'js-cookie'; // Import js-cookie
import Navbar from './components/Navbar';
import FormBuilder from './components/FormBuilder';
import ViewForms from './components/ViewForms';
import Configuration from './components/Configuration';
import FormDisplay from './components/FormDisplay';
import Login from './components/Login';
import CreateUser from './components/CreateUser';
import ResetPassword from './components/ResetPassword';
import GrantPermissions from './components/GrantPermissions';
import AdminPage from './components/AdminPage';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!Cookies.get('token') // Check if token exists in cookies
    );
    const [userRole, setUserRole] = useState(Cookies.get('userRole') || ''); // Get role from cookies
    const [username, setUsername] = useState(Cookies.get('username') || ''); // Get username from cookies

    useEffect(() => {
        // Check if token exists in cookies and set state accordingly
        if (Cookies.get('token')) {
            setIsAuthenticated(true);
            setUserRole(Cookies.get('userRole'));
            setUsername(Cookies.get('username'));
        }
    }, []);

    const handleLogin = (role, user) => {
        // Save token and user details in cookies
        Cookies.set('token', 'user-session-token', { expires: 7 }); // Replace with actual token
        Cookies.set('userRole', role, { expires: 7 });
        Cookies.set('username', user, { expires: 7 });

        setIsAuthenticated(true);
        setUserRole(role);
        setUsername(user);
        console.log('User logged in with role:', role);
    };

    const handleLogout = () => {
        // Remove cookies on logout
        Cookies.remove('token');
        Cookies.remove('userRole');
        Cookies.remove('username');

        setIsAuthenticated(false);
        setUserRole('');
        setUsername('');
        console.log('User logged out');
    };

    const hasAccessToForms = () => {
        return ['admin', 'developer', 'read_user'].includes(userRole);
    };

    return (
        <SplunkThemeProvider family="enterprise" density="comfortable">
            <Router>
                <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} username={username} />
                <div className="content">
                <Routes>
    <Route path="/" element={<Navigate to={isAuthenticated ? "/view-forms" : "/login"} />} />
    <Route path="/login" element={isAuthenticated ? <Navigate to="/view-forms" /> : <Login onLogin={handleLogin} />} />
    <Route
        path="/view-forms"
        element={isAuthenticated && ['admin', 'developer', 'read_user'].includes(userRole) ? <ViewForms userRole={userRole} /> : <Navigate to="/login" />}
    />
    <Route
        path="/form-builder"
        element={isAuthenticated && ['admin', 'developer'].includes(userRole) ? <FormBuilder /> : <Navigate to="/login" />}
    />
    <Route
        path="/configuration"
        element={isAuthenticated && ['admin', 'developer'].includes(userRole) ? <Configuration /> : <Navigate to="/login" />}
    />
    <Route
        path="/admin"
        element={isAuthenticated && userRole === 'admin' ? <AdminPage /> : <Navigate to="/login" />}
    />
    <Route
        path="/create-user"
        element={isAuthenticated && userRole === 'admin' ? <CreateUser /> : <Navigate to="/login" />}
    />
    <Route
        path="/reset-password"
        element={isAuthenticated && userRole === 'admin' ? <ResetPassword /> : <Navigate to="/login" />}
    />
    <Route
        path="/grant-permissions"
        element={isAuthenticated && userRole === 'admin' ? <GrantPermissions /> : <Navigate to="/login" />}
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
