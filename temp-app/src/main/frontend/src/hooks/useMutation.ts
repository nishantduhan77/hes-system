import { useMutation as useReactMutation, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useSnackbar } from 'notistack';

export function useMutation<TData = unknown, TError = AxiosError, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  const { enqueueSnackbar } = useSnackbar();

  return useReactMutation<TData, TError, TVariables>({
    mutationFn,
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