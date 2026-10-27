import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {baselineCase, CaseSchema, type SharingCase} from './model.ts';
import {Builder} from './builder-client.tsx';
import {WorkflowNav} from './workflow-nav.tsx';
import './style.css';

async function api(path:string, body?:unknown) {
  const res=await fetch('/api/'+path, body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
  const data=await res.json();
  if(!res.ok) throw new Error(data.error??'Request failed');
  return data;
}
const words:Record<string,string>={pass:'Pass',fail:'Fails policy',unknown:'Missing fact',conflict:'Needs review'};
const symbols:Record<string,string>={pass:'✓',fail:'×',unknown:'?',conflict:'!'};
const outcomeNames:Record<string,string>={permitted:'Permitted',denied:'Not permitted',unknown:'Insufficient information',conflict:'Conflicting evidence'};
const answerTitles:Record<string,string>={
  unknown:'Permission isn’t established yet.',
  permitted:'Permitted under the supplied policy and evidence',
  denied:'This sharing action fails a policy check.',
  conflict:'The records disagree. Review is needed.',
};
const examples=[
  {label:'Orion · technical review',question:baselineCase.question},
  {label:'Orion · marketing',question:'Can I share Project Orion’s design report with Supplier A for marketing?'},
  {label:'Supplier B · expired NDA',question:'Can I share Project Orion’s design report with Supplier B for technical review?'},
  {label:'Vega · restricted report',question:'Can I share Project Vega’s security report with Supplier A for technical review?'},
  {label:'Orion · conflicting approvals',question:'Can I share Project Orion’s design report with Supplier A for audit?'},
];
type DraftCase=Omit<SharingCase,'purpose'>&{purpose:SharingCase['purpose']|''};
type Interpretation={documentId:string;supplierId:string;purpose:string;clarification:string|null;model:string;question:string};

function App() {
  const [catalog,setCatalog]=useState<any>(null),[modelInfo,setModelInfo]=useState<any>(null);
  const [request,setRequest]=useState<DraftCase>({...baselineCase,documentId:'',supplierId:'',purpose:''});
  const [result,setResult]=useState<any>(null),[interpretation,setInterpretation]=useState<Interpretation|null>(null);
  const [phase,setPhase]=useState<'idle'|'interpreting'|'checking'>('idle');
  const [error,setError]=useState(''),[notice,setNotice]=useState('');
  const [reviewOpen,setReviewOpen]=useState(false),[needsClarification,setNeedsClarification]=useState(false);
  const [editedDetails,setEditedDetails]=useState(false),[answerOrigin,setAnswerOrigin]=useState<'question'|'reviewed'|'manual'>('question');
  const [selected,setSelected]=useState<any>(null),[tab,setTab]=useState('graph');
  const [explanation,setExplanation]=useState<any>(null),[explaining,setExplaining]=useState(false);
  const answerRef=useRef<HTMLDivElement>(null),reviewRef=useRef<HTMLDetailsElement>(null);
  const previousFocus=useRef<HTMLElement|null>(null);
  const busy=phase!=='idle';
  useEffect(()=>{
    api('catalog').then(setCatalog).catch(e=>setError(e.message));
    api('semantic-model').then(setModelInfo).catch(()=>{});
  },[]);
  // A source inspector stays usable with the keyboard as well as the mouse.
  useEffect(()=>{
    if(!selected)return;
    const previous=previousFocus.current;
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    const listener=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setSelected(null);
      if(event.key==='Tab'){
        const elements=Array.from(document.querySelectorAll<HTMLElement>('.drawer button, .drawer summary, .drawer a, .drawer [tabindex="0"]'));
        const first=elements[0],last=elements[elements.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',listener);
    return ()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',listener);previous?.focus();};
  },[selected]);
  function clearAnswer(){setResult(null);setSelected(null);setExplanation(null);setError('');setNotice('');}
  function questionChanged(question:string){
    clearAnswer();setInterpretation(null);setNeedsClarification(false);setEditedDetails(false);setReviewOpen(false);
    setRequest(r=>({...r,question,documentId:'',supplierId:'',purpose:''}));
  }
  function field(key:keyof DraftCase,value:string){
    clearAnswer();setRequest(r=>({...r,[key]:value}));setEditedDetails(true);
    setNotice('Details changed. Check these details to retrieve fresh evidence.');
  }
  function dateChanged(date:string){
    clearAnswer();setInterpretation(null);setNeedsClarification(false);setEditedDetails(false);
    setRequest(r=>({...r,date}));
  }
  async function evaluateCase(draft:DraftCase,scenario='none',origin:typeof answerOrigin=answerOrigin){
    const parsed=CaseSchema.safeParse(draft);
    if(!parsed.success){setError('Select a document, supplier, purpose and valid evaluation date before checking.');setReviewOpen(true);setPhase('idle');return;}
    setPhase('checking');setError('');setSelected(null);setExplanation(null);
    try{
      const value=await api('evaluate',{request:parsed.data,scenario});
      setResult(value);setAnswerOrigin(origin);setNotice('');setNeedsClarification(false);setReviewOpen(false);
      window.setTimeout(()=>answerRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),50);
    }catch(e){setError((e as Error).message);}
    finally{setPhase('idle');}
  }
  async function ask(event?:React.FormEvent){
    event?.preventDefault();if(busy||explaining||!request.question.trim())return;
    clearAnswer();setInterpretation(null);setEditedDetails(false);setNeedsClarification(false);setReviewOpen(false);setPhase('interpreting');
    // Always resolve this question afresh. Never substitute previous case fields.
    const question=request.question.trim();
    try{
      const resolved=await api('interpret',{question,date:request.date});
      const next:DraftCase={question,date:request.date,documentId:resolved.documentId,supplierId:resolved.supplierId,purpose:resolved.purpose};
      setRequest(next);setInterpretation({...resolved,question});
      if(resolved.clarification||!resolved.documentId||!resolved.supplierId||!resolved.purpose){
        setNeedsClarification(true);setReviewOpen(true);setPhase('idle');
        window.setTimeout(()=>reviewRef.current?.scrollIntoView({behavior:'smooth',block:'center'}),50);
        return;
      }
      await evaluateCase(next,'none','question');
    }catch(e){
      setError((e as Error).message);setPhase('idle');setReviewOpen(true);
      setRequest(r=>({...r,documentId:'',supplierId:'',purpose:''}));
    }
  }
  async function explain(){
    setExplaining(true);
    try{setExplanation(await api('explain',{id:result.id}));}
    catch(e){setExplanation({error:(e as Error).message});}
    finally{setExplaining(false);}
  }
  function inspect(ids:string[],label?:string){
    previousFocus.current=document.activeElement as HTMLElement|null;
    setSelected({label:label??'Supporting evidence',records:ids.map(id=>result.graph.nodes.find((e:any)=>e.id===id)??result.decision.evidence.find((e:any)=>e.id===id)).filter(Boolean)});
  }
  const decision=result?.decision;
  const complete=!!(request.documentId&&request.supplierId&&request.purpose&&request.date);
  const documentLabel=catalog?.documents.find((d:any)=>d.id===request.documentId)?.label??request.documentId;
  const supplierLabel=catalog?.suppliers.find((d:any)=>d.id===request.supplierId)?.label??request.supplierId;
  const reason=decision?.checks.find((c:any)=>c.status===(decision.outcome==='conflict'?'conflict':decision.outcome==='denied'?'fail':'unknown'));
  return <div className="shell question-first">
    <header>
      <a className="brand" href="/"><span className="brandmark">C<span>↗</span></span>ClauseLens<span className="brand-divider"/><small>Evidence before answers</small></a>
      <div className="header-actions"><a className="builder-back" href="#how-it-works">How it works</a><span className="demo-badge"><i/> Fictional policy demo</span></div>
    </header>
    <main>
      <WorkflowNav active="answer"/>
      <section className="ask-intro"><div><p className="eyebrow">A CLEAR ANSWER STARTS WITH A QUESTION</p><h1>Can I share this document?<br/><span>Ask. See why. Test what changes.</span></h1><p className="lede">ClauseLens connects your question to the policy, agreements and approval records.</p></div><div className="intro-stamp"><span>Evidence, not guesswork.</span><p>Three required checks.<br/>Every finding has a source.</p></div></section>
      <section className="question-panel panel" aria-labelledby="ask-title">
        <div className="composer-top"><div className="section-title"><span className="step">01</span><h2 id="ask-title">Ask your sharing question</h2></div><span className="ai-label">Interpreted with AI · Nightshift / Nemotron</span></div>
        <form onSubmit={ask}>
          <label className="sr-only" htmlFor="question">Policy question</label>
          <div className="question-entry"><textarea id="question" rows={2} maxLength={1500} value={request.question} disabled={busy||explaining} onChange={e=>questionChanged(e.target.value)} placeholder="Can I share [document] with [supplier] for [purpose]?"/><button className="primary ask-button" disabled={busy||explaining||!catalog||!request.question.trim()||!request.date} type="submit">{phase==='interpreting'?'Understanding your question…':phase==='checking'?'Retrieving & checking…':'Ask ClauseLens'}<span aria-hidden="true">↗</span></button></div>
          <div className="question-meta"><p>One question → an interpreted case → live evidence → a checked answer.</p><div className="date-control"><label htmlFor="date">Evaluate as of</label><input id="date" type="date" required disabled={busy||explaining} value={request.date} onChange={e=>dateChanged(e.target.value)}/><span>Demo date</span></div></div>
        </form>
        <div className="example-questions"><span>Try a case</span>{examples.map(example=><button type="button" key={example.label} disabled={busy||explaining} onClick={()=>questionChanged(example.question)}>{example.label}</button>)}</div>
        <div className="journey" aria-label="Answer workflow" aria-live="polite">
          <div className={phase==='interpreting'?'active':interpretation?'done':''}><span>{interpretation?'✓':'1'}</span><div><strong>Understand the question</strong><small>{phase==='interpreting'?'Nightshift is identifying the document, supplier and purpose.':'AI identifies the case. Unclear details need your input.'}</small></div></div>
          <div className={phase==='checking'?'active':result?'done':''}><span>{result?'✓':'2'}</span><div><strong>Retrieve & check</strong><small>{phase==='checking'?'Reading live Zetaris evidence and checking policy requirements.':'Zetaris retrieves records. Fixed rules check permission.'}</small></div></div>
          <div className={result?'done':''}><span>{result?'✓':'3'}</span><div><strong>See the answer & evidence</strong><small>Inspect each finding. Test what would change the result.</small></div></div>
        </div>
        {error&&<div role="alert" className="alert">{error}{!catalog&&<button onClick={()=>api('catalog').then(setCatalog).then(()=>setError('')).catch(e=>setError(e.message))}>Retry data connection</button>}</div>}
        {needsClarification&&<div className="clarification-callout" role="status"><strong>Let’s clarify this case before answering.</strong><p>{interpretation?.clarification||'Select the missing document, supplier or purpose below.'} Nothing has been evaluated yet.</p></div>}
        {interpretation&&<div className="understood"><div><span className="eyebrow">{editedDetails?'DETAILS EDITED AFTER AI INTERPRETATION':'WHAT THE AI UNDERSTOOD'}</span><p><strong>{documentLabel||'Which document?'}</strong><span>→</span><strong>{supplierLabel||'Which supplier?'}</strong><span>for</span><strong>{request.purpose||'what purpose?'}</strong></p></div><span className="model-used">{interpretation.model}</span></div>}
        <details className="case-review" ref={reviewRef} open={reviewOpen} onToggle={e=>setReviewOpen(e.currentTarget.open)}>
          <summary>{needsClarification?'Clarify the missing details':'Review or adjust case details'}<span>{!interpretation?'Manual fallback available':'You stay in control of what is checked'}</span></summary>
          <div className="case-fields">
            <div><label htmlFor="document">Document</label><select id="document" disabled={busy||explaining} value={request.documentId} onChange={e=>field('documentId',e.target.value)}><option value="">Select a document</option>{catalog?.documents.map((d:any)=><option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
            <div><label htmlFor="supplier">Recipient</label><select id="supplier" disabled={busy||explaining} value={request.supplierId} onChange={e=>field('supplierId',e.target.value)}><option value="">Select a supplier</option>{catalog?.suppliers.map((d:any)=><option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
            <div><label htmlFor="purpose">Purpose</label><select id="purpose" disabled={busy||explaining} value={request.purpose} onChange={e=>field('purpose',e.target.value)}><option value="">Select purpose</option><option>technical review</option><option>marketing</option><option>audit</option></select></div>
          </div>
          <div className="review-actions"><p>{interpretation?'Check these reviewed details against fresh evidence. Any changes you make are identified as human input.':'If AI interpretation is unavailable, choose the case yourself. This is a manual check, not an AI-interpreted answer.'}</p><button disabled={busy||explaining||!catalog||!complete} onClick={()=>evaluateCase(request,'none',interpretation?'reviewed':'manual')}>Check selected details →</button></div>
          {notice&&<p className="hint">{notice}</p>}
        </details>
      </section>

      <section className="answer-workspace" aria-live="polite" aria-busy={busy}>
        {!result?<div className="answer-placeholder panel"><div><span className="eyebrow">THE ANSWER WILL APPEAR HERE</span><h2>{busy?'Following the evidence…':needsClarification?'A clear case comes before a confident answer.':'A relevant paragraph is only part of the answer.'}</h2><p>{busy?'We’ll show what passes, what is missing and the sources behind each finding.':needsClarification?'Confirm the missing details above. We won’t guess a document, supplier or purpose.':'Ask the Orion question above to check all three requirements together.'}</p></div><div className="requirements-preview"><span><i>01</i> Sharing classification</span><span><i>02</i> NDA coverage</span><span><i>03</i> Owner approval</span></div></div>:<>
          <div ref={answerRef} className={'outcome panel '+decision.outcome} tabIndex={-1}>
            <div className="outcome-top"><span className="eyebrow">02 / {result.scenario==='none'?'ANSWER FROM ORIGINAL EVIDENCE':'SIMULATED ANSWER · NO ACCESS GRANTED'}</span><span className="status-pill">{outcomeNames[decision.outcome]}</span></div>
            <h2>{answerTitles[decision.outcome]}</h2>
            <p className="answer-reason">{reason?.detail??'All required checks pass for this report, supplier, purpose and evaluation date under the supplied policy and evidence.'}</p>
            <div className="answer-provenance"><span>{answerOrigin==='question'?'✓ AI-interpreted question':answerOrigin==='reviewed'?'✓ Human-reviewed case details':'Manual case · no AI interpretation'}</span><span>✓ Live Zetaris evidence</span><span>✓ Explicit policy checks</span><strong>{decision.checks.filter((c:any)=>c.status==='pass').length} / {decision.checks.length} checks pass</strong></div>
            <div className="outcome-meta"><span>{decision.evidence.find((e:any)=>e.id===decision.request.documentId)?.label??decision.request.documentId} → {decision.evidence.find((e:any)=>e.id===decision.request.supplierId)?.label??decision.request.supplierId}</span><span>{decision.request.purpose}</span><span>As of {decision.request.date}</span><span>Policy {decision.policyVersions.join(', ')||'unavailable'}</span></div>
          </div>
          <section className="why-section" aria-labelledby="why-title"><div className="section-heading"><div><span className="eyebrow">WHY THIS ANSWER?</span><h2 id="why-title">Three checks. The evidence behind each.</h2></div><span>Click a check to inspect its sources ↗</span></div><div className="checks">{decision.checks.map((check:any)=><button key={check.id} className={'check-card '+check.status} onClick={()=>inspect(check.sourceIds,check.label)}><div><span className="check-symbol">{symbols[check.status]}</span><span className="check-state">{words[check.status]}</span><span className="arrow">↗</span></div><h3>{check.label}</h3><p>{check.detail}</p><small>{check.sourceIds.length} sources · inspect evidence</small></button>)}</div></section>
          <section className="what-if panel" aria-labelledby="what-if-title"><div><span className="eyebrow">WHAT WOULD CHANGE THE ANSWER?</span><h2 id="what-if-title">Change one fact. See the difference.</h2><p>These are simulations. Original records stay untouched and every check runs again.</p></div><div className="scenario-actions"><button disabled={busy||explaining} className={result.scenario==='add-approval'?'chosen':''} onClick={()=>evaluateCase(result.decision.request,'add-approval')}>+ Simulate owner approval</button><button disabled={busy||explaining} className={result.scenario==='expire-nda'?'chosen':''} onClick={()=>evaluateCase(result.decision.request,'expire-nda')}>Set NDA to expired</button>{result.scenario!=='none'&&<button disabled={busy||explaining} onClick={()=>evaluateCase(result.decision.request,'none')}>Restore original evidence</button>}</div>
            {result.scenario!=='none'&&<div className="comparison"><div className="comparison-outcomes"><div><small>ORIGINAL EVIDENCE</small><strong>{outcomeNames[result.baseline.outcome]}</strong></div><span aria-hidden="true">→</span><div><small>SIMULATED SCENARIO</small><strong>{outcomeNames[decision.outcome]}</strong></div></div>{result.comparison.changedChecks.length?result.comparison.changedChecks.map((c:any)=><p key={c.id}>{c.label}: {words[c.before]} → {words[c.after]}</p>):<p>No check status changed. A simulated approval cannot override another failed or conflicting requirement.</p>}</div>}
          </section>
          <section className="evidence-panel panel" aria-labelledby="evidence-title"><div className="evidence-heading"><span className="eyebrow">03 / INSPECT THE EVIDENCE</span><h2 id="evidence-title">Don’t just take the answer. Check the sources.</h2><p>Read source passages, explore the relationships or see what earlier cases found.</p></div><div className="tab-bar"><div role="tablist" aria-label="Evidence views">{[['graph','Evidence graph'],['sources','Source records'],['memory','Case memory']].map(([key,label])=><button role="tab" id={`tab-${key}`} aria-controls={`view-${key}`} aria-selected={tab===key} key={key} onClick={()=>setTab(key)}>{label}{key==='memory'&&<span className="count">{result.recalled.length}</span>}</button>)}</div><span className="tiny">EVERY RELATIONSHIP HAS A SOURCE</span></div>
            <div role="tabpanel" id={`view-${tab}`} aria-labelledby={`tab-${tab}`}>
              {tab==='graph'&&<><div className="graph-caption">The relationships behind this decision<small>Select a node or relationship to inspect its supporting passage, version and dates.</small></div><EvidenceGraph graph={result.graph} inspect={inspect}/></>}
              {tab==='sources'&&<div className="source-list">{decision.evidence.map((e:any)=><button key={e.id} className={e.simulated?'sim-record':''} onClick={()=>inspect([e.id],e.label)}><span>{e.kind}</span><strong>{e.label}</strong><small>{e.simulated?'SIMULATED':e.sourceId} ↗</small></button>)}</div>}
              {tab==='memory'&&<div className="memory-view"><span className="eyebrow">METERLESS H-MEM · PERSISTENT WORKING MEMORY</span><h3>Recall is a lead, never permission.</h3><p>Previous findings are recalled with provenance, then rechecked against freshly retrieved original evidence at the current evaluation date.</p>{!result.recalled.length?<p className="notice">No matching prior finding recalled yet. Recheck this case to see memory in action.</p>:result.recalled.map((m:any)=><div className="memory-card" key={m.id}><strong>{m.id} · Revalidated</strong><p>Previous: {m.previousOutcome} ({m.previousDate}) → Current original evidence: {m.currentOutcome}</p><p>{m.scenarioExcluded?'Previous simulation excluded from evidence. ':''}{m.evidenceChanged?'Evidence snapshot changed. ':'Evidence snapshot unchanged. '}{m.evaluationDateChanged?'Evaluation date changed.':''}</p><small>{m.source} · {m.provenance.label}</small></div>)}<small>{result.memory.records} stored findings · {result.memory.ledgerEntries} append-only audit entries</small></div>}
            </div>
          </section>
          <div className="explain-panel panel"><div><span className="eyebrow">OPTIONAL AI EVIDENCE FOCUS</span><h3>Which checks matter most?</h3><p>Nightshift selects the key checks; the explanation uses verified policy-check text.</p></div><button disabled={explaining||busy} onClick={explain}>{explaining?'Asking Nightshift…':'Highlight key checks with AI ↗'}</button>{explanation&&<div className="explanation">{explanation.error?<p>{explanation.error}</p>:<><p>{explanation.text}</p><small>Live response · {explanation.model}</small></>}</div>}</div>
          <details className="audit"><summary>Technical receipt · {result.id.slice(0,8)}</summary><p>{decision.title}</p><p>Input: {answerOrigin==='question'?'AI interpretation':answerOrigin==='reviewed'?'Human-reviewed details after AI interpretation':'Manual selection'}</p>{interpretation&&<p>Interpreted through {interpretation.model}</p>}<p>Retrieved {result.snapshot.retrievedAt} · {result.snapshot.mode}</p><p>Semantic model: {result.snapshot.semanticModel?.name} · {result.snapshot.sourceCount} sources</p>{result.snapshot.queries?.map((q:any)=><p key={q.table}>{q.source} → {q.table}: {q.rowCount} retrieved rows</p>)}<p>Query: <code>{result.snapshot.query}</code></p><p>Evidence SHA-256: <code>{result.snapshot.hash}</code></p><p>Decision engine: fixed rules · Scenario: {result.scenario} · H-MEM record: {result.memoryId}</p></details>
        </>}
      </section>
      <details className="how-it-works panel" id="how-it-works"><summary>How ClauseLens gets an answer<span>AI understands. Data grounds. Policy checks decide.</span></summary><div className="how-grid"><div><b>1. Understand</b><p>Nightshift routes the question to Nemotron to identify the document, recipient and purpose. Unclear cases need your clarification.</p></div><div><b>2. Retrieve & verify</b><p>Zetaris queries five fictional sources through a semantic model. Predefined policy checks evaluate classification, NDA coverage and owner approval.</p></div><div><b>3. Inspect & compare</b><p>Every finding links to evidence. Simulations stay separate. Meterless H-MEM recalls previous findings and revalidates them against current evidence.</p></div></div></details>
      {modelInfo&&<details className="connections panel"><summary><span className="eyebrow">LIVE DATA CONNECTIONS</span><strong>{modelInfo.sources.length} sources → Zetaris semantic model</strong></summary><p>Five fictional business systems are registered separately. Zetaris maps their native fields into common business entities. Records are queried live; they are not materialized.</p><code>{modelInfo.name}</code><div className="connections-table"><table><thead><tr><th>Source</th><th>Semantic tables</th><th>Original data</th></tr></thead><tbody>{modelInfo.sources.map((source:any)=><tr key={source.id}><td>{source.id}</td><td>{modelInfo.tables.filter((t:any)=>t.source===source.id).map((t:any)=>t.name).join(', ')}</td><td><a href={source.endpoint} target="_blank" rel="noreferrer">Inspect source JSON ↗</a></td></tr>)}</tbody></table></div><details><summary>Inspect field mappings and relationships</summary>{modelInfo.tables.map((table:any)=><div className="mapping" key={table.name}><strong>{table.name}</strong>{table.columns.map((c:any)=><div key={c.name}><code>{c.raw} → {c.name}</code>{c.references&&<small>references {c.references}</small>}{c.primary&&<small>primary key</small>}</div>)}</div>)}</details><p>These are separate simulated sources on the same local server, not five connected enterprise products. Policy decisions use explicit rules.</p></details>}
      <div className="integration-status"><div className="source-status"><i className={catalog?'online':''}/><div><strong>{catalog?'Zetaris connected':'Waiting for Zetaris'}</strong><small>{catalog?`${catalog.integration.sourceCount} sources · ${catalog.integration.count} fictional records`:'No evidence fallback'}</small></div></div><p>Fictional policy assistance. No documents are sent and no access is granted.</p></div>
      <footer><span>ClauseLens / Hackathon prototype</span><span>Ask a policy question. Inspect the evidence. Understand what would change the answer.</span><span>Built with Codex · Actual tool use documented</span></footer>
    </main>
    {selected&&<div className="drawer-backdrop" onClick={()=>setSelected(null)}><section className="drawer" role="dialog" aria-modal="true" aria-label="Evidence inspector" onClick={e=>e.stopPropagation()}><button className="close" autoFocus onClick={()=>setSelected(null)} aria-label="Close evidence inspector">×</button><p className="eyebrow">EVIDENCE INSPECTOR</p><h2>{selected.label}</h2>{selected.records.map((e:any)=><article key={e.id}><span className={'source-kind '+(e.simulated?'sim':'')}>{e.simulated?'SIMULATED · ':''}{e.kind}</span><h3>{e.label}</h3><blockquote>{e.passage}</blockquote><dl><dt>Source ID</dt><dd>{e.sourceId}</dd><dt>Record ID</dt><dd>{e.id}</dd><dt>Version</dt><dd>{e.version}</dd>{e.lineage&&<><dt>Source system</dt><dd>{e.lineage.sourceSystem}</dd><dt>Semantic table</dt><dd>{e.lineage.semanticTable}</dd><dt>Source endpoint</dt><dd>{e.lineage.sourceEndpoint}</dd></>}<dt>Effective dates</dt><dd>{e.effectiveFrom} → {e.effectiveTo}</dd></dl><details><summary>Structured facts</summary><pre>{JSON.stringify(e.facts,null,2)}</pre></details></article>)}<p className="hint">All source material is fictional and curated for this demo.</p></section></div>}
  </div>;
}
function EvidenceGraph({graph,inspect}:{graph:any;inspect:(ids:string[],label?:string)=>void}){
 const columns=[graph.nodes.filter((n:any)=>n.kind==='PolicyClause'),graph.nodes.filter((n:any)=>['SharingRequest','Document','Classification'].includes(n.kind)),graph.nodes.filter((n:any)=>['Supplier','Agreement','Approval'].includes(n.kind))];
 const height=Math.max(340,...columns.map(c=>c.length*85+35));const positions=new Map<string,{x:number;y:number}>();columns.forEach((col,i)=>col.forEach((n:any,j:number)=>positions.set(n.id,{x:115+i*250,y:45+j*85})));
 return <div className="graph-wrap"><svg viewBox={`0 0 750 ${height}`} role="img" aria-label="Source linked evidence graph"><title>Evidence relationships; select nodes and edges to inspect provenance</title><defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#98b5ad"/></marker></defs>{graph.edges.map((edge:any)=>{const a=positions.get(edge.from)!,b=positions.get(edge.to)!;const mid=(a.x+b.x)/2;const bend=a.x===b.x?105:0,lift=a.y===b.y?-40:0;const d=`M${a.x},${a.y} C${bend?a.x+bend:mid},${a.y+lift} ${bend?b.x+bend:mid},${b.y+lift} ${b.x},${b.y}`;return <g key={edge.id} className="graph-edge" role="button" tabIndex={0} aria-label={`${edge.label}, ${edge.from} to ${edge.to}`} onClick={()=>inspect(edge.sourceIds,edge.label)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect(edge.sourceIds,edge.label);}}}><title>{edge.label} · click for source</title><path className="edge-hit" d={d}/><path className="edge-line" d={d} markerEnd="url(#arrowhead)"/></g>;})}{graph.nodes.map((node:any)=>{const p=positions.get(node.id)!;return <g key={node.id} className={'graph-node '+(node.simulated?'sim-node':'')} role="button" tabIndex={0} aria-label={`Inspect ${node.label}`} transform={`translate(${p.x-100},${p.y-25})`} onClick={()=>inspect([node.id],node.label)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect([node.id],node.label);}}}><rect width="200" height="55" rx="9"/><text x="12" y="19" className="node-kind">{node.simulated?'SIMULATED ':''}{node.kind.toUpperCase()}</text><text x="12" y="39">{node.label.length>27?node.label.slice(0,26)+'…':node.label}</text></g>;})}</svg><details className="edge-index"><summary>Inspect all {graph.edges.length} relationships</summary>{graph.edges.map((e:any)=><button key={e.id} onClick={()=>inspect(e.sourceIds,e.label)}>{e.from} → {e.to} <small>{e.label} ↗</small></button>)}</details></div>;
}
createRoot(document.getElementById('root')!).render(window.location.pathname==='/builder'?<Builder/>:<App/>);
