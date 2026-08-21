// V4 runtime bridge — keeps the dashboard UI synchronized with the decision engine.
import { evaluateOpportunity } from './modules/decision-engine.js';

const clamp = (value) => Math.max(0, Math.min(100, Number(value) || 0));

function readPercent(selector) {
  const node = document.querySelector(selector);
  if (!node) return 0;
  const match = node.textContent.match(/-?\d+(?:[.,]\d+)?/);
  return match ? clamp(Number(match[0].replace(',', '.'))) : 0;
}

function applyDecision() {
  const result = evaluateOpportunity({
    demandScore: readPercent('.sig:nth-child(1) b'),
    sourcingScore: readPercent('.sig:nth-child(3) b'),
    riskScore: 100 - readPercent('.sig:nth-child(4) b'),
    confidence: readPercent('.sig:nth-child(5) b'),
    profitabilityScore: readPercent('.kpi:nth-child(3) .val'),
  });

  const decision = document.querySelector('.decision');
  if (decision) {
    decision.textContent = result.decision;
    decision.title = result.reason;
  }

  const score = document.querySelector('.gauge b');
  if (score) score.textContent = String(result.score);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyDecision, { once: true });
} else {
  applyDecision();
}
