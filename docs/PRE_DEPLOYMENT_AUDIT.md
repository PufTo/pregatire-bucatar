# Pre-deployment audit

**Date:** 30 October 2026 · **Recommendation: READY WITH MINOR CAVEATS**

The identified safety, persistence, offline-cache and input defects have been corrected locally. No unresolved **BLOCKER** or **HIGH** finding remains. Nothing was pushed, published or deployed; repository settings were not changed.

## Scope and architecture

Reviewed every tracked application/documentation/test file, the icon, manifest, service worker, `.nojekyll`, and the sole existing Git commit. The application remains a static Romanian single-page app: HTML/CSS, an in-memory question bank, DOM rendering, localStorage and a service worker. A small dependency-free `logic.js` now shares validated data/scoring/calculation helpers with tests. No backend, API keys, build process or runtime packages are required. Playwright and axe were installed only under `/tmp` for development tests.

## Important corrections

| Severity | Finding and correction |
| --- | --- |
| **HIGH** | Invalid stored data could leave the main screen empty; reproduced in Chrome with `stats:null`. Added schema validation for statistics, history, practice checkboxes, session IDs/index/times, answers and option order. Useful valid progress is retained. Untrusted history values no longer reach HTML unchecked. |
| **HIGH** | The old service worker deleted every other origin cache. Cache names and cleanup now include the application path; unrelated caches survive. Versioned complete precaching replaces network-first mixing of old/new files. Updates wait for the learner or closure of old tabs; failed downloads retain the working version. |
| **HIGH** | Expired exams disappeared on reload, and an answer could be accepted immediately after the deadline. Expiry is checked at rendering, interaction, timer ticks and foreground return. Expired attempts receive one score, with unanswered questions marked incorrect. |
| **HIGH** | Health guidance (#4, #10) did not adequately explain stopping work/medical assessment and infected wounds. Clarified these points against Romanian hygiene norms and EU hygiene rules. Practical notes now explicitly address egg-mixture heat treatment and allergens; they are identified as app-authored guidance. |
| **MEDIUM** | Learning sessions vanished on reload, storage errors were silent, and progress keys were shared across paths. Sessions now resume; storage failure has visible Romanian feedback; keys are path-specific with legacy import. Writes happen on actions, avoiding stale unload writes. |
| **MEDIUM** | Decimal-comma entry was unreliable in `type=number`; the tolerance also accepted inaccurate values. Decimal keyboard/text input now accepts `0,3` and `0.3`, rejects invalid/negative/empty input, and checks the actual recipe data. |
| **MEDIUM** | Rerendering lost keyboard focus; the entire main area was live, including the ticking timer. Added targeted focus, visible answer feedback, selected-answer state, current navigation, skip link, labels, table headers and scroll clearance. Increased small navigation/help text, improved contrast and touch targets. |
| **MEDIUM** | Clarified cleaning/rinsing (#6), either-direction critical-limit deviations (#24), thermometer/time-temperature use (#61), energy macronutrients (#89), and source-specific fish processing order (#125). The simulator is now explicitly an app training format; calculator feedback is distinguished from the original marking scheme. |
| **LOW** | Corrected wording/grammar (#102, #103, #138, #139); added explicit manifest scope, updated regulatory links to consolidated versions, documented update/offline/persistence limitations, and replaced the old arithmetic-only test with tests of application data and behavior. |

## Educational review and provenance

All **146 questions, 584 answer alternatives and 146 explanations** were read individually. All 30 Neamț-themed practice questions and the written/practical pages were checked. See [the per-ID review and supporting sources](CONTENT_REVIEW.md). IDs/order/count remain unchanged; no questions were removed. No exact duplicates or remaining conflicting accepted answers were found. Several topics intentionally repeat; distractors are often easy.

High-priority safety claims were checked against WHO guidance, EU regulations and Romanian hygiene norms. The WHO values remain recommendations, not universal legal limits. The 2025 change to the EU allergen annex was considered; its narrow industrial mustard-derivative exemption does not change the ordinary mustard-sauce answer. Basic culinary definitions were reviewed as general practice; this is **not** a claim of separate external corroboration for every sentence or official educational accreditation.

The [ANC standard](https://intern.anc.edu.ro/virtualanc/crud/standarde/standarde_ocupationale_2014_prezent/brain/upload/1681302852.pdf) confirms COR 512001, approval 55/31.01.2023 and 13 competencies. The app supports relevant study topics; it does not assess all practical competencies.

The [Neamț written paper](https://lteant.wordpress.com/wp-content/uploads/2023/03/subiect-concurs-meserii-bucatar-1.pdf), [marking scheme](https://lteant.wordpress.com/wp-content/uploads/2023/03/barem-concurs-meserii-bucatar.pdf) and [practical paper](https://lteant.wordpress.com/wp-content/uploads/2023/03/subiect-proba-practica-bucatari.pdf) were independently opened and read. Attribution to the county vocational competition, class XI, 4 March 2023 is supported. All ten calculation results and nine practical ingredient entries match, including **5 g egg**, **450 ml stock**, **3 × 200 g** and **90 minutes**. The practical source gives no method or loss/yield reconciliation; no cooking trial was performed. App-authored steps and practice questions are clearly distinguished from source facts.

## Tests performed

Environment: Node **22.13.1**, Chrome **147.0.7727.101**, Playwright **1.64.1**, axe-core **4.14.0**, Linux/headless browser. The original validation script passed before changes, demonstrating its limited coverage; it and the expanded checks were rerun after fixes.

```bash
node tests/validate-content.js
node tests/test-logic.js
NODE_PATH=/tmp/bucatar-audit-tools/node_modules node tests/browser-audit.js
NODE_PATH=/tmp/bucatar-audit-tools/node_modules AUDIT_FILTER="console errors" AUDIT_ARTIFACTS=/tmp/bucatar-console-artifacts node tests/browser-audit.js
node --check assets/js/app.js
node --check assets/js/questions.js
node --check assets/js/logic.js
node --check sw.js
git diff --check
```

- Content validation: **PASS**, 146 items, 8 categories, 30 themed items, distinct alternatives, IDs, assets and manifest paths.
- Logic: **PASS**, 6 test groups; all 584 answer alternatives, empty/perfect scores, actual recipe quantities, malformed storage/sessions, and decimal parsing.
- Browser: **PASS**, 10 full-suite scenario groups, an additional targeted real-service-worker console check, and **46 axe scans**, zero reported WCAG A/AA violations in scanned states. No application exceptions, browser console errors in the dedicated console check, unexpected HTTP failures or unsolicited third-party requests.
- Browser scenarios include all categories; complete 10/15/25/146-question sessions; mistake review to empty; 30-item model selection; a complete 20/25 exam; changing answers/back navigation; refresh/resume; expiry live/on reload/on interaction/on foreground return; exit/reset cancellation and acceptance; repeated answer clicks; all ten calculations; practice persistence; malformed/blocked storage; legacy import; empty question bank; keyboard navigation; root/subpath hosting; offline operation; successful and failed updates. Deadline tests advance the clock; they do **not** wait thirty real minutes.
- Screenshots and machine-readable diagnostics are generated in `/tmp/bucatar-audit-artifacts`; they are not bundled with the site. Screenshots at narrow and tablet widths were visually inspected as well as checked automatically.

## Mobile and GitHub Pages results

| Viewport width | Navigation, learning, source/practical/calculation pages | Overflow/touch checks | Axe checks |
| --- | --- | --- | --- |
| 320 px | PASS | PASS | PASS |
| 360 px | PASS | PASS | PASS |
| 390 px | PASS | PASS | PASS |
| 430 px | PASS | PASS | PASS |
| 768 px | PASS | PASS | PASS |

Tests use mobile/touch emulation and local **HTTP**, including `/pregatire-bucatar/`; they are not physical-device tests. Semantic labels, selected answers and keyboard focus were exercised. This is not a full manual screen-reader/WCAG certification.

Relative scripts/styles/icons load successfully at root and project paths. Manifest start/scope and service-worker scope resolve to the project path. All eight required cache entries were present. Offline reload, `index.html` with a query string, learning, exam and calculator worked. A simulated version update retained progress/session and preserved two foreign caches. A failed subsequent precache left the working app usable offline. `.nojekyll` is present. No backend or client-side route rewrite is needed; navigation uses in-page views, not deep URLs.

## Security, privacy and source links

No credentials, tokens or sensitive personal data were found in the application or the one-commit history (manual inspection plus credential-pattern scan). No analytics, remote fonts, remote scripts or unnecessary permissions were found. Dynamic text is escaped; persisted data is reconstructed from an allowlisted schema. Progress is origin-local and path-namespaced; paths are not a security boundary against other scripts on the same origin.

Direct HTTP checks returned **200** for the three Neamț PDFs, ANC PDF, ministry page, WHO page, Scribd page and Romanian norms. Both consolidated EUR-Lex links returned **202/empty responses** to the direct client and anti-bot restrictions through the research tool. Relevant official indexed text and the amending act were consulted; uninterrupted access to these two links is not claimed. Scribd remains a third-party upload, with possible account restrictions, not an authoritative safety source.

External PDFs were not added to the repository. Only linked sources, factual quantities and original practice material are included. No explicit redistribution license for the source papers was established. The repository itself still has no selected open-source license.

## Remaining caveats and recommendation

- **MEDIUM:** Test on the learner's actual phone, particularly Safari/iOS, and with a screen reader if needed. Native installation was not tested; SVG-only icons may limit installation/icon support in some browsers. Ordinary browser/offline use passed in Chrome.
- **LOW:** Use one study tab. Concurrent tabs can overwrite progress; no cross-device sync/export exists. A completed exam's full correction is not restored after leaving/reloading its results, although scores and mistakes remain. Browser deletion/eviction can remove progress/cache; external PDFs require internet.
- **LOW:** An instructor-led practical trial remains useful, particularly for the source recipe's yield and technique. No claim of exhaustive occupational-standard coverage is made. Keep the original-source attribution and avoid treating app simulation percentages as certification pass marks.
- **LOW:** External availability/rights can change. Keep papers linked, decide a license before encouraging code redistribution, and bump `VERSION` whenever deploying changed app assets. The pre-audit legacy cache may remain until browser eviction; the new worker does not read it.

**READY WITH MINOR CAVEATS.** No remaining issue found in this audit requires blocking publication of this lightweight study aid. Physical-phone checks and practical instructor feedback remain recommended; no deployment was performed.

## Files modified or added

`index.html`, `assets/css/style.css`, `assets/js/app.js`, `assets/js/questions.js`, **new** `assets/js/logic.js`, `manifest.webmanifest`, `sw.js`, `README.md`, `docs/SURSE-SI-VERIFICARE.md`, **new** `docs/CONTENT_REVIEW.md`, **new** `docs/PRE_DEPLOYMENT_AUDIT.md`, `tests/validate-content.js`, **new** `tests/test-logic.js`, **new** `tests/browser-audit.js`.
