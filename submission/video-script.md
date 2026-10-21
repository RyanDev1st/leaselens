# LeaseLens demo video script (about 2:40)

Audience: Devpost judges. Show the problem, the kernel (highlight in place), the action (negotiation message), real-world input (own PDF), and privacy (works offline). `submission/capture.mjs` records this exact flow to `demo.webm` at 1920x1080 with on-screen captions (`CAPTIONS=0` for a clean take to voice over). Read the narration in your own words.

| Time | On screen (cue) | Narration idea |
| --- | --- | --- |
| 0:00 | Title card "LeaseLens: Read your lease before you sign it." Fade to start view. | Who it is for: first-time renters, a student or a young worker. |
| 0:07 | Start view. Caption: first lease, 12 dense pages, deadline. Slow scroll to the specimen showing one highlighted clause. | The problem: you sign what you do not understand. |
| 0:20 | Caption: checked in your browser, nothing uploaded, no account, no key. Point at the privacy note and header. | Privacy is the feature, not a footnote. |
| 0:30 | Click "Student apartment" sample. | Try a sample: value in five seconds. |
| 0:38 | Result: score 90, "Very high risk", mix bar, first read. | Score and a first read of what matters most. |
| 0:55 | Scroll the lease slowly; highlights in red (solid), amber (dashed), blue (dotted). | Every risky sentence is marked where it sits; colour, underline and label. |
| 1:15 | Back to top, finding card: explanation, what is normal, why it matters. Click "Show in lease": the sentence pulses. | Plain language, context, and a jump to the exact sentence. |
| 1:30 | Open "Read the message", click "Copy message"; toast "Message copied". | A polite, ready-to-send negotiation message. |
| 1:45 | Filter High, then All. Click "Copy one message for all high and medium findings". Open Checklist, scroll, close. | One email for everything; printable questions to ask before signing. |
| 2:05 | Open "Deeper read": show what is sent and where. Close. | Optional: your own Gemini key, kept in this tab only. The app works without it. |
| 2:15 | New lease > "Shared house" sample: low score, few flags. | A fair lease looks different. It is not just alarmist. |
| 2:30 | New lease. Turn the network off. Drop a PDF of your own lease. Result appears with highlights. | Your own lease, offline: it never left the browser. |
| 2:55 | End card: "Know what you are signing. Private, free, in your browser." Disclaimer: informational, not legal advice. | Close: informational, not legal advice. Built with the Devpost Learn skill pack and Claude Code. |

Notes
- The offline step is real: the script uses Playwright `setOffline(true)` before dropping the PDF.
- Keep the disclaimer visible in the last frame.
- Do not show any real lease or personal data; the sample PDF in the script is fictional.
