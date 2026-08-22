import test from 'node:test';
import assert from 'node:assert/strict';
import { EVIDENCE_LEVELS, compareEvidenceLevel, isVerifiedEvidence, normalizeEvidenceLevel } from '../modules/evidence-level.js';

test('evidence levels are exactly P0-P4 and ordered', () => {
  assert.equal(normalizeEvidenceLevel('invalid'), EVIDENCE_LEVELS.P0);
  assert.equal(compareEvidenceLevel('P4', 'P0'), 4);
  assert.equal(compareEvidenceLevel('P2', 'P3'), -1);
});

test('P3 and P4 are verified evidence', () => {
  assert.equal(isVerifiedEvidence('P2'), false);
  assert.equal(isVerifiedEvidence('P3'), true);
  assert.equal(isVerifiedEvidence('P4'), true);
});
