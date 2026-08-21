import { getRecords } from '../data/v4-data-layer.js';
import { createOpportunity } from './opportunity-model.js';

const STORAGE_KEY = 'v4.activeOpportunity';

function readStoredOpportunity() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeOpportunity(value) {
  if (!value || typeof value !== 'object') return null;
  try {
    return createOpportunity(value);
  } catch {
    return value;
  }
}

export function getActiveOpportunity() {
  const globalOpportunity = typeof window !== 'undefined' ? window.V4SourcingOpportunity : null;
  const storedOpportunity = readStoredOpportunity();
  const records = getRecords('opportunities');
  const latestRecord = records.length ? records[records.length - 1] : null;

  return normalizeOpportunity(globalOpportunity)
    ?? normalizeOpportunity(storedOpportunity)
    ?? normalizeOpportunity(latestRecord)
    ?? null;
}

export function setActiveOpportunity(opportunity) {
  const canonical = normalizeOpportunity(opportunity);
  if (!canonical) throw new TypeError('A valid Opportunity is required');

  if (typeof window !== 'undefined') window.V4SourcingOpportunity = canonical;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(canonical));
  }

  return canonical;
}
