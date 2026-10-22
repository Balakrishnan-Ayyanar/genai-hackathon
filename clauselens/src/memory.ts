import { HMEM } from '../vendor/hmem/reference/src/index.ts';
import { evaluate } from './evaluator.ts';
import { type Decision, type Evidence } from './model.ts';
import fs from 'node:fs';
import path from 'node:path';
export function memoryService(dir=path.resolve('.runtime/hmem')){
 const hmem=new HMEM({persistDir:dir,actor:'clauselens'});
 return {
 recall(decision:Decision,evidence:Evidence[],hash:string){
 const q=`Project report ${decision.request.documentId} ${decision.request.supplierId} ${decision.request.purpose}`;
 // Filter by case before limiting displayed findings. Keep the two newest
 // qualifying findings as well as ranked leads so repeat reads cannot bury
 // a newly simulated scenario behind frequently accessed originals.
 const ranked=hmem.query(q,{topN:Math.max(5,hmem.store.all().length)}).memories.filter(({memory})=>{
 try{const prior=JSON.parse(memory.content);return prior.request.documentId===decision.request.documentId&&prior.request.supplierId===decision.request.supplierId&&prior.request.purpose===decision.request.purpose;}catch{return false;}
 });
 const recent=[...ranked].sort((a,b)=>b.memory.timestamp-a.memory.timestamp||Number(b.memory.id.replace('mem-',''))-Number(a.memory.id.replace('mem-','')));
 const matches=[...new Map([...recent.slice(0,2),...ranked].map(m=>[m.memory.id,m])).values()].slice(0,5);
 return matches.map(({memory,relevance})=>{
 let previous:any;try{previous=JSON.parse(memory.content);}catch{return null;}
 if(previous.request.documentId!==decision.request.documentId||previous.request.supplierId!==decision.request.supplierId||previous.request.purpose!==decision.request.purpose)return null;
 const revalidated=evaluate({...previous.request,date:decision.request.date},evidence);
 return {id:memory.id,previousOutcome:previous.outcome,currentOutcome:revalidated.outcome,evidenceChanged:previous.hash!==hash,evaluationDateChanged:previous.request.date!==decision.request.date,previousDate:previous.request.date,previousScenario:previous.scenario,scenarioExcluded:previous.scenario!=='none',relevance,source:memory.source,provenance:memory.provenance,detail:'Revalidated against freshly retrieved original evidence at the current evaluation date. Remembered or simulated findings are not approval evidence.'};
 }).filter(Boolean);
 },
 remember(decision:Decision,hash:string,evaluationId:string,scenario:string){
 return hmem.add({content:JSON.stringify({request:decision.request,outcome:decision.outcome,hash,scenario}),type:'factual',layer:'working',tags:['project:clauselens','report','review'],confidence:1,source:`evaluation:${evaluationId}`,provenance:{origin:'plan_completion',learnedAt:Date.now(),label:`${scenario==='none'?'Original':'SIMULATED'} case finding; revalidation required`,refs:decision.checks.flatMap(c=>c.sourceIds)}}).id;
 },
 audit(){const f=path.join(dir,'ledger.jsonl');return {records:hmem.store.all().length,ledgerEntries:fs.existsSync(f)?fs.readFileSync(f,'utf8').trim().split('\n').length:0,implementation:'Meterless H-MEM upstream reference (vendored)',persistent:true};}
 };
}
