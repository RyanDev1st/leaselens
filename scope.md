---
doc: scope
status: approved
---

# LeaseLens

A private, in-browser lease reader that highlights every risky clause in your rental lease, explains it in plain language, and drafts the polite message to negotiate it.

## The Unique Kernel
Risk is shown **in place**: the lease stays on the page like paper, and every risky sentence is marked right where it is, colour-coded by severity, with a "what's normal" comparison and a copy-ready negotiation message attached. It runs entirely in the browser with a deterministic clause engine, so the lease (which holds names, addresses and income) never leaves the device and no key or account is needed. Remove the in-place highlighting plus the ready-to-send message and it becomes another "chat with your PDF" tool.

## Who It's For
A first-time renter: a student moving off campus, or a young worker signing their first lease in a new city. They get a 12-page document on a Friday, the landlord wants a signature by Monday, and they sign without understanding it. Today they skim it, ask a friend, or paste it into a chatbot and hope (while uploading personal data).

## The Core Loop
Open LeaseLens, paste text or drop a PDF (or click "Try a sample"), and read the result: a risk score and summary bar, the lease with highlighted clauses beside clause cards. Click a card to jump to the sentence, copy the negotiation message, then export the "questions to ask before signing" checklist. They come back for each new lease or revised draft from a landlord.

## Inspiration & Identity
Calm, trustworthy and editorial: a warm off-white paper page for the lease, one accent colour, risk colours that pass WCAG AA, serif for lease text and a clean sans for the interface. Think a careful legal-aid pamphlet or a good newspaper, not a chatbot. No gradient blobs, no emoji confetti, no chip soup.

## Why This Matters to the Learner
Leases are the first big legal document most young people sign, and most cannot judge them. The learner wants a tool that makes a renter feel informed and less alone, without asking them to hand over their documents.

## What "Working" Looks Like
A judge opens the page, clicks "Try a sample" and within five seconds sees a lease with 10+ highlighted clauses, a risk score and cards. They click the auto-renewal card, the lease scrolls to the clause, and a polite negotiation message copies to the clipboard. They then drop their own lease (text or PDF), see the same result, and confirm via the privacy note that nothing was uploaded. The "oh, that's cool" beat: the highlights appear in the lease itself, instantly, offline.

## The POC Boundary
- Text paste and PDF text extraction (in browser) as inputs; two fictional sample leases.
- Deterministic clause engine over about 25 clause types (regex/keyword plus structure rules), each with severity, plain explanation, "what's normal", negotiation message.
- Risk score and summary bar; side-by-side lease view with highlights; clause cards; copy buttons; printable/exportable "questions to ask before signing" checklist.
- Optional "Deeper read": the user's own Gemini key, kept only in sessionStorage, for an AI summary. The app is fully useful without it.
- Designed empty, loading and error states; responsive to 375px; keyboard accessible; "informational, not legal advice" disclaimer.
- Static Vite + TypeScript build, relative base path, deployable to GitHub Pages.

## Later
- Jurisdiction-specific norms (state/country rules) and law citations.
- Scanned-PDF OCR.
- Compare two versions of a lease; save and share a report.
- Additional languages.

## Explicitly Cut
- Accounts, backend, database, uploads: contradicts the privacy kernel.
- Legal advice or jurisdiction-specific legality verdicts: out of scope, and a liability risk; the app says "common" versus "unusual", not "illegal".
- Commercial leases and non-English leases: different clause set, not needed to prove the kernel.
- Sending messages for the user (email integration): copy-to-clipboard is enough.
- Scanned image OCR: heavy dependency, later.
