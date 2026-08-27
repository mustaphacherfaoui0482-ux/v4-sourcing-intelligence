const UI_VERSION = '1.0.0';

function isAlibabaUrl(value) {
  return /^https:\/\/(?:[^/]+\.)?alibaba\.com\//i.test(String(value || '').trim());
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
}

function mountPanel() {
  if (document.querySelector('[data-v4-gpt-sourcing]')) return;
  const actions = document.querySelector('.hero .actions');
  if (!actions) return;

  const button = document.createElement('button');
  button.className = 'btn primary';
  button.type = 'button';
  button.textContent = '◈ GPT Sourcing';
  button.dataset.v4GptOpen = 'true';
  actions.prepend(button);

  button.addEventListener('click', openPanel);
}

function openPanel() {
  if (document.querySelector('[data-v4-gpt-sourcing]')) return;
  const overlay = document.createElement('div');
  overlay.dataset.v4GptSourcing = 'true';
  Object.assign(overlay.style, {
    position:'fixed', inset:'0', zIndex:'15000', background:'#07090bf5',
    display:'flex', alignItems:'center', justifyContent:'center', padding:'16px',
  });
  overlay.innerHTML = `
    <section style="width:min(720px,100%);max-height:90vh;overflow:auto;background:#0e1216;border:1px solid #3a3324;border-radius:14px;padding:18px;box-shadow:0 24px 80px #000b">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <div><div style="color:#d7b45a;font-size:10px;letter-spacing:.16em">GPT SOURCING × V4</div><h2 style="margin:7px 0;font-size:20px">Nouvelle analyse</h2><div style="color:#8d979e;font-size:10px">GPT orchestre. V4 décide.</div></div>
        <button class="btn" type="button" data-gpt-close>Fermer</button>
      </div>
      <label style="display:block;margin-top:18px;color:#8d979e;font-size:10px">MISSION OU URL ALIBABA</label>
      <textarea data-gpt-target rows="4" placeholder="Ex. trouver 5 produits innovants pour le marché français\nou coller une URL Alibaba HTTPS" style="width:100%;margin-top:7px;resize:vertical;background:#090d10;color:#f4f6f5;border:1px solid #252d33;border-radius:9px;padding:12px;font:12px Inter,system-ui,sans-serif;outline:none"></textarea>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn primary" type="button" data-gpt-run>Lancer GPT → V4</button><span style="color:#687279;font-size:9px;padding:10px 0">Budget agent : 8 étapes max</span></div>
      <div data-gpt-result style="margin-top:14px"></div>
    </section>`;
  document.body.appendChild(overlay);
  overlay.querySelector('[data-gpt-close]').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (event) => { if (event.target === overlay) overlay.remove(); });
  overlay.querySelector('[data-gpt-run]').addEventListener('click', () => runWorkflow(overlay));
  overlay.querySelector('[data-gpt-target]').focus();
}

function renderResult(root, data) {
  const result = root.querySelector('[data-gpt-result]');
  if (!result) return;
  const v4 = data?.v4Decision;
  const gpt = data?.gpt;
  const trace = Array.isArray(gpt?.toolTrace) ? gpt.toolTrace : [];
  const status = data?.status || gpt?.status || 'UNKNOWN';
  const decision = v4?.decision || gpt?.output?.decision || 'NON DÉCIDÉ';
  const reason = v4?.reason || gpt?.output?.reason || gpt?.reason || 'Aucune raison disponible.';
  const next = gpt?.output?.nextAction || data?.state?.nextAllowedAction || 'STOP';
  result.innerHTML = `
    <div style="border:1px solid #252d33;border-radius:10px;padding:13px;background:#0b0f12">
      <div style="display:flex;justify-content:space-between;gap:10px"><b>Résultat V4</b><span style="color:#d7b45a">${escapeHtml(status)}</span></div>
      <div style="margin-top:12px;font-size:18px;font-weight:800">${escapeHtml(decision)}</div>
      <p style="color:#c4cbd0;font-size:11px;line-height:1.5">${escapeHtml(reason)}</p>
      <div style="color:#8d979e;font-size:10px">Prochaine action : <b style="color:#f4f6f5">${escapeHtml(next)}</b></div>
      <div style="margin-top:10px;color:#687279;font-size:9px">GPT ${escapeHtml(gpt?.promptVersion || '—')} · ${trace.length} tool call(s)</div>
    </div>`;
}

async function runWorkflow(root) {
  const input = root.querySelector('[data-gpt-target]');
  const run = root.querySelector('[data-gpt-run]');
  const target = input?.value?.trim();
  if (!target) return;
  run.disabled = true;
  run.textContent = 'Analyse en cours…';
  try {
    const candidate = isAlibabaUrl(target) ? { sourceUrl: target } : null;
    const response = await fetch('/api/gpt-sourcing', {
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({ target, candidate }),
    });
    const data = await response.json().catch(() => ({ status:'INVALID_RESPONSE' }));
    renderResult(root, response.ok ? data : { status:`HTTP_${response.status}`, gpt:data });
  } catch (error) {
    renderResult(root, { status:'NETWORK_ERROR', gpt:{ reason:error instanceof Error ? error.message : 'network_error' } });
  } finally {
    run.disabled = false;
    run.textContent = 'Lancer GPT → V4';
  }
}

function boot() {
  mountPanel();
  document.documentElement.dataset.v4GptSourcingUi = UI_VERSION;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
}
