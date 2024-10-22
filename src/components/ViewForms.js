// src/components/ViewForms.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ViewForms = () => {
  const [forms, setForms] = useState([]);
  const navigate = useNavigate(); // Use navigate for programmatic navigation

  useEffect(() => {
    const savedForms = Object.keys(localStorage).map((key) => ({
      name: key,
      data: JSON.parse(localStorage.getItem(key)),
    }));
    setForms(savedForms);
  }, []);

  const openForm = (formName) => {
    navigate(`/forms/${formName}`); // Navigate to the form's URL
  };

  return (
    <div>
      <h2>View Forms</h2>
      <ul>
        {forms.map((form) => (
          <li key={form.name}>
            <button onClick={() => openForm(form.name)}>
              {form.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ViewForms;
