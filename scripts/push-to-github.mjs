#!/usr/bin/env node
/**
 * Push to GitHub via Git Data API with rate-limit handling.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'yeeraano-sketch';
const REPO = 'Nona';
const BRANCH = 'main';
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

const headers = {
  'Authorization': `token ${TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'tos-v2-push',
  'Content-Type': 'application/json',
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function api(path, method = 'GET', body, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    if (res.status === 403 || res.status === 429) {
      const wait = Math.pow(2, attempt + 1) * 5000;
      console.log(`  Rate limited (${res.status}), waiting ${wait/1000}s... (attempt ${attempt+1})`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${method} ${path} → ${res.status}: ${text}`);
    }
    return res.json();
  }
  throw new Error(`Failed after ${retries} retries: ${method} ${path}`);
}

function walkDir(dir, base = dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(base, full);
    if (/^(node_modules|\.git|\.bun|\.npm|\.clone-cache|\.turbo|\.blink)/.test(rel)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      entries.push(...walkDir(full, base));
    } else if (stat.isFile()) {
      entries.push({ path: rel, fullPath: full });
    }
  }
  return entries;
}

async function main() {
  console.log(`Pushing to ${OWNER}/${REPO} (${BRANCH})...\n`);

  // 1. Get current commit SHA
  const ref = await api(`/git/refs/heads/${BRANCH}`);
  const commitSha = ref.object.sha;
  console.log(`Current commit: ${commitSha}`);

  // 2. Walk all files
  const files = walkDir(process.cwd());
  console.log(`Found ${files.length} files\n`);

  // 3. Create blobs — 5 at a time with 2s delay between batches
  const BATCH = 5;
  const DELAY = 2500;
  const fileBlobs = [];

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (f) => {
        const content = readFileSync(f.fullPath, 'utf8');
        const blob = await api('/git/blobs', 'POST', {
          content: Buffer.from(content).toString('base64'),
          encoding: 'base64',
        });
        return { path: f.path, sha: blob.sha };
      })
    );
    fileBlobs.push(...results);
    const pct = Math.round(((i + batch.length) / files.length) * 100);
    process.stdout.write(`\r  Blobs: ${fileBlobs.length}/${files.length} (${pct}%)`);
    if (i + BATCH < files.length) await sleep(DELAY);
  }
  console.log(`\n  All ${fileBlobs.length} blobs created\n`);

  // 4. Create tree — in chunks of 100 entries
  const TREE_BATCH = 100;
  let baseTreeSha = commitSha;

  for (let i = 0; i < fileBlobs.length; i += TREE_BATCH) {
    const chunk = fileBlobs.slice(i, i + TREE_BATCH);
    const treeEntries = chunk.map(f => ({
      path: f.path,
      mode: '100644',
      type: 'blob',
      sha: f.sha,
    }));

    const newTree = await api('/git/trees', 'POST', {
      base_tree: baseTreeSha,
      tree: treeEntries,
    });
    baseTreeSha = newTree.sha;
    process.stdout.write(`\r  Tree chunks: ${Math.ceil((i + TREE_BATCH) / TREE_BATCH)}/${Math.ceil(fileBlobs.length / TREE_BATCH)}`);
    await sleep(1000);
  }
  console.log(`\n  Final tree: ${baseTreeSha}\n`);

  // 5. Create commit
  const commitMsg = `chore: initialize TOS V2 architecture skeleton

Phase -1: Architecture Validation
- Glossary (45+ terms)
- 18 Architecture Decision Records
- Bounded Context Map, Dependency Rules, Domain Classification
- Shared Kernel Design documentation

Phase 0: Architecture Skeleton
- 12 Core Domains (full structure)
- 11 Planned Domains (lightweight)
- 44 Application Use Cases
- Infrastructure adapters (Supabase, Telegram, Maps, Payment, etc.)
- 12 App entry points
- Workflow/Policy/ServiceRegistry/FeatureFlag YAML definitions
- Monorepo config (pnpm + Turborepo + TypeScript)

${files.length} files across 212 directories`;

  const newCommit = await api('/git/commits', 'POST', {
    message: commitMsg,
    tree: baseTreeSha,
    parents: [commitSha],
  });
  console.log(`Commit: ${newCommit.sha}\n`);

  // 6. Update branch ref
  await api(`/git/refs/heads/${BRANCH}`, 'PATCH', {
    sha: newCommit.sha,
    force: true,
  });
  console.log(`Branch ${BRANCH} updated!\n`);
  console.log(`https://github.com/${OWNER}/${REPO}/tree/${BRANCH}`);
}

main().catch(err => {
  console.error('\nPush failed:', err.message);
  process.exit(1);
});
