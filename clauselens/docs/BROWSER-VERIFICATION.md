# Browser verification

Run on 2026-10-22 with Playwright and the existing installed Google Chrome in WSL. The user explicitly requested Playwright after the computer-use browser inventory was unavailable.

Result: **7 passed, 1 intentionally skipped** after the multi-source semantic-layer extension. Desktop viewport 1440 × 1000; mobile viewport 390 × 844 with touch/mobile emulation. The mobile duplicate of the live-model test was skipped because model routing is identical and repeating it consumes provider quota. No tests replaced API, Zetaris, H-MEM or Nightshift responses with mocks.

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
- Desktop and mobile full-page screenshots were captured and visually inspected. The graph scrolls within its panel on narrow screens.

Two fixes resulted from verification: curved SVG paths now avoid zero-width/height geometry for aligned nodes, and application-level H-MEM recall filters candidates by exact case before limiting displayed findings while retaining the two newest qualifying findings alongside ranked leads. A regression test covers recent simulated findings being crowded out by repeated originals. Application tests now pass 29/29; TypeScript and production build pass.

Rerun with the app and all services running:

```bash
npm run test:browser
```

Configuration: `playwright.config.ts`. Browser tests: `e2e/demo.spec.ts`. HTML report: `.runtime/playwright-report/index.html`. Additional mapping screenshots: `.runtime/browser-results/demo-inspect-five-source-c-fb490-nd-scoped-retrieval-receipt-{desktop,mobile}-chrome/semantic-connections.png`. Screenshot artifacts: `.runtime/browser-results/demo-canonical-demo-source-56852-enario-isolation-and-memory-{desktop,mobile}-chrome/{original-evidence,simulated-approval}.png`. These generated runtime artifacts are ignored by Git.

Limits: Chrome only; mobile emulation is not a real phone, and Firefox/Safari have not been checked. This smoke suite does not constitute a complete accessibility audit or performance/security assessment. The local app remains running at http://localhost:3100.
