// src/components/FormDisplay.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const FormDisplay = () => {
  const { formName } = useParams(); // Get form name from the URL
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem(formName);
    if (data) {
      setFormData(JSON.parse(data));
    } else {
      console.error('Form not found:', formName);
    }
  }, [formName]);

  if (!formData) {
    return <h2>Form not found</h2>;
  }

  return (
    <div>
      <h2>{formData.name}</h2>
      {formData.elements.map((element, index) => (
        <div key={index}>
          <p><strong>Type:</strong> {element.type}</p>
          <p><strong>Label:</strong> {element.label}</p>
          <p><strong>Required:</strong> {element.required ? 'Yes' : 'No'}</p>
          <hr />
        </div>
      ))}
    </div>
  );
};

export default FormDisplay;
