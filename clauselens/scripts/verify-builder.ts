import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://localhost:3100/api';
const response=await fetch(base+'/builder/proposals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({goal:'Connect document registry, supplier master, NDA agreements, owner decisions and policy clauses for external document sharing. Preserve source identity, effective dates and opposing records. Ask for clarification when source identifier meanings are uncertain.'})});
const proposal=await response.json();assert.ok(response.ok,proposal.error??'Proposal request failed');assert.equal(proposal.plan.tables.length,7);assert.equal(proposal.plan.relationships.length,5);assert.ok(proposal.plan.questions.some((q:any)=>q.id==='recipient_namespace'));assert.ok(proposal.model&&!proposal.model.includes('test-double'));
fs.mkdirSync('.runtime',{recursive:true});fs.writeFileSync('.runtime/builder-probe-id',proposal.id);console.log('PASS live discovery and Nightshift proposal:',proposal.id,'route:',proposal.model);console.log('Saved proposal for review. No deployment or model selection performed.');
