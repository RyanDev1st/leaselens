import { reflow } from './reflow';

export type ExtractErrorCode = 'not-supported' | 'too-large' | 'encrypted' | 'scanned' | 'unreadable';

export class ExtractError extends Error {
  constructor(public code: ExtractErrorCode) {
    super(code);
  }
}

export const MAX_BYTES = 15 * 1024 * 1024;

/** Reads a dropped or chosen file into plain lease text. PDFs are parsed locally with pdf.js. */
export async function readLeaseFile(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new ExtractError('too-large');
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return extractPdfText(file);
  if (file.type.startsWith('text/') || /\.(txt|md|text)$/.test(name)) return reflow(await file.text());
  throw new ExtractError('not-supported');
}

async function extractPdfText(file: File): Promise<string> {
  let pdfjs: typeof import('pdfjs-dist');
  try {
    pdfjs = await import('pdfjs-dist');
    const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  } catch {
    throw new ExtractError('unreadable');
  }
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  } catch (err) {
    if (err && typeof err === 'object' && (err as { name?: string }).name === 'PasswordException') {
      throw new ExtractError('encrypted');
    }
    throw new ExtractError('unreadable');
  }
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      text += item.str;
      text += item.hasEOL ? '\n' : ' ';
    }
    pages.push(text);
  }
  const joined = reflow(pages.join('\n\n'));
  if (joined.replace(/\s/g, '').length < 80) throw new ExtractError('scanned');
  return joined;
}

export function describeError(code: ExtractErrorCode): { title: string; help: string } {
  switch (code) {
    case 'scanned':
      return {
        title: 'This PDF looks like a scan',
        help: 'It contains pictures of pages rather than text, and LeaseLens does not do OCR. Open it, select and copy the text if you can, or type the clauses you care about, then paste them here.',
      };
    case 'encrypted':
      return {
        title: 'This PDF is password protected',
        help: 'Open it with its password, then copy the text and paste it here.',
      };
    case 'too-large':
      return { title: 'That file is too large', help: 'LeaseLens reads files up to 15 MB. A lease is usually far smaller; try pasting the text instead.' };
    case 'not-supported':
      return { title: 'That file type is not supported', help: 'Drop a PDF or a plain text file, or paste the lease text.' };
    default:
      return {
        title: 'We could not read that PDF',
        help: 'The file may be damaged or unusual. Open it, copy the text and paste it here instead.',
      };
  }
}
