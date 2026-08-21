// V4 Sourcing Intelligence - Decision Engine v2
// Moteur de décision contrôlable sans IA.
import '../v4-premium-shell.css';
import { evaluateOfferForDecision } from './v4-offer-engine-adapter.js';
export const DECISIONS={TEST:'TESTER',ANALYZE:'APPROFONDIR',WAIT:'ATTENDRE',REJECT:'EVITER'};
export function evaluateOpportunity(data={}){
 const demand=data.demandScore??0,sourcing=data.sourcingScore??0,risk=data.riskScore??100,confidence=data.confidence??0;
 let profitability=data.profitabilityScore??0,offer=null;
 if(data.offer){offer=evaluateOfferForDecision(data.offer);const marginScore=Math.max(0,Math.min(100,offer.economics.netContributionMargin*2));profitability=Math.round(profitability*.4+marginScore*.4+offer.resilience*.2);if(offer.economics.status==='loss')profitability=Math.min(profitability,20);}
 const score=Math.round(demand*.25+sourcing*.2+profitability*.3+confidence*.15+(100-risk)*.1);
 if(confidence<40)return{decision:DECISIONS.WAIT,score,profitability,offer,reason:'Données insuffisantes'};
 if(risk>70||score<40||offer?.recommendation==='avoid')return{decision:DECISIONS.REJECT,score,profitability,offer,reason:'Risque ou économie insuffisante'};
 if(score>=75&&(!offer||offer.resilience>=67))return{decision:DECISIONS.TEST,score,profitability,offer,reason:'Opportunité à tester'};
 return{decision:DECISIONS.ANALYZE,score,profitability,offer,reason:'Analyse complémentaire nécessaire'};
}
