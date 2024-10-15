import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the form builder', () => {
    const { getByText } = render(<App />);
    expect(getByText('Elements')).toBeInTheDocument();
  });

  it('adds a new element to the form', () => {
    const { getByText, getByRole } = render(<App />);
    const addButton = getByRole('button', { name: 'Label' });
    fireEvent.click(addButton);
    expect(getByText('Label')).toBeInTheDocument();
  });

  it('selects an element for editing', () => {
    const { getByText, getByRole } = render(<App />);
    const addButton = getByRole('button', { name: 'Label' });
    fireEvent.click(addButton);
    const element = getByText('Label');
    fireEvent.click(element);
    expect(getByText('Edit label')).toBeInTheDocument();
  });

  it('updates the properties of the selected element', () => {
    const { getByText, getByRole } = render(<App />);
    const addButton = getByRole('button', { name: 'Label' });
    fireEvent.click(addButton);
    const element = getByText('Label');
    fireEvent.click(element);
    const labelInput = getByRole('textbox', { name: 'Label' });
    fireEvent.change(labelInput, { target: { value: 'New Label' } });
    expect(getByText('New Label')).toBeInTheDocument();
  });

  it('deletes the selected element', () => {
    const { getByText, getByRole } = render(< App />);
    const addButton = getByRole('button', { name: 'Label' });
    fireEvent.click(addButton);
    const element = getByText('Label');
    fireEvent.click(element);
    const deleteButton = getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);
    expect(getByText('Label')).not.toBeInTheDocument();
  });
});