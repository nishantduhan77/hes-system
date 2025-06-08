"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useQuery = useQuery;
const react_query_1 = require("@tanstack/react-query");
const notistack_1 = require("notistack");
function useQuery(queryKey, queryFn, options) {
    const { enqueueSnackbar } = (0, notistack_1.useSnackbar)();
    return (0, react_query_1.useQuery)(queryKey, queryFn, {
        onError: (error) => {
            let errorMessage = 'An unexpected error occurred';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            else if ('response' in error && error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            else if ('message' in error) {
                errorMessage = error.message;
            }
            enqueueSnackbar(errorMessage, { variant: 'error' });
        },
        ...options,
    });
}
