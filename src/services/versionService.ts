const LAST_SEEN_KEY = 'app_last_seen_version';

export function getLastSeenVersion(): string {
  try {
    return localStorage.getItem(LAST_SEEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setLastSeenVersion(version: string): void {
  try {
    localStorage.setItem(LAST_SEEN_KEY, version);
  } catch {
    // ignore
  }
}

export function hasNewVersion(currentVersion: string): boolean {
  if (!currentVersion) return false;
  const lastSeen = getLastSeenVersion();
  return lastSeen !== currentVersion;
}
