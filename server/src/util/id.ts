import { randomUUID } from "node:crypto";

export function newInstanceId(prefix: string) {
  // Using Node's crypto UUID keeps ids unique and avoids extra deps.
  return `${prefix}_${randomUUID()}`;
}

