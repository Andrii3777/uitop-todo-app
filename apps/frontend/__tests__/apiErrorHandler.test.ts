import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from '@/lib/apiErrorHandler';

describe('getApiErrorMessage', () => {
  it('reads production Nest error filter messages', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          error: true,
          errorDetails: {
            message: 'Category Work already has 5 active tasks',
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
    };

    expect(getApiErrorMessage(error)).toBe('Category Work already has 5 active tasks');
  });

  it('formats validation messages from Nest ValidationPipe', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          error: true,
          errorDetails: {
            message: [
              'text should not be empty',
              'categoryId must not be less than 1',
            ],
            error: 'Bad Request',
            statusCode: 400,
          },
        },
      },
    };

    expect(getApiErrorMessage(error)).toBe(
      'text should not be empty. categoryId must not be less than 1',
    );
  });

  it('handles network errors separately from backend responses', () => {
    const error = {
      isAxiosError: true,
      message: 'Network Error',
    };

    expect(getApiErrorMessage(error)).toBe('Network error. Please check your connection.');
  });
});
