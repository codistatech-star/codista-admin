import { createHash, randomInt } from "crypto";

export function hashKioskPin(pin: string) {
  return createHash("sha256").update(pin.trim()).digest("hex");
}

/** @deprecated use hashKioskPin */
export function hashKioskToken(token: string) {
  return hashKioskPin(token);
}

export function isValidKioskPin(pin: string) {
  return /^\d{4}$/.test(pin.trim());
}

export function generateKioskPin() {
  return String(randomInt(1000, 10000));
}

export function kioskPinHint(pin: string) {
  const trimmed = pin.trim();
  return trimmed.slice(-2);
}

/** @deprecated use generateKioskPin */
export function generateKioskToken() {
  return generateKioskPin();
}

/** @deprecated use kioskPinHint */
export function kioskTokenHint(token: string) {
  return kioskPinHint(token);
}
