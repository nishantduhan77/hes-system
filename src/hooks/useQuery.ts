import { useQuery as useReactQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import axios from 'axios';
import { useSnackbar } from 'notistack';

// Define a type that matches the shape of Axios errors
interface ApiError {
  isAxiosError?: boolean;
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
}

export function useQuery<TData = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, ApiError>, 'queryKey' | 'queryFn'>
) {
  const { enqueueSnackbar } = useSnackbar();

  return useReactQuery<TData, ApiError>(
    queryKey,
    queryFn,
    {
      onError: (error) => {
        // Extract error message from various possible locations
        const errorMessage = 
          error.response?.data?.message || // API error response
          error.message || // Error object message
          error.response?.statusText || // HTTP status text
          'An unexpected error occurred'; // Fallback message

        enqueueSnackbar(errorMessage, { variant: 'error' });
      },
      ...options,
    }
  );
} 