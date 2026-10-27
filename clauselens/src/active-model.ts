import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {tables,sources,MODEL_NAME,MODEL_PATH,MODEL_VERSION,MODEL_NAMESPACE,type Table} from './semantic.ts';
const identifier=z.string().regex(/^[a-z][a-z0-9_]*$/);
export const BindingSchema=z.object({name:identifier,source:z.string(),collection:identifier,mappings:z.record(identifier,identifier),reason:z.string().min(1).max(1500)}).strict();
export type Binding=z.infer<typeof BindingSchema>;
export function bindTables(bindings:Binding[]):Table[]{
 if(bindings.length!==tables.length||new Set(bindings.map(b=>b.name)).size!==tables.length)throw new Error('All seven unique ClauseLens entities are required.');
 return tables.map(t=>{
 const binding=bindings.find(b=>b.name===t.name);if(!binding)throw new Error(`Missing entity ${t.name}.`);
 const src=sources.find(s=>s.id===binding.source);const native=tables.find(n=>n.source===binding.source&&n.collection===binding.collection);
 if(!src||!native)throw new Error(`Unknown source/collection for ${t.name}.`);
 if(Object.keys(binding.mappings).length!==t.columns.length||t.columns.some(c=>!binding.mappings[c.name]))throw new Error(`Incomplete target columns for ${t.name}.`);
 for(const raw of Object.values(binding.mappings))if(!native.columns.some(c=>c.raw===raw))throw new Error(`Unknown native field for ${t.name}.`);
 return {...t,source:src.id,database:src.database,collection:binding.collection,columns:t.columns.map(c=>({...c,raw:binding.mappings[c.name]}))};
 });
}
const configSchema=z.object({name:z.string().regex(/^(sharing_model|sharing_[a-f0-9]{12})$/),proposalId:z.uuid().nullable(),bindings:z.array(BindingSchema).nullable()});
export function activeModelStore(file=path.resolve('.runtime/active-model.json')){
 return {
 get(){if(!fs.existsSync(file))return {name:MODEL_NAME,path:MODEL_PATH,version:MODEL_VERSION,proposalId:null,tables};const value=configSchema.parse(JSON.parse(fs.readFileSync(file,'utf8')));return {name:value.name,path:`${MODEL_NAMESPACE}.${value.name}`,version:value.proposalId?`builder:${value.proposalId}`:MODEL_VERSION,proposalId:value.proposalId,tables:value.bindings?bindTables(value.bindings):tables};},
 set(name:string,proposalId:string|null,bindings:Binding[]|null){const value=configSchema.parse({name,proposalId,bindings});if(bindings)bindTables(bindings);fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');fs.renameSync(tmp,file);return this.get();}
 };
}
export const activeModels=activeModelStore();
