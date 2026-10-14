import { RivenError } from "./errors.js";
import type { AnalyticsEvent, RivenClientOptions } from "./types.js";

export interface Transport {
  send(event: AnalyticsEvent): Promise<void>;
}

type TransportOptions = Required<
  Pick<RivenClientOptions, "endpoint" | "projectKey" | "timeoutMs" | "ingestionPath" | "fetch">
>;

export function createTransport(options: TransportOptions): Transport {
  const url = new URL(options.ingestionPath, options.endpoint);

  return {
    async send(event) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

      try {
        const response = await options.fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-project-key": options.projectKey
          },
          body: JSON.stringify(event),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new RivenError(`Riven API returned HTTP ${response.status}.`, {
            code: "HTTP_ERROR",
            status: response.status
          });
        }
      } catch (error) {
        if (error instanceof RivenError) throw error;
        if (controller.signal.aborted) {
          throw new RivenError(`Riven request timed out after ${options.timeoutMs} ms.`, {
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
