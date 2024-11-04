// src/components/FormDisplay.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './FormDisplay.css';

// Move authInfo to the top so it's accessible globally
const authInfo = {
  token: 'YOUR_API_TOKEN',
  server: 'https://192.168.50.160',
};



const FormDisplay = () => {
  const { formName } = useParams(); // Get form name from the URL
  const [formData, setFormData] = useState(null);
  const [formValues, setFormValues] = useState({}); // Store user input

  const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    const name = xmlDoc.querySelector('form > name')?.textContent || 'Unnamed Form';
    const label = xmlDoc.querySelector('form > label')?.textContent || 'event_data';
  
    const elements = Array.from(xmlDoc.querySelectorAll('elements > element')).map((el) => {
      const optionsNode = el.querySelector('dropdownOptions');
      const options = optionsNode ? Array.from(optionsNode.querySelectorAll('option')).map(opt => opt.textContent) : [];
      
      return {
        type: el.querySelector('type')?.textContent || 'text',
        key: el.querySelector('key')?.textContent || '',
        label: el.querySelector('label')?.textContent || '',
        required: el.querySelector('required')?.textContent === 'true',
        placeholder: el.querySelector('placeholder')?.textContent || '',
        alignment: el.querySelector('alignment')?.textContent || 'center',
        options: options
      };
    });
  
    return { name, label, elements };
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

  const handleInputChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = (key, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormValues((prev) => ({ ...prev, [`file_${key}`]: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    try {
      const containerResponse = await createContainer(formData.name, formData.label);
      const containerId = containerResponse.id;

      // Add artifacts for each form field
      const aggregatedCEF = { ...formValues };
      await addArtifact(containerId, aggregatedCEF, `${formData.name} Artifact`);

      alert('Form submitted and data sent to Splunk SOAR successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form data to Splunk SOAR.');
    }
  };

  const createContainer = async (name, label) => {
    const { token, server } = authInfo;
    const response = await fetch(`${server}/rest/container`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ph-auth-token': token,
      },
      body: JSON.stringify({
        name,
        label,
        description: `${name} container created via API`,
      }),
    });
    if (!response.ok) throw new Error('Failed to create container');
    return response.json();
  };

  const addArtifact = async (containerId, cefData, artifactName) => {
    const { token, server } = authInfo;
    const response = await fetch(`${server}/rest/artifact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ph-auth-token': token,
      },
      body: JSON.stringify({
        container_id: containerId,
        cef: cefData, // Aggregated form data
        name: artifactName,
        label: 'event_data',
        description: 'Artifact created via API with aggregated form data',
      }),
    });
    if (!response.ok) throw new Error('Failed to add artifact');
    return response.json();
  };

  if (!formData) {
    return <h2>Form not found</h2>;
  }

  const renderElement = (element, index) => {
    switch (element.type) {
      case 'boolean':
        return (
          <div key={index} className="form-group" style={{ textAlign: element.alignment, marginBottom: '15px' }}>
            {element.label && (
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: element.alignment,
                }}
              >
                {element.label}
              </label>
            )}
            <select
              required={element.required}
              onChange={(e) => handleInputChange(element.key, e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', width: '100%', maxWidth: '400px' }}
            >
              <option value="">Select an option</option>
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        );
      case 'dateTime':
        return (
          <div key={index} className="form-group" style={{ textAlign: element.alignment, marginBottom: '15px' }}>
            {element.label && (
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: element.alignment,
                }}
              >
                {element.label}
              </label>
            )}
            <input
              type="datetime-local"
              placeholder={element.placeholder}
              required={element.required}
              onChange={(e) => handleInputChange(element.key, e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', width: '100%', maxWidth: '400px' }}
            />
          </div>
        );
      case 'number':
        return (
          <div key={index} className="form-group" style={{ textAlign: element.alignment, marginBottom: '15px' }}>
            {element.label && (
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: element.alignment,
                }}
              >
                {element.label}
              </label>
            )}
            <input
              type="number"
              placeholder={element.placeholder}
              required={element.required}
              onChange={(e) => handleInputChange(element.key, e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', width: '100%', maxWidth: '400px' }}
            />
          </div>
        );
      case 'dropdown':
        return (
          <div key={index} className="form-group" style={{ textAlign: element.alignment, marginBottom: '15px' }}>
            {element.label && (
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: element.alignment,
                }}
              >
                {element.label}
              </label>
            )}
            <select
              required={element.required}
              onChange={(e) => handleInputChange(element.key, e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', width: '100%', maxWidth: '400px' }}
            >
              <option value="">Select an option</option>
              {element.options.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      case 'divider':
        return (
          <hr key={index} className="form-divider" style={{ width: '100%', borderTop: '1px solid #444', margin: '20px 0' }} />
        );
      case 'button':
        if (element.key === 'Submit') {
          return null; // Do not render this button here, as we will use the form's submit button instead
        }
        return (
          <div key={index} className="form-group" style={{ textAlign: element.alignment, marginBottom: '15px' }}>
            <button
              type="button"
              onClick={() => alert(`${element.label} button clicked!`)}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {element.label || 'Button'}
            </button>
          </div>
        );
      case 'text':
        return (
          <div key={index} className="form-group" style={{ textAlign: element.alignment, marginBottom: '15px' }}>
            {element.label && (
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: element.alignment,
                }}
              >
                {element.label}
              </label>
            )}
          </div>
        );
      case 'heading':
        return (
          <div key={index} className="form-group" style={{ textAlign: element.alignment, marginBottom: '15px' }}>
            {element.label && (
              <h1
                style={{
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: element.alignment,
                }}
              >
                {element.label}
              </h1>
            )}
          </div>
        );
      case 'file':
        return (
          <div key={index} className="form-group" style={{ textAlign: element.alignment, marginBottom: '15px' }}>
            {element.label && (
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: element.alignment,
                }}
              >
                {element.label}
              </label>
            )}
            <input
              type="file"
              required={element.required}
              onChange={(e) => handleFileChange(element.key, e.target.files[0])}
              style={{ padding: '10px', borderRadius: '6px', width: '100%', maxWidth: '400px' }}
            />
          </div>
        );
      default:
        return (
          <div key={index} className="form-group" style={{ textAlign: element.alignment, marginBottom: '15px' }}>
            {element.label && (
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  textAlign: element.alignment,
                }}
              >
                {element.label}
              </label>
            )}
            <input
              type={element.type}
              placeholder={element.placeholder}
              required={element.required}
              onChange={(e) => handleInputChange(element.key, e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', width: '100%', maxWidth: '400px' }}
            />
          </div>
        );
    }
  };

  return (
    <div className="form-container">
      <h2>{formData.name}</h2>
      <form onSubmit={handleSubmit} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {formData.elements.map((element, index) => renderElement(element, index))}
        <button
          type="submit"
          id="submit-button"
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            marginTop: '20px',
            maxWidth: '400px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            float: 'right',
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default FormDisplay;
