---
doc: spec
status: approved
---

# LeaseLens — Technical Spec

## How This Works, In Plain Language
LeaseLens is a web page with no server behind it. When someone pastes a lease, drops a PDF or clicks a sample, the page turns the file into plain text (inside the browser), cuts the text into sentences, and runs each sentence past a catalogue of about 26 clause rules. A rule is a small recipe ("auto-renews unless you give 60 days' notice") written as patterns plus some conditions. Every rule that fires produces a finding: severity, the exact sentence, an explanation, what is normal, and a negotiation message. The page then draws the lease like paper with those sentences highlighted, lines up the findings as cards, and adds up a score.

Nothing is sent anywhere. The only network call the app can ever make is the optional "Deeper read", which sends the lease text to Google's Gemini API using a key the user pastes in. The key stays in sessionStorage (it disappears when the tab closes).

This shape (rules in the browser, no backend, AI optional) is the simplest design that proves the kernel: highlighting in place, privately, instantly, and testably.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.
1. Page loads `index.html` -> `src/main.ts` renders the start view (`ui/start.ts`).
2. User pastes text / drops a PDF / clicks a sample -> text enters `main.ts`. PDFs go through `pdf/extract.ts` (pdf.js, lazy-loaded) and return text or a typed error.
3. `engine/analyze.ts` splits the text into sentences with offsets (`engine/text.ts`), runs every rule (`engine/rules/*`), merges overlapping hits, and computes the score (`engine/score.ts`). Output: an `Analysis` object.
4. `ui/result.ts` renders the summary band, `ui/lease.ts` renders the paper with `<mark>` elements, `ui/cards.ts` renders the finding cards. A shared selection state links them.
5. Copy buttons call `ui/clipboard.ts`; checklist uses `engine/checklist.ts` plus `ui/checklist.ts` (print CSS and Markdown download).
6. Optional: `ui/deeper.ts` collects the key, `ai/gemini.ts` calls Google's API and returns a summary.

## Stack
- TypeScript (strict) with Vite 5, vanilla DOM (no UI framework): small bundle, fast load, nothing to hide behind. Docs: https://vite.dev/guide/
- pdfjs-dist (Apache-2.0) for in-browser PDF text extraction: https://mozilla.github.io/pdf.js/ (lazy-loaded so the start page stays small).
- Vitest for unit tests: https://vitest.dev/
- Playwright for screenshots and the demo recording: https://playwright.dev/
- Google Fonts: Source Serif 4 and Inter (CSS link).
- Verified early in the build: pdf.js worker bundling with Vite and relative base path.

## Where It Runs and How Someone Tries It
- Runs entirely in a modern browser. Needs Node 20+ only to build.
- `npm install`, `npm run dev` (development) or `npm run build` then `npx vite preview` (production build) and open the printed localhost URL.
- Demo recording: `node submission/capture.mjs` (builds, serves with `vite preview`, records `submission/demo.webm`).
- Deployment is optional: the build uses a relative base (`./`) so `dist/` can be published to GitHub Pages as is.

