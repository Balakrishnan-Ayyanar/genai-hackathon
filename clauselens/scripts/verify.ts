import assert from 'node:assert/strict';
import fs from 'node:fs';
import {retrieve} from '../src/integrations.ts';
import {baselineCase} from '../src/model.ts';
const base='http://localhost:3100';
async function post(endpoint:string,body:unknown){const r=await fetch(base+'/api/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.ok(r.ok,`API ${endpoint} returned ${r.status}`);return r.json();}
const snapshot=await retrieve();const source=JSON.parse(fs.readFileSync('data/evidence.json','utf8'));
assert.equal(snapshot.evidence.length,source.length);
const canonical=(rows:any[])=>rows.map(({lineage,...e})=>({...e,facts:{...e.facts,...(e.facts.purposes?{purposes:[...e.facts.purposes].sort()}: {})}})).sort((a,b)=>a.id.localeCompare(b.id));
assert.deepEqual(canonical(snapshot.evidence),canonical(source));
assert.equal(snapshot.mode,'live-zetaris-usl');assert.equal(snapshot.sourceCount,5);
console.log(`PASS real Zetaris retrieval: ${snapshot.evidence.length} records exactly match fictional source`);
const first=await post('evaluate',{request:baselineCase,scenario:'none'});assert.equal(first.decision.outcome,'unknown');assert.equal(first.snapshot.semanticModel.name,'lightning.metastore.clauselens.sharing_model');assert.equal(first.snapshot.queries.find((q:any)=>q.table==='approval').rowCount,0);assert.equal(first.decision.evidence.length,8);
const after=await post('evaluate',{request:baselineCase,scenario:'add-approval'});assert.equal(after.decision.outcome,'permitted');assert.equal(after.baseline.outcome,'unknown');assert.equal(after.comparison.changedChecks[0].id,'approval');
const original=await post('evaluate',{request:baselineCase,scenario:'none'});assert.equal(original.decision.outcome,'unknown');assert.ok(original.recalled.some((m:any)=>m.scenarioExcluded&&m.currentOutcome==='unknown'));
console.log('PASS live API canonical before/after, simulation isolation, persisted H-MEM recall and revalidation');
const scenarios:[Partial<typeof baselineCase>,string][]=[[{purpose:'marketing'},'permitted'],[{supplierId:'supplier-b'},'denied'],[{documentId:'doc-vega'},'denied'],[{purpose:'audit'},'conflict']];
for(const [change,expected] of scenarios){const d=await post('evaluate',{request:{...baselineCase,...change}});assert.equal(d.decision.outcome,expected);}
console.log('PASS live API valid, expired NDA, prohibited classification and conflicting approvals');
const explanation=await post('explain',{id:first.id});assert.equal(explanation.mode,'live-nightshift');assert.ok(explanation.focusCheckIds.length);console.log('PASS Nightshift model response; verified evidence focus; routed model:',explanation.model);
const interpretation=await post('interpret',{question:baselineCase.question,date:baselineCase.date});assert.equal(interpretation.documentId,'doc-orion');assert.equal(interpretation.supplierId,'supplier-a');assert.equal(interpretation.purpose,'technical review');
const ambiguous=await post('interpret',{question:'Can I share the report with them?',date:baselineCase.date});assert.ok(ambiguous.clarification);assert.equal(ambiguous.documentId,'');assert.equal(ambiguous.supplierId,'');console.log('PASS real Nightshift question interpretation and ambiguous-question clarification');
