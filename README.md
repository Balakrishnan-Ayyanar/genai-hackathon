# ClauseLens — GenAI Hackathon

**Ask a policy question. Inspect the evidence. Understand what would change the answer.**

ClauseLens is a local fictional policy-assistance demo for checking whether an employee can share a document with an external supplier. It combines live Zetaris evidence retrieval, explicit policy checks, source-linked graph inspection, hypothetical comparisons, Nightshift model calls and Meterless H-MEM recall with revalidation.

The active implementation uses five separately registered fictional source systems and a deployed Zetaris Unified Semantic Layer with seven tables and five foreign-key relationships. It does not send documents or grant access.

## Project

- [`clauselens/`](clauselens/): application source, fictional data, semantic-model SQL, tests and documentation.
- [`connection-tools/`](connection-tools/): local WSL/Windows Nightshift connectivity helpers.
- [Application run instructions and demo walkthrough](clauselens/README.md).
- [Semantic-layer architecture and deployment](clauselens/docs/SEMANTIC-LAYER.md).
- [Actual tool-use and integration record](clauselens/docs/IMPLEMENTATION.md).
- [Browser verification](clauselens/docs/BROWSER-VERIFICATION.md).

## Local setup

The app requires an existing local Zetaris installation and a configured Nightshift Runtime. Installation bundles, downloaded reference material and private credentials are deliberately excluded from this repository. Place the Zetaris getting-started checkout alongside `clauselens/` as described in the application guide; its private `.env.local` is read by the backend only. The tunnel helper currently targets the original Windows/WSL development setup and needs path/user adjustments on another machine.

```bash
cd clauselens
npm ci
npm run build
npm start
```

With the services and semantic sources configured, open http://localhost:3100.

## Verification

```bash
cd clauselens
npm test
npm run test:hmem
npm run build
# Requires the running app, Zetaris and Nightshift:
npm run verify
npm run test:browser
# Run separately: briefly changes/restores a fictional source label.
npm run verify:semantic
```

All policies, people, suppliers, documents and approval records are fictional. What-if changes are separated from original evidence. Development was performed with Codex; no Cursor use is claimed. The Meterless H-MEM reference is vendored with its upstream license under [`clauselens/vendor/hmem/`](clauselens/vendor/hmem/).
