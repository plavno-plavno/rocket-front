#!/usr/bin/env node
/** pnpm wt:dev — mock server + next dev on the ports of this worktree's .env.local (SDD-01T §3.9). */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const env = { ...process.env };
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}
const mockPort = env.MOCK_PORT ?? '4010';
const webPort = env.WEB_PORT ?? env.PORT ?? '3000';
env.CORE_API_URL ??= `http://localhost:${mockPort}`;
env.PORT = webPort;

const procs = [spawn('pnpm', ['mock:api:watch'], { env: { ...env, MOCK_PORT: mockPort }, stdio: 'inherit' }), spawn('pnpm', ['exec', 'next', 'dev', '-p', webPort], { env, stdio: 'inherit' })];
const stop = () => {
  for (const p of procs) p.kill('SIGTERM');
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const p of procs) p.on('exit', (code) => (code ? (stop(), process.exit(code)) : undefined));
console.log(`[wt:dev] web http://localhost:${webPort} · mock http://localhost:${mockPort}`);
