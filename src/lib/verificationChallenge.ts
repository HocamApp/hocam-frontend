export function secondsUntil(isoTimestamp: string | null | undefined, now = Date.now()) {
  if (!isoTimestamp) return 0;
  const timestamp = Date.parse(isoTimestamp);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.ceil((timestamp - now) / 1000));
}

export function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
