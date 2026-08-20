/** V4 state adapter: keeps the UI state durable without coupling the UI to storage internals. */
import { loadState, saveState } from './v4-persistence.js';

const STATE_NAME = 'radar';

export function loadRadarState(fallback = {}) {
  return loadState(STATE_NAME, fallback);
}

export function saveRadarState(state) {
  return saveState(STATE_NAME, state);
}

export function bindRadarPersistence(root = document) {
  const elements = Array.from(root.querySelectorAll('input, textarea, select'));
  const initial = loadRadarState({});

  for (const element of elements) {
    if (element.id && initial[element.id] !== undefined) element.value = initial[element.id];
    element.addEventListener('input', persist);
    element.addEventListener('change', persist);
  }

  function persist() {
    const state = {};
    for (const element of elements) {
      if (element.id) state[element.id] = element.value;
    }
    saveRadarState(state);
  }

  return { persist };
}
