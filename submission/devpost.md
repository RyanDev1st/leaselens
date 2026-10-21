# Devpost submission notes: LeaseLens

> Agent-written draft notes. The Devpost Learn `6-ship` skill says the human submitter writes the final public copy in their own words; treat everything below as raw material to rewrite, not text to paste.

**Project name:** LeaseLens

**Tagline (under 200 characters):** Paste or drop a rental lease and see every risky clause highlighted in place, explained in plain language, with a polite message to negotiate it. Private: it runs in your browser.

## Inspiration
Leases are the first big legal document most students and young workers sign, and they usually arrive as a dense PDF with a deadline. People skim, ask a friend, or paste the whole thing into a chatbot, uploading their name, address and income. We wanted a careful first read that stays on the device.

## What it does
Paste lease text or drop a PDF (or try one of two fictional samples). LeaseLens shows the lease like paper with every risky sentence highlighted where it sits, colour and underline style by risk. Each finding has a plain-language explanation, what is normal, why it matters, and a polite negotiation message you can copy. You also get a 0 to 100 risk score, a one-sentence first read, and a printable checklist of questions to ask before signing. An optional "Deeper read" uses your own Gemini key for an AI summary; the app is fully useful without it.

## How we built it
We started from an empty folder and ran the Devpost Learn skill pack (`npx skills add challengepost/learn-ai-basics --all -y`) with Claude Code as the coding agent: `1-start`, `2-scope`, `3-prd`, `4-spec`, `5-build` and `6-ship`, producing `scope.md`, `prd.md`, `spec.md` and a slice-by-slice build checklist in the repository. The app is Vite and vanilla TypeScript with no backend. A deterministic clause engine (26 rules of patterns plus structure checks, for example notice periods and negation) runs in the browser; pdf.js reads PDFs locally. Vitest covers every rule with a positive and a negative case, the scoring, the samples, WCAG contrast of the colour tokens and the Gemini request handling with a mocked fetch; Playwright checks the full flow, including that no data leaves the browser.

## Challenges
- Making regex-based rules precise: fair clauses ("24 hours' notice except in an emergency", "consent not to be unreasonably withheld") must not be flagged. Negative tests for each rule drove this.
- Real documents: PDFs hard-wrap lines, headings look like clauses, and typographic quotes break patterns. We reflow text, detect headings and normalise quotes while keeping character offsets exact for highlighting.
- Design: keeping it calm and trustworthy, with risk shown by colour, underline style and text, and AA contrast checked by tests.
- Offline PDFs: lazy-loaded pdf.js worked online but not offline until the worker was preloaded.

## Accomplishments
- A complete, coherent flow from empty state to checklist, responsive down to 375 px and keyboard accessible.
- Privacy that is verifiable: an automated check of requests during a full session.
- Each clause rule tested both ways.

## What we learned
Plan-first with the skill pack kept scope small: the PRD's acceptance criteria turned directly into tests. Deterministic rules plus honest wording ("common" versus "unusual", never "illegal") beat a black box for trust.

## What's next
Jurisdiction-specific norms and citations, OCR for scanned leases, comparing two versions of a lease, more languages.

## Built with
TypeScript, Vite, pdf.js, Vitest, Playwright, Google Fonts (Inter, Source Serif 4), optional Google Gemini API (bring your own key), Devpost Learn skill pack, Claude Code.

## Links to fill in
- Public GitHub repository: (owner to add)
- Demo video: (owner to upload `submission/demo.webm`; script in `video-script.md`)
- Live demo (optional): the `dist/` folder deploys as is to GitHub Pages.
