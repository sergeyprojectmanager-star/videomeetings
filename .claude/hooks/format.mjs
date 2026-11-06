#!/usr/bin/env node
// PostToolUse hook: formats the file changed by Edit/Write/NotebookEdit with Prettier.
// Respects .prettierignore and skips files Prettier does not support.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

let raw = '';
for await (const chunk of process.stdin) raw += chunk;

let input;
try {
  input = JSON.parse(raw);
} catch {
  process.exit(0);
}

const filePath = input?.tool_input?.file_path ?? input?.tool_input?.notebook_path;
if (!filePath) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const absPath = resolve(projectDir, filePath);
if (!existsSync(absPath)) process.exit(0);

const prettier = resolve(projectDir, 'node_modules/.bin/prettier');
if (!existsSync(prettier)) process.exit(0);

const result = spawnSync(
  prettier,
  ['--write', '--ignore-unknown', '--log-level', 'warn', absPath],
  { cwd: projectDir, encoding: 'utf8' },
);

// Formatting errors (e.g. syntax errors) must not block the agent:
// print them to stderr and exit with code 0.
if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || 'prettier failed\n');
}
process.exit(0);
