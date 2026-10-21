---
doc: checklist
status: approved
---

# Build Checklist

Build mode: fast

## Slices

- [x] **1. Try a sample and see the lease highlighted with cards**
  Becomes usable: Running app; clicking a sample shows the lease with highlighted sentences and finding cards.
  Why now: Proves the kernel (highlight in place) end to end, including scaffold, splitter, first rules and both views.
  PRD ref: `prd.md > The Core Journey` (steps 1-4), `prd.md > Input and samples`
  Spec ref: `spec.md > Analyzer`, `spec.md > Samples`, `spec.md > Result view`
  Build: Scaffold Vite + TS + Vitest, sentence splitter with offsets, rule framework, analyzer, two samples, start view, result view with paper and cards.
  Verify (mechanical): `npm test` passes; `npm run build` succeeds; analyzing each sample yields findings.
  Learner check: Open the app, click a sample, see highlights and cards.
  Commit: `feat: scaffold app, analyzer and highlighted lease view`

- [x] **2. All 26 clause types detected, each tested**
  Becomes usable: Every clause type in the PRD is flagged with explanation, normal context and message.
  Why now: The catalogue is the product's substance.
  PRD ref: `prd.md > The clause engine (deterministic)`
  Spec ref: `spec.md > Clause catalogue and rules`
  Build: Rules grouped in five files with positive and negative tests per rule.
  Verify (mechanical): `npm test` shows a positive and a negative test per rule id; samples stable.
  Learner check: Paste custom clauses and watch them flag.
  Commit: `feat: full clause catalogue with per-rule tests`

- [x] **3. Score, summary bar and linked selection**
  Becomes usable: Risk score, severity bar, one-sentence read; clicking a card or highlight links both sides.
  Why now: Turns findings into a decision aid.
  PRD ref: `prd.md > Risk score and summary`, `prd.md > Linking lease and cards`
  Spec ref: `spec.md > Analyzer`, `spec.md > Result view`
  Build: Scoring, bands, summary text, selection and pulse, mobile tabs.
  Verify (mechanical): Score unit tests; deterministic output test; Playwright smoke at 375px.
  Learner check: Click cards and highlights; resize the window.
  Commit: `feat: risk score, summary and linked selection`

- [x] **4. Negotiation messages and checklist export**
  Becomes usable: Copy message, copy all, print and download the pre-signing checklist.
  Why now: The action the renter takes after reading.
  PRD ref: `prd.md > Negotiation messages`, `prd.md > Checklist export`
  Spec ref: `spec.md > Messages and checklist`
  Build: Clipboard helper with fallback, checklist builder and dialog, print CSS.
  Verify (mechanical): Checklist unit tests; manual Playwright copy check.
  Learner check: Copy a message and download the checklist.
  Commit: `feat: negotiation messages and checklist export`

- [x] **5. PDF upload and designed states**
  Becomes usable: Drop a text PDF; scanned, wrong type, too short and oversize inputs show designed errors.
  Why now: Real leases arrive as PDFs.
  PRD ref: `prd.md > Input and samples`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > PDF extraction`, `spec.md > Important Failure Modes`
  Build: pdf.js lazy extraction, error mapping, loading state.
  Verify (mechanical): Generate a text PDF and a blank PDF fixture and run extraction in the browser via Playwright.
  Learner check: Drop a PDF.
  Commit: `feat: in-browser PDF extraction and error states`

- [x] **6. Deeper read with the user's own Gemini key**
  Becomes usable: Optional AI summary panel.
  Why now: Optional extra, built last so the core stays independent.
  PRD ref: `prd.md > Deeper read (optional BYOK)`
  Spec ref: `spec.md > Deeper read`
  Build: Key field in sessionStorage, request builder, error mapping.
  Verify (mechanical): Unit tests for request building and error mapping with a mocked fetch.
  Learner check: Open the panel; confirm it explains what is sent.
  Commit: `feat: optional Gemini deeper read`

- [x] **7. Design polish, accessibility, README and submission assets**
  Becomes usable: Finished look at 375px to 1920px; docs; demo video and screenshots.
  Why now: Design is a third of the score.
  PRD ref: `prd.md > Look and Feel`
  Spec ref: `spec.md > Look and Feel`
  Build: Styles, focus handling, contrast test, README, screenshots, submission folder, capture script.
  Verify (mechanical): `npm test`, `npm run build`, screenshots exist, ffprobe duration above 60s.
  Learner check: Watch the demo video.
  Commit: `docs: README, submission assets and screenshots`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 1 (agent ran the built app in headless Chromium and viewed screenshots; human owner reviews at hand-off)
- [x] Final kick-the-tires exploration and feedback completed — agent exercised the flow via Playwright; human owner reviews at hand-off

## Final Review

- [x] Final review complete — agent verification done; human owner confirms before submitting

## Code Tour and App Map

- [x] Learning activity complete — recap of one core action traced through the code (see Activity and evidence)
- [x] Optional edit and transfer reflection addressed — not applicable (autonomous agent build; owner not present)
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: brief recap. Clicking "Try a sample" runs `analyze()` in `src/engine/analyze.ts`, which uses `splitSentences()` and the rules in `src/engine/rules/`; the result renders via `src/ui/result.ts`. Test evidence: `tests/rules.test.ts`.
Route and stops: `src/main.ts` > `src/engine/analyze.ts` > `src/ui/lease.ts` (reference route, not toured interactively).
Edit outcome: not applicable.
Reflection: not applicable (no human learner present).
Activity mode: recap

## Revisions
