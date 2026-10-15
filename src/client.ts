import { RivenError } from "./errors.js";
import { createTransport } from "./transport.js";
import { validateEventName, validateProperties } from "./validation.js";
import type { EventProperties, RivenClientOptions, TrackResult } from "./types.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_INGESTION_PATH = "/v1/events";

export interface RivenClient {
  /** Record one event and resolve with its server-assigned ID after acceptance. */
  track(name: string, properties?: EventProperties): Promise<TrackResult>;
}

export function createClient(options: RivenClientOptions): RivenClient {
  let endpoint: URL;
  try {
    endpoint = new URL(options.endpoint);
  } catch (cause) {
    throw new RivenError("endpoint must be an absolute URL.", {
      code: "INVALID_CONFIGURATION",
      cause
    });
  }

  // Only allow web protocols; credentials and URL suffixes can leak or alter request routing.
  if (!/^https?:$/.test(endpoint.protocol)) {
    throw new RivenError("endpoint must use HTTP or HTTPS.", { code: "INVALID_CONFIGURATION" });
  }
  if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new RivenError("endpoint must not contain credentials, a query string, or a fragment.", {
      code: "INVALID_CONFIGURATION"
    });
  }

  // The project key is sent as an HTTP header, so reject values that are malformed or ambiguous.
  if (typeof options.projectKey !== "string" || !options.projectKey.trim()) {
    throw new RivenError("projectKey must be a non-empty string.", { code: "INVALID_CONFIGURATION" });
  }
  if (
    options.projectKey !== options.projectKey.trim() ||
    options.projectKey.includes(String.fromCharCode(10)) ||
    options.projectKey.includes(String.fromCharCode(13))
  ) {
    throw new RivenError("projectKey must not contain surrounding whitespace or line breaks.", {
      code: "INVALID_CONFIGURATION"
    });
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RivenError("timeoutMs must be a positive finite number.", {
      code: "INVALID_CONFIGURATION"
    });
  }

  const ingestionPath = options.ingestionPath ?? DEFAULT_INGESTION_PATH;
  // A protocol-relative path (//host/path) would send the project key to a different host.
  if (
    typeof ingestionPath !== "string" ||
    !ingestionPath.startsWith("/") ||
    ingestionPath.startsWith("//")
  ) {
    throw new RivenError("ingestionPath must be an absolute path on the configured API origin.", {
      code: "INVALID_CONFIGURATION"
    });
  }

  let ingestionUrl: URL;
  try {
    ingestionUrl = new URL(ingestionPath, endpoint);
  } catch (cause) {
    throw new RivenError("ingestionPath must be a valid URL path.", {
      code: "INVALID_CONFIGURATION",
      cause
    });
  }
  // Keep authentication confined to the configured API origin and keep endpoint selection explicit.
  if (ingestionUrl.origin !== endpoint.origin || ingestionUrl.search || ingestionUrl.hash) {
    throw new RivenError("ingestionPath must stay on the configured origin and must not include a query or fragment.", {
      code: "INVALID_CONFIGURATION"
    });
  }

  const transport = createTransport({
    endpoint: endpoint.toString(),
    projectKey: options.projectKey,
    timeoutMs,
    ingestionPath,
    fetch: options.fetch ?? globalThis.fetch
  });
  const now = options.now ?? (() => new Date());

  return {
    async track(name, properties = {}) {
      // Fail before making a network request, so invalid events never reach ingestion.
      validateEventName(name);
      validateProperties(properties);

      // Create the timestamp at call time, then pass a stable ISO-8601 value to the transport.
      const timestamp = now();
      if (Number.isNaN(timestamp.getTime())) {
        throw new RivenError("The configured clock returned an invalid date.", {
          code: "INVALID_CONFIGURATION"
        });
      }
      return transport.send({ name, properties, timestamp: timestamp.toISOString() });
    }
  };
}
