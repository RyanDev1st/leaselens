---
doc: prd
status: approved
---

# LeaseLens — Product Requirements

LeaseLens is a private, in-browser reader that marks every risky clause in a residential lease and helps a first-time renter negotiate it.
Source: `scope.md > The Unique Kernel`, `scope.md > Who It's For`, `scope.md > The Core Loop`.

## The Core Journey
1. Arrive on the landing view: a one-line promise ("Read your lease before you sign it"), a drop zone / paste area, a "Try a sample" button, and a plain privacy note ("Your lease never leaves this device").
2. Provide a lease in one of three ways: click "Try a sample" (two fictional leases), paste text, or drop/choose a PDF.
3. A short, designed loading state appears while the PDF is read or the clauses are scanned (text analysis is near-instant).
4. The result view appears: a risk score and summary bar at the top; the lease as a paper page on the left with risky sentences highlighted in place; clause cards on the right, ordered by severity.
5. The renter clicks a card (or a highlight): the other side scrolls to and pulses the matching sentence. The card shows the plain-language explanation, "what's normal", why it matters, and a negotiation message.
6. They press "Copy message" (confirmation shown), edit it elsewhere and send it to the landlord.
7. They open "Questions to ask before signing" and print it or download it as a text/Markdown file.
8. Optionally they open "Deeper read", paste their own Gemini key, and get an AI summary alongside the deterministic result.
9. Success: the renter leaves with a prioritized list of what to negotiate, ready-to-send wording, and knowledge that nothing was uploaded.

## Screens and Layout
Single page, three states of one surface (no routing needed):
- **Start view.** Centered column: title, promise, input area (textarea plus drop zone), "Try a sample" with two named options, privacy note, disclaimer in the footer.
- **Result view.** Header bar (title, "New lease" button, "Deeper read", "Checklist", "Print"). Under it the summary band: score, a segmented severity bar (counts of high, medium, low), and a one-sentence read. Below that, two columns on desktop: lease paper (left, about 60%) and clause cards (right, about 40%, sticky and scrollable). On mobile (375px) one column with a two-tab switch "Lease" / "Findings" (keyboard-operable tabs); tapping a card's "Show in lease" switches to the lease tab at the sentence.
- **Checklist dialog.** A modal sheet listing questions grouped by priority, with Print and Download buttons. Print produces a clean one-page-style layout via print CSS.
- **Deeper read panel.** A drawer or panel with key field, privacy statement, run button, result area.

