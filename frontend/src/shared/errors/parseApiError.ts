import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

import type { ApiErrorResponse } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return isRecord(value) && typeof value.message === 'string' && typeof value.status === 'number';
}

function formatDetails(details: string[] | undefined): string | null {
  if (!details || details.length === 0) {
    return null;
  }

  return details.join(' · ');
}

export function parseApiError(
  error: FetchBaseQueryError | SerializedError | unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (isRecord(error) && typeof error.message === 'string' && !('status' in error && 'data' in error)) {
    // SerializedError from RTK
    if (!('status' in error)) {
      return error.message || fallback;
    }
  }

  const fetchError = error as FetchBaseQueryError;

  if (fetchError.status === 'FETCH_ERROR') {
    return 'Unable to reach the server. Check your connection.';
  }

  if (fetchError.status === 'TIMEOUT_ERROR') {
    return 'The request timed out. Please try again.';
  }

  if (fetchError.status === 'PARSING_ERROR') {
    return 'Received an unexpected response from the server.';
  }

  if (fetchError.status === 'CUSTOM_ERROR') {
    return fetchError.error || fallback;
  }

  if (typeof fetchError.status === 'number') {
    const data = fetchError.data;

    if (isApiErrorResponse(data)) {
      const details = formatDetails(data.details);
      return details ? `${data.message}: ${details}` : data.message;
    }

    if (isRecord(data) && typeof data.message === 'string') {
      return data.message;
    }

    if (fetchError.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (fetchError.status === 403) {
      return 'You do not have permission to do that.';
    }

    if (fetchError.status === 404) {
      return 'The requested resource was not found.';
    }

    if (fetchError.status >= 500) {
      return 'The server ran into a problem. Please try again later.';
    }
  }

  if (isRecord(error) && typeof error.message === 'string') {
    return error.message;
  }

  return fallback;
}
