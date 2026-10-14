import { describe, expect, it, vi } from "vitest";
import { createClient } from "../../src/index.js";
import { RivenError } from "../../src/errors.js";

describe("createClient", () => {
  it("posts a validated event with a timestamp and project key", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(null, { status: 202 })
    );
    const client = createClient({ endpoint: "https://analytics.example.com", projectKey: "public-key", fetch, now: () => new Date("2026-01-02T03:04:05.000Z") });
    await client.track("signup.completed", { method: "email", trial: true });
    expect(fetch).toHaveBeenCalledOnce();
    const [url, request] = fetch.mock.calls[0]!;
    expect(url).toEqual(new URL("https://analytics.example.com/v1/events"));
    expect(new Headers(request?.headers).get("x-project-key")).toBe("public-key");
    expect(JSON.parse(String(request?.body))).toEqual({ name: "signup.completed", properties: { method: "email", trial: true }, timestamp: "2026-01-02T03:04:05.000Z" });
  });
  it("rejects invalid event names before making a request", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const client = createClient({ endpoint: "https://analytics.example.com", projectKey: "key", fetch });
    await expect(client.track(" bad name ")).rejects.toMatchObject({ code: "INVALID_EVENT" });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects non-JSON properties", async () => {
    const client = createClient({ endpoint: "https://analytics.example.com", projectKey: "key", fetch: vi.fn<typeof globalThis.fetch>() });
    await expect(client.track("signup", { count: Number.NaN })).rejects.toBeInstanceOf(RivenError);
  });
  it("rejects invalid configuration", () => {
    expect(() => createClient({ endpoint: "file:///tmp", projectKey: "key", fetch: globalThis.fetch })).toThrowError(RivenError);
  });
});
