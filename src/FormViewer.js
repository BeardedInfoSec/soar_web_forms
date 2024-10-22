import React from 'react';
import { useParams } from 'react-router-dom';

const FormViewer = () => {
  const { formName } = useParams();
  const savedForm = JSON.parse(localStorage.getItem(formName));

  if (!savedForm) return <div>Form "{formName}" not found.</div>;

  return (
    <div>
      <h1>{savedForm.name}</h1>
      {savedForm.elements.map((el) => (
        <div key={el.id}>
          <h3>{el.label}</h3>
          {/* Add more detailed rendering logic if necessary */}
        </div>
      ))}
      <button onClick={() => handleSubmit(savedForm.elements)}>Submit</button>
    </div>
  );
};

const handleSubmit = (formElements) => {
  const data = formElements.reduce((acc, el) => {
    acc[el.label] = el.settings?.defaultValue || '';
    return acc;
  }, {});

  fetch('http://192.168.50.160/rest/soar_endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Token <your_soar_token>',
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((result) => console.log('Form submitted:', result))
    .catch((error) => console.error('Error:', error));
};

export default FormViewer;
