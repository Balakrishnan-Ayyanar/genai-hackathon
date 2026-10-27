import {Router} from 'express';
import {z} from 'zod';
import {builderService} from './builder.ts';
export function builderRoutes(){
 const router=Router(),builder=builderService();
 const handle=(fn:(req:any)=>unknown)=>async(req:any,res:any)=>{try{res.json(await fn(req));}catch(error){const message=error instanceof z.ZodError?'Invalid model proposal or request. Check the required fields.':(error as Error).message;res.status(422).json({error:message});}};
 const id=(req:any)=>z.uuid().parse(req.params.id);
 router.get('/catalog',handle(()=>builder.discover()));
 router.get('/proposals',handle(()=>builder.list()));
 router.post('/proposals',handle(req=>{const body=z.object({goal:z.string().trim().min(20).max(2000),clarifications:z.record(z.string().max(80),z.string().max(1000)).refine(v=>Object.keys(v).length<=8).default({})}).parse(req.body);return builder.propose(body.goal,body.clarifications);}));
 router.get('/proposals/:id',handle(req=>{const proposal=builder.get(id(req));try{return {proposal,sql:builder.preview(proposal.id)};}catch{return {proposal,sql:null};}}));
 router.post('/proposals/:id/revise',handle(req=>{const body=z.object({plan:z.unknown(),answers:z.record(z.string(),z.string().max(1000))}).parse(req.body);return builder.revise(id(req),body.plan,body.answers);}));
 router.post('/proposals/:id/validate',handle(req=>builder.validate(id(req))));
 router.post('/proposals/:id/deploy',handle(req=>builder.deploy(id(req),z.object({reviewed:z.literal(true)}).parse(req.body).reviewed)));
 router.post('/proposals/:id/use',handle(req=>builder.use(id(req))));
 router.post('/baseline',handle(()=>builder.baseline()));
 return router;
}
