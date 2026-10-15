export type RivenErrorCode =
  | "INVALID_CONFIGURATION"
  | "INVALID_EVENT"
  | "INVALID_RESPONSE"
  | "REQUEST_TIMEOUT"
  | "NETWORK_ERROR"
  | "HTTP_ERROR";

export interface RivenErrorOptions {
  code: RivenErrorCode;
  status?: number;
  /** Stable machine-readable code returned by the Riven API, when present. */
  apiCode?: string;
  /** Retry-After duration parsed from the API response, in milliseconds. */
  retryAfterMs?: number;
  cause?: unknown;
}

/** Error raised for invalid input, an invalid API response, or failed ingestion. */
export class RivenError extends Error {
  readonly code: RivenErrorCode;
  readonly status?: number;
  readonly apiCode?: string;
  readonly retryAfterMs?: number;

  constructor(message: string, options: RivenErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "RivenError";
    this.code = options.code;
    if (options.status !== undefined) this.status = options.status;
    if (options.apiCode !== undefined) this.apiCode = options.apiCode;
    if (options.retryAfterMs !== undefined) this.retryAfterMs = options.retryAfterMs;
  }
}
