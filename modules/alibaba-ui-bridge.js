import { renderAlibabaImport } from './alibaba-import.js';

// Explicit UI bootstrap: guarantees the Alibaba import panel is mounted after the dashboard DOM exists.
function mount() {
  try {
    renderAlibabaImport(document);
    document.documentElement.dataset.v4AlibabaUi = document.querySelector('[data-v4-alibaba-import]') ? 'ready' : 'missing-anchor';
  } catch (error) {
    document.documentElement.dataset.v4AlibabaUi = 'error';
    console.error('[V4 Alibaba] UI bootstrap failed', error);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
}
