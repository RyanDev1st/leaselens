import './styles/index.css';
import { analyze } from './engine/analyze';
import { renderResult } from './ui/result';
import { renderStart } from './ui/start';

const main = document.getElementById('main');
if (!main) throw new Error('Missing #main');

function show(view: HTMLElement): void {
  main!.replaceChildren(view);
  window.scrollTo({ top: 0 });
  view.querySelector<HTMLElement>('#view-title')?.focus({ preventScroll: true });
}

function showStart(): void {
  document.title = 'LeaseLens: read your lease before you sign it';
  show(
    renderStart({
      onAnalyze: (text, label) => {
        const analysis = analyze(text);
        document.title = `LeaseLens: ${analysis.band} risk, score ${analysis.score}`;
        show(renderResult(analysis, label, showStart));
      },
    }),
  );
}

showStart();
