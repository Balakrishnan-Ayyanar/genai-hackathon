import {test,expect,type Page} from '@playwright/test';
const unknown='Permission isn’t established yet.';
const permitted='Permitted under the supplied policy and evidence';
async function open(page:Page){await page.goto('/');await expect(page.getByText('Zetaris connected',{exact:true})).toBeVisible();}
async function ask(page:Page,title=unknown){await page.getByRole('button',{name:'Ask ClauseLens',exact:true}).click();await expect(page.locator('.outcome h2')).toHaveText(title,{timeout:95000});await expect(page.getByRole('button',{name:'Ask ClauseLens',exact:true})).toBeEnabled();}
// Explicit UI test double: isolate alternate states without spending provider quota.
// Zetaris retrieval and deterministic evaluation still run against the real app.
async function mockInterpretation(page:Page){await page.route('**/api/interpret',async route=>{
 const {question}=route.request().postDataJSON();
 await route.fulfill({json:{documentId:question.toLowerCase().includes('vega')?'doc-vega':'doc-orion',supplierId:question.includes('Supplier B')?'supplier-b':'supplier-a',purpose:question.includes('marketing')?'marketing':question.includes('audit')?'audit':'technical review',clarification:null,model:'test-double/browser-only'}});
});}

test('real question-first demo, sources, graph, scenario isolation and memory',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await open(page);
 await expect(page.locator('.case-review')).not.toHaveAttribute('open');await expect(page.locator('.outcome')).toHaveCount(0);
 await page.screenshot({path:info.outputPath('question-first-start.png'),fullPage:true});
 const steps:string[]=[];page.on('request',r=>{if(r.method()==='POST'&&/\/api\/(interpret|evaluate)$/.test(r.url()))steps.push(r.url().split('/').pop()!);});
 await ask(page);expect(steps).toEqual(['interpret','evaluate']);await expect(page.locator('.understood')).toContainText('Project Orion');await expect(page.locator('.understood')).toContainText('nvidia/');
 await expect(page.locator('.answer-provenance')).toContainText('AI-interpreted question');
 await expect(page.locator('.check-card.pass')).toHaveCount(2);await expect(page.locator('.check-card.unknown')).toHaveCount(1);
 await page.screenshot({path:info.outputPath('question-first-answer.png'),fullPage:true});
 await page.getByRole('button',{name:/Missing fact.*Document-owner approval/}).click();await expect(page.getByRole('dialog')).toContainText('SRC-POLICY-APPROVAL');await expect(page.getByRole('dialog')).toContainText('POL-2026.1');await expect(page.getByRole('dialog')).toContainText('Effective dates');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('button',{name:/Missing fact.*Document-owner approval/})).toBeFocused();
 await page.getByRole('button',{name:'Inspect Project Orion · Design report',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('SRC-DOC-ORION');await expect(page.getByRole('dialog')).toContainText('lightning.metastore.clauselens.sharing_model.document');await page.getByRole('button',{name:'Close evidence inspector'}).click();
 const relationship=page.getByRole('button',{name:'classified as, doc-orion to class-partner',exact:true});await relationship.scrollIntoViewIfNeeded();
 const point=await relationship.locator('.edge-hit').evaluate(node=>{const path=node as SVGPathElement;const pt=path.getPointAtLength(path.getTotalLength()/2);const screen=new DOMPoint(pt.x,pt.y).matrixTransform(path.getScreenCTM()!);return {x:screen.x,y:screen.y};});await page.mouse.click(point.x,point.y);await expect(page.getByRole('dialog')).toContainText('SRC-DOC-ORION');await page.getByRole('button',{name:'Close evidence inspector'}).click();
 await page.getByRole('button',{name:'+ Simulate owner approval',exact:true}).click();await expect(page.locator('.outcome h2')).toHaveText(permitted);await expect(page.locator('.comparison')).toContainText('Document-owner approval: Missing fact → Pass');await page.getByRole('button',{name:'Inspect SIMULATED · Owner approval',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('SIMULATION-ONLY');await page.getByRole('button',{name:'Close evidence inspector'}).click();
 await page.screenshot({path:info.outputPath('question-first-simulation.png'),fullPage:true});
 await page.getByRole('button',{name:'Restore original evidence'}).click();await expect(page.locator('.outcome h2')).toHaveText(unknown);await page.getByRole('tab',{name:/Case memory/}).click();await expect(page.locator('.memory-view')).toContainText('Previous simulation excluded from evidence.');await page.getByRole('tab',{name:'Source records'}).click();await expect(page.locator('.source-list button')).toHaveCount(8);await expect(page.locator('.source-list')).not.toContainText('SIMULATION-ONLY');
 // Simulations rerun checks, but do not silently replace the interpreted case.
 expect(steps.filter(s=>s==='interpret')).toHaveLength(1);expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('alternate question examples and NDA what-if (mocked interpretation)',async({page})=>{
 await mockInterpretation(page);await open(page);
 for(const [name,title] of [['Orion · marketing',permitted],['Supplier B · expired NDA','This sharing action fails a policy check.'],['Vega · restricted report','This sharing action fails a policy check.'],['Orion · conflicting approvals','The records disagree. Review is needed.']]){
  await page.getByRole('button',{name,exact:true}).click();await expect(page.locator('.outcome')).toHaveCount(0);await ask(page,title);
 }
 await page.getByRole('button',{name:'Orion · marketing',exact:true}).click();await ask(page,permitted);await page.getByRole('button',{name:'Set NDA to expired'}).click();await expect(page.locator('.outcome h2')).toHaveText('This sharing action fails a policy check.');await expect(page.locator('.comparison')).toContainText('NDA · recipient, purpose and date: Pass → Fails policy');
});

test('real Nightshift evidence focus and ambiguous question stop before evaluation',async({page})=>{
 test.skip(test.info().project.name==='mobile-chrome','Real model calls are already covered on both layouts in the canonical demo.');await open(page);await ask(page);await page.getByRole('button',{name:'Highlight key checks with AI ↗'}).click();await expect(page.locator('.explanation')).toContainText('Live response',{timeout:95000});
 let evaluations=0;page.on('request',r=>{if(r.url().endsWith('/api/evaluate'))evaluations++;});await page.getByLabel('Policy question').fill('Can I share the report with them?');await expect(page.locator('.outcome')).toHaveCount(0);await page.getByRole('button',{name:'Ask ClauseLens',exact:true}).click();await expect(page.locator('.clarification-callout')).toContainText('Nothing has been evaluated yet.',{timeout:95000});await expect(page.getByRole('button',{name:'Check selected details'})).toBeDisabled();expect(evaluations).toBe(0);
});

test('clarification never falls back to a previous case and human input is identified',async({page})=>{
 await mockInterpretation(page);await open(page);await ask(page);
 await page.unroute('**/api/interpret');await page.route('**/api/interpret',route=>route.fulfill({json:{documentId:'',supplierId:'',purpose:'',clarification:'Please select one document, one supplier and the intended purpose in the case fields.',model:'test-double/ambiguous'}}));
 let evaluations=0;page.on('request',r=>{if(r.url().endsWith('/api/evaluate'))evaluations++;});await page.getByLabel('Policy question').fill('Can I share this with them?');await page.getByRole('button',{name:'Ask ClauseLens',exact:true}).click();await expect(page.locator('.clarification-callout')).toBeVisible();await expect(page.locator('.outcome')).toHaveCount(0);expect(evaluations).toBe(0);
 await expect(page.getByLabel('Document',{exact:true})).toHaveValue('');await expect(page.getByLabel('Recipient',{exact:true})).toHaveValue('');await expect(page.getByLabel('Purpose',{exact:true})).toHaveValue('');
 await page.getByLabel('Document',{exact:true}).selectOption('doc-orion');await page.getByLabel('Recipient',{exact:true}).selectOption('supplier-a');await page.getByLabel('Purpose',{exact:true}).selectOption('technical review');await page.getByRole('button',{name:'Check selected details'}).click();await expect(page.locator('.outcome h2')).toHaveText(unknown);await expect(page.locator('.answer-provenance')).toContainText('Human-reviewed case details');await expect(page.locator('.understood')).toContainText('DETAILS EDITED AFTER AI INTERPRETATION');expect(evaluations).toBe(1);
});

test('model outage gives no automatic answer and manual fallback is honest',async({page})=>{
 await page.route('**/api/interpret',route=>route.fulfill({status:503,json:{error:'Nightshift question interpretation is unavailable. Check the WSL tunnel.'}}));await open(page);
 let evaluations=0;page.on('request',r=>{if(r.url().endsWith('/api/evaluate'))evaluations++;});await page.getByRole('button',{name:'Ask ClauseLens',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Nightshift question interpretation is unavailable');await expect(page.locator('.outcome')).toHaveCount(0);expect(evaluations).toBe(0);await expect(page.getByRole('button',{name:'Check selected details'})).toBeDisabled();
 await page.getByLabel('Document',{exact:true}).selectOption('doc-orion');await page.getByLabel('Recipient',{exact:true}).selectOption('supplier-a');await page.getByLabel('Purpose',{exact:true}).selectOption('marketing');await page.getByRole('button',{name:'Check selected details'}).click();await expect(page.locator('.outcome h2')).toHaveText(permitted);await expect(page.locator('.answer-provenance')).toContainText('Manual case · no AI interpretation');await expect(page.locator('.understood')).toHaveCount(0);
});

test('evaluation uses fresh model-resolved values and locks edits while asking',async({page})=>{
 await open(page);await page.route('**/api/interpret',async route=>{await new Promise(resolve=>setTimeout(resolve,400));await route.fulfill({json:{documentId:'doc-vega',supplierId:'supplier-b',purpose:'audit',clarification:null,model:'test-double/fresh-resolution'}});});
 const evaluation=page.waitForRequest(r=>r.url().endsWith('/api/evaluate')&&r.method()==='POST');await page.getByLabel('Policy question').fill('Can I share Project Vega’s security report with Supplier B for audit?');await page.getByRole('button',{name:'Ask ClauseLens',exact:true}).click();await expect(page.getByLabel('Policy question')).toBeDisabled();await expect(page.getByLabel('Evaluate as of')).toBeDisabled();const body=(await evaluation).postDataJSON();expect(body.request.documentId).toBe('doc-vega');expect(body.request.supplierId).toBe('supplier-b');expect(body.request.purpose).toBe('audit');await expect(page.locator('.outcome h2')).toHaveText('This sharing action fails a policy check.');
});

test('inspect source connections and scoped retrieval receipt (mocked interpretation)',async({page},info)=>{
 await mockInterpretation(page);await open(page);await page.locator('.connections>summary').click();await expect(page.locator('.connections tbody tr')).toHaveCount(5);await expect(page.locator('.connections')).toContainText('lightning.metastore.clauselens.sharing_model');await page.locator('.connections details>summary').click();await expect(page.locator('.mapping')).toContainText(['classification','document','supplier','agreement','agreement_purpose','approval','policy_clause']);await expect(page.locator('.connections')).toContainText('recipient_id → supplier_id');await expect(page.locator('.connections')).toContainText('references supplier(supplier_id)');const source=await page.request.get('/source/supplier-registry');expect((await source.json()).suppliers[0].vendor_code).toBe('supplier-a');await page.screenshot({path:info.outputPath('question-first-connections.png'),fullPage:true});await page.locator('.connections>summary').click();await ask(page);await page.locator('.audit>summary').click();await expect(page.locator('.audit')).toContainText('approval-register → approval: 0 retrieved rows');await expect(page.locator('.audit')).toContainText('live-zetaris-usl');
});
