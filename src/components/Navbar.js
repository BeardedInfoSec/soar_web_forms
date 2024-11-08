import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/images/splunk_app.png';

const Navbar = ({ isAuthenticated, onLogout, username }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null); // Reference for the dropdown

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

    const handleLinkClick = () => {
        setIsDropdownOpen(false);
    };

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

                {(username === 'admin_user' || username === 'developer') && (
                    <Link to="/form-builder" className="navbar-link">Form Builder</Link>
                )}
                {username === 'admin_user' && (
                    <div className="dropdown" ref={dropdownRef}>
                        <button onClick={toggleDropdown} className="navbar-link dropdown-toggle">
                            Admin Panel
                        </button>
                        {isDropdownOpen && (
                            <div className="dropdown-menu">
                                <Link to="/create-user" className="dropdown-item" onClick={handleLinkClick}>Create User</Link>
                                <Link to="/reset-password" className="dropdown-item" onClick={handleLinkClick}>Reset Password</Link>
                                <Link to="/grant-permissions" className="dropdown-item" onClick={handleLinkClick}>Grant Permissions</Link>
                                <Link to="/configuration" className="dropdown-item" onClick={handleLinkClick}>Configuration</Link>
                            </div>
                        )}
                    </div>
                )}

                <span className="navbar-username">{username}</span>
                <button onClick={onLogout} className="navbar-link logout-button">Logout</button>
            </nav>
        </div>
    );
};

export default Navbar;
