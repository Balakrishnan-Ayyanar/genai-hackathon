import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sql,retrieve} from '../../src/integrations.ts';
import {sources,tables,MODEL_PATH,MODEL_NAME,MODEL_NAMESPACE} from '../../src/semantic.ts';
import {baselineCase} from '../../src/model.ts';
const receipt:{checks:string[];model:string;checkedAt:string}={checks:[],model:MODEL_PATH,checkedAt:new Date().toISOString()};
function pass(message:string){console.log('PASS',message);receipt.checks.push(message);}
const loaded=await sql(`LOAD USL ${MODEL_NAME} NAMESPACE ${MODEL_NAMESPACE}`);
const model=JSON.parse(String(loaded[0][0]));
assert.equal(model.tables.length,7);
const fks=model.tables.flatMap((t:any)=>t.columnSpecs.filter((c:any)=>c.foreignKey));assert.equal(fks.length,5);
pass('Deployed USL has seven tables and five persisted foreign-key relationships');
for(const source of sources){const native=await fetch('http://localhost:3100'+source.endpoint).then(r=>{assert.ok(r.ok);return r.json();});for(const table of tables.filter(t=>t.source===source.id)){const rows=await sql(`SELECT COUNT(*) FROM ${MODEL_PATH}.${table.name}`);assert.equal(Number(rows[0][0]),native[table.collection].length);pass(`${table.name}: source and USL counts match (${rows[0][0]})`);}}
const normalize=(records:any[])=>records.map(({lineage,...e})=>({...e,facts:{...e.facts,...(e.facts.purposes?{purposes:[...e.facts.purposes].sort()}: {})}})).sort((a,b)=>a.id.localeCompare(b.id));
const snapshot=await retrieve();assert.deepEqual(normalize(snapshot.evidence),normalize(JSON.parse(fs.readFileSync('data/evidence.json','utf8'))));assert.equal(snapshot.sourceCount,5);assert.ok(snapshot.evidence.every(e=>e.lineage));pass('All 17 normalized evidence records preserve original source passages, facts, versions and dates');
const scoped=await retrieve(baselineCase);assert.equal(scoped.evidence.length,8);assert.equal(scoped.queries.find(q=>q.table==='approval')!.rowCount,0);assert.equal(scoped.evidence.filter(e=>e.kind==='Document').length,1);pass('Case-scoped retrieval preserves Orion with zero matching approvals (no inner-join loss)');
const conflicts=await retrieve({...baselineCase,purpose:'audit'});assert.equal(conflicts.evidence.filter(e=>e.kind==='Approval').length,2);pass('Opposing approval records both survive semantic retrieval');
const join=await sql(`SELECT d.document_id, s.supplier_id, n.agreement_id FROM ${MODEL_PATH}.document d CROSS JOIN ${MODEL_PATH}.supplier s JOIN ${MODEL_PATH}.agreement n ON n.supplier_id = s.supplier_id WHERE d.document_id = 'doc-orion' AND s.supplier_id = 'supplier-a'`);assert.deepEqual(join,[['doc-orion','supplier-a','nda-a']]);pass('Cross-source SQL join resolves normalized supplier keys');
// A reversible fictional label probe demonstrates live access without materialization.
const file='data/sources/approval-register.json',original=fs.readFileSync(file,'utf8');
try{const native=JSON.parse(original);native.approvals[0].decision_title+=' · live virtualization probe';fs.writeFileSync(file,JSON.stringify(native,null,2)+'\n');const rows=await sql(`SELECT label FROM ${MODEL_PATH}.approval WHERE approval_id = 'approval-marketing'`);assert.match(String(rows[0][0]),/live virtualization probe/);pass('A native source-file change is visible through USL without reload or materialization');}finally{fs.writeFileSync(file,original);}
const restored=await sql(`SELECT label FROM ${MODEL_PATH}.approval WHERE approval_id = 'approval-marketing'`);assert.equal(restored[0][0],'Approval Marketing');pass('Live source probe restored and verified');
fs.mkdirSync('.runtime',{recursive:true});fs.writeFileSync('.runtime/semantic-verification.json',JSON.stringify(receipt,null,2)+'\n');