## Look and Feel
- Editorial, calm, trustworthy. Warm off-white paper surface (about #FAF6EE) for the lease, slightly cooler page background, ink-black text.
- Serif (Source Serif 4 or similar) for the lease and headings, a clean humanist sans (Inter or similar) for UI. Generous line height; lease text 17-18px.
- One accent colour (deep teal-blue) for interactive elements. Risk colours (high, medium, low) use hue plus a text label plus a left-border/underline style, each meeting WCAG AA contrast against its background. Colour is never the only signal.
- Highlights look like marker/underline on paper, not neon blocks. No gradient blobs, no emoji, no chip clusters, no glass cards; restrained shadows, hairline borders.
- Avoid: stock AI-app styling, confetti, rainbow chips, generic hero gradients.

## Features and Behavior

### Input and samples
- Paste area accepts plain text (min 200 characters to analyse; otherwise a helpful inline message).
- PDF drop or file picker reads text in the browser. A PDF with no extractable text (scanned) shows a designed error: "This PDF looks like a scan; paste the text instead" with a paste fallback. Files over 15 MB or non-PDF/non-text files are rejected with a clear message.
- "Try a sample" offers two fictional leases (a student apartment lease and a shared-house lease), each labelled "Fictional sample".
- As a first-time renter I want to see value immediately so that I trust the tool before pasting my own lease.
  - [ ] Clicking a sample shows highlights, score and cards in under 2 seconds.
  - [ ] Both samples are clearly marked fictional.

### The clause engine (deterministic)
The engine splits the lease into clauses/sentences and checks about 26 clause types with keyword/regex and structure rules. Each finding has: id, severity (high, medium, low), title, the exact matched sentence span, plain-language explanation, what is normal, why it matters, negotiation message, checklist question. Clause types:
auto-renewal; early-termination penalty; re-letting liability after breaking lease; non-refundable fees; broad deposit deductions; deposit return deadline missing; landlord entry without notice; repairs shifted to tenant; mid-term rent increase; late fees or compounding; subletting ban; guest limits; pet fees or ban; utilities ambiguity; joint and several liability; waiver of rights; one-sided attorney fees; mold/pest disclaimers; move-out cleaning charges; landlord liability waiver; holdover penalty; long notice-to-vacate; unilateral rule changes; self-help lockout or seizure of belongings; mandatory renters insurance with landlord as beneficiary or odd terms; noise/parking fines and towing.
- As a renter I want each risky sentence marked where it sits so that I understand the context.
  - [ ] Matched sentences are highlighted in the lease view with the severity style and an accessible label.
  - [ ] Each finding has a card with explanation, "what's normal", and a negotiation message.
  - [ ] Overlapping matches on one sentence merge into one highlight listing all findings.
  - [ ] A clean lease (no matches) shows an explicit, designed "No flagged clauses" result that still states the limits of the check.

### Risk score and summary
- Score 0-100 ("lower is safer" shown as "Risk score: N of 100") derived from weighted severities, with a band label (Lower, Moderate, High, Very high) and the severity bar counts.
- The one-sentence read names the top two concerns.
  - [ ] The same input always yields the same score and findings.

### Linking lease and cards
- Clicking a highlight or "Show in lease" scrolls and pulses the other side; keyboard users get the same via buttons; focus moves to the target.

### Negotiation messages
- Polite, specific, first-person messages; "Copy message" uses the clipboard with a visible confirmation and a textarea fallback when clipboard access is blocked. A "Copy all" collects every high and medium message into one email draft.
  - [ ] Copy produces the exact message text; confirmation appears and is announced to screen readers.

### Checklist export
- "Questions to ask before signing": ordered high to low, one question per finding plus 3 universal questions (move-in condition photos, written receipts, who to contact for emergencies). Print (print CSS) and Download (.md).

### Deeper read (optional BYOK)
- The user pastes a Gemini API key; it is kept in sessionStorage only, with a visible statement of exactly what is sent (the lease text, to Google's API only). A "Forget key" button clears it. The result is an AI plain-English summary and top three concerns shown in a separate panel; failure states (invalid key, network, quota) show designed messages and the deterministic result remains unaffected.
  - [ ] With no key, no network request is ever made by the app after load.

## States and Boundaries
- **First use / empty** — start view with samples; no stored data.
- **Loading** — progress text and a calm indicator while a PDF is parsed.
- **Too short / unreadable input** — inline message explaining what is needed.
- **Scanned or encrypted PDF / wrong file type / too large** — designed error with a paste fallback.
- **No findings** — reassuring but honest result.
- **Deeper-read errors** — invalid key, offline, rate limit each have their own message.
- **Persistence** — nothing persists except the optional API key in sessionStorage for the tab session. Lease text is never stored or sent.
- **Boundary** — informational only, not legal advice; stated on the start view, result view, checklist and exports.

## Product Decisions
- Deterministic engine first, AI optional — privacy and reliability; works offline, testable.
- Highlight in place, not a chat — the kernel; reviewers see value instantly.
- "Common" versus "unusual" language instead of "illegal" — avoids legal conclusions.
- Two fictional samples, written from scratch — immediate value for judges and no copyright concerns.
- Copy-to-clipboard only, no email sending — nothing leaves the device.

## What We're Building
Start view with paste, PDF and samples; the 26-type clause engine; result view with score, severity bar, annotated lease, linked cards; negotiation messages with copy; checklist print/download; optional Gemini Deeper read; designed empty/loading/error states; responsive and keyboard-accessible UI; disclaimer; unit tests for each clause type; static build.

## Deferred From the POC
- Jurisdiction-specific rules and statute citations — need per-region data and legal review.
- Scanned PDF OCR — heavy dependency; the paste fallback covers it.
- Saved reports or accounts — contradicts the privacy kernel.

## Possible Later Enhancements
Compare two lease versions; localized languages; a "what changed since last draft" diff; a browser-extension mode for listing sites.

## Non-Goals
- No legal advice or enforceability verdicts.
- No backend, accounts, analytics or uploads.
- No commercial or non-English leases.
- No sending messages on the user's behalf.

## Open Questions
- Exact score weights: can be tuned during the build against the samples (does not block spec).
