import { useQuery as useReactQuery, UseQueryOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useSnackbar } from 'notistack';

export function useQuery<TData = unknown, TError = AxiosError>(
  key: string | readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
) {
  const { enqueueSnackbar } = useSnackbar();

  return useReactQuery<TData, TError, TData>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn,
    onError: (error) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message || error.message
          : 'An unexpected error occurred';
      
      enqueueSnackbar(message, { variant: 'error' });
      options?.onError?.(error);
    },
    ...options,
  });
} 