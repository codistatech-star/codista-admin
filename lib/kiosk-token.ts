import { createHash, randomBytes } from "crypto";

export function generateKioskToken() {
  return randomBytes(24).toString("base64url");
}

export function hashKioskToken(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export function kioskTokenHint(token: string) {
  const trimmed = token.trim();
  return trimmed.slice(-4);
}
