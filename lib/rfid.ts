/** Normalize HID/reader output to a canonical card UID. */
export function normalizeRfidUid(raw: string) {
  return raw.replace(/[\s:.\-_]/g, "").toUpperCase();
}
