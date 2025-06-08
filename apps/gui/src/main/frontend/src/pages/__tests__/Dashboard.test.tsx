import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../Dashboard';

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

describe('Dashboard Component', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it('renders dashboard title', () => {
    render(<Dashboard />, { wrapper });
    expect(screen.getByText('System Dashboard')).toBeInTheDocument();
  });

  it('displays meter statistics', async () => {
    render(<Dashboard />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Total Meters')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('142')).toBeInTheDocument();
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('displays voltage readings chart', async () => {
    render(<Dashboard />, { wrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Real-time Voltage Readings')).toBeInTheDocument();
    });
  });
}); 