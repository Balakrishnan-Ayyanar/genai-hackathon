import {z} from 'zod';
import {EvidenceSchema,type Evidence,type SharingCase} from './model.ts';
export const MODEL_NAMESPACE='lightning.metastore.clauselens';
export const MODEL_NAME='sharing_model';
export const MODEL_PATH=`${MODEL_NAMESPACE}.${MODEL_NAME}`;
export const MODEL_VERSION='clauselens-usl-1';
type Column={name:string;raw:string;type?:string;primary?:boolean;references?:string};
type Table={name:string;source:string;database:string;collection:string;kind?:Evidence['kind'];columns:Column[]};
const common:Column[]=[{name:'source_id',raw:'source_ref'},{name:'version',raw:'revision'},{name:'effective_from',raw:'valid_from',type:'date'},{name:'effective_to',raw:'valid_until',type:'date'},{name:'passage',raw:'source_text',type:'varchar(4000)'}];
const base=(id:string,rawId:string,label:string,extra:Column[]):Column[]=>[{name:id,raw:rawId,primary:true},{name:'label',raw:label},...common,...extra];
export const tables:Table[]=[
 {name:'classification',source:'document-registry',database:'CL_DOCUMENTS',collection:'classifications',kind:'Classification',columns:base('classification_id','class_code','caption',[])},
 {name:'document',source:'document-registry',database:'CL_DOCUMENTS',collection:'documents',kind:'Document',columns:base('document_id','report_code','report_title',[{name:'classification_id',raw:'classification_code',references:'classification(classification_id)'},{name:'owner_id',raw:'owner_code'},{name:'aliases_json',raw:'aliases_json',type:'varchar(2000)'}])},
 {name:'supplier',source:'supplier-registry',database:'CL_SUPPLIERS',collection:'suppliers',kind:'Supplier',columns:base('supplier_id','vendor_code','display_name',[{name:'aliases_json',raw:'aliases_json',type:'varchar(2000)'}])},
 {name:'agreement',source:'agreement-register',database:'CL_AGREEMENTS',collection:'agreements',kind:'Agreement',columns:base('agreement_id','contract_code','contract_title',[{name:'supplier_id',raw:'vendor_code',references:'supplier(supplier_id)'},{name:'status',raw:'contract_state'}])},
 {name:'agreement_purpose',source:'agreement-register',database:'CL_AGREEMENTS',collection:'purposes',columns:[{name:'coverage_id',raw:'coverage_code',primary:true},{name:'agreement_id',raw:'contract_code',references:'agreement(agreement_id)'},{name:'purpose',raw:'purpose_code'},{name:'source_id',raw:'source_ref'}]},
 {name:'approval',source:'approval-register',database:'CL_APPROVALS',collection:'approvals',kind:'Approval',columns:base('approval_id','decision_code','decision_title',[{name:'document_id',raw:'report_ref',references:'document(document_id)'},{name:'supplier_id',raw:'recipient_id',references:'supplier(supplier_id)'},{name:'owner_id',raw:'approver_ref'},{name:'purpose',raw:'intended_use'},{name:'status',raw:'decision'}])},
 {name:'policy_clause',source:'policy-repository',database:'CL_POLICIES',collection:'clauses',kind:'PolicyClause',columns:base('clause_id','clause_code','heading',[{name:'rule_key',raw:'rule_key'},{name:'config_json',raw:'config_json',type:'varchar(4000)'}])}
];
export const sources=[...new Set(tables.map(t=>t.source))].map(id=>({id,database:tables.find(t=>t.source===id)!.database,endpoint:`/source/${id}`,file:`data/sources/${id}.json`,fictional:true}));
export function nativeSourceSchema(source:string){
 return z.object(Object.fromEntries(tables.filter(t=>t.source===source).map(t=>[t.collection,z.array(z.object(Object.fromEntries(t.columns.map(c=>[c.raw,z.string().min(1)]))))])));
}
export function ddl(){return `COMPILE USL IF NOT EXISTS ${MODEL_NAME} DEPLOY NAMESPACE ${MODEL_NAMESPACE} DDL\n`+tables.map(t=>`CREATE TABLE ${t.name} (\n${t.columns.map(c=>`    ${c.name} ${c.type??'varchar(300)'}${c.primary?' NOT NULL PRIMARY KEY':c.references?` FOREIGN KEY REFERENCES ${c.references}`:''}`).join(',\n')}\n)`).join(';\n')+';';}
export function activation(t:Table){return `ACTIVATE USL TABLE ${MODEL_PATH}.${t.name} AS\nSELECT\n${t.columns.map(c=>`    ${c.primary?`COALESCE(r.${c.raw}, '')`:c.type==='date'?`CAST(r.${c.raw} AS DATE)`:`r.${c.raw}`} AS ${c.name}`).join(',\n')}\nFROM ${t.database}.registry LATERAL VIEW explode(${t.collection}) AS r`;}
const quote=(v:string)=>"'"+v.replace(/'/g,"''")+"'";
export function retrievalQueries(request?:SharingCase){
 if(request&&(!/^[a-zA-Z0-9_-]*$/.test(request.documentId)||!/^[a-zA-Z0-9_-]*$/.test(request.supplierId)))throw new Error('Invalid case identifier.');
 const doc=request?quote(request.documentId):'',supplier=request?quote(request.supplierId):'';
 return tables.map(t=>{
 let filter='';
 if(request){switch(t.name){case 'document':filter=`document_id = ${doc}`;break;case 'classification':filter=`classification_id IN (SELECT classification_id FROM ${MODEL_PATH}.document WHERE document_id = ${doc})`;break;case 'supplier':case 'agreement':filter=`supplier_id = ${supplier}`;break;case 'agreement_purpose':filter=`agreement_id IN (SELECT agreement_id FROM ${MODEL_PATH}.agreement WHERE supplier_id = ${supplier})`;break;case 'approval':filter=`document_id = ${doc} AND supplier_id = ${supplier} AND purpose = ${quote(request.purpose)}`;break;}}
 return {table:t.name,source:t.source,query:`SELECT ${t.columns.map(c=>c.name).join(', ')} FROM ${MODEL_PATH}.${t.name}${filter?' WHERE '+filter:''}`};
 });
}
export type SemanticRows=Record<string,Record<string,string>[]>;
const jsonStrings=z.array(z.string());
export function toEvidence(results:SemanticRows):Evidence[]{
 const coverage=results.agreement_purpose??[];
 return tables.flatMap(t=>{
 if(!t.kind)return [];
 return (results[t.name]??[]).map(row=>{
 const id=row[t.columns[0].name];let facts:Record<string,unknown>={};
 switch(t.kind){
 case 'Document':facts={classificationId:row.classification_id,ownerId:row.owner_id,aliases:jsonStrings.parse(JSON.parse(row.aliases_json))};break;
 case 'Supplier':facts={aliases:jsonStrings.parse(JSON.parse(row.aliases_json))};break;
 case 'Agreement':facts={supplierId:row.supplier_id,status:row.status,purposes:coverage.filter(p=>p.agreement_id===id).map(p=>p.purpose)};break;
 case 'Approval':facts={documentId:row.document_id,supplierId:row.supplier_id,ownerId:row.owner_id,purpose:row.purpose,status:row.status};break;
 case 'PolicyClause':facts=z.record(z.string(),z.unknown()).parse(JSON.parse(row.config_json));if(facts.rule!==row.rule_key)throw new Error('Policy semantic mapping mismatch.');break;
 }
 return EvidenceSchema.parse({id,kind:t.kind,label:row.label,sourceId:row.source_id,version:row.version,effectiveFrom:row.effective_from,effectiveTo:row.effective_to,passage:row.passage,facts,lineage:{sourceSystem:t.source,semanticTable:`${MODEL_PATH}.${t.name}`,sourceEndpoint:sources.find(s=>s.id===t.source)!.endpoint}});
 });
 });
}
export function rowsToObjects(table:string,rows:unknown[][]){
 const columns=tables.find(t=>t.name===table)!.columns;
 if(rows.length>=1000)throw new Error('Semantic source exceeds supported retrieval limit.');
 return rows.map(row=>{if(row.length!==columns.length)throw new Error('Unexpected semantic result shape.');return Object.fromEntries(columns.map((c,i)=>{if(row[i]===null||row[i]===undefined)throw new Error(`Missing semantic value: ${table}.${c.name}`);return [c.name,String(row[i])];}));});
}
