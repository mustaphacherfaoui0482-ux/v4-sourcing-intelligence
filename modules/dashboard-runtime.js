import { evaluateOpportunity } from './decision-engine.js';
import { calculateOfferEconomics } from './v4-offer-economics-engine.js';
import { buildRadarOpportunity } from './radar-orchestrator.js';
import { toOpportunityViewModel } from './ui-adapter.js';

export const DEMO_OPPORTUNITY = Object.freeze({
  id:'demo-hoodie-dz-premium', product:'HOODIE DZ - PREMIUM 450GSM', source:'1688', country:'CN',
  offer:{salePrice:29.9,landedCost:7,variableFees:1.22,cac:6.1,targetMargin:30,visitors:1000,conversionRate:2.5},
  demandScore:90,sourcingScore:92,profitabilityScore:90,riskScore:18,confidence:92,
  marketingScore:90,easeOfTest:80,availability:80,potential:90,landedCostScore:90,
});

function engineInput(o){return{demand:o.demandScore,marketing:o.marketingScore??o.demandScore,sourcing:o.sourcingScore,profitability:o.profitabilityScore,confidence:o.confidence,economics:calculateOfferEconomics(o.offer)}}
export function calculateDashboardState(o=DEMO_OPPORTUNITY){
 const economics=calculateOfferEconomics(o.offer);
 const decision=evaluateOpportunity({...o,landedCost:o.offer.landedCost,margin:economics.netContributionMargin});
 const canonical=buildRadarOpportunity({id:o.id,product:o.product,source:o.source,country:o.country,radarSignals:engineInput(o),dimensions:{potential:o.potential,demand:o.demandScore,margin:economics.netContributionMargin,availability:o.availability,landedCost:o.landedCostScore,risk:o.riskScore,easeOfTest:o.easeOfTest,dataConfidence:o.confidence},economics,decision});
 return Object.freeze({economics,decision,opportunity:canonical,viewModel:toOpportunityViewModel(canonical)});
}
const money=v=>`${Number(v).toFixed(2).replace('.',',')} €`;
const setText=(n,v)=>{if(n)n.textContent=v};
function setGauge(node,score){if(!node)return;const n=Math.max(0,Math.min(100,Number(score)||0));node.style.background=`conic-gradient(var(--green,#79df31) 0 ${n*3.6}deg,#24302d ${n*3.6}deg)`;setText(node.querySelector('b'),String(Math.round(n)))}
function setDecisionStyle(node,decision){if(!node)return;node.classList.remove('good');node.style.color=decision==='TESTER'?'var(--green,#79df31)':decision==='EVITER'?'var(--red,#ef5b52)':'var(--orange,#f0a52b)'}
function render(state){
 const vm=state.viewModel,cards=[...document.querySelectorAll('.kpis .kpi')];
 if(cards.length>=5){setGauge(cards[0].querySelector('.gauge'),vm.score);setText(cards[0].querySelector('.sub'),Number(vm.score)>=75?'Score opportunité élevé':Number(vm.score)>=50?'Potentiel à approfondir':'Potentiel faible');setText(cards[1].querySelector('.val'),vm.dimensions.landedCost);setText(cards[2].querySelector('.val'),vm.dimensions.margin);setText(cards[3].querySelector('.val'),money(vm.economics.maxCacAtTargetMargin));setText(cards[4].querySelector('.decision'),vm.decision);setText(cards[4].querySelector('.sub'),vm.decisionReason);setDecisionStyle(cards[4].querySelector('.decision'),vm.decision)}
 const signals=[...document.querySelectorAll('.signals .sig')];
 if(signals.length>=5){setText(signals[0].querySelector('span'),`${state.opportunity.dimensions.potential??0}/100`);setText(signals[1].querySelector('span'),`${state.opportunity.dimensions.demand??0}/100`);setText(signals[2].querySelector('span'),`${state.opportunity.dimensions.margin??0}%`);setText(signals[3].querySelector('span'),`${state.opportunity.dimensions.risk??0}/100`);setText(signals[4].querySelector('span'),`Preuve : ${state.opportunity.evidenceLevel??'P0'}`)}
 const badges=[...document.querySelectorAll('.pbadge')];if(badges[0]&&state.opportunity.evidenceLevel)badges[0].textContent=`${state.opportunity.evidenceLevel} · niveau de preuve`;
 const d=document.querySelector('.diagnostic');if(d){const s=state.economics.status==='healthy'?'Économie compatible avec un test.':state.economics.status==='thin_margin'?'Marge trop fine pour la cible.':'Économie déficitaire.';d.textContent=`Diagnostic : ${s} Contribution après acquisition : ${money(state.economics.contributionAfterAds)} par commande. La preuve fournisseur et la validation qualité restent déterminantes avant achat.`}
}
function feedback(text){document.querySelector('[data-v4-feedback]')?.remove();const el=document.createElement('div');el.dataset.v4Feedback='true';el.textContent=text;Object.assign(el.style,{position:'fixed',right:'18px',bottom:'18px',zIndex:'9999',padding:'10px 13px',border:'1px solid #5b4a27',borderRadius:'8px',background:'#11100d',color:'#d7b45a',font:'600 11px Inter,system-ui,sans-serif',boxShadow:'0 10px 30px #0008'});document.body.appendChild(el);window.setTimeout(()=>el.remove(),1800)}
function sourcingStatus(product,stage,done=false){document.querySelector('[data-v4-sourcing-run]')?.remove();const el=document.createElement('div');el.dataset.v4SourcingRun='true';Object.assign(el.style,{position:'fixed',left:'50%',top:'18px',transform:'translateX(-50%)',zIndex:'10000',width:'min(520px,calc(100vw - 24px))',padding:'12px 14px',border:`1px solid ${done?'#315c3d':'#5b4a27'}`,borderRadius:'10px',background:'#0d1012',color:'#f3f4f2',font:'600 11px Inter,system-ui,sans-serif',boxShadow:'0 14px 40px #0009'});el.innerHTML=`<div style="display:flex;justify-content:space-between"><span>SOURCING</span><b style="color:${done?'#79df31':'#d7b45a'}">${done?'TERMINÉ':'EN COURS'}</b></div><div style="margin-top:6px;color:#9da4a8">${product}</div><div style="margin-top:7px;color:${done?'#79df31':'#d7b45a'}">Étape : ${stage}</div>`;document.body.appendChild(el);if(done)window.setTimeout(()=>el.remove(),2600)}
function startSourcing(product=DEMO_OPPORTUNITY.product){const name=String(product||'').trim();if(!name)return null;const stages=['Découverte','Analyse','Scoring','Rentabilité','Validation','Décision'];let i=0;sourcingStatus(name,stages[i]);const next={...DEMO_OPPORTUNITY,id:`manual-${Date.now()}`,product:name};initDashboardRuntime(next);const timer=window.setInterval(()=>{i+=1;if(i>=stages.length){window.clearInterval(timer);sourcingStatus(name,'Décision disponible',true);feedback(`Sourcing terminé : ${name}`);return}sourcingStatus(name,stages[i])},450);return next}
function scrollToTarget(selector,label){const target=document.querySelector(selector);if(target){target.scrollIntoView({behavior:'smooth',block:'center'});feedback(label)}else feedback(`${label} : section indisponible`)}
function addSectionButtons(){
 if(document.querySelector('[data-v4-section-actions]'))return;
 const configs=[
  ['Radar Sourcing','.radar','Ouvrir le radar','radar'],
  ['Opportunités prioritaires','.table','Analyser les opportunités','opportunities'],
  ['Priorité unique','.diagnostic','Voir le diagnostic','diagnostic'],
  ['Validation avant achat','.flow','Ouvrir la validation','qc'],
 ];
 configs.forEach(([label,selector,text,key])=>{const panel=[...document.querySelectorAll('.panel')].find(p=>p.querySelector('h2')?.textContent.trim()===label);if(!panel)return;const head=panel.querySelector('.panelHead');if(!head)return;const b=document.createElement('button');b.className='btn';b.type='button';b.dataset.v4SectionAction=key;b.textContent=text;b.style.padding='7px 10px';b.style.fontSize='10px';head.appendChild(b)});
 const priority=[...document.querySelectorAll('.panel')].find(p=>p.querySelector('h2')?.textContent.trim()==='Priorité unique');
 if(priority&&!priority.querySelector('[data-v4-section-actions]'))priority.dataset.v4SectionActions='true';
}
function wireActions(state){
 if(document.documentElement.dataset.v4ActionsWired==='true')return;document.documentElement.dataset.v4ActionsWired='true';addSectionButtons();
 const buttons=[...document.querySelectorAll('button')];
 const exportButton=buttons.find(b=>/Exporter/i.test(b.textContent));
 if(exportButton)exportButton.addEventListener('click',()=>{const current=window.V4SourcingRuntime??state;const report={product:current.opportunity.product,score:current.opportunity.score,decision:current.opportunity.decision,reason:current.opportunity.decisionReason,evidenceLevel:current.opportunity.evidenceLevel,economics:current.economics,generatedAt:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='v4-sourcing-intelligence-report.json';document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),250)});
 buttons.filter(b=>b.dataset.action==='new'||/Nouveau sourcing|Lancer une vérification/i.test(b.textContent)).forEach(b=>b.addEventListener('click',()=>{const product=window.prompt('Produit à analyser');if(product?.trim())startSourcing(product)}));
 const navTargets={'Dashboard':'.hero','Radar Sourcing':'.radar','Opportunités':'.table','Fournisseurs':'.table','Coût rendu':'.kpis','Échantillon & QC':'.section:last-of-type','Décisions':'.kpis .kpi:nth-child(5)','Rentabilité':'.grid','Veille & Alertes':'.diagnostic'};
 [...document.querySelectorAll('.nav a')].forEach(link=>link.addEventListener('click',event=>{event.preventDefault();document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('on'));link.classList.add('on');const label=link.textContent.replace(/^[^\p{L}\p{N}€]+/u,'').trim();if(label==='Radar Sourcing')startSourcing(window.V4SourcingRuntime?.opportunity?.product||DEMO_OPPORTUNITY.product);else scrollToTarget(navTargets[label]||'.hero',label)}));
 document.querySelectorAll('[data-v4-section-action]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.v4SectionAction;if(key==='radar')startSourcing(window.V4SourcingRuntime?.opportunity?.product||DEMO_OPPORTUNITY.product);else if(key==='opportunities')scrollToTarget('.table','Opportunités');else if(key==='diagnostic')scrollToTarget('.diagnostic','Diagnostic');else if(key==='qc')scrollToTarget('.section:last-of-type','Validation QC')}));
}
export function initDashboardRuntime(opportunity=DEMO_OPPORTUNITY){try{const state=calculateDashboardState(opportunity);render(state);wireActions(state);document.documentElement.dataset.v4Runtime='ready';window.V4SourcingRuntime=Object.freeze(state);return state}catch(error){document.documentElement.dataset.v4Runtime='error';console.error('[V4 Sourcing] runtime initialization failed',error);sourcingStatus(opportunity?.product||'Produit inconnu','Erreur d’initialisation',true);return null}}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initDashboardRuntime(),{once:true});else initDashboardRuntime()}
