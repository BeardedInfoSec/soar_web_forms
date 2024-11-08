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
    const fetchForms = async () => {
      try {
        const response = await fetch('http://localhost:5000/forms'); // Update with your backend URL
        if (!response.ok) {
          throw new Error(`Failed to fetch forms: ${response.status}`);
        }
        const data = await response.json();
        // Include the ID and parse XML data
        setForms(data.map(form => ({
          id: form.id, // Store the ID for deletion
          ...parseXML(form.xml_data) // Parse XML from the database
        })));
      } catch (error) {
        console.error('Error fetching forms:', error);
      }
    };

    fetchForms();
  }, []);

  const openForm = (formName) => {
    const url = `/forms/${formName}`;
    window.open(url, '_blank');
  };

  const toggleManageMode = () => {
    setManageMode(!manageMode);
    setSelectedForms([]); // Clear selections when entering/exiting manage mode
  };

  const handleCheckboxChange = (formId) => {
    setSelectedForms((prevSelected) =>
      prevSelected.includes(formId)
        ? prevSelected.filter((id) => id !== formId)
        : [...prevSelected, formId]
    );
  };

  const deleteSelectedForms = async () => {
    try {
      await Promise.all(
        selectedForms.map(async (formId) => {
          const response = await fetch(`http://localhost:5000/forms/${formId}`, { // Use form.id for deletion
            method: 'DELETE',
          });
          if (!response.ok) {
            throw new Error(`Failed to delete form: ${response.status}`);
          }
        })
      );

      // Update the forms state after deletion
      setForms((prevForms) => prevForms.filter((form) => !selectedForms.includes(form.id))); // Filter by ID
      setSelectedForms([]); // Clear selected forms after deletion
      setManageMode(false); // Exit manage mode
    } catch (error) {
      console.error('Error deleting forms:', error);
    }
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
        {forms.map((form) => (
          <li key={form.id} className="form-card"> {/* Use form.id as the key */}
            {manageMode && (
              <input
                type="checkbox"
                checked={selectedForms.includes(form.id)} // Check by form ID
                onChange={() => handleCheckboxChange(form.id)} // Pass form ID to handler
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
