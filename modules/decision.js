// V4 Sourcing Intelligence - Decision module
export function makeDecision({score=0, dataConfidence="incomplete"}) {
  if (dataConfidence === "incomplete") return "ATTENDRE";
  if (score >= 75) return "TESTER";
  if (score >= 55) return "APPROFONDIR";
  return "EVITER";
}
