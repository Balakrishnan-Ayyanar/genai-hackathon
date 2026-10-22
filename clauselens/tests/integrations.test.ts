import {test} from 'node:test';
import assert from 'node:assert/strict';
import {model,retrieve,interpret} from '../src/integrations.ts';
import {evaluate} from '../src/evaluator.ts';
import {baselineCase} from '../src/model.ts';
import fixtures from '../data/evidence.json';
import {EvidenceSchema} from '../src/model.ts';
const evidence=fixtures.map(e=>EvidenceSchema.parse(e));
test('service failures, reasoning artifacts, unknown references and ambiguity fail safely',async()=>{const original=globalThis.fetch;try{
 globalThis.fetch=async()=>new Response('{}',{status:503});
 await assert.rejects(retrieve(),/Zetaris retrieval failed/);await assert.rejects(model([]),/Nightshift returned HTTP 503/);
 assert.equal(evaluate({...baselineCase,purpose:'marketing'},evidence).outcome,'permitted');
 globalThis.fetch=async()=>Response.json({model:'test-only',choices:[{message:{content:'private reasoning</think>final'}}]});assert.equal((await model([])).text,'final');
 globalThis.fetch=async()=>Response.json({choices:[{message:{content:'<think>unfinished'}}]});await assert.rejects(model([]),/incomplete final/);
 globalThis.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({documentId:'nonexistent',supplierId:'supplier-a',purpose:'technical review'})}}]});await assert.rejects(interpret(baselineCase.question,evidence,baselineCase.date),/unknown entity/);
 globalThis.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({documentId:'doc-orion',supplierId:'supplier-a',purpose:'technical review'})}}]});
 const ambiguous=await interpret('Can I share Orion with Supplier A or Supplier B for technical review and marketing?',evidence,baselineCase.date);assert.equal(ambiguous.supplierId,'');assert.equal(ambiguous.purpose,'');assert.ok(ambiguous.clarification);
 }finally{globalThis.fetch=original;}});
