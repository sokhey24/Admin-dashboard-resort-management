export const CONCIERGE_STORAGE_KEY = 'solara_concierge_history';

export function readConciergeMessages() {
  try {
    const raw = sessionStorage.getItem(CONCIERGE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const valid = parsed.every(
      (m) =>
        m &&
        typeof m.id === 'number' &&
        (m.sender === 'user' || m.sender === 'ai') &&
        typeof m.text === 'string',
    );
    return valid ? parsed : null;
  } catch {
    return null;
  }
}

export function writeConciergeMessages(messages) {
  try {
    sessionStorage.setItem(CONCIERGE_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // quota or private mode — ignore
  }
}

export function clearConciergeMessages() {
  try {
    sessionStorage.removeItem(CONCIERGE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
