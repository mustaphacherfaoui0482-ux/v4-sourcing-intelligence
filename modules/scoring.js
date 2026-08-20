// V4 Sourcing Intelligence - Score engine foundation
export function calculateV4Score(criteria={}){
  let score = 0;
  if(criteria.margin) score += 25;
  if(criteria.dataConfidence) score += 20;
  if(criteria.supplierAvailable) score += 20;
  if(criteria.testReady) score += 15;
  if(criteria.riskLow) score += 20;
  return Math.min(100, score);
}
