import type { Decision, Evidence } from './model.ts';
export function graph(decision:Decision){
 const used=new Set(decision.checks.flatMap(c=>c.sourceIds));
 const evidence=decision.evidence.filter(e=>used.has(e.id));
 const nodes=[{id:'sharing-request',kind:'SharingRequest',label:'Proposed sharing',sourceId:'USER-INPUT',passage:JSON.stringify(decision.request),version:'1',effectiveFrom:decision.request.date,effectiveTo:decision.request.date,facts:{}},...evidence];
 const edges:{id:string;from:string;to:string;label:string;sourceIds:string[]}[]=[];
 const link=(from:string,to:unknown,label:string,sources:string[])=>{if(typeof to==='string'&&nodes.some(n=>n.id===from)&&nodes.some(n=>n.id===to))edges.push({id:`edge-${edges.length}`,from,to,label,sourceIds:sources});};
 link('sharing-request',decision.request.documentId,'requests document',['sharing-request']);link('sharing-request',decision.request.supplierId,'intended recipient',['sharing-request']);
 for(const e of evidence){if(e.kind==='Document')link(e.id,e.facts.classificationId,'classified as',[e.id]);if(e.kind==='Agreement')link(e.id,e.facts.supplierId,'covers supplier',[e.id]);if(e.kind==='Approval'){link(e.id,e.facts.documentId,'owner decision for',[e.id]);link(e.id,e.facts.supplierId,'recipient',[e.id]);}if(e.kind==='PolicyClause')link(e.id,'sharing-request','governs request',[e.id]);}
 return {nodes,edges};
}
