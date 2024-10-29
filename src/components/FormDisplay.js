// src/components/FormDisplay.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './FormDisplay.css';

// Global authInfo for Splunk SOAR API
const authInfo = {
  token: '+KATK0NWh3VQT1EAMK6fwmfx+1sz9Oo3hNdeAXff1VA=',
  server: 'https://192.168.50.160',
};

const FormDisplay = () => {
  const { formName } = useParams(); // Get form name from the URL
  const [formData, setFormData] = useState(null);
  const [formValues, setFormValues] = useState({}); // Store user input

  // Helper function to parse XML data from local storage
  const parseXML = (xmlString) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
    const name = xmlDoc.querySelector('form > name')?.textContent || 'Unnamed Form';
    const label = xmlDoc.querySelector('form > label')?.textContent || 'event_data';

    const elements = Array.from(xmlDoc.querySelectorAll('elements > element')).map((el) => ({
      type: el.querySelector('type')?.textContent || 'text',
      key: el.querySelector('key')?.textContent || '',
      label: el.querySelector('label')?.textContent || '',
      required: el.querySelector('required')?.textContent === 'true',
      placeholder: el.querySelector('placeholder')?.textContent || '',
      alignment: el.querySelector('alignment')?.textContent || 'center',
    }));

    return { name, label, elements };
  };

  // Load form data from local storage when the component mounts
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

  // Handle input changes and store the values in state
  const handleInputChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior
    try {
      // Create a new container in Splunk SOAR
      const containerResponse = await createContainer(formData.name, formData.label);
      const containerId = containerResponse.id;

      // Aggregate all form values into a single CEF object
      const aggregatedCEF = { ...formValues };

      // Create a single artifact with the aggregated data
      await addArtifact(containerId, aggregatedCEF, `${formData.name} Artifact`);

      alert('Form submitted and data sent to Splunk SOAR successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form data to Splunk SOAR.');
    }
  };

  // Render message if the form is not found
  if (!formData) {
    return <h2>Form not found</h2>;
  }

  // Render form elements dynamically based on the XML data
  const renderElement = (element, index) => (
    <div key={index} className="form-group" style={{ textAlign: element.alignment }}>
      <label>{element.label}</label>
      <input
        type={element.type}
        placeholder={element.placeholder}
        required={element.required}
        onChange={(e) => handleInputChange(element.key, e.target.value)}
        style={{ padding: '10px', borderRadius: '6px', width: '100%' }}
      />
    </div>
  );

  return (
    <div className="form-container">
      <h2>{formData.name}</h2>
      <form onSubmit={handleSubmit}>
        {formData.elements.map((element, index) => renderElement(element, index))}
        <button type="submit" style={{ padding: '10px 20px', borderRadius: '6px' }}>
          Submit
        </button>
      </form>
    </div>
  );
};

// Function to create a container in Splunk SOAR
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

// Function to add an artifact to a container in Splunk SOAR
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

export default FormDisplay;
