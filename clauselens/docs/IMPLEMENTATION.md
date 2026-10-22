# Implementation and integration record

Date: 2026-10-22. Development environment: Codex in WSL2 Ubuntu. User explicitly selected “Build here with Codex; document actual tool use.” No Cursor editing, Cursor CLI use or Cursor attribution is claimed.

## Real integrations

| Component | Implemented path | Evidence |
| --- | --- | --- |
| Zetaris | Existing Docker instance, five separate REST sources, seven-table deployed USL with five foreign keys | Live model load confirms keys and relationships; source/USL row counts match; 17 normalized evidence records preserve facts and provenance; cross-source SQL join and reversible live source-change probe passed |
| Nightshift | Existing Windows Runtime via loopback SSH tunnel; authenticated model calls from WSL | Invalid-token rejection and model discovery verified; live app calls for question extraction, ambiguous question and fixed-check selection succeeded |
| NVIDIA | Provider routed by Nightshift | Successful responses reported `nvidia/nemotron-3-ultra-550b-a55b`; no claim that every advertised model is available |
| Meterless Engine | Official H-MEM TypeScript reference, vendored with license | Actual disk persistence, ranked recall, provenance and append-only ledger used in app; recall revalidation tests and 13/13 upstream conformance checks passed |

H-MEM source: https://github.com/Meterless/Meterless/tree/main/engines/hmem/reference

Reference source and conformance files downloaded from official Meterless `main` on the implementation date. The upstream source is unchanged; application-specific storage and revalidation lives in `src/memory.ts`. Exact file digests are in `vendor/hmem/UPSTREAM-SHA256.txt`. This is the runnable reference, not a claim of a production-certified H-MEM package.

## Fictional data and test doubles

All policies, suppliers, people, reports, NDA terms and approvals are authored fictional fixtures. Serving five independent curated fictional sources through separately registered REST tables is intentional; the Zetaris integration itself is real. Hypothetical approvals and NDA expiry changes are explicitly marked simulated and stay outside original evidence.

Only automated boundary tests replace HTTP fetch responses to test outages, incomplete reasoning, unknown entities and ambiguous extraction. Runtime requests do not return canned model responses or replace failed Zetaris calls with local fixtures.

## Tools actually used

Codex terminal tools: filesystem/code editing, npm registry installation, TypeScript checking, Node test runner, Vite build, Python Zetaris preflight and SQL runner, Docker networking inspection and driver reachability test, local HTTP integration tests. Official documentation was inspected using web access; H-MEM reference source was downloaded from the official GitHub repository. Sites skill supplied local development guidance; nothing was registered or published through Sites. No subagents were used.

The computer-use tool initially reported no browsers. The user then explicitly requested Playwright or a similar tool. Playwright was installed from npm and used with the existing `/usr/bin/google-chrome` browser. Actual desktop and mobile viewport browser tests and screenshots are recorded in `BROWSER-VERIFICATION.md`. No browser model calls or evidence retrieval were mocked in these tests.

## Demo constraints

Only four known policy clauses under `POL-2026.1` are supported. Question interpretation requires explicit entity mentions and one supported purpose; structured case fields are authoritative. The LLM never writes policies, facts, approvals or outcomes. Model responses are validated and provider reasoning artifacts are stripped before parsing; the explanation panel displays trusted evaluator text for selected references. Unknown policy versions are flagged for review.

The graph is ontology-informed, not a claim of OWL inference or automatic PDF extraction. Retrieved source passages are curated text. There is no real authorization service, document sending, production authentication or arbitrary natural-language policy compiler.

## Semantic-layer extension

The user explicitly requested the proposed multi-source semantic extension. Implemented five source files/endpoints, five Lightning source databases, one deployed `sharing_model` USL, seven activation queries and case-scoped app retrieval through that model. Used the supplied Python runner with dry runs for source creation, namespace creation, model deployment and activation. Existing objects and evidence were preserved. No materialization, extra database, RDF/SPARQL service or automatic permission inference was added. Native fields such as `vendor_code` and `recipient_id` are mapped to the same `supplier_id` by activation SQL. Source files are read on each source request, so their changes are visible live. The app queries through Zetaris only. See `SEMANTIC-LAYER.md` for actual files and verification limits.
