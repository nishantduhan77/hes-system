import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MeterManagement from '../MeterManagement';
import userEvent from '@testing-library/user-event';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('MeterManagement Component', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders meter management title', () => {
    render(<MeterManagement />, { wrapper });
    expect(screen.getByText('Meter Management')).toBeInTheDocument();
  });

  it('displays meter list', async () => {
    render(<MeterManagement />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('MTR001')).toBeInTheDocument();
      expect(screen.getByText('MTR002')).toBeInTheDocument();
    });
  });

  it('opens add meter dialog when clicking add button', async () => {
    render(<MeterManagement />, { wrapper });
    
    const addButton = screen.getByText('Add Meter');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Add New Meter')).toBeInTheDocument();
  });

  it('adds new meter when submitting form', async () => {
    render(<MeterManagement />, { wrapper });
    
    // Open dialog
    fireEvent.click(screen.getByText('Add Meter'));
    
    // Fill form
    await userEvent.type(screen.getByLabelText('Meter ID'), 'MTR003');
    await userEvent.type(screen.getByLabelText('Serial Number'), 'SN123458');
    await userEvent.type(screen.getByLabelText('Manufacturer'), 'Siemens');
    await userEvent.type(screen.getByLabelText('IP Address'), '192.168.1.102');
    await userEvent.type(screen.getByLabelText('Port'), '4059');
    
    // Submit form
    fireEvent.click(screen.getByText('Add'));
    
    // Verify new meter is added
    await waitFor(() => {
      expect(screen.getByText('MTR003')).toBeInTheDocument();
    });
  });

  it('validates required fields in add meter form', async () => {
    render(<MeterManagement />, { wrapper });
    
    // Open dialog
    fireEvent.click(screen.getByText('Add Meter'));
    
    // Try to submit empty form
    fireEvent.click(screen.getByText('Add'));
    
    await waitFor(() => {
      expect(screen.getByText('Meter ID is required')).toBeInTheDocument();
      expect(screen.getByText('Serial Number is required')).toBeInTheDocument();
      expect(screen.getByText('IP Address is required')).toBeInTheDocument();
    });
  });
}); 