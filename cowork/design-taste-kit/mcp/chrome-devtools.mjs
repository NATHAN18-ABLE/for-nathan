#!/usr/bin/env node
// Launches chrome-devtools-mcp for performance work only: page loads, traces,
// network, Lighthouse and console. Input and memory tools are turned off so
// clicks and typing stay with the Playwright server. In the Claude Code cloud
// container (no Google Chrome, runs as root) it points at the pre-installed
// Chromium, runs headless and turns off Chrome's sandbox, which cannot start as root.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const cloudChromium = '/opt/pw-browsers/chromium';
const args = [
  '-y', 'chrome-devtools-mcp@latest',
  '--category-input=false',
  '--category-memory=false',
  ...process.argv.slice(2),
];
if (existsSync(cloudChromium)) {
  args.push('--headless', '--isolated', '--executable-path', cloudChromium, '--chrome-arg=--no-sandbox');
}

const child = spawn('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 0));
