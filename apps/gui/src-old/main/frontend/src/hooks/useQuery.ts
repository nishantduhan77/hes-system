import { useQuery as useReactQuery, UseQueryOptions } from '@tanstack/react-query';
import axios from 'axios';
import { useSnackbar } from 'notistack';

type ErrorType = Error | {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
};

export function useQuery<TData = unknown>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, ErrorType>, 'queryKey' | 'queryFn'>
) {
  const { enqueueSnackbar } = useSnackbar();

  return useReactQuery<TData, ErrorType>(
    queryKey,
    queryFn,
    {
      onError: (error) => {
        let errorMessage = 'An unexpected error occurred';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if ('response' in error && error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if ('message' in error) {
          errorMessage = error.message;
        }
        
        enqueueSnackbar(errorMessage, { variant: 'error' });
      },
      ...options,
    }
  );
} 