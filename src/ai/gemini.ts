export const GEMINI_MODEL = 'gemini-flash-latest';
export const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
export const KEY_STORAGE = 'leaselens.geminiKey';
/** Longest lease text we send, to stay well inside the model's input limit. */
export const MAX_CHARS = 60000;

export type DeeperErrorCode = 'invalid-key' | 'quota' | 'offline' | 'blocked' | 'empty' | 'unknown';

export class DeeperError extends Error {
  constructor(public code: DeeperErrorCode) {
    super(code);
  }
}

const INSTRUCTIONS = [
  'You are helping a first-time renter understand a residential lease. You are not a lawyer and must not give legal advice.',
  'Write in plain, calm English for someone with no legal background.',
  'Reply with exactly three parts:',
  '1. A summary of at most 90 words describing what this lease asks of the tenant.',
  '2. The three clauses that most deserve a conversation before signing, each as one short sentence beginning with the clause topic.',
  '3. One sentence reminding the renter to check local tenant rules.',
  'Use only what is in the lease text. If something is unclear, say it is unclear.',
].join('\n');

export function buildRequest(leaseText: string): { contents: { role: 'user'; parts: { text: string }[] }[]; generationConfig: { temperature: number; maxOutputTokens: number } } {
  const text = leaseText.length > MAX_CHARS ? leaseText.slice(0, MAX_CHARS) : leaseText;
  return {
    contents: [{ role: 'user', parts: [{ text: `${INSTRUCTIONS}\n\nLEASE TEXT:\n${text}` }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
  };
}

export function mapHttpError(status: number): DeeperErrorCode {
  if (status === 400 || status === 401 || status === 403) return 'invalid-key';
  if (status === 429) return 'quota';
  return 'unknown';
}

export function parseResponse(body: unknown): string {
  const parts = (body as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates?.[0]?.content?.parts;
  const text = parts?.map((p) => p.text ?? '').join('').trim();
  if (!text) throw new DeeperError('empty');
  return text;
}

/**
 * The only network request LeaseLens can make. It runs only when the user presses
 * "Run deeper read" and sends the lease text and key to Google's Gemini API, nowhere else.
 */
export async function deeperRead(key: string, leaseText: string, fetchImpl: typeof fetch = fetch): Promise<string> {
  let res: Response;
  try {
    res = await fetchImpl(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(buildRequest(leaseText)),
    });
  } catch {
    throw new DeeperError('offline');
  }
  if (!res.ok) throw new DeeperError(mapHttpError(res.status));
  return parseResponse(await res.json());
}

export function describeDeeperError(code: DeeperErrorCode): string {
  switch (code) {
    case 'invalid-key':
      return 'Google did not accept this key. Check that you copied the whole key from Google AI Studio and that it is enabled.';
    case 'quota':
      return 'Google says this key has hit its rate or quota limit. Wait a minute and try again, or use a different key.';
    case 'offline':
      return 'Could not reach Google. Check your connection and try again. Your lease analysis above is not affected.';
    case 'empty':
      return 'Google returned an empty answer. Try again; the analysis above is not affected.';
    default:
      return 'Something went wrong with the request. Try again later; the analysis above is not affected.';
  }
}
