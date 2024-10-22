import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul>
        <li>
          <NavLink exact to="/" activeClassName="active">
            Form Builder
          </NavLink>
        </li>
        <li>
          <NavLink to="/view-forms" activeClassName="active">
            View Forms
          </NavLink>
        </li>
        <li>
          <NavLink to="/configuration" activeClassName="active">
            Configuration
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
