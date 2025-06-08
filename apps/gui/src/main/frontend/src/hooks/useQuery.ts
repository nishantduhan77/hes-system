import { useQuery as useReactQuery, UseQueryOptions } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

interface ErrorResponse {
  message: string;
}

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
};

export function useQuery<TData = unknown, TError = unknown>(
  key: string | readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
) {
  const { enqueueSnackbar } = useSnackbar();

  return useReactQuery<TData, TError, TData>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn,
    onError: (error: unknown) => {
      let message = 'An unexpected error occurred';
      
      if (error && typeof error === 'object') {
        const apiError = error as ApiError;
        message = apiError.response?.data?.message || apiError.message || message;
      }
      
      enqueueSnackbar(message, { variant: 'error' });
      options?.onError?.(error as TError);
    },
    ...options,
  });
} 