/**
 * V4 Sourcing Intelligence — Test Planner v1
 * Converts a TEST decision into an actionable validation plan.
 */

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

export function createTestPlan(input = {}) {
  const confidence = clamp(input.confidence);
  const risk = clamp(input.risk);
  const margin = clamp(input.margin);

  const sampleQuantity = risk > 60 ? 3 : 1;
  const testBudget = Math.round(
    (Number(input.productCost) || 0) * sampleQuantity +
    (Number(input.marketingBudget) || 0)
  );

  const criteria = [
    'validate_product_quality',
    'validate_supplier_reliability',
    'measure_customer_interest',
    'confirm_real_margin'
  ];

  return {
    sampleQuantity,
    testBudget,
    estimatedDurationDays: confidence >= 70 ? 14 : 30,
    criteria,
    status: margin >= 50 && risk < 70 ? 'ready_for_test' : 'needs_review'
  };
}
