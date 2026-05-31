import axios from 'axios';
import { toast } from 'react-toastify';

type BackendMessage = string | string[];

interface ApiErrorResponse {
  error?: boolean | string;
  errorDetails?: BackendMessage | {
    message?: BackendMessage;
    error?: string;
    statusCode?: number;
  };
  message?: BackendMessage;
  statusCode?: number;
}

function formatMessage(message: BackendMessage | undefined): string | undefined {
  if (Array.isArray(message)) {
    return message.join('. ');
  }
  return message;
}

function getBackendMessage(data: ApiErrorResponse | undefined): string | undefined {
  if (!data) return undefined;

  if (typeof data.errorDetails === 'string' || Array.isArray(data.errorDetails)) {
    return formatMessage(data.errorDetails);
  }

  return (
    formatMessage(data.errorDetails?.message) ??
    formatMessage(data.message) ??
    (typeof data.error === 'string' ? data.error : undefined)
  );
}

export function getApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return 'An unexpected error occurred';
  }

  const status = error.response?.status;
  const data = error.response?.data;
  const backendMessage = getBackendMessage(data);

  if (error.code === 'ECONNABORTED' || (error.message ?? '').includes('timeout')) {
    return 'Request timeout. Please check your connection.';
  }

  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  if (status === 400) {
    return backendMessage ?? 'Invalid request';
  }

  if (status === 401) {
    return 'Authentication required';
  }

  if (status === 403) {
    return 'Access denied';
  }

  if (status === 404) {
    return backendMessage ?? 'Resource not found';
  }

  if (status && status >= 500) {
    return 'Server error. Please try again later.';
  }

  return backendMessage ?? 'An error occurred. Please try again.';
}

export function handleApiError(error: unknown): void {
  toast.error(getApiErrorMessage(error));
}
