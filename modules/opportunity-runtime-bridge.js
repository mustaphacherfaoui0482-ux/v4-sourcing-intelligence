import { getRecords } from '../data/v4-data-layer.js';

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

function isRuntimeOpportunity(value) {
  return Boolean(value?.product && value?.offer && typeof value.offer === 'object');
}

export function getActiveOpportunity() {
  const globalOpportunity = typeof window !== 'undefined' ? window.V4SourcingOpportunity : null;
  const storedOpportunity = readStoredOpportunity();
  const records = getRecords('opportunities');
  const latestRecord = records.length ? records[records.length - 1] : null;

  if (isRuntimeOpportunity(globalOpportunity)) return globalOpportunity;
  if (isRuntimeOpportunity(storedOpportunity)) return storedOpportunity;
  if (isRuntimeOpportunity(latestRecord)) return latestRecord;
  return null;
}

export function setActiveOpportunity(opportunity) {
  if (!isRuntimeOpportunity(opportunity)) {
    throw new TypeError('A runtime Opportunity with product and offer is required');
  }

  if (typeof window !== 'undefined') window.V4SourcingOpportunity = opportunity;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opportunity));
  }

  return opportunity;
}
