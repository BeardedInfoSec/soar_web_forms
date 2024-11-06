// src/components/ViewForms.js
import React, { useState, useEffect } from 'react';
import './ViewForms.css';

const ViewForms = () => {
  const [forms, setForms] = useState([]);
  const [manageMode, setManageMode] = useState(false); // Toggle for manage mode
  const [selectedForms, setSelectedForms] = useState([]); // Track selected forms for deletion

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

  const toggleManageMode = () => {
    setManageMode(!manageMode);
    setSelectedForms([]); // Clear selections when entering/exiting manage mode
  };

  const handleCheckboxChange = (formName) => {
    setSelectedForms((prevSelected) =>
      prevSelected.includes(formName)
        ? prevSelected.filter((name) => name !== formName)
        : [...prevSelected, formName]
    );
  };

  const deleteSelectedForms = () => {
    selectedForms.forEach((formName) => {
      localStorage.removeItem(formName);
    });
    setForms((prevForms) => prevForms.filter((form) => !selectedForms.includes(form.name)));
    setSelectedForms([]); // Clear selected forms after deletion
    setManageMode(false); // Exit manage mode
  };

  return (
    <div className="view-forms-container">
      <h2>View Forms</h2>
      <button className="manage-button" onClick={toggleManageMode}>
        {manageMode ? 'Cancel' : 'Manage Forms'}
      </button>

      {manageMode && (
        <button className="delete-selected-button" onClick={deleteSelectedForms} disabled={selectedForms.length === 0}>
          Delete Selected
        </button>
      )}

      <ul className="form-list">
        {forms.map((form, index) => (
          <li key={index} className="form-card">
            {manageMode && (
              <input
                type="checkbox"
                checked={selectedForms.includes(form.name)}
                onChange={() => handleCheckboxChange(form.name)}
                className="form-checkbox"
              />
            )}
            <span className="form-name" onClick={() => !manageMode && openForm(form.name)}>
              {form.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewForms;
