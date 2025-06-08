import { useMutation as useReactQueryMutation, UseMutationOptions } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

export function useMutation<TData = unknown, TError = Error, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'>
) {
  const { enqueueSnackbar } = useSnackbar();

  return useReactQueryMutation<TData, TError, TVariables>({
    mutationFn,
    onError: (error: TError, variables: TVariables) => {
      const message = error instanceof Error ? error.message : 'An error occurred';
      enqueueSnackbar(message, { variant: 'error' });
      if (options?.onError) {
        options.onError(error, variables, undefined);
      }
    },
    ...options,
  });
}

export default useMutation; 