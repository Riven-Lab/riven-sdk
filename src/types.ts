/** JSON values accepted as analytics event properties. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type EventProperties = Record<string, JsonValue>;

/** One event sent to the configured Riven ingestion endpoint. */
export interface AnalyticsEvent {
  name: string;
  properties: EventProperties;
  timestamp: string;
}

export interface RivenClientOptions {
  /** Base URL of the Riven Analytics API, for example https://analytics.example.com. */
  endpoint: string;
  /** Public project key. Never use an administrative or secret key in a browser. */
  projectKey: string;
  /** Request timeout in milliseconds. Defaults to 10 seconds. */
  timeoutMs?: number;
  /** Relative ingestion path. Defaults to /v1/events. Confirm with the server contract. */
  ingestionPath?: string;
  /** Override fetch for tests, runtimes, or custom networking. */
  fetch?: typeof fetch;
  /** Injectable clock for deterministic event timestamps. */
  now?: () => Date;
}

export interface TrackOptions {
  properties?: EventProperties;
}
