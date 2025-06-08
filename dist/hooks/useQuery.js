"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useQuery = useQuery;
const react_query_1 = require("@tanstack/react-query");
const notistack_1 = require("notistack");
function useQuery(queryKey, queryFn, options) {
    const { enqueueSnackbar } = (0, notistack_1.useSnackbar)();
    return (0, react_query_1.useQuery)(queryKey, queryFn, {
        onError: (error) => {
            // Extract error message from various possible locations
            const errorMessage = error.response?.data?.message || // API error response
                error.message || // Error object message
                error.response?.statusText || // HTTP status text
                'An unexpected error occurred'; // Fallback message
            enqueueSnackbar(errorMessage, { variant: 'error' });
        },
        ...options,
    });
}
