import { RivenError } from "./errors.js";
import type { EventProperties } from "./types.js";

const EVENT_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_.:-]{0,127}$/;

function isJsonValue(value: unknown, seen: WeakSet<object>): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  let valid: boolean;
  if (Array.isArray(value)) {
    valid = value.every((item) => isJsonValue(item, seen));
  } else {
    const prototype = Object.getPrototypeOf(value);
    valid =
      (prototype === Object.prototype || prototype === null) &&
      Object.values(value).every((item) => isJsonValue(item, seen));
  }
  seen.delete(value);
  return valid;
}

export function validateEventName(name: string): void {
  if (!EVENT_NAME_PATTERN.test(name)) {
    throw new RivenError(
      "Event names must start with a letter and contain only letters, numbers, periods, underscores, colons, or hyphens (up to 128 characters).",
      { code: "INVALID_EVENT" }
    );
  }
}

export function validateProperties(properties: EventProperties): void {
  if (properties === null || Array.isArray(properties) || typeof properties !== "object") {
    throw new RivenError("Event properties must be a plain object.", { code: "INVALID_EVENT" });
  }
  if (!isJsonValue(properties, new WeakSet())) {
    throw new RivenError("Event properties must contain only finite JSON values.", {
      code: "INVALID_EVENT"
    });
  }
}
