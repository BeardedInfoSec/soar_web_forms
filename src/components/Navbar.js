import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/images/splunk_app.png';

const Navbar = ({ isAuthenticated, onLogout }) => {
    // Only render the Navbar if the user is authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="navbar">
            <div className="navbar-logo">
                <img src={logo} alt="SOAR Forms Logo" className="navbar-logo-image" />
            </div>
            <nav className="navbar-links">
                <Link to="/view-forms" className="navbar-link">View Forms</Link>
                <Link to="/form-builder" className="navbar-link">Form Builder</Link>
                <Link to="/configuration" className="navbar-link">Configuration</Link>

                {/* Logout Button */}
                <button onClick={onLogout} className="navbar-link logout-button">Logout</button>
            </nav>
        </div>
    );
};

export default Navbar;
