import { RivenError } from "./errors.js";
import { createTransport } from "./transport.js";
import { validateEventName, validateProperties } from "./validation.js";
import type { EventProperties, RivenClientOptions } from "./types.js";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_INGESTION_PATH = "/v1/events";

export interface RivenClient {
  /** Record and immediately send one event. Rejects when input or the request fails. */
  track(name: string, properties?: EventProperties): Promise<void>;
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

  if (!/^https?:$/.test(endpoint.protocol)) {
    throw new RivenError("endpoint must use HTTP or HTTPS.", { code: "INVALID_CONFIGURATION" });
  }
  if (!options.projectKey.trim()) {
    throw new RivenError("projectKey must not be empty.", { code: "INVALID_CONFIGURATION" });
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RivenError("timeoutMs must be a positive finite number.", {
      code: "INVALID_CONFIGURATION"
    });
  }

  const ingestionPath = options.ingestionPath ?? DEFAULT_INGESTION_PATH;
  if (!ingestionPath.startsWith("/")) {
    throw new RivenError("ingestionPath must start with '/'.", { code: "INVALID_CONFIGURATION" });
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
      validateEventName(name);
      validateProperties(properties);
      const timestamp = now();
      if (Number.isNaN(timestamp.getTime())) {
        throw new RivenError("The configured clock returned an invalid date.", {
          code: "INVALID_CONFIGURATION"
        });
      }
      await transport.send({ name, properties, timestamp: timestamp.toISOString() });
    }
  };
}
