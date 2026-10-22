export class TjkClientError extends Error {
  override readonly name = 'TjkClientError';
}

export class TjkValidationError extends TjkClientError {
  override readonly name = 'TjkValidationError';
}

export class TjkHttpError extends TjkClientError {
  override readonly name = 'TjkHttpError';
  constructor(message: string, public readonly status: number, public readonly body?: unknown) {
    super(message);
  }
}

export class TjkApiError extends TjkClientError {
  override readonly name = 'TjkApiError';
  constructor(message: string, public readonly code?: number, public readonly body?: unknown) {
    super(message);
  }
}

export class TjkResponseError extends TjkClientError {
  override readonly name = 'TjkResponseError';
}
