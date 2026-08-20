// V4 Production Readiness Engine v1

const STATUS = {
  READY: 'ready',
  REVIEW: 'review',
  BLOCKED: 'blocked'
};

function evaluateReadiness(checks = []) {
  const total = checks.length;
  const passed = checks.filter((check) => check === true || check.status === 'pass').length;

  if (total === 0) return { status: STATUS.REVIEW, score: 0 };

  const score = Math.round((passed / total) * 100);

  let status = STATUS.BLOCKED;
  if (score >= 90) status = STATUS.READY;
  else if (score >= 60) status = STATUS.REVIEW;

  return { status, score };
}

module.exports = {
  evaluateReadiness,
  STATUS
};
