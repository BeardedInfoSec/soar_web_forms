import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/images/splunk_app.png';

const Navbar = ({ isAuthenticated, onLogout }) => {
    return (
        <div className="navbar">
            <div className="navbar-logo">
                <img src={logo} alt="SOAR Forms Logo" className="navbar-logo-image" />
            </div>
            <nav className="navbar-links">
                <Link to="/" className="navbar-link">Form Builder</Link>
                <Link to="/view-forms" className="navbar-link">View Forms</Link>
                <Link to="/configuration" className="navbar-link">Configuration</Link>

                {/* Conditional Rendering based on Authentication Status */}
                {!isAuthenticated ? (
                    <>
                        <Link to="/login" className="navbar-link">Login</Link>
                        <Link to="/register" className="navbar-link">Register</Link>
                    </>
                ) : (
                    <button onClick={onLogout} className="navbar-link logout-button">Logout</button>
                )}
            </nav>
        </div>
    );
};

export default Navbar;
