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

Automated boundary tests replace HTTP fetch responses to test outages, incomplete reasoning, unknown entities and ambiguous extraction. The question-first browser suite also uses explicitly labeled interpretation test doubles for alternate outcomes, missing details, a model outage and fresh-value sequencing. Runtime requests do not return canned model responses or replace failed Zetaris calls with local fixtures.

## Tools actually used

Codex terminal tools: filesystem/code editing, npm registry installation, TypeScript checking, Node test runner, Vite build, Python Zetaris preflight and SQL runner, Docker networking inspection and driver reachability test, local HTTP integration tests. Official documentation was inspected using web access; H-MEM reference source was downloaded from the official GitHub repository. Sites skill supplied local development guidance; nothing was registered or published through Sites. No subagents were used.

The computer-use tool initially reported no browsers. The user then explicitly requested Playwright or a similar tool. Playwright was installed from npm and used with the existing `/usr/bin/google-chrome` browser. Actual desktop and mobile viewport browser tests and screenshots are recorded in `BROWSER-VERIFICATION.md`. The original 2026-10-22 browser tests used no model or evidence mocks. In the 2026-10-26 question-first suite, canonical desktop/mobile flows and desktop explanation/ambiguity remain live; other state-specific browser tests explicitly stub interpretation. Zetaris retrieval, evaluation and memory remain real in those browser runs.

## Demo constraints

Only four known policy clauses under `POL-2026.1` are supported. Question interpretation requires explicit entity mentions and one supported purpose; structured case fields are authoritative. The LLM never writes policies, facts, approvals or outcomes. Model responses are validated and provider reasoning artifacts are stripped before parsing; the explanation panel displays trusted evaluator text for selected references. Unknown policy versions are flagged for review.

The graph is ontology-informed, not a claim of OWL inference or automatic PDF extraction. Retrieved source passages are curated text. There is no real authorization service, document sending, production authentication or arbitrary natural-language policy compiler.

## Semantic-layer extension

The user explicitly requested the proposed multi-source semantic extension. Implemented five source files/endpoints, five Lightning source databases, one deployed `sharing_model` USL, seven activation queries and case-scoped app retrieval through that model. Used the supplied Python runner with dry runs for source creation, namespace creation, model deployment and activation. Existing objects and evidence were preserved. No materialization, extra database, RDF/SPARQL service or automatic permission inference was added. Native fields such as `vendor_code` and `recipient_id` are mapped to the same `supplier_id` by activation SQL. Source files are read on each source request, so their changes are visible live. The app queries through Zetaris only. See `SEMANTIC-LAYER.md` for actual files and verification limits.

## Focused Semantic Model Builder

Added live Zetaris metadata discovery/profiling and three-stage Nightshift generation of structured source bindings, field mappings, relationship proposals and clarifications. The model receives descriptions and limited fictional profile examples, never credentials. The target domain contract remains explicit. Backend templates generate the SQL; candidate compilation is read-only until a reviewed deploy action creates a separate named USL. Deployment verifies seven activated tables and five relationships. Selecting that model for evaluations is separate, persisted locally and reversible to the baseline. Source/plan fingerprints and validation age block stale deployment; edits invalidate validation; partial candidates are retained without automatic overwrite or selection.

Two successful staged proposal generations reported NVIDIA `nvidia/nemotron-3-ultra-550b-a55b`. An initial full-size generation failed with HTTP 502 and no canned fallback or deployment. Validation caught native rather than semantic endpoint names in the first staged proposal. The browser review corrected and deployed that real proposal, selected it for a real case and approval simulation, then restored baseline. A revised prompt generated semantic endpoint names correctly in a later live draft. See `SEMANTIC-MODEL-BUILDER.md` for the focused scope and actual tests. No Cursor or native Zetaris AI Data Steward usage is claimed; this is ClauseLens's own constrained builder over verified SQL/REST operations.

## Question-first interface — 2026-10-26

The primary action is now **Ask ClauseLens**. The browser calls `/api/interpret` with the current question and date; only complete, unambiguous model-resolved fields proceed immediately to `/api/evaluate`. The evaluation receives the freshly resolved case directly, rather than reading a stale React state value. Required details missing from the model response open a clarification panel and produce no evaluation. Previous case selections are never substituted for missing model output.

The case form is secondary, with explicit labels distinguishing human-reviewed details and manual fallback from an AI-interpreted question. Changing the question/date clears any previous answer. While asking, inputs are locked; scenarios use the actual answered request and never reinterpret another question. The screen foregrounds the answer, its reason, three source-linked checks and the hypothetical comparison. Technical connections, receipts and builder navigation remain available without dominating the primary flow. The fixed policy evaluator and live integration APIs are unchanged.

A missing WSL-to-Windows Nightshift tunnel was also repaired. `npm start` now runs the tunnel-aware startup script directly. Interpretation distinguishes invalid input, Zetaris catalog failure and Nightshift failure instead of attributing every failure to an unclear question.

## Workflow tabs and ElevenLabs video — 2026-10-27

Added shared, responsive navigation between answering and semantic-model generation. The recorded demo now performs a fresh three-call Nemotron proposal, clarification, validation, reviewed separate deployment, explicit selection and evaluation through the selected model. Baseline selection is restored after recording. The presentation uses ElevenLabs George / eleven_v4 with provider character-aligned captions; ElevenLabs is used only by the offline narration script, not by the app frontend or by Nemotron. Credentials are read from the environment and never included in the media or browser bundle.
