// src/components/FormDisplay.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './FormDisplay.css'; // Import CSS styling

const FormDisplay = () => {
  const { formName } = useParams(); // Get form name from the URL
  const [formData, setFormData] = useState(null);

  const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    const name = xmlDoc.querySelector('form > name')?.textContent || 'Unnamed Form';

    const elements = Array.from(xmlDoc.querySelectorAll('elements > element')).map((el) => ({
      type: el.querySelector('type')?.textContent || 'text',
      label: el.querySelector('label')?.textContent || '',
      required: el.querySelector('required')?.textContent === 'true',
      placeholder: el.querySelector('placeholder')?.textContent || '',
      alignment: el.querySelector('alignment')?.textContent || 'center', // Extract alignment
    }));

    return { name, elements };
  };

  useEffect(() => {
    const data = localStorage.getItem(formName);
    if (data) {
      try {
        const parsedData = parseXML(data);
        setFormData(parsedData);
      } catch (error) {
        console.error('Error parsing XML:', error);
      }
    } else {
      console.error('Form not found:', formName);
    }
  }, [formName]);

  if (!formData) {
    return <h2>Form not found</h2>;
  }

  const renderElement = (element, index) => {
    const alignmentStyle = { textAlign: element.alignment, width: '100%' }; // Respect alignment

    switch (element.type) {
      case 'inputText':
        return (
          <div key={index} className="form-group" style={{ justifyContent: element.alignment }}>
            <input
              type="text"
              placeholder={element.placeholder}
              required={element.required}
              style={{ ...alignmentStyle, padding: '10px', borderRadius: '6px' }}
            />
          </div>
        );
      case 'email':
        return (
          <div key={index} className="form-group" style={{ justifyContent: element.alignment }}>
            <input
              type="email"
              placeholder={element.placeholder || 'Enter your email'}
              required={element.required}
              style={{ ...alignmentStyle, padding: '10px', borderRadius: '6px' }}
            />
          </div>
        );
      case 'password':
        return (
          <div key={index} className="form-group" style={{ justifyContent: element.alignment }}>
            <input
              type="password"
              placeholder={element.placeholder || 'Enter your password'}
              required={element.required}
              style={{ ...alignmentStyle, padding: '10px', borderRadius: '6px' }}
            />
          </div>
        );
      case 'button':
        return (
          <div key={index} className="form-group" style={{ textAlign: element.alignment }}>
            <button style={{ padding: '10px 20px', borderRadius: '6px' }}>{element.label}</button>
          </div>
        );
      case 'divider':
        return <hr key={index} className="form-divider" />;
      case 'file':
        return (
          <div key={index} className="form-group" style={{ justifyContent: element.alignment }}>
            <input type="file" />
          </div>
        );
      case 'number':
        return (
          <div key={index} className="form-group" style={{ justifyContent: element.alignment }}>
            <input type="number" required={element.required} />
          </div>
        );
      default:
        return (
          <div key={index} className="form-group" style={{ justifyContent: element.alignment }}>
            <input
              type="text"
              placeholder={element.placeholder}
              required={element.required}
            />
          </div>
        );
    }
  };

  return (
    <div className="form-container">
      <h2>{formData.name}</h2>
      <form>
        {formData.elements.map((element, index) => renderElement(element, index))}
      </form>
    </div>
  );
};

export default FormDisplay;
