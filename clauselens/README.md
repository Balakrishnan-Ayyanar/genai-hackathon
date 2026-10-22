# ClauseLens

Ask a policy question. Inspect the evidence. Understand what would change the answer.

Local fictional policy-assistance demo built here with **Codex**, as requested. No Cursor usage is claimed. This app neither grants access nor sends documents. Hackathon tool eligibility needs to be checked against the event rules separately.

## Run

Prerequisites: existing Zetaris Docker stack running in WSL, Node 22+, Windows Nightshift running with a configured provider, and the existing private `../zetaris-getting-started/.env.local` configuration. No credentials are copied into this project. The backend reads that file; the frontend cannot access it. Override its path using `CLAUSELENS_ENV_FILE` when needed.

```bash
cd /home/bala/Projects/GenAI/zetaris-platform
docker compose up -d
cd ../clauselens
npm ci
npm run build
./scripts/start.sh
```

Open **http://localhost:3100** in Windows or WSL's browser. Port 3100 must remain available: Zetaris retrieves the fictional source from this server. For code changes use `npm run dev` instead of `npm start`.

Five sources are registered as `CL_DOCUMENTS`, `CL_SUPPLIERS`, `CL_AGREEMENTS`, `CL_APPROVALS` and `CL_POLICIES`, each with its own REST table. The deployed Unified Semantic Layer is `lightning.metastore.clauselens.sharing_model`, with seven activated tables and five foreign-key relationships. Open **Data connections** in ClauseLens to inspect source JSON, mappings and relationships. The actual registration, model DDL and activation SQL live in `scripts/semantic/`. The earlier `CLAUSELENS_REST.records` / `clauselens.evidence` setup remains available for comparison, but the app no longer queries it or falls back to it. The registered REST endpoints use Docker network gateway `172.18.0.1`. If that gateway changes, verify the new address using `docker network inspect zetaris_default`, test reachability from the driver, and update the registration deliberately. Do not rerun creation blindly or remove existing objects to resolve errors. Use the Zetaris repository's documented runner and dry run for future registration changes.

Nightshift uses the existing loopback SSH tunnel to Windows. `scripts/start.sh` starts the tunnel if needed. A Nightshift outage leaves deterministic checks available; a Zetaris outage blocks evaluations without a fixture fallback.

## Two-minute demo

1. Keep the default Orion / Supplier A / technical review / 2026-10-22 case and click **Evaluate original evidence**. Classification and NDA pass; approval is unknown. The app says no matching approval was found, not that approval never happened.
2. Click the approval check and inspect the policy passage, source ID, version and effective dates. Select graph nodes and relationships to inspect their provenance.
3. Click **Simulate owner approval**. The result becomes **Permitted under the supplied policy and evidence**. The comparison identifies only the approval check as changed. The simulated record has an explicit label and simulation source ID.
4. Restore original evidence. Permission is unestablished again. Open **Case memory**: H-MEM may recall the permitted hypothetical, but its revalidation uses current original evidence, so it does not establish approval.
5. Click **Explain through Nightshift** to request live model-assisted check selection. The model selects valid check IDs; the app displays the selected deterministic explanations. This prevents invented policy rules or altered outcomes.

Other cases are prefilled by the sidebar buttons; click Evaluate after selecting one. Marketing / Orion / A passes, technical review / Orion / B has an expired NDA, technical review / Vega / A fails classification, and audit / Orion / A has opposing owner records. To test ambiguity, ask “Can I share the report with them?” and click Interpret; missing case fields require clarification.

## Architecture and boundaries

