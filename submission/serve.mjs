// Starts `vite preview` on a fixed port and resolves when it is reachable.
import { spawn } from 'node:child_process';

export async function startPreview(port = 4173) {
  const isWin = process.platform === 'win32';
  const child = spawn(isWin ? 'npx.cmd' : 'npx', ['vite', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], {
    stdio: 'ignore',
    shell: isWin,
  });
  const url = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return { url, stop: () => stop(child) };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  stop(child);
  throw new Error('vite preview did not start');
}

function stop(child) {
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill('SIGTERM');
}
