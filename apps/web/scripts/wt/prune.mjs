#!/usr/bin/env node
/** pnpm wt:prune — removes worktrees whose branch is merged into main, then git worktree prune. */
import { execSync } from 'node:child_process';

const merged = new Set(
  execSync('git branch --merged main --format=%(refname:short)', { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter((b) => b.startsWith('ui/'))
);
const out = execSync('git worktree list --porcelain', { encoding: 'utf8' });
for (const block of out.split('\n\n').filter(Boolean)) {
  const dir = /^worktree (.+)$/m.exec(block)?.[1];
  const branch = /^branch refs\/heads\/(.+)$/m.exec(block)?.[1];
  if (dir && branch && merged.has(branch)) {
    console.log(`removing ${dir} (${branch} merged)`);
    execSync(`git worktree remove --force "${dir}"`, { stdio: 'inherit' });
  }
}
execSync('git worktree prune', { stdio: 'inherit' });
