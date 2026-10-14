export type RivenErrorCode =
  | "INVALID_CONFIGURATION"
  | "INVALID_EVENT"
  | "REQUEST_TIMEOUT"
  | "NETWORK_ERROR"
  | "HTTP_ERROR";

export interface RivenErrorOptions {
  code: RivenErrorCode;
  status?: number;
  cause?: unknown;
}

/** Error raised for invalid input or a failed ingestion request. */
export class RivenError extends Error {
  readonly code: RivenErrorCode;
  readonly status?: number;

  constructor(message: string, options: RivenErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "RivenError";
    this.code = options.code;
    if (options.status !== undefined) this.status = options.status;
  }
}
