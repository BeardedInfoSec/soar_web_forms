import React, { useState, useRef, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import Papa from 'papaparse';
import './FormBuilder.css';

const ELEMENT_TYPES = [
  { id: 'heading', label: 'Heading' },
  { id: 'text', label: 'Text' },
  { id: 'divider', label: 'Divider' },
  //{ id: 'button', label: 'Button' },
  //{ id: 'image', label: 'Image' },
  { id: 'table', label: 'Table' }
];

const INPUT_FIELDS = [
  { id: 'inputText', label: 'Input Text', type: 'text' },
  { id: 'email', label: 'Email', type: 'email' },
  //{ id: 'password', label: 'Password', type: 'password' }, 
  { id: 'dateTime', label: 'Date or Time', type: 'datetime-local' },
  { id: 'dropdown', label: 'Dropdown', type: 'dropdown' },
  { id: 'boolean', label: 'Boolean', type: 'dropdown' },
  { id: 'number', label: 'Number', type: 'number' },
  { id: 'file', label: 'File Upload', type: 'file' }

];

const FormBuilder = () => {
  const [formElements, setFormElements] = useState([]);
  const [formName, setFormName] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formTags, setFormTags] = useState('');
  const [savedForms, setSavedForms] = useState([]); // Add state to store list of saved forms
  const [selectedForm, setSelectedForm] = useState(''); // Add state to track selected form
  const [selectedElement, setSelectedElement] = useState(null);
  const [draftSettings, setDraftSettings] = useState(null);
  const [draggingElement, setDraggingElement] = useState(null);
  const formContainerRef = useRef(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const SUBMIT_BUTTON_ID = 'submit-button';
  const [formToLoad, setFormToLoad] = useState(null); // Hold the form name to load after clearing
  

useEffect(() => {
  console.log('Form Elements Updated:', formElements);
  const tableElement = formElements.find((el) => el.type === 'table');
  if (tableElement) {
    console.log('Table Element Found:', tableElement);
    console.log('CSV Data in State:', tableElement.settings.csvData);
  }
}, [formElements]);

useEffect(() => {
  if (!formElements.some(el => el.id === SUBMIT_BUTTON_ID)) {
    addSubmitButton();
  }
}, [formElements]);

useEffect(() => {
  loadSavedForms();
}, []);


const loadSavedForms = async () => {
  try {
    const response = await fetch('http://localhost:5000/forms');
    if (!response.ok) {
      throw new Error(`Failed to fetch forms: ${response.status}`);
    }
    const data = await response.json();
    const loadedForms = data.map(form => ({
      id: form.id, // Ensure this is present
      name: form.name // Ensure this is present
    }));
    setSavedForms(loadedForms); // Set the forms to state
  } catch (error) {
    console.error('Error loading forms:', error);
  }
};


const loadForm = async () => {
  if (!selectedForm) {
    alert('Please select a form to load.');
    return;
  }

  // Clear existing elements before loading
  setFormElements([]);

  // Find the selected form by name
  const formToFetch = savedForms.find(form => form.name === selectedForm);
  if (!formToFetch) {
    alert(`No form found for the name "${selectedForm}"`);
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/forms/${formToFetch.id}`);
    if (!response.ok) {
      throw new Error(`Failed to load form: ${response.status}`);
    }
    const formData = await response.json();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(formData.xml_data, 'application/xml');
    const loadedName = xmlDoc.querySelector('form > name')?.textContent || '';
    const loadedLabel = xmlDoc.querySelector('form > label')?.textContent || '';
    const loadedTags = Array.from(xmlDoc.querySelectorAll('form > tags > tag')).map(tag => tag.textContent);

    const elements = Array.from(xmlDoc.querySelectorAll('elements > element')).map((el, index) => {
      const type = el.querySelector('type')?.textContent || 'text';
      const optionsNode = el.querySelector('dropdownOptions');
      const options = optionsNode ? Array.from(optionsNode.querySelectorAll('option')).map(opt => opt.textContent) : [];

      return {
        id: `element-${Date.now()}-${index}`, // Generate unique ID
        type,
        key: el.querySelector('key')?.textContent || '',
        label: el.querySelector('label')?.textContent || '',
        required: el.querySelector('required')?.textContent === 'true',
        alignment: el.querySelector('alignment')?.textContent || 'center',
        settings: {
          headerLevel: el.querySelector('headerLevel')?.textContent || 'h1',
          placeholder: el.querySelector('placeholder')?.textContent || '',
          dropdownOptions: options,
        }
      };
    }).filter(el => el.type !== 'button'); // Exclude submit button

    // Set new form data
    setFormName(loadedName);
    setFormLabel(loadedLabel);
    setFormTags(loadedTags.join(', '));
    setFormElements(elements);
    console.log(`Form "${selectedForm}" loaded successfully!`);
  } catch (error) {
    console.error('Error loading form:', error);
    alert('Failed to load form data.');
  }
};

const addSubmitButton = () => {
  setFormElements(prev => [
    ...prev,
    {
      id: SUBMIT_BUTTON_ID,
      type: 'button',
      key: 'Submit',
      label: 'Submit',
      alignment: 'center',
      required: false,
      settings: {},
    },
  ]);
};

  const generateKey = (type) => {
    const existingCount = formElements.filter((el) => el.type === type).length + 1;
    return `${type} ${existingCount}`; // Example: "inputText 1"
  };
  
  const addElement = (type) => {
    const newKey = generateKey(type); // Generate the key
    const newElement = {
      id: Date.now().toString(),
      type,
      key: newKey, // Assign the generated key
      label: type === 'heading' ? 'Heading' : type,
      alignment: 'center',
      settings: {
        headerLevel: 'h1',
        placeholder:
        type === 'email'
          ? 'Email Address'
          : type === 'password'
          ? 'Enter password'
          : 'Enter text here...',
        useCurrentDate: false,
        defaultBoolean: 'true',
        dropdownOptions: [],
        min: '',
        max: '',
        step: '',
        defaultValue: '',
        showPasswordOption: false,
        passwordLength: '',
        requireSymbols: false,
        requireNumbers: false,
        csvData: []
      },
      required: false,
      textColor: '#ffffff',
      fontFamily: 'Arial',
    };
  
    // Ensure new elements are added before the Submit button
    setFormElements((prev) => {
      const submitIndex = prev.findIndex((el) => el.id === SUBMIT_BUTTON_ID);
      const newFormElements = [...prev];
      newFormElements.splice(submitIndex, 0, newElement); // Insert new element before submit button
      return newFormElements;
    });
  };

  const isKeyUnique = (key) => {
    return !formElements.some((el) => el.key === key && el.id !== selectedElement?.id);
  };
  const handleSubmit = () => {
    const formData = formElements.filter(el => el.id !== SUBMIT_BUTTON_ID); // Exclude submit button from data
    console.log('Form submitted:', formData);

    // Example API call
    fetch('/api/submit-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ elements: formData }),
    })
      .then(response => response.json())
      .then(data => console.log('Form submission response:', data))
      .catch(error => console.error('Error submitting form:', error));
  };

  const handleImageUpload = (event, elementId) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target.result;
        setFormElements((prev) =>
          prev.map((el) =>
            el.id === elementId
              ? { ...el, settings: { ...el.settings, imageSrc } }
              : el
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };
  
  const saveForm = async () => {
    if (!formName) {
      alert('Please enter a name for the form.');
      return;
    }

    const formData = {
      name: formName,
      label: formLabel,
      tags: formTags ? formTags.split(',').map(tag => tag.trim()) : [],
      elements: formElements,
    };

    // Convert form data to XML
    const convertToXML = (obj) => {
      let xml = '';
      for (let key in obj) {
        if (Array.isArray(obj[key])) {
          xml += `<${key}>`;
          obj[key].forEach((element) => {
            xml += `<element>${convertToXML(element)}</element>`;
          });
          xml += `</${key}>`;
        } else if (typeof obj[key] === 'object') {
          xml += `<${key}>${convertToXML(obj[key])}</${key}>`;
        } else {
          xml += `<${key}>${obj[key]}</${key}>`;
        }
      }
      return xml;
    };

    const xmlData = `<form>${convertToXML(formData)}</form>`;

    // Store form data in the PostgreSQL backend
    try {
      const response = await fetch('http://localhost:5000/save_form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formName,
          label: formLabel,
          tags: formTags ? formTags.split(',').map(tag => tag.trim()) : [],
          elements: formElements,
          xmlData: xmlData // Include XML data in the request
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save form: ${response.status} ${response.statusText}`);
      }

      alert(`Form "${formName}" saved successfully!`);
      localStorage.setItem(formName, xmlData); // Still save to local storage
      
      // Call loadSavedForms to refresh the dropdown
      loadSavedForms(); // Automatically refresh the dropdown after saving

    } catch (error) {
      console.error('Error:', error);
      alert(`Error saving form: ${error.message}`);
    }
  };

  
  
  const removeElement = (id) => {
    if (id === SUBMIT_BUTTON_ID) return; // Prevent deletion of the Submit button
    setFormElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  };

  const handleEditClick = (element) => {
    setSelectedElement(element);
    setDraftSettings({
      ...element.settings,
      key: element.key || '',  // Populate the key value properly
      label: element.label,
      alignment: element.alignment,
      required: element.required,
      placeholder: element.settings?.placeholder,
      isValid: element.settings?.isValid,
      useCurrentDate: element.settings?.useCurrentDate,
      defaultBoolean: element.settings?.defaultBoolean,
      min: element.settings?.min,
      max: element.settings?.max,
      step: element.settings?.step,
      defaultValue: element.settings?.defaultValue,
      showPasswordOption: element.settings?.showPasswordOption,
      passwordLength: element.settings?.passwordLength,
      requireSymbols: element.settings?.requireSymbols,
      requireNumbers: element.settings?.requireNumbers,
      csvData: element.settings?.csvData || [],
    });
  };
  
  const applyDraftChanges = () => {
    if (selectedElement && draftSettings) {
      if (isKeyUnique(draftSettings.key)) {
        updateElementSettings(selectedElement.id, {
          ...draftSettings,
          key: draftSettings.key,  // Update the key
        });
        setSelectedElement(null);
        setDraftSettings(null);
      } else {
        alert('The key must be unique. Please choose another.');
      }
    }
  };
  
  const cancelChanges = () => {
    setSelectedElement(null);
    setDraftSettings(null);
  };

  const updateElementSettings = (id, newSettings) => {
    setFormElements((prev) =>
      prev.map((el) =>
        el.id === id.toString()
          ? {
              ...el,
              ...newSettings,
              settings: {
                ...el.settings,
                ...newSettings,
              },
            }
          : el
      )
    );
  };
  
  const handleDragStart = ({ active }) => {
    setDraggingElement(active.id);
  };

  const handleDragEnd = ({ active, over }) => {
    if (over && active.id !== over.id) {
      const oldIndex = formElements.findIndex((el) => el.id === active.id);
      const newIndex = formElements.findIndex((el) => el.id === over.id);
      setFormElements((prev) => arrayMove(prev, oldIndex, newIndex));
    }
    setDraggingElement(null);
  };

  const handleCSVUpload = (event, elementId) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        alert('Please upload a valid .csv file.');
        return;
      }
      setSelectedFileName(file.name); // Update the selected file name
      Papa.parse(file, {
        complete: (result) => {
          const csvData = result.data;
          console.log('Parsed CSV Data:', csvData);
  
          setFormElements((prev) =>
            prev.map((el) =>
              el.id === elementId
                ? { ...el, settings: { ...el.settings, csvData } }
                : el
            )
          );
        },
        header: false,
      });
    }
  };
  
  const handleResetForm = () => {
    if (window.confirm('Are you sure you want to reset the form?')) {
      setFormElements([]);
    }
  };

  const validatePassword = (password, settings) => {
    if (settings?.passwordLength && password.length < settings.passwordLength) {
      return false;
    }
    if (settings?.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false;
    }
    if (settings?.requireNumbers && !/[0-9]/.test(password)) {
      return false;
    }
    return true;
  };

  const renderElementContent = (element) => {
    const isBeingEdited = selectedElement?.id === element.id;
    const settings = isBeingEdited ? draftSettings : element.settings;
  
    const alignmentStyle = {
      textAlign: settings?.alignment || 'center',
    };
  
    // Use the element key as the default label if the label isn't set
    const displayLabel = settings?.label || element.key || element.label;
  
    switch (element.type) {
      case 'heading': {
        const HeaderTag = settings?.headerLevel || 'h1';
        const alignmentStyle = { 
          textAlign: settings?.alignment || 'center', 
          width: '100%', 
          margin: '0 auto'  // Ensures it's centered
        };
      
        return (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <HeaderTag style={alignmentStyle}>
              {settings?.label || element.label}
            </HeaderTag>
          </div>
        );
      }      
      case 'text':
        return <p style={alignmentStyle}>{displayLabel}</p>;
      case 'button':
        return (
          <div style={{ display: 'flex', justifyContent: element.alignment || 'center', width: '100%' }}>
            <button
              onClick={element.id === SUBMIT_BUTTON_ID ? handleSubmit : undefined} // Submit button triggers API
              className="custom-button"
              style={{ padding: '10px 20px', borderRadius: '6px', margin: '5px', backgroundColor: '#007bff', color: 'white' }}
            >
              {element.label}
            </button>
          </div>
        );
      case 'inputText':
        return (
          <div style={{ display: 'flex', justifyContent: settings?.alignment || 'center', width: '100%' }}>
            <input
              type="text"
              placeholder={settings?.placeholder || displayLabel}
              required={settings?.required}
              style={{
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #ced4da',
                textAlign: 'center',
              }}
            />
          </div>
        );
      case 'email':
        return (
          <div style={{ display: 'flex', justifyContent: settings?.alignment || 'center', width: '100%' }}>
            <input
              type="email"
              placeholder={settings?.placeholder || 'Email Address'}
              required={settings?.required}
              style={{
                borderRadius: '8px',
                padding: '10px',
                border: settings?.isValid === false ? '2px solid #ff0000' : '1px solid #ced4da',
                boxShadow: settings?.isValid === false ? '0 0 5px #ff0000' : 'none',
                textAlign: 'center'
              }}
              onBlur={(e) => {
                if (e.target.value.trim() !== '') {
                  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
                  updateElementSettings(element.id, { ...settings, isValid });
                }
              }}
            />
            {!settings?.isValid && settings?.isValid !== undefined && (
              <span style={{ color: '#ff0000', fontSize: '0.8em', marginTop: '5px' }}>Invalid email address</span>
            )}
          </div>
        );
      case 'divider':
        return <hr style={{ ...alignmentStyle, width: '100%' }} />;
      case 'image':
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <label className="custom-file-label">
                Choose Image
                <input
                  type="file"
                  className="custom-file-input"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, element.id)}
                />
              </label>
              {settings?.imageSrc ? (
                <img
                  src={settings.imageSrc}
                  alt="Uploaded"
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', marginTop: '10px' }}
                />
              ) : (
                <img
                  src="https://via.placeholder.com/150"
                  alt="Placeholder"
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', marginTop: '10px' }}
                />
              )}
            </div>
          );       
      case 'file':
          return (
            <div style={{ display: 'flex', justifyContent: settings?.alignment || 'center', width: '100%' }}>
              <label className="custom-file-label">
                Upload File
                <input
                  type="file"
                  className="custom-file-input"
                  onChange={(e) => handleCSVUpload(e, element.id)}
                  accept=".csv"
                />
              </label>
              <span className="file-name">No file chosen</span>
            </div>
          );
      case 'table':
          const tableData = element.settings?.csvData || [];
          console.log('Rendering Table with Data:', tableData);
    
          return (
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div>
                {/* Styled file input and label */}
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="file"
                    accept=".csv"
                    id={`file-upload-${element.id}`}
                    onChange={(e) => handleCSVUpload(e, element.id)}
                    style={{ display: 'none' }} // Hide default input
                  />
                  <label
                    htmlFor={`file-upload-${element.id}`}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-block',
                    }}
                  >
                    Upload CSV File
                  </label>
                  <span style={{ marginLeft: '10px' }}>
                    {selectedFileName || 'No file chosen'}
                  </span>
                </div>
    
                <table style={{ margin: '0 auto', borderCollapse: 'collapse', width: '100%' }}>
                  <tbody>
                    {tableData.length > 0 ? (
                      tableData.map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={`cell-${rowIndex}-${cellIndex}`}
                              style={{ border: '1px solid #ddd', padding: '8px' }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td style={{ textAlign: 'center' }}>No Data Available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
      case 'dateTime':
      return (
        <div style={{ display: 'flex', justifyContent: settings?.alignment || 'center', width: '100%' }}>
          {settings?.useCurrentDate ? (

            <input
              type="text"
              value={new Date().toLocaleDateString('en-US')}
              readOnly
              style={{
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #ced4da',
                textAlign: 'center'
              }}
            />
          ) : (
            <input
              type="date"
              style={{
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #ced4da',
                textAlign: 'center'
              }}
            />
          )}
        </div>
      );    
      case 'dropdown':
        return (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <select
              style={{
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #ced4da',
                textAlign: 'center',
              }}
            >
              <option value="">Select an option</option>
              {settings?.dropdownOptions?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );    
      case 'boolean':
        return (
          <div style={{ display: 'flex', justifyContent: settings?.alignment || 'center', width: '100%' }}>
            <select
              value={settings?.defaultBoolean || 'true'}
              onChange={(e) => updateElementSettings(element.id, { ...settings, defaultBoolean: e.target.value })}
              style={{
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #ced4da',
                textAlign: 'center'
              }}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        );      
      case 'number':
        return (
          <div style={{ display: 'flex', justifyContent: settings?.alignment || 'center', width: '100%' }}>
            <input
              type="number"
              min={settings?.min}
              max={settings?.max}
              step={settings?.step}
              defaultValue={settings?.defaultValue}
              required={settings?.required}
              style={{
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #ced4da',
                textAlign: 'center'
              }}
            />
          </div>
        );
      case 'password':
      return (
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: settings?.alignment === 'left' ? 'flex-start' : settings?.alignment === 'right' ? 'flex-end' : 'center',
            justifyContent: 'center',
          }}
        >
          {/* Password Input Field and Show Password Option */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: settings?.alignment === 'left' ? 'flex-start' : settings?.alignment === 'right' ? 'flex-end' : 'center', width: '100%' }}>
            <input
              type={settings?.showPasswordOption && settings?.showPassword ? 'text' : 'password'}
              placeholder={settings?.placeholder || 'Enter password'}
              required={settings?.required}
              onBlur={(e) => {
                const isValid = validatePassword(e.target.value, settings);
                updateElementSettings(element.id, { ...settings, isValid });
              }}
              style={{
                borderRadius: '8px',
                padding: '10px',
                width: '300px', // Adjust the width as needed
                border: settings?.isValid === false ? '2px solid #ff0000' : '1px solid #ced4da',
                textAlign: 'left', // Ensures the placeholder text stays aligned left
                marginRight: '10px',
              }}
            />
            {settings?.showPasswordOption && (
              <label style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings?.showPassword || false}
                  onChange={(e) => updateElementSettings(element.id, { ...settings, showPassword: e.target.checked })}
                  style={{ marginRight: '5px' }}
                />
                Show Password
              </label>
            )}
          </div>
          {/* Password Requirements */}
          <div style={{ marginTop: '10px', textAlign: settings?.alignment || 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: settings?.alignment === 'left' ? 'flex-start' : settings?.alignment === 'right' ? 'flex-end' : 'center' }}>
            {settings?.passwordLength && <p style={{ marginBottom: '5px' }}>Requires Minimum Length: {settings.passwordLength}</p>}
            {settings?.requireSymbols && <p style={{ marginBottom: '5px' }}>Requires Symbols: Yes</p>}
            {settings?.requireNumbers && <p>Requires Numbers: Yes</p>}
          </div>
          {/* Validation Error */}
          {!settings?.isValid && settings?.isValid !== undefined && (
            <span style={{ color: '#ff0000', fontSize: '0.8em', marginTop: '5px' }}>Password does not meet requirements</span>
          )}
        </div>
      );
      default:
        return (
          <input
            type={element.type}
            placeholder={settings?.placeholder || displayLabel}
            required={settings?.required}
            style={alignmentStyle}
          />
        );
    }
  };
  
  const areRequiredFieldsFilled = () => {
    return formElements.every((el) => {
      if (el.required) {
        return el.settings.label && el.settings.label.trim() !== '';
      }
      return true;
    });
  };

  return (
    <div className="form-builder-container" style={{ height: '100vh', overflow: 'hidden' }}>
<div className="sidebar">


  {/* Form Name Input */}
  <div className="form-name-section" style={{ marginBottom: '20px' }}>
    <label htmlFor="form-name" className="sidebar-label">Form Name:</label>
    <input
      id="form-name"
      type="text"
      value={formName}
      onChange={(e) => setFormName(e.target.value)}
      placeholder="Enter form name"
      className="form-input"
    />
  </div>

  {/* Label Input (Required) */}
  <div className="form-label-section" style={{ marginBottom: '20px' }}>
    <label htmlFor="form-label" className="sidebar-label">Label (Required):</label>
    <input
      id="form-label"
      type="text"
      value={formLabel}
      onChange={(e) => setFormLabel(e.target.value)}
      placeholder="Enter form label"
      className="form-input"
    />
  </div>

  <div className="element-input-wrapper" style={{ display: 'flex', gap: '10px' }}>
    <div className="element-selector">
      <h4>Elements</h4>
      {ELEMENT_TYPES.map((element) => (
        <button
          key={element.id}
          onClick={() => addElement(element.id)}
          className="element-button"
        >
          {element.label}
        </button>
      ))}
    </div>

    <div className="input-selector">
      <h4>Input Fields</h4>
      {INPUT_FIELDS.map((input) => (
        <button
          key={input.id}
          onClick={() => addElement(input.id)}
          className="input-button"
        >
          {input.label}
        </button>
      ))}
    </div>
  </div>
  <div className="load-section" style={{ marginBottom: '20px' }}>
  <label htmlFor="saved-forms" className="sidebar-label">Load Saved Form:</label>
  <select
    id="saved-forms"
    value={selectedForm}
    onChange={(e) => setSelectedForm(e.target.value)}
    className="sidebar-select"
  >
    <option value="">-- Select a Form --</option>
    {savedForms.map((form) => (
      <option key={form.id} value={form.name}> {/* Ensure you're using form.name */}
        {form.name} {/* This should render a string */}
      </option>
    ))}
  </select>
  <button onClick={loadForm} className="load-form-button">Load Form</button>
</div>
  <button onClick={saveForm} className="save-form-button">Save Form</button>
  <button onClick={handleResetForm} className="reset-form-button">Reset Form</button>
</div>


      <div className="form-builder" ref={formContainerRef} style={{ height: '100%', overflowY: 'auto' }}>
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
        >
          <SortableContext items={formElements} strategy={rectSortingStrategy}>
            <div className="form-preview">
              {formElements.map((element) => (
                <SortableFormElement
                  key={element.id}
                  element={element}
                  handleEditClick={handleEditClick}
                  renderElementContent={renderElementContent}
                />
              ))}
            </div>
          </SortableContext>
          {draggingElement && (
            <DragOverlay>
              <div className="dragging-overlay">Dragging</div>
            </DragOverlay>
          )}
        </DndContext>
      </div>

      {selectedElement && (
        <div className="element-editor">
          <h3>Edit Element</h3>
          
          <label>
          Key:
          <input
            type="text"
            value={draftSettings?.key || ''}
            onChange={(e) =>
              setDraftSettings((prev) => ({ ...prev, key: e.target.value }))
            }
           />
          </label>
          <label>
            Label:
            <input
              type="text"
              value={draftSettings?.label || ''}
              onChange={(e) =>
                setDraftSettings((prev) => ({ ...prev, label: e.target.value }))
              }
            />
          </label>
          {selectedElement.type === 'heading' && (
            <label>
              Header Level:
              <select
                value={draftSettings?.headerLevel || 'h1'}
                onChange={(e) =>
                  setDraftSettings((prev) => ({
                    ...prev,
                    headerLevel: e.target.value,
                  }))
                }
              >
                <option value="h1">H1</option>
                <option value="h2">H2</option>
                <option value="h3">H3</option>
                <option value="h4">H4</option>
                <option value="h5">H5</option>
                <option value="h6">H6</option>
              </select>
            </label>
          )}
          <label>
            Alignment:
            <select
              value={draftSettings?.alignment || 'center'}
              onChange={(e) =>
                setDraftSettings((prev) => ({ ...prev, alignment: e.target.value }))
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          {(selectedElement.type === 'inputText' || selectedElement.type === 'email') && (
            <label>
              Placeholder Text:
              <input
                type="text"
                value={draftSettings?.placeholder || ''}
                onChange={(e) =>
                  setDraftSettings((prev) => ({ ...prev, placeholder: e.target.value }))
                }
              />
            </label>
          )}
          {selectedElement.type === 'dateTime' && (
            <label>
              Use Current Date:
              <input
                type="checkbox"
                checked={draftSettings?.useCurrentDate || false}
                onChange={(e) =>
                  setDraftSettings((prev) => ({ ...prev, useCurrentDate: e.target.checked }))
                }
              />
            </label>
          )}
          {selectedElement.type === 'dropdown' && (
          <>
            <label>Dropdown Options:</label>
            {draftSettings?.dropdownOptions?.map((option, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={option}
                  onChange={(e) =>
                    setDraftSettings((prev) => {
                      const updatedOptions = [...prev.dropdownOptions];
                      updatedOptions[idx] = e.target.value;
                      return { ...prev, dropdownOptions: updatedOptions };
                    })
                  }
                />
                <button
                  onClick={() =>
                    setDraftSettings((prev) => ({
                      ...prev,
                      dropdownOptions: prev.dropdownOptions.filter((_, i) => i !== idx),
                    }))
                  }
                  style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    color: 'white',
                    backgroundColor: 'red',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                 X
                </button>
              </div>
            ))}
<button
  onClick={() =>
    setDraftSettings((prev) => ({
      ...prev,
      dropdownOptions: [...(prev.dropdownOptions || []), ''],
    }))
  }
  className="add-option-button"
>
  +
</button>

          </>
        )}

          {selectedElement.type === 'boolean' && (
            <label>
              Default Boolean Value:
              <select
                value={draftSettings?.defaultBoolean || 'true'}
                onChange={(e) =>
                  setDraftSettings((prev) => ({ ...prev, defaultBoolean: e.target.value }))
                }
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </label>
          )}
          {selectedElement.type === 'number' && (
            <>
              <label>
                Minimum Value:
                <input
                  type="number"
                  value={draftSettings?.min || ''}
                  onChange={(e) =>
                    setDraftSettings((prev) => ({ ...prev, min: e.target.value }))
                  }
                />
              </label>
              <label>
                Maximum Value:
                <input
                  type="number"
                  value={draftSettings?.max || ''}
                  onChange={(e) =>
                    setDraftSettings((prev) => ({ ...prev, max: e.target.value }))
                  }
                />
              </label>
              <label>
                Step Value:
                <input
                  type="number"
                  value={draftSettings?.step || ''}
                  onChange={(e) =>
                    setDraftSettings((prev) => ({ ...prev, step: e.target.value }))
                  }
                />
              </label>
              <label>
                Default Value:
                <input
                  type="number"
                  value={draftSettings?.defaultValue || ''}
                  onChange={(e) =>
                    setDraftSettings((prev) => ({ ...prev, defaultValue: e.target.value }))
                  }
                />
              </label>
            </>
          )}
          {selectedElement.type === 'password' && (
            <>
              <label>
                Show Password Option:
                <input
                  type="checkbox"
                  checked={draftSettings?.showPasswordOption || false}
                  onChange={(e) =>
                    setDraftSettings((prev) => ({
                      ...prev,
                      showPasswordOption: e.target.checked,
                    }))
                  }
                />
              </label>
              <label>
                Minimum Password Length:
                <input
                  type="number"
                  value={draftSettings?.passwordLength || ''}
                  onChange={(e) =>
                    setDraftSettings((prev) => ({
                      ...prev,
                      passwordLength: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Requires Symbols:
                <input
                  type="checkbox"
                  checked={draftSettings?.requireSymbols || false}
                  onChange={(e) =>
                    setDraftSettings((prev) => ({
                      ...prev,
                      requireSymbols: e.target.checked,
                    }))
                  }
                />
              </label>
              <label>
                Requires Numbers:
                <input
                  type="checkbox"
                  checked={draftSettings?.requireNumbers || false}
                  onChange={(e) =>
                    setDraftSettings((prev) => ({
                      ...prev,
                      requireNumbers: e.target.checked,
                    }))
                  }
                />
              </label>
            </>
          )}
          <button
            onClick={applyDraftChanges}
            className="save-changes custom-button"
            style={{
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              textAlign: 'center',
              fontSize: '16px',
              cursor: 'pointer',
              margin: '5px',
              borderRadius: '6px'
            }}
            disabled={!areRequiredFieldsFilled()}
          >
            Save Changes
          </button>
          <button
            onClick={cancelChanges}
            className="cancel-button custom-button"
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              textAlign: 'center',
              fontSize: '16px',
              cursor: 'pointer',
              margin: '5px',
              borderRadius: '6px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this element?')) {
                removeElement(selectedElement.id);
              }
            }}
            className="delete-element custom-button"
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              textAlign: 'center',
              fontSize: '16px',
              cursor: 'pointer',
              margin: '5px',
              borderRadius: '6px'
            }}
          >
            Delete Element
          </button>         
        </div>
      )}
    </div>
  );
};

const SortableFormElement = ({ element, handleEditClick, renderElementContent }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: element.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    backgroundColor: element.settings?.backgroundColor || 'inherit',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="form-element"
      onClick={() => handleEditClick(element)}
    >
      {renderElementContent(element)}
      <button
        className="drag-handle"
        {...listeners}
        {...attributes}
        onMouseDown={(e) => e.stopPropagation()}
      >
        Drag
      </button>
    </div>
  );
};

export default FormBuilder;
