import { describe, expect, it, vi } from "vitest";
import { createClient } from "../../src/index.js";

describe("transport errors", () => {
  it("exposes HTTP status on server errors", async () => {
    const client = createClient({
      endpoint: "https://analytics.example.com",
      projectKey: "key",
      fetch: vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null, { status: 429 }))
    });

    await expect(client.track("page.view")).rejects.toMatchObject({
      code: "HTTP_ERROR",
      status: 429
    });
  });

  it("wraps network failures with a stable error code", async () => {
    const client = createClient({
      endpoint: "https://analytics.example.com",
      projectKey: "key",
      fetch: vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError("offline"))
    });

    await expect(client.track("page.view")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});
