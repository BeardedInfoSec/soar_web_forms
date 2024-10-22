// src/components/ViewForms.js
import React, { useState, useEffect } from 'react';
import './ViewForms.css'; // Styling for improved list layout

const ViewForms = () => {
  const [forms, setForms] = useState([]);

  useEffect(() => {
    const savedForms = Object.keys(localStorage).map((key) => ({
      name: key,
      data: JSON.parse(localStorage.getItem(key)),
    }));
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
        {forms.map((form) => (
          <li key={form.name} className="form-item">
            <button className="form-button" onClick={() => openForm(form.name)}>
              {form.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewForms;
