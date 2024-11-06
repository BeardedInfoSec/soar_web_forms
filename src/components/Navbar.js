import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/images/splunk_app.png';

const Navbar = () => {
    return (
        <div className="navbar">
            <div className="navbar-logo">
                <img src={logo} alt="SOAR Forms Logo" className="navbar-logo-image" />
            </div>
            <nav className="navbar-links">
                <Link to="/" className="navbar-link">Form Builder</Link>
                <Link to="/view-forms" className="navbar-link">View Forms</Link>
                <Link to="/configuration" className="navbar-link">Configuration</Link>
            </nav>
        </div>
    );
};

export default Navbar;