## Look and Feel
Carried from `prd.md > Look and Feel`. Paper (#FAF6EE) lease on a slightly cooler page (#F1EEE8); ink #1D1B16; accent deep teal #0F5C6E. Risk styles: high = deep red text on pale red underline/left border (#8E1B1B on #FBE3DF), medium = amber/brown (#7A4A00 on #FBEBC8), low = slate blue (#1F4E79 on #E3EEF8); contrast verified AA by a test. Serif for lease and headings, sans for UI. Spacious, calm, plain interface copy ("Here is what to look at before you sign"), no emoji, no gradients, hairline borders. Reference tone: legal-aid pamphlet, quality newspaper.

## Components

### Clause catalogue and rules
`src/engine/rules/` — one file per group (`term.ts`, `money.ts`, `access.ts`, `liability.ts`, `living.ts`). Each rule is `{id, severity, title, test(sentence, ctx) -> match|null, explain, normal, why, message, question}`. A test is regex/keyword based, sometimes with a number threshold (e.g. notice period of 60+ days, late fee above a percent) or a negation check ("24 hours' notice" disables the entry rule).
PRD ref: `prd.md > The clause engine (deterministic)`.

### Analyzer
`src/engine/analyze.ts` with `text.ts` (sentence splitter that keeps character offsets and handles headings, numbered clauses and abbreviations), merging of multiple findings on one sentence, and `score.ts` (weights high 14, medium 7, low 3, saturating curve to 100; band labels). Pure functions; no DOM.
PRD ref: `prd.md > Risk score and summary`.

### Samples
`src/samples/` — two fictional leases ("Maple Court student apartment", "Riverside shared house") written from scratch.
PRD ref: `prd.md > Input and samples`.

### PDF extraction
`src/pdf/extract.ts` — lazy `import('pdfjs-dist')`, reads pages, joins lines, returns `{text}` or an error code (`scanned`, `encrypted`, `too-large`, `unreadable`).
PRD ref: `prd.md > Input and samples`.

### Start view
`src/ui/start.ts` — paste area, drop zone, file picker, sample buttons, privacy note, error/loading states.
PRD ref: `prd.md > Screens and Layout`.

### Result view
`src/ui/result.ts` (summary band and layout), `ui/lease.ts` (paper with marks), `ui/cards.ts` (cards, sticky panel, mobile tabs), `ui/select.ts` (linking, scroll and pulse, focus).
PRD ref: `prd.md > Linking lease and cards`.

### Messages and checklist
`src/ui/clipboard.ts` (clipboard with fallback and live-region confirmation), `engine/checklist.ts`, `ui/checklist.ts` (dialog, print CSS, Markdown download).
PRD ref: `prd.md > Negotiation messages`, `prd.md > Checklist export`.

### Deeper read
`src/ai/gemini.ts` (single `fetch` to `generativelanguage.googleapis.com`, `gemini-2.0-flash` family model configurable), `ui/deeper.ts` (key field, sessionStorage, forget key, error mapping).
PRD ref: `prd.md > Deeper read (optional BYOK)`.

## Data Model
- `Finding {ruleId, severity, title, start, end, sentence, explain, normal, why, message, question}`.
- `Analysis {text, sentences, findings[], score, band, counts{high,medium,low}, summary}`.
- UI state in memory only: `{view, analysis, selectedFindingId, tab}`. Leaving the page loses everything by design. sessionStorage holds only `leaselens.geminiKey` when the user chooses to.

## File Structure
```
leaselens/
├── index.html
├── package.json, tsconfig.json, vite.config.ts, vitest config
├── src/
│   ├── main.ts                # bootstrap and state
│   ├── engine/                # analyzer, text splitter, score, checklist, rules/
│   ├── samples/               # two fictional leases
│   ├── pdf/extract.ts
│   ├── ai/gemini.ts
│   ├── ui/                    # start, result, lease, cards, select, clipboard, checklist, deeper, dom
│   └── styles/                # tokens.css, base.css, start.css, result.css, print.css
├── tests/                     # engine rules, analyzer, samples, score, contrast, checklist
├── submission/                # devpost.md, video-script.md, capture.mjs, demo.webm
├── docs/screenshots/
├── devpost/                   # learner workspace: scope.md, prd.md, spec.md (copies at repo root)
├── scope.md, prd.md, spec.md  # root copies for judges
├── README.md, LICENSE
└── .agents/, .claude/         # Learn skill pack
```

## External Services and Dependencies
- Google Gemini API (optional): `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=KEY` with `{contents:[{parts:[{text}]}]}`; response `candidates[0].content.parts[0].text`. Docs: https://ai.google.dev/gemini-api/docs. User supplies key; free tier has rate limits.
- Google Fonts (CSS only; app is fully usable if blocked, with system serif/sans fallbacks).
- No other services.

## Important Failure Modes
- **Scanned or image-only PDF** -> designed message plus paste fallback.
- **pdf.js fails to load or parse** -> "Could not read this PDF" with paste fallback; rest of app unaffected.
- **Clipboard blocked** -> message shown in a selectable textarea.
- **Gemini key invalid, offline or quota** -> specific message; deterministic analysis untouched.
- **Rule false positives/negatives** -> explanations say "flagged because..." and show the matched sentence; disclaimer states it is a first pass.

## What Was Simplified and Why
- **Deterministic rules** instead of an ML model: private, offline, testable; a model would need a backend or a download. The fuller version would add a local model for fuzzy matches.
- **Paste fallback** instead of OCR: OCR is a heavy dependency; later.
- **No jurisdiction data**: needs legal review; "what's normal" is general-practice wording, not law.

## Decisions and Open Issues
- Vanilla TypeScript instead of Preact (agent recommendation, accepted per brief): smaller bundle and no framework needed for one surface; tradeoff is manual DOM wiring.
- Vitest plus Playwright (derived from the brief).
- One genuine uncertainty: how well sentence-level regex copes with real-world lease formatting (numbered clauses, all-caps blocks). Check: two realistic samples plus targeted splitter tests in `tests/text.test.ts`; a "flagged because" display lets users judge misses.
- Open: score weights tuned against samples during the build (non-blocking).
