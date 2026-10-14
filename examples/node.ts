import { createClient } from "@riven-lab/sdk";

const endpoint = process.env.RIVEN_ENDPOINT;
const projectKey = process.env.RIVEN_PROJECT_KEY;

if (!endpoint || !projectKey) {
  throw new Error("Set RIVEN_ENDPOINT and RIVEN_PROJECT_KEY before running this example.");
}

const analytics = createClient({ endpoint, projectKey });

await analytics.track("signup_completed", {
  method: "email"
});
