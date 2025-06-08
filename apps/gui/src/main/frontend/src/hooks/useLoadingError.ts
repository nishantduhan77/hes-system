import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';

interface UseLoadingErrorReturn {
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (error: unknown) => void;
  withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

export function useLoadingError(): UseLoadingErrorReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleError = useCallback((error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred';
    
    setError(message);
    enqueueSnackbar(message, { variant: 'error' });
  }, [enqueueSnackbar]);

  const withLoading = useCallback(async <T>(promise: Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const result = await promise;
      return result;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    loading,
    error,
    setError,
    handleError,
    withLoading,
  };
} 