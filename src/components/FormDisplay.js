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
            const response = await fetch('http://localhost:5001/api/configuration'); // Call the API endpoint
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
            const type = el.querySelector('type')?.textContent || 'text';
            const optionsNode = el.querySelector('dropdownOptions');
            const options = optionsNode ? Array.from(optionsNode.querySelectorAll('option')).map(opt => opt.textContent) : [];
    
            // Extract CSV data if present
            const csvData = Array.from(el.querySelectorAll('settings > csvData > row')).map(row =>
                Array.from(row.querySelectorAll('cell')).map(cell => cell.textContent)
            );
    
            return {
                type,
                key: el.querySelector('key')?.textContent || '',
                label: el.querySelector('label')?.textContent || '',
                required: el.querySelector('required')?.textContent === 'true',
                placeholder: el.querySelector('placeholder')?.textContent || '',
                alignment: el.querySelector('alignment')?.textContent || 'center',
                options: options,
                settings: {
                    csvData: csvData.length > 0 ? csvData : [] // Ensure csvData is set correctly
                }
            };
        });
    
        return { name, label, elements };
    };
    

    useEffect(() => {
        const fetchFormData = async () => {
            try {
                const response = await fetch(`http://localhost:5001/forms/${encodeURIComponent(formName)}`, {
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
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFormValues((prev) => ({
                    ...prev,
                    [`file_${key}`]: e.target.result, // Store base64 encoded file
                    [`file_name_${key}`]: file.name,
                    [`file_path_${key}`]: file.webkitRelativePath || file.name,
                    [`file_size_${key}`]: file.size,
                    [`file_type_${key}`]: file.type,
                    [`file_last_modified_${key}`]: new Date(file.lastModified).toISOString(),
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault(); // Prevent default form submission
        try {
            const containerResponse = await createContainer(formData.name, formData.label);
            const containerId = containerResponse.id;
            console.log('Container created successfully:', containerResponse);
    
            // Add artifacts for each form field and table data
            const aggregatedCEF = {};
            formData.elements.forEach((element) => {
                if (element.type === 'table' && element.settings.csvData) {
                    // Extract headers and transpose data by columns
                    const headers = element.settings.csvData[0];
                    const columns = headers.reduce((acc, header, colIndex) => {
                        acc[header] = element.settings.csvData.slice(1).map(row => row[colIndex]).filter(cell => cell !== undefined && cell !== '');
                        return acc;
                    }, {});
    
                    // Merge column data into the aggregated CEF
                    Object.assign(aggregatedCEF, columns);
                } else if (!element.type.startsWith('file') && formValues[element.key] !== undefined) {
                    // Include non-file form data
                    aggregatedCEF[element.key] = formValues[element.key];
                }
            });
    
            if (Object.keys(aggregatedCEF).length > 0) {
                const artifactResponse = await addArtifact(containerId, aggregatedCEF, `${formData.name} Artifact`);
                console.log('Artifact added successfully:', artifactResponse);
            }
    
            // Upload files to the vault and add file metadata as artifacts
            for (const key in formValues) {
                if (key.startsWith('file_')) {
                    const fileData = formValues[key];
                    const fileNameKey = `file_name_${key.split('_')[1]}`;
                    const fileName = formValues[fileNameKey];
                    const fileType = formValues[`file_type_${key.split('_')[1]}`];
                    const fileSize = formValues[`file_size_${key.split('_')[1]}`];
                    const fileSizeInKB = (fileSize / 1024).toFixed(2);
                    const fileSizeFormatted = fileSizeInKB > 1024 ? `${(fileSizeInKB / 1024).toFixed(2)} MB` : `${fileSizeInKB} KB`;
    
                    if (fileData && fileName) {
                        const fileResponse = await uploadFileToVault(containerId, fileData, fileName);
                        console.log('File uploaded successfully:', fileResponse);
    
                        // Add file metadata as artifact
                        const fileArtifactData = {
                            hash: fileResponse.hash,
                            filename: fileName,
                            filetype: fileType,
                            filesize: fileSizeFormatted,
                        };
                        const fileArtifactResponse = await addArtifact(containerId, fileArtifactData, `${fileName} Metadata Artifact`);
                        console.log('File metadata artifact added successfully:', fileArtifactResponse);
                    } else {
                        console.error('Missing file data or file name for:', key);
                    }
                }
            }
    
            alert('Form submitted and data sent to Splunk SOAR successfully!');
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Failed to submit form data to Splunk SOAR.');
        }
    };
    
    
    const createContainer = async (name, label) => {
        const response = await fetch(`${authInfo.server}/rest/container`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ph-auth-token': authInfo.token,
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
        const response = await fetch(`${authInfo.server}/rest/artifact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ph-auth-token': authInfo.token,
            },
            body: JSON.stringify({
                container_id: containerId,
                cef: cefData, // Aggregated form data
                name: artifactName,
                label: 'event_data',
                description: 'Artifact created via API with aggregated form data',
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to add artifact:', errorText);
            throw new Error('Failed to add artifact');
        }
        return response.json();
    };

    const uploadFileToVault = async (containerId, fileData, fileKey) => {
        const response = await fetch(`${authInfo.server}/rest/container_attachment`, {
            method: 'POST',
            headers: {
                'ph-auth-token': authInfo.token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                container_id: containerId,
                file_content: fileData.split(',')[1], // Extract base64 content
                file_name: fileKey,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to upload the file to the vault:', errorText);
            throw new Error('Failed to upload the file to the vault');
        }
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

        case 'table':
            const tableData = element.settings?.csvData || [];

            if (!Array.isArray(tableData) || tableData.length === 0) {
                return (
                    <div key={index} className="form-group" style={{ textAlign: element.alignment, marginBottom: '15px' }}>
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
                        <div>No CSV data to display</div>
                    </div>
                );
            }

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
                    <table className="csv-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {Array.isArray(tableData[0]) && tableData[0].map((header, headerIndex) => (
                                    <th key={headerIndex} style={{ border: '1px solid #ccc', padding: '8px', backgroundColor: '#333', color: '#fff' }}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.slice(1).map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {Array.isArray(row) && row.map((cell, cellIndex) => (
                                        <td key={cellIndex} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
