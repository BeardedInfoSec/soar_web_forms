// src/components/FormDisplay.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './FormDisplay.css';

// Initial hardcoded authInfo
let authInfo = {
    token: '',
    server: '',
    sslVerification: true, // Default to true; will be updated from the configuration
};


const FormDisplay = () => {
    const { formName } = useParams(); // Get form name from the URL
    const [formData, setFormData] = useState(null);
    const [formValues, setFormValues] = useState({}); // Store user input

    // Function to fetch auth info from the configuration table
    const fetchAuthInfo = async () => {
        try {
            const response = await fetch('http://localhost:5050/api/configuration'); // Call the API endpoint
            if (!response.ok) {
                throw new Error('Failed to fetch auth info');
            }
            const data = await response.json();
            // Update authInfo with fetched values
            authInfo = {
                token: data.ph_auth_token,
                server: data.server,
            };
        } catch (error) {
            console.error('Error fetching auth info:', error);
        }
    };

    useEffect(() => {
        fetchAuthInfo(); // Fetch auth info when the component mounts
    }, []);

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
        const fetchFormData = async () => {
            try {
                const response = await fetch(`http://localhost:5050/forms/${encodeURIComponent(formName)}`, {
                    headers: {
                        'Authorization': `Bearer ${authInfo.token}`, // Use the updated token
                        'Content-Type': 'application/json',
                    },
                });

                // Log the response for debugging
                const responseText = await response.text();

                // Check if response is valid JSON
                if (!response.ok) {
                    throw new Error('Form not found');
                }

                const data = JSON.parse(responseText); // Attempt parsing only if the response is correct
                if (data.xml_data) {
                    const parsedData = parseXML(data.xml_data);
                    setFormData(parsedData);
                } else {
                    console.error('No XML data found in the response');
                }
            } catch (error) {
                console.error('Error fetching form data:', error);
            }
        };

        fetchFormData();
    }, [formName]);

    const handleInputChange = (key, value) => {
        setFormValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (key, file) => {
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        setFormValues(prev => ({
          ...prev,
          [`file_${key}`]: e.target.result, // base64 data URL
          [`file_name_${key}`]: file.name,
          [`file_size_${key}`]: file.size,
          [`file_type_${key}`]: file.type,
          [`file_lastmod_${key}`]: file.lastModified
        }));
      };
      reader.readAsDataURL(file);
    };


const handleSubmit = async (event) => {
  event.preventDefault(); // Prevent default form submission
  try {
    const containerResponse = await createContainer(formData.name, formData.label);
    const containerId = containerResponse.id;
    console.log('✅ Container created successfully:', containerResponse);

    // Aggregate all non-file form values into one artifact
    const aggregatedCEF = Object.keys(formValues).reduce((acc, key) => {
      if (!key.startsWith('file_')) {
        acc[key] = formValues[key];
      }
      return acc;
    }, {});

    if (Object.keys(aggregatedCEF).length > 0) {
      const artifactResponse = await addArtifact(containerId, aggregatedCEF, `${formData.name} Artifact`);
      console.log('✅ Artifact added successfully:', artifactResponse);
    }


// ✅ Upload each file and add corresponding metadata
const uploadedBaseKeys = new Set();

for (const key of Object.keys(formValues)) {
  if (
    key.startsWith('file_') &&
    !key.startsWith('file_name_') &&
    !key.startsWith('file_size_') &&
    !key.startsWith('file_type_') &&
    !key.startsWith('file_lastmod_')
  ) {
    const baseKey = key.replace('file_', '');
    if (uploadedBaseKeys.has(baseKey)) continue;
    uploadedBaseKeys.add(baseKey);

    const fileData = formValues[`file_${baseKey}`];
    const fileName = formValues[`file_name_${baseKey}`];
    const fileType = formValues[`file_type_${baseKey}`];
    const fileSize = formValues[`file_size_${baseKey}`];

    if (fileData && fileName) {
      try {
        const fileResponse = await uploadFileToVault(containerId, fileData, fileName);
        console.log('✅ File uploaded:', fileResponse);

        const metadata = {
          hash: fileResponse.hash,
          filename: fileName,
          filetype: fileType,
          filesize: `${(fileSize / 1024).toFixed(2)} KB`,
        };

        const metaResponse = await addArtifact(containerId, metadata, `${fileName} Metadata`);
        console.log('✅ File metadata added:', metaResponse);
      } catch (err) {
        console.error(`❌ Upload failed for ${fileName}:`, err);
      }
    } else {
      console.warn(`⚠️ Skipping ${baseKey} – missing file data`);
    }
  }
}


    alert('✅ Form submitted and data sent to Splunk SOAR successfully!');
  } catch (error) {
    console.error('❌ Error submitting form:', error);
    alert('❌ Failed to submit form data to Splunk SOAR.');
  }
};


    const createContainer = async (name, label) => {
        const response = await fetch('http://localhost:3001/proxy/rest/container', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name,
                label,
                description: `${name} container created via API`,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to create container:', errorText);
            throw new Error('Failed to create container');
        }
        return response.json();
    };
    
    const addArtifact = async (containerId, cefData, artifactName) => {
        const response = await fetch('http://localhost:3001/proxy/rest/artifact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                container_id: containerId,
                cef: cefData,
                name: artifactName,
                label: 'event_data',
                description: 'Artifact created via API with aggregated form data',
            }),
        });

        const rawText = await response.text(); // Read raw first

        if (!response.ok) {
            console.error('❌ Artifact response not ok:', rawText);
            throw new Error(`Failed to add artifact: ${response.status}`);
        }

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (err) {
            console.error('❌ Failed to parse artifact JSON:', rawText);
            throw new Error('Invalid JSON in artifact response');
        }
    };


    const uploadFileToVault = async (containerId, fileData, fileName) => {
        const response = await fetch('http://localhost:3001/proxy/rest/container_attachment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                container_id: containerId,
                file_content: fileData.split(',')[1], // Remove the base64 prefix
                file_name: fileName,
            }),
        });

        const rawText = await response.text(); // Get raw response for debugging

        if (!response.ok) {
            console.error('❌ Vault upload failed. Raw response:', rawText);
            throw new Error(`Failed to upload the file to the vault: ${response.status}`);
        }

        try {
            const data = JSON.parse(rawText);
            return data;
        } catch (err) {
            console.error('❌ Failed to parse vault upload JSON:', rawText);
            throw new Error('Invalid JSON in vault upload response');
        }
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
                            type="date"
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
                <div className="form-group" style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button
                        type="submit"
                        id="submit-button"
                        style={{
                            padding: '10px 20px',
                            borderRadius: '6px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: formData?.alignment || 'center',
                        }}
                    >
                        Submit
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormDisplay;