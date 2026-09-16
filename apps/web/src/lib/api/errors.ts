import type { Schema } from '@lp/contracts';

export type Problem = Schema<'Problem'>;

/**
 * Error thrown by `core-client` for any non-2xx response.
 * Carries the RFC 9457 problem document when the server sent one.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail?: string;
  readonly problem?: Problem;
  readonly requestId?: string;

  constructor(status: number, problem?: Problem, requestId?: string) {
    super(problem?.title ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = problem?.code ?? statusToCode(status);
    this.detail = problem?.detail;
    this.problem = problem;
    this.requestId = requestId;
  }

  /** Field-level validation messages keyed by field path (422). */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const e of this.problem?.errors ?? []) out[e.field] = e.message;
    return out;
  }
}

function statusToCode(status: number): string {
  switch (status) {
    case 400:
      return 'bad_request';
    case 401:
      return 'unauthenticated';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 422:
      return 'validation_failed';
    case 429:
      return 'rate_limited';
    default:
      return status >= 500 ? 'server_error' : 'request_failed';
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
