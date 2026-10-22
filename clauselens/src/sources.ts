import fs from 'node:fs';
import {nativeSourceSchema,sources} from './semantic.ts';
// Only the source-serving routes use these files. Retrieval never calls this module.
export function readSource(id:string){const source=sources.find(s=>s.id===id);if(!source)throw new Error('Unknown fictional source.');return nativeSourceSchema(id).parse(JSON.parse(fs.readFileSync(source.file,'utf8')));}
