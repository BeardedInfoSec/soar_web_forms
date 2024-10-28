// src/components/ViewForms.js
import React, { useState, useEffect } from 'react';
import './ViewForms.css'; // Styling for improved list layout

const ViewForms = () => {
  const [forms, setForms] = useState([]);

  // Helper function to parse XML from a string
  const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    const nameElement = xmlDoc.getElementsByTagName('name')[0];
    const name = nameElement ? nameElement.textContent : 'Unnamed Form';
    return { name, xml: xmlString };
  };

  useEffect(() => {
    const savedForms = Object.keys(localStorage)
      .map((key) => {
        const xmlData = localStorage.getItem(key);
        return parseXML(xmlData);
      })
      .filter((form) => form.name); // Exclude invalid forms
    setForms(savedForms);
  }, []);

  const openForm = (formName) => {
    const url = `/forms/${formName}`;
    window.open(url, '_blank');
  };

  return (
    <div className="view-forms-container">
      <h2>View Forms</h2>
      <ul className="form-list">
        {forms.map((form, index) => (
          <li key={index} className="form-item">
            <button
              className="form-button"
              onClick={() => openForm(form.name)}
            >
              {form.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewForms;
