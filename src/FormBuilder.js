import React, { useState, useRef } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import Papa from 'papaparse';
import './FormBuilder.css';

const ELEMENT_TYPES = [
  { id: 'heading', label: 'Heading' },
  { id: 'text', label: 'Text' },
  { id: 'divider', label: 'Divider' },
  { id: 'button', label: 'Button' },
  { id: 'image', label: 'Image' },
  { id: 'table', label: 'Table' }
];

const INPUT_FIELDS = [
  { id: 'inputText', label: 'Input Text', type: 'text' },
  { id: 'email', label: 'Email', type: 'email' },
  { id: 'dateTime', label: 'Date or Time', type: 'datetime-local' },
  { id: 'boolean', label: 'Boolean', type: 'dropdown' },
  { id: 'number', label: 'Number', type: 'number' },
  { id: 'file', label: 'File Upload', type: 'file' },
  { id: 'password', label: 'Password', type: 'password' }
];

const FormBuilder = () => {
  const [formElements, setFormElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [draftSettings, setDraftSettings] = useState(null);
  const [draggingElement, setDraggingElement] = useState(null);
  const formContainerRef = useRef(null);

  const addElement = (type) => {
    setFormElements((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type,
        label: type === 'heading' ? 'Heading' : type,
        alignment: 'center',
        settings: {
          headerLevel: 'h1',
          placeholder: type === 'email' ? 'Email Address' : 'Enter text here...',
          placeholder: type === 'password' ? 'Enter password' : '',
          useCurrentDate: false,
          defaultBoolean: 'true',
          min: '',
          max: '',
          step: '',
          defaultValue: '',
          showPasswordOption: false,
          passwordLength: '',
          requireSymbols: false,
          requireNumbers: false
        },
        required: false,
        textColor: '#ffffff',
        fontFamily: 'Arial'
      },
    ]);
  };

  const removeElement = (id) => {
    setFormElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  };

  const handleEditClick = (element) => {
    setSelectedElement(element);
    setDraftSettings({
      ...element.settings,
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
      requireNumbers: element.settings?.requireNumbers
    });
  };

  const applyDraftChanges = () => {
    if (selectedElement && draftSettings) {
      updateElementSettings(selectedElement.id, draftSettings);
      setSelectedElement(null);
      setDraftSettings(null);
    }
  };

  const cancelChanges = () => {
    setSelectedElement(null);
    setDraftSettings(null);
  };

  const updateElementSettings = (id, newSettings) => {
    setFormElements((prev) =>
      prev.map((el) =>
        el.id === id
          ? {
              ...el,
              settings: newSettings,
              label: newSettings.label,
              alignment: newSettings.alignment,
              required: newSettings.required,
              placeholder: newSettings.placeholder,
              isValid: newSettings.isValid,
              useCurrentDate: newSettings.useCurrentDate,
              defaultBoolean: newSettings.defaultBoolean,
              min: newSettings.min,
              max: newSettings.max,
              step: newSettings.step,
              defaultValue: newSettings.defaultValue,
              showPasswordOption: newSettings.showPasswordOption,
              passwordLength: newSettings.passwordLength,
              requireSymbols: newSettings.requireSymbols,
              requireNumbers: newSettings.requireNumbers
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
      Papa.parse(file, {
        complete: (result) => {
          const csvData = result.data;
          updateElementSettings(elementId, { ...draftSettings, csvData });
        },
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

    switch (element.type) {
      case 'heading': {
        const HeaderTag = settings?.headerLevel || 'h1';
        return <HeaderTag style={alignmentStyle}>{settings?.label || element.label}</HeaderTag>;
      }
      case 'text':
        return <p style={alignmentStyle}>{settings?.label || element.label}</p>;
      case 'divider':
        return <hr style={{ ...alignmentStyle, width: '100%' }} />;
      case 'button':
        return (
          <div
            style={{
              display: 'flex',
              justifyContent:
                settings?.alignment === 'left'
                  ? 'flex-start'
                  : settings?.alignment === 'center' || !settings?.alignment
                  ? 'center'
                  : 'flex-end',
              width: '100%'
            }}
          >
            <button
              className="custom-button"
              style={{
                backgroundColor: '#4285f4',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                margin: '5px',
                borderRadius: '6px',
              }}
            >
              {settings?.label || element.label}
            </button>
          </div>
        );
      case 'image':
        return <img src="https://via.placeholder.com/150" alt="Placeholder" style={alignmentStyle} />;
      case 'file':
        return (
          <div style={{ display: 'flex', justifyContent: settings?.alignment || 'center', width: '100%' }}>
            <input
              type="file"
              style={{
                borderRadius: '8px',
                padding: '10px',
                border: '1px solid #ced4da',
                textAlign: 'center',
                ...alignmentStyle
              }}
              onChange={(e) => handleCSVUpload(e, element.id)}
            />
          </div>
        );
      case 'table':
        return (
          <div style={alignmentStyle}>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleCSVUpload(e, element.id)}
              style={{ marginBottom: '10px' }}
            />
            <table style={{ textAlign: settings?.alignment || 'center', width: '100%' }}>
              <tbody>
                {settings.csvData
                  ? settings.csvData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                      </tr>
                    ))
                  : (
                    <tr>
                      <td>Table Content</td>
                    </tr>
                  )}
              </tbody>
            </table>
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
      case 'inputText':
        return (
          <div style={{ display: 'flex', justifyContent: settings?.alignment || 'center', width: '100%' }}>
            <input
              type="text"
              placeholder={settings?.placeholder || 'Enter text here...'}
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
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: settings?.alignment || 'center' }}>
              {/* Password Input Field */}
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
                  textAlign: 'center', // Placeholder aligned to the left
                  margin: '0', // Remove auto-centering from the input box itself
                }}
              />
              {/* Show Password Option */}
              {settings?.showPasswordOption && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    checked={settings?.showPassword || false}
                    onChange={(e) => updateElementSettings(element.id, { ...settings, showPassword: e.target.checked })}
                  />
                  <label style={{ marginLeft: '10px' }}>Show Password</label>
                </div>
              )}
              {/* Password Requirements */}
              <div style={{ marginTop: '10px', textAlign: 'center', width: '100%' }}>
                {settings?.passwordLength && <p>Requires Minimum Length: {settings.passwordLength}</p>}
                {settings?.requireSymbols && <p>Requires Symbols: Yes</p>}
                {settings?.requireNumbers && <p>Requires Numbers: Yes</p>}
              </div>
              {/* Validation Error */}
              {!settings?.isValid && settings?.isValid !== undefined && (
                <span style={{ color: '#ff0000', fontSize: '1em', marginTop: '5px' }}>Password does not meet requirements</span>
              )}
            </div>
          );
        
        return (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: settings?.alignment || 'center', width: '100%' }}>
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
                  width: '300px', // You can adjust the width as needed
                  border: settings?.isValid === false ? '2px solid #ff0000' : '1px solid #ced4da',
                  textAlign: 'left', // Ensures the placeholder text stays aligned left
                  margin: '0 auto' // Center the input box itself
                }}
              />
              {settings?.showPasswordOption && (
                <label style={{ marginLeft: '10px' }}>
                  <input
                    type="checkbox"
                    checked={settings?.showPassword || false}
                    onChange={(e) => updateElementSettings(element.id, { ...settings, showPassword: e.target.checked })}
                  />
                  Show Password
                </label>
              )}
            </div>
            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {settings?.passwordLength && <p style={{ marginRight: '20px' }}>Requires Minimum Length: {settings.passwordLength}</p>}
              {settings?.requireSymbols && <p style={{ marginRight: '20px' }}>Requires Symbols: Yes</p>}
              {settings?.requireNumbers && <p>Requires Numbers: Yes</p>}
            </div>
            {!settings?.isValid && settings?.isValid !== undefined && (
              <span style={{ color: '#ff0000', fontSize: '0.8em', marginTop: '5px' }}>Password does not meet requirements</span>
            )}
          </div>

        );
      default:
        return (
          <input
            type={element.type}
            placeholder={settings?.placeholder || element.label}
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
        <div className="element-selector">
          <h3>Elements</h3>
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
          <h3>Input Fields</h3>
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

        <button
          onClick={handleResetForm}
          className="reset-form-button custom-button"
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            textAlign: 'center',
            fontSize: '16px',
            cursor: 'pointer',
            margin: '10px 0',
            borderRadius: '6px',
            width: '100%'
          }}
        >
          Reset Form
        </button>
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
