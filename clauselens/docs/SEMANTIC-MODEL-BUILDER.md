# Focused Semantic Model Builder

Open **http://localhost:3100/builder**, or select **Semantic Model Builder** in the ClauseLens header.

The builder turns a natural-language business goal into a reviewable, model-generated mapping proposal for the five existing fictional sources. It discovers real registered metadata through Zetaris, calls Nightshift, validates the proposal, generates constrained SQL, deploys a separate candidate USL, and optionally selects that verified model for subsequent sharing-case evaluations.

This is a focused ClauseLens builder, not an arbitrary ontology generator or unrestricted SQL agent. The seven target entities/columns and five required relationships are an explicit application contract. Nemotron selects source/collection bindings, maps native fields to those target columns, explains the connections and identifies uncertain business meanings. It does not generate policy rules or grant sharing permission.

## Use it

1. Inspect **Discovered through Zetaris**. Each of five registered sources exposes its collections, actual scalar field types, row counts, missing/distinct-value counts and limited examples. The business descriptions are curated metadata, not facts inferred from column names.
2. Describe your goal, for example: “Connect documents, suppliers, NDA coverage, owner decisions and policy clauses so employees can check whether they may share reports externally. Preserve dates, source references and conflicting records.”
3. Click **Propose through Nightshift**. Generation makes three real requests: one source/relationship blueprint and two compact field-mapping batches. This avoids relying on one oversized completion. Provider response times vary and generation may take several minutes. A failed call is reported; no canned proposal is substituted.
4. Review the proposed source bindings and mappings. Answer the shared supplier-identifier question. Matching `recipient_id` and `vendor_code` samples alone do not prove that the business identifiers have the same meaning. “No / uncertain” blocks deployment until a real crosswalk is supplied; the focused builder does not invent one. The model can also ask additional questions. Those answers are recorded for review. **Refine a new proposal using these answers** sends the answers back to all three generation stages and creates a separate draft.
5. Correct mappings or relationship endpoints using their selectors. Relationships must use semantic names, such as `approval.supplier_id → supplier.supplier_id`, rather than native names such as `recipient_id → vendor_code`. The interface explains any validation errors.
6. Click **Validate proposal**. This saves the revision, checks live source metadata, compiles candidate DDL without deployment, runs read-only source mapping queries, checks primary keys and reference coverage, converts dates, and verifies the expected fictional case outcomes. The focused fixture contract currently expects the supplied 17 evidence records and known demo IDs. Changes to that dataset/contract may require extending the validation suite.
7. Inspect the generated deployment and activation SQL. Check **I reviewed the mappings, relationships and generated SQL**, then select **Deploy reviewed candidate**. Deployment creates `lightning.metastore.clauselens.sharing_<unique-id>`, activates seven tables, loads model metadata and verifies the actual table results. The original `sharing_model` is not replaced, and sources are not modified or materialized.
8. Select **Use this model for case evaluations** only when you want the app to use the candidate. That action rechecks source fingerprints and actual candidate records. Model selection persists locally across restarts. Open the sharing app and inspect the evaluation receipt to see its model identity and query provenance. **Use original baseline** restores the original app selection without deleting candidate models.

## Validation and review boundaries

The backend accepts a strict structured proposal, not model-supplied SQL. It allowlists registered sources, collections, field identifiers and the fixed target contract. DDL, date casts, primary-key expressions and activation queries come from backend templates. Statements cannot contain model-generated filters, constants, expressions, source URLs, credentials, grants or deletion operations.

All five expected relationships must be present. Primary keys must be populated and unique; reference values must resolve. The mapped evidence must retain the expected valid, missing approval, expired NDA, prohibited classification, conflicting approval, date-boundary and hypothetical-approval behaviors. This checks the small demo contract; it does not establish that every business meaning is correct. The operator must still review descriptions, proposed meanings and free-text clarifications.

Edits invalidate previous validation. Deployment requires the same validated plan/answer fingerprint, source schema and data fingerprints, and a validation no older than 15 minutes. Operations on a proposal are locked against concurrent mutation within the local server. A completed deployment is idempotent. A partially failed candidate remains in Zetaris for inspection; it is never selected automatically and cannot silently be overwritten by retrying the proposal. Create a new proposal after correcting the problem. No cleanup/drop feature is included.

The review checkbox is a local workflow gate, not authenticated proof that a particular human approved the model. This remains a local development demo without production authentication or multi-user governance.

## Persistence and actual integration

- `src/builder-catalog.ts`: live source discovery using `SHOW LIGHTNING DATABASES`, `DESCRIBE DATASOURCE TABLE` and explicit read-only profiling queries.
- `src/builder.ts`: three-stage Nightshift generation, strict plan validation, SQL compilation/deployment, persisted proposal state and verification.
- `src/builder-routes.ts`: the local API; no arbitrary SQL execution endpoint.
- `src/builder-client.tsx`: goal, catalog, proposal review/editors, questions, validation, SQL preview and deployment/selection UI.
- `src/active-model.ts`: strict binding/configuration validation and atomic local selection persistence.
- `.runtime/builder/<proposal-id>.json`: ignored proposal, model route(s), catalog fingerprints, revisions, answers, validation and deployment receipts.
- `.runtime/active-model.json`: ignored selected model/bindings. New evaluation snapshots retain the actual model path/version. Existing receipts are not rewritten.

No credentials are sent to the browser or the model. Only the five fictional-source metadata/profile summaries are supplied to Nightshift. Each successful generation records its reported model route. Source passages remain curated fictional evidence; this feature does not extract ontologies from arbitrary PDFs.

## Verification

```bash
npm test
npm run build
# Requires the running app and configured Zetaris/Nightshift; uses provider quota:
npm run verify:builder
# Review/deploy tests use the saved real proposal when available:
npm run test:browser
```

`verify:builder` creates a real draft and saves its ID in `.runtime/builder-probe-id`. It does not deploy or select the model. The browser deployment test uses that actual proposal, exercises the review gate and real Zetaris deployment, selects the candidate for a sharing-case evaluation, checks the approval hypothetical, and restores baseline selection in cleanup. Without a saved live proposal this test is explicitly skipped. Duplicate mobile deployment/model tests are skipped to avoid redundant writes and provider usage. The normal desktop/mobile discovery and app-flow tests still run.

A first large generation request returned HTTP 502 and created no candidate. The first successful staged proposal used native field names in relationship endpoints; validation blocked deployment. Browser review corrected those endpoints, then deployed and tested it. The revised prompt explicitly supplies semantic column names; a subsequent real Nemotron proposal returned the correct semantic relationships directly. This is why generation, validation and review are separate stages. Unit tests use explicitly labelled SQL/model doubles only for failure paths and state-machine checks; the live verification and browser deployment use real integrations.
