import { RivenError } from "./errors.js";
import type { AnalyticsEvent, RivenClientOptions } from "./types.js";

export interface Transport {
  send(event: AnalyticsEvent): Promise<void>;
}

type TransportOptions = Required<
  Pick<RivenClientOptions, "endpoint" | "projectKey" | "timeoutMs" | "ingestionPath" | "fetch">
>;

export function createTransport(options: TransportOptions): Transport {
  // Build the URL once so every event from this client uses the same validated destination.
  const url = new URL(options.ingestionPath, options.endpoint);

  return {
    async send(event) {
      // AbortController gives fetch a hard deadline; the timer is always cleared below.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

      try {
        const response = await options.fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-project-key": options.projectKey
          },
          // The event envelope is the wire payload defined by the ingestion contract.
          body: JSON.stringify(event),
          signal: controller.signal
        });

        // Treat all non-2xx responses as failures so callers can handle them consistently.
        if (!response.ok) {
          throw new RivenError("Riven API returned HTTP " + response.status + ".", {
            code: "HTTP_ERROR",
            status: response.status
          });
        }
      } catch (error) {
        // Preserve typed HTTP failures; convert fetch and abort errors into stable SDK codes.
        if (error instanceof RivenError) throw error;
        if (controller.signal.aborted) {
          throw new RivenError("Riven request timed out after " + options.timeoutMs + " ms.", {
            code: "REQUEST_TIMEOUT",
            cause: error
          });
        }
        throw new RivenError("Unable to send event to the Riven API.", {
          code: "NETWORK_ERROR",
          cause: error
        });
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}
