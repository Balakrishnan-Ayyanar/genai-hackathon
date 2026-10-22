import { active, outcomes, type Check, type Decision, type Evidence, type SharingCase, type Status } from './model.ts';
export function evaluate(request:SharingCase,evidence:Evidence[]):Decision {
 const checks:Check[]=[];
 const current=evidence.filter(e=>active(e,request.date));
 const get=(kind:string,id:string)=>current.filter(e=>e.kind===kind&&e.id===id);
 const docs=get('Document',request.documentId),suppliers=get('Supplier',request.supplierId);
 const add=(id:string,label:string,status:Status,detail:string,records:Evidence[])=>checks.push({id,label,status,detail,sourceIds:[...new Set(records.map(e=>e.id))]});
 const policy=(rule:string)=>current.filter(e=>e.kind==='PolicyClause'&&e.facts.rule===rule);
 const completePolicy=['classification','nda','approval','conflicts'].every(r=>policy(r).length===1);
 const supportedPolicy=completePolicy&&['classification','nda','approval','conflicts'].every(r=>policy(r)[0].version==='POL-2026.1')&&policy('nda')[0].facts.inclusiveDates===true&&policy('approval')[0].facts.requireOwner===true;
 if(!completePolicy) add('policy','Applicable policy',['classification','nda','approval','conflicts'].some(r=>policy(r).length>1)?'conflict':'unknown','A unique, current set of the four supported policy clauses is required.',current.filter(e=>e.kind==='PolicyClause'));
 if(completePolicy&&!supportedPolicy)add('policy-schema','Supported policy version','unknown','This policy version or rule configuration requires review before the fixed evaluator can use it.',current.filter(e=>e.kind==='PolicyClause'));
 if(docs.length!==1||suppliers.length!==1) add('identity','Document and recipient',docs.length>1||suppliers.length>1?'conflict':'unknown','Select one current document and one current supplier before checking permission.',[...docs,...suppliers]);
 const doc=docs[0];
 const classification=doc?get('Classification',String(doc.facts.classificationId)):[];
 const cp=policy('classification')[0];
 const allowed=Array.isArray(cp?.facts.allowed)?cp.facts.allowed as string[]:undefined,prohibited=Array.isArray(cp?.facts.prohibited)?cp.facts.prohibited as string[]:undefined;
 const classId=String(doc?.facts.classificationId);
 const classStatus:Status=!doc||classification.length!==1||!allowed||!prohibited?'unknown':allowed.includes(classId)&&prohibited.includes(classId)?'conflict':prohibited.includes(classId)?'fail':allowed.includes(classId)?'pass':'unknown';
 add('classification','External-sharing classification',classStatus,classStatus==='pass'?'Partner-shareable classification is eligible; the remaining checks still apply.':classStatus==='fail'?'The supplied policy explicitly prohibits external sharing of this classification.':'A unique, supported classification and policy are required.',[...docs,...classification,...policy('classification')]);
 const agreements=evidence.filter(e=>e.kind==='Agreement'&&e.facts.supplierId===request.supplierId&&Array.isArray(e.facts.purposes)&&e.facts.purposes.includes(request.purpose));
 const activeNdas=agreements.filter(e=>active(e,request.date));
 const ndaStates=new Set(activeNdas.map(e=>e.facts.status));
 let ndaStatus:Status=ndaStates.size>1?'conflict':activeNdas.length?ndaStates.has('valid')?'pass':ndaStates.has('revoked')?'fail':'unknown':agreements.length?'fail':'unknown';
 if(policy('nda').length!==1) ndaStatus='unknown';
 add('nda','NDA · recipient, purpose and date',ndaStatus,ndaStatus==='pass'?`A valid NDA covers this recipient and purpose on ${request.date} (inclusive date boundaries).`:ndaStatus==='conflict'?'Current NDA records disagree on validity.':ndaStatus==='fail'?'The supplied NDA is outside its validity interval or explicitly revoked.':'No matching NDA record establishes coverage for this recipient and purpose.',[...agreements,...suppliers,...policy('nda')]);
 const approvals=current.filter(e=>e.kind==='Approval'&&e.facts.documentId===request.documentId&&e.facts.supplierId===request.supplierId&&e.facts.purpose===request.purpose&&e.facts.ownerId===doc?.facts.ownerId);
 const approvalStates=new Set(approvals.map(e=>e.facts.status));
 const as:Status=approvalStates.size>1?'conflict':approvalStates.has('denied')?'fail':approvalStates.has('approved')?'pass':'unknown';
 add('approval','Document-owner approval',policy('approval').length===1?as:'unknown',as==='conflict'?'Current owner records both approve and deny this exact action; human review is required.':as==='fail'?'A matching owner record explicitly denies this sharing action.':as==='pass'?approvals.some(e=>e.simulated)?'A clearly labelled simulated owner approval matches this document, recipient and purpose.':'A current owner approval matches this document, recipient and purpose.':'No matching owner approval was found in the supplied records. This does not establish that approval never happened.',[...approvals,...docs,...policy('approval')]);
 for(const check of checks)check.sourceIds=[...new Set([...check.sourceIds,...policy('conflicts').map(e=>e.id)])];
 const outcome=checks.some(c=>c.status==='conflict')?'conflict':checks.some(c=>c.status==='fail')?'denied':checks.some(c=>c.status==='unknown')?'unknown':'permitted';
 return {request,outcome,title:outcomes[outcome],checks,evidence,policyVersions:[...new Set(current.filter(e=>e.kind==='PolicyClause').map(e=>e.version))],missingFacts:checks.filter(c=>c.status==='unknown').map(c=>c.detail)};
}
export type Scenario='none'|'add-approval'|'expire-nda';
export function simulate(evidence:Evidence[],request:SharingCase,scenario:Scenario):Evidence[] {
 const copy=structuredClone(evidence);
 if(scenario==='none')return copy;
 if(scenario==='add-approval'){
 const doc=copy.find(e=>e.id===request.documentId&&e.kind==='Document');
 copy.push({id:'sim-approval',kind:'Approval',label:'SIMULATED · Owner approval',sourceId:'SIMULATION-ONLY',version:'scenario-1',effectiveFrom:request.date,effectiveTo:request.date,passage:'SIMULATED, not an original record: the document owner approves this exact report, supplier and purpose on the evaluation date.',simulated:true,facts:{documentId:request.documentId,supplierId:request.supplierId,purpose:request.purpose,ownerId:doc?.facts.ownerId??'',status:'approved'}});
 }else for(const e of copy)if(e.kind==='Agreement'&&e.facts.supplierId===request.supplierId){e.effectiveTo=new Date(Date.parse(request.date)-86400000).toISOString().slice(0,10);e.simulated=true;e.facts.originalSourceId=e.sourceId;e.facts.originalRecordId=e.id;e.sourceId='SIMULATION-ONLY';e.passage='SIMULATED replacement validity: this NDA ended the day before the evaluation date. Original agreement remains unchanged.';}
 return copy;
}
