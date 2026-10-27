import {createHash} from 'node:crypto';
import {sources,tables} from './semantic.ts';
export const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const descriptions:Record<string,string>={
 'document-registry':'Fictional report registry with document owner references and external-sharing classifications.',
 'supplier-registry':'Fictional supplier master. vendor_code identifies an external supplier.',
 'agreement-register':'Fictional NDA register and one-to-many covered purposes. Contract dates include both endpoints.',
 'approval-register':'Fictional owner decisions. Both approved and denied records must remain visible; absence does not prove a decision never occurred.',
 'policy-repository':'Curated policy clauses with explicit rule identifiers, source text and supported policy versions.'};
const fields:Record<string,string>={report_code:'Stable report identifier.',report_title:'Report title.',classification_code:'Classification reference assigned to a document.',owner_code:'Document owner identifier.',class_code:'Stable classification identifier.',caption:'Classification label.',vendor_code:'Supplier master code; same intended business concept across supplier and NDA registers.',display_name:'Supplier name.',contract_code:'Stable agreement identifier or coverage reference to an agreement.',contract_title:'NDA title.',contract_state:'Agreement validity state, such as valid or revoked.',coverage_code:'Unique agreement-purpose coverage identifier.',purpose_code:'Covered sharing purpose.',decision_code:'Stable decision record identifier; opposing decisions are separate records.',decision_title:'Decision label.',report_ref:'Report reference recorded on the approval.',recipient_id:'Recipient reference in approval system. Matching sample values alone do not establish that this uses the supplier-master namespace; ask the user to confirm.',approver_ref:'Identity of the person recording the owner decision. Do not assume this is an approval without checking against the document owner.',intended_use:'Purpose of the proposed sharing action.',decision:'Recorded approval state, approved or denied.',clause_code:'Stable policy clause identifier.',heading:'Policy clause label.',rule_key:'Predefined policy rule identifier.',config_json:'JSON configuration of the supported fixed policy clause.',source_ref:'Original evidence source identifier.',revision:'Source record or policy version.',valid_from:'Inclusive effective start date, YYYY-MM-DD.',valid_until:'Inclusive effective end date, YYYY-MM-DD.',source_text:'Curated source passage.',aliases_json:'JSON array of entity name aliases.'};
export type SqlClient=(query:string)=>Promise<unknown[][]>;
export type Profile={name:string;type:string;description:string;nullCount:number;uniqueCount:number;examples:string[]};
export type Catalog={sources:{id:string;description:string;database:string;collections:{name:string;rowCount:number;fields:Profile[]}[]}[];schemaHash:string;dataHash:string;discoveredAt:string};
export async function discover(sql:SqlClient):Promise<Catalog>{
 const available=await sql('SHOW LIGHTNING DATABASES');
 const databaseNames=new Set(available.flatMap(row=>row.map(String)));
 const collected=await Promise.all(sources.map(async source=>{
 if(!databaseNames.has(source.database))throw new Error(`Registered source ${source.database} is unavailable.`);
 const description=await sql(`DESCRIBE DATASOURCE TABLE ${source.database}.registry`);
 const collections=await Promise.all(tables.filter(t=>t.source===source.id).map(async t=>{
 const raw=description.find(row=>row[0]===t.collection);if(!raw)throw new Error(`Collection ${t.collection} is not registered.`);
 const schema=JSON.parse(String(raw[1]));if(schema.type!=='array'||schema.elementType?.type!=='struct')throw new Error('Unsupported native source shape.');
 const native=schema.elementType.fields as {name:string;type:string}[];
 if(native.some(f=>f.type!=='string'||!/^[a-z][a-z0-9_]*$/.test(f.name)))throw new Error('Only scalar string fields from the five curated sources are supported.');
 const rows=await sql(`SELECT ${native.map(f=>'r.'+f.name).join(', ')} FROM ${source.database}.registry LATERAL VIEW explode(${t.collection}) AS r`);
 if(rows.length>=1000)throw new Error('Source profiling exceeds the focused builder limit.');
 return {name:t.collection,rowCount:rows.length,fields:native.map((f,i)=>({name:f.name,type:f.type,description:fields[f.name]??'Undocumented native source field; clarify its meaning before mapping.',nullCount:rows.filter(row=>row[i]===null||row[i]===undefined||row[i]==='').length,uniqueCount:new Set(rows.map(row=>JSON.stringify(row[i]))).size,examples:[...new Set(rows.map(row=>String(row[i]??'')))].slice(0,3).map(v=>v.slice(0,150))})),dataDigest:digest([...rows].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))))};
 }));return {id:source.id,description:descriptions[source.id],database:source.database,collections};
 }));
 const schemaHash=digest(collected.map(s=>({...s,collections:s.collections.map(c=>({name:c.name,fields:c.fields.map(({name,type,description})=>({name,type,description}))}))})));
 const dataHash=digest(collected.map(s=>s.collections.map(c=>c.dataDigest)));
 const catalog=collected.map(s=>({...s,collections:s.collections.map(({dataDigest,...c})=>c)}));
 return {sources:catalog,schemaHash,dataHash,discoveredAt:new Date().toISOString()};
}
