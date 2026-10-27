export function WorkflowNav({active}:{active:'answer'|'build'}){
 return <nav className="workflow-tabs" aria-label="ClauseLens workflows">
  <a href="/" aria-current={active==='answer'?'page':undefined}><span className="workflow-number">01</span><span><strong>Ask a question</strong><small>Interpret → retrieve → check the evidence</small></span><span className="workflow-direction" aria-hidden="true">↗</span></a>
  <a href="/builder" aria-current={active==='build'?'page':undefined}><span className="workflow-number">02</span><span><strong>Build the semantic layer</strong><small>Nemotron proposes → review → deploy in Zetaris</small></span><span className="workflow-direction" aria-hidden="true">↗</span></a>
 </nav>;
}
