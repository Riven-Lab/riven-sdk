import { RivenError } from "./errors.js";
import type { AnalyticsEvent, RivenClientOptions, TrackResult } from "./types.js";

export interface Transport {
  send(event: AnalyticsEvent): Promise<TrackResult>;
}

type TransportOptions = Required<
  Pick<RivenClientOptions, "endpoint" | "projectKey" | "timeoutMs" | "ingestionPath" | "fetch">
>;

function readRetryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
  const retryAt = Date.parse(value);
  if (Number.isNaN(retryAt)) return undefined;
  return Math.max(0, retryAt - Date.now());
}

function readApiCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== "object") return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code) ? code : undefined;
}

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
          // Keep the HTTP body identical to the server's single-event ingestion schema.
          body: JSON.stringify(event),
          signal: controller.signal
        });

        if (!response.ok) {
          // Expose only stable API metadata; never include event data or raw response bodies.
          const body: unknown = await response.json().catch(() => null);
          throw new RivenError("Riven API returned HTTP " + response.status + ".", {
            code: "HTTP_ERROR",
            status: response.status,
            apiCode: readApiCode(body),
            retryAfterMs: readRetryAfterMs(response.headers.get("retry-after"))
          });
        }

        // The API confirms acceptance with a stable event ID the caller can retain if needed.
        const body: unknown = await response.json().catch(() => null);
        const eventId =
          body && typeof body === "object" ? (body as { eventId?: unknown }).eventId : undefined;
        if (
          !body ||
          typeof body !== "object" ||
          (body as { accepted?: unknown }).accepted !== true ||
          typeof eventId !== "string" ||
          eventId.length === 0
        ) {
          throw new RivenError("Riven API returned an invalid success response.", {
            code: "INVALID_RESPONSE",
            status: response.status
          });
        }

        return { eventId };
      } catch (error) {
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