- One Node/Express backend and React frontend, TypeScript, Vite production build.
- Five independent fictional sources in `data/sources/`: document registry, supplier registry, agreement register, approval register and policy repository. They use deliberately different field names. Together they retain the original 17 evidence records; NDA-purpose coverage is a separate four-row semantic table. `data/evidence.json` is now the legacy regression fixture, not the active source for evaluations. SharingRequest remains user input rather than a permanent semantic table.
- **Actual evidence path:** case-scoped app SQL → Zetaris USL tables → five registered raw REST tables → five read-only local source endpoints. Seven explicit queries retrieve normalized fields; approval queries preserve all matching decisions, agreement queries retain expired/future evidence, and document retrieval does not depend on approval existence. The app reconstructs the evaluator input from semantic columns, not the old stringified payload. Catalog retrieval reads all 17 records; the default case retrieves eight relevant evidence records plus three NDA-purpose rows. Every record has source-system and semantic-table lineage, and every receipt records model identity, queries, counts and a snapshot hash. No source failure triggers a local/legacy fallback. The sources share one local server; they simulate independent business systems, not five actual enterprise products.
- Fixed evaluator checks classification eligibility, NDA recipient/purpose/date and exact document-owner approval. Inclusive validity intervals are defined by the fictional policy. Decision precedence: conflict → explicit failure → unknown → all pass. Unsupported policy versions fail closed for review. This is a deliberately small policy evaluator, not a general policy language.
- **Actual Nightshift calls:** OpenAI-compatible `/v1/chat/completions`, server-side bearer token, `meterless-app: clauselens`. Question interpretation has catalog checks and explicit-mention ambiguity checks. Explanation generation is constrained to selecting known check references; displayed passages come from the evaluator. Routing uses `meterless/auto`; a catalog entry alone does not prove provider entitlement.
- **Actual H-MEM:** vendored upstream Meterless runnable reference, used for persistent working-memory storage, hybrid-ranked recall, source/provenance, and append-only trust ledger. The app filters candidates by exact case and retains the two newest qualifying findings alongside ranked leads, up to five, so repeated original findings cannot bury a recent hypothetical. Not a custom store merely labelled H-MEM. No dreaming or sleep automation is enabled. Recall runs before storage and revalidates matched case requests against freshly retrieved original evidence at the current evaluation date. H-MEM scores determine recall relevance only, never sharing permission.
- Every evaluation, original snapshot, scenario, checks and memory trace is stored under ignored `.runtime/evaluations`. H-MEM persists under `.runtime/hmem`. These are demo artifacts and can grow with repeated use; no production retention or multi-user isolation is implemented.
- What-if changes are copied in memory and never written to the source files or Zetaris. NDA simulation retains original provenance inside its facts. Both before and after use the same retrieval snapshot.
- SVG graph nodes and edges have source references. No Neo4j or extra database is needed.
- Browser requests use same-origin APIs. This local demo has no login and binds to `0.0.0.0` so the Docker driver can retrieve the source. Use it only in this local development setup; it is not a hosted service.

## Checks

```bash
npm test            # deterministic rules, integration boundary failures and H-MEM persistence/revalidation
npm run test:hmem   # 13 upstream conformance assertions
npm run build       # strict TypeScript check and production frontend
npm run verify      # real Zetaris + Nightshift + local API; creates fictional evaluation/memory receipts
npm run test:browser # Playwright, installed Chrome, desktop + mobile viewport; app must be running
npm run verify:semantic # deployed model, source counts, joins, provenance and reversible live-source probe
```

`npm run verify:semantic` briefly edits and restores a fictional source label to prove live virtualization. Run it separately from browser tests. `npm run verify` requires the running app and services, invokes the configured model provider and may consume provider quota. Test-only HTTP stubs are confined to `tests/integrations.test.ts`; runtime integrations have no mock mode.

Verification performed: source count and full payload equality through Zetaris; live canonical scenario and reversal; four alternate outcomes; Nightshift interpretation, ambiguity and evidence-focus responses; H-MEM disk persistence and revalidation; upstream conformance; TypeScript and production build. Browser verification is now available through Playwright using the installed Chrome browser, explicitly requested by the user after the computer-use tool had reported no browsers. Desktop and mobile viewport tests cover source inspection, graph node/edge clicks, approval simulation/reversal, H-MEM recall, alternate outcomes, and page overflow. Live Nightshift interpretation and explanation are tested once on desktop to avoid duplicate provider quota use. This is Chrome with mobile emulation, not physical-device or Safari/Firefox verification. See `docs/BROWSER-VERIFICATION.md` for results and artifacts.

See [semantic model and deployment guide](docs/SEMANTIC-LAYER.md), [integration and tool-use record](docs/IMPLEMENTATION.md) and [upstream H-MEM license](vendor/hmem/LICENSE).
