/** V4 Persistence Layer v1 — browser-safe local persistence with versioning. */

const PREFIX = 'v4:sourcing:';
const VERSION = 1;

function key(name) { return `${PREFIX}${name}:v${VERSION}`; }

export function saveState(name, value) {
  try {
    localStorage.setItem(key(name), JSON.stringify({ version: VERSION, savedAt: new Date().toISOString(), value }));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'storage_write_failed' };
  }
}

export function loadState(name, fallback = null) {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed?.version === VERSION ? parsed.value : fallback;
  } catch {
    return fallback;
  }
}

export function removeState(name) {
  try { localStorage.removeItem(key(name)); return { success: true }; }
  catch (error) { return { success: false, error: 'storage_delete_failed' }; }
}
