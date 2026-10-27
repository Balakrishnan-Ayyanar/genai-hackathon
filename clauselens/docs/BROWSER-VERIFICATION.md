# Browser verification

## Workflow navigation and recorded semantic generation — 2026-10-27

Shared workflow navigation links now appear on both pages, styled as two tabs with `aria-current` and responsive layouts. **Generate with Nemotron** explicitly names the model workflow. The updated selected browser suite passed **17 checks**, with one intentional duplicate-model skip, on desktop/mobile Chrome; application tests passed **40/40**. The two added tests exercise navigation between answering and semantic modeling and verify the active tab and no horizontal overflow.

A separate unmocked recording generated proposal `71002e4b-0c97-4b53-be94-d7a1ee20690b` through three real Nightshift/Nemotron calls, clarified the supplier identifier namespace, validated the mappings, reviewed SQL, deployed `sharing_71002e4b0c97`, selected it and evaluated the Orion question through that model. The original baseline was restored and independently checked afterward. This recording is separate from the test-suite count.

The video joins generation and review recordings of that same proposal. Cursor and click annotations follow real browser events; idle waits are shortened and stable views held for readability. No model-speed benchmark or unedited real-time recording is claimed. Model-call receipts and edit timestamps are in the video project's ignored output folder.

## Question-first interface — 2026-10-26

Result: **15 passed, 1 intentionally skipped** across desktop Chrome (1440 × 1000) and mobile Chrome emulation (390 × 844). Application tests remain **40/40 passing** and the TypeScript/Vite build passes. No candidate model was deployed or selected for this UI change; the baseline `sharing_model` remains active.

Run used:

```bash
npm run test:browser -- --grep 'question-first|alternate question|real Nightshift evidence|clarification never|model outage|evaluation uses|inspect source connections|builder source discovery'
```

Verified:

- One **Ask ClauseLens** action calls interpretation first and evaluation second. Real Nightshift/Nemotron resolves Orion / Supplier A / technical review on both desktop and mobile; live Zetaris evidence yields two passes and an unknown owner approval.
- The model-resolved case is visible, the manual fields start collapsed, and no separate evaluation click is needed.
- Missing details never inherit a previous case. An ambiguous question produces no evaluation request; human clarification is identified as reviewed input.
- A model outage produces no automatic answer. The explicit manual fallback is labeled as having no AI interpretation.
- Evaluation receives fresh resolved values directly, rather than stale React state. Editing the question clears the previous answer and locks case changes while a request is running.
- Source inspectors, actual graph relationship clicks, Escape-to-close and focus restoration work.
- Approval simulation, reversal, original-source isolation, NDA expiry, all four outcomes and H-MEM revalidation work.
- No page errors or page-level horizontal overflow in the canonical flows. Desktop and mobile screenshots were visually inspected; the graph retains its own horizontal scroll area on narrow screens.
- The builder's desktop/mobile source-discovery layout still works. Candidate deployment was intentionally not repeated for this UI-only change.

Real versus mocked: canonical desktop/mobile flows and the desktop evidence-focus/ambiguous-question test use real Nightshift calls. Alternate outcomes, forced ambiguity, forced model outage, fresh-field sequencing and source-inspection tests explicitly intercept `/api/interpret` with test-only responses. They still use the real application, Zetaris retrieval, rule evaluator and H-MEM. Runtime code has no mock route. The duplicate mobile evidence-focus/ambiguity test is skipped to avoid extra provider usage.

Artifacts: `.runtime/browser-results/demo-real-question-first-d-191ac-enario-isolation-and-memory-{desktop,mobile}-chrome/question-first-{start,answer,simulation}.png`. Additional manual visual-review captures are in `.runtime/question-first/`. Generated files remain ignored by Git.

## Earlier verification — 2026-10-22

Run on 2026-10-22 with Playwright and the existing installed Google Chrome in WSL. The user explicitly requested Playwright after the computer-use browser inventory was unavailable.

