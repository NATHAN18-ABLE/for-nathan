#!/usr/bin/env node
// Launches @playwright/mcp. In the Claude Code cloud container (no Google Chrome,
// no sandbox support) it points at the pre-installed Chromium and runs headless;
// everywhere else it runs with Playwright's defaults.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const cloudChromium = '/opt/pw-browsers/chromium';
const args = ['-y', '@playwright/mcp@latest', ...process.argv.slice(2)];
if (existsSync(cloudChromium)) {
  args.push('--headless', '--no-sandbox', '--executable-path', cloudChromium);
}

const child = spawn('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 0));