Result: **10 passed, 2 intentionally skipped** after adding the focused Semantic Model Builder. Desktop viewport 1440 × 1000; mobile viewport 390 × 844 with touch/mobile emulation. The mobile duplicates of live-model interpretation and candidate deployment were skipped to avoid redundant provider usage and writes. No tests replaced API, Zetaris, H-MEM or Nightshift responses with mocks.

Verified through actual browser actions:

- Initial catalog loads all 17 evidence records through the seven-table Zetaris USL; the default request retrieves eight case-relevant evidence records and produces two passes plus missing approval.
- Approval-card source inspector shows source ID, policy version and effective dates. Document inspectors additionally show actual source-system and semantic-table lineage.
- Graph document node and a relationship open the correct source inspector. Curved SVG relationship tests click the actual path midpoint, not an empty part of the curve's bounding rectangle.
- Simulated approval is clearly labelled and changes only the approval check; restoration returns to insufficient information.
- Simulated approval source is labelled `SIMULATION-ONLY` and does not appear in restored original source records.
- H-MEM recalls and revalidates a prior simulation without using it as original approval evidence, even after repeated demo runs.
- Valid permission, expired NDA, prohibited classification and opposing owner records produce the expected four outcomes.
- NDA-expiry what-if changes a permitted case to not permitted.
- Desktop Nightshift interpretation resolves Orion/A/technical review; ambiguous question clears required fields and disables evaluation; explanation shows a live model response.
- Canonical flows produce no uncaught page errors and no document-level horizontal overflow in either viewport.
- Data connections shows five separately registered sources, seven semantic tables, normalized field mappings and foreign-key relationships. Source JSON links return native source fields. The evaluation receipt shows the zero-row approval query without losing the selected document.
- Builder source discovery and responsive review layout passed on desktop and mobile. A saved real three-call Nemotron proposal was reviewed, clarified, validated, deployed to a separate seven-table/five-relationship USL, selected for actual case evaluation and an approval hypothetical, then baseline selection was restored. Generation itself was verified through the real builder API; the browser test starts from that saved proposal.
- Desktop and mobile full-page screenshots were captured and visually inspected. The graph scrolls within its panel on narrow screens.

Two fixes resulted from verification: curved SVG paths now avoid zero-width/height geometry for aligned nodes, and application-level H-MEM recall filters candidates by exact case before limiting displayed findings while retaining the two newest qualifying findings alongside ranked leads. A regression test covers recent simulated findings being crowded out by repeated originals. Application tests now pass 40/40; TypeScript and production build pass.

Rerun with the app and all services running:

```bash
npm run test:browser
```

Configuration: `playwright.config.ts`. Browser tests: `e2e/demo.spec.ts`. HTML report: `.runtime/playwright-report/index.html`. Additional mapping screenshots: `.runtime/browser-results/demo-inspect-five-source-c-fb490-nd-scoped-retrieval-receipt-{desktop,mobile}-chrome/semantic-connections.png`. Screenshot artifacts: `.runtime/browser-results/demo-canonical-demo-source-56852-enario-isolation-and-memory-{desktop,mobile}-chrome/{original-evidence,simulated-approval}.png`. These generated runtime artifacts are ignored by Git.

Limits: Chrome only; mobile emulation is not a real phone, and Firefox/Safari have not been checked. This smoke suite does not constitute a complete accessibility audit or performance/security assessment. The local app remains running at http://localhost:3100.

Builder screenshots: `.runtime/browser-results/builder-builder-source-dis-4752a-nd-responsive-review-layout-{desktop,mobile}-chrome/builder-discovery.png` and `.runtime/browser-results/builder-review-a-real-Nigh-60e56-select-and-restore-baseline-desktop-chrome/builder-validated.png`. See `SEMANTIC-MODEL-BUILDER.md` for provider failures, validation corrections and focused scope.
