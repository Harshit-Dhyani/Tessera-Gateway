import { type Dirent, existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const EXCLUDE_DIRS = ['node_modules', '.next', '.turbo', 'opensrc', '.github', '.kilo', '.opencode', '.git', 'dist'];

const EXCLUDE_EXTENSIONS = ['.lock', '.log', '.json', '.md', '.toml', '.yml', '.yaml', '.tsbuildinfo'];

const ROOT = process.cwd();
const OUTPUT_FILE = join(ROOT, 'docs', 'tree.md');

function shouldExclude(name: string, _fullPath: string): boolean {
  if (EXCLUDE_DIRS.includes(name)) return true;
  if (name.startsWith('.')) return true;
  const ext = name.substring(name.lastIndexOf('.'));
  if (EXCLUDE_EXTENSIONS.includes(ext)) return true;
  return false;
}

function generateTree(dir: string, prefix = '', isLast = true): string {
  let result = '';
  if (!existsSync(dir)) return result;

  const entries = readdirSync(dir, { withFileTypes: true }).sort((a: Dirent, b: Dirent) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const fullPath = join(dir, entry.name);
    if (shouldExclude(entry.name, fullPath)) continue;

    const isLastEntry = i === entries.length - 1;
    const connector = isLastEntry ? '└── ' : '├── ';
    const newPrefix = isLast ? '    ' : '│   ';
    result += `${prefix}${connector}${entry.name}\n`;

    if (entry.isDirectory()) {
      result += generateTree(fullPath, prefix + newPrefix, isLastEntry);
    }
  }
  return result;
}

function generateRootConfig(): string {
  let result = '';
  const files = [
    'package.json',
    'turbo.json',
    'tsconfig.base.json',
    'vitest.config.ts',
    'eslint.config.js',
    'bunfig.toml',
    'AGENTS.md',
    'README.md',
  ];
  for (const file of files) {
    if (existsSync(join(ROOT, file))) {
      result += `- ${file}\n`;
    }
  }
  return result;
}

async function main() {
  const treeContent = `# Project Tree

> Generated: ${new Date().toISOString().split('T')[0]}

## apps/
${generateTree(join(ROOT, 'apps'))}
---
## packages/
${generateTree(join(ROOT, 'packages'))}
---
## Root Config
${generateRootConfig()}
`;

  if (!existsSync(join(ROOT, 'docs'))) {
    mkdirSync(join(ROOT, 'docs'), { recursive: true });
  }

  writeFileSync(OUTPUT_FILE, treeContent);

  console.log('\nfile:///' + OUTPUT_FILE.replace(/\\/g, '/') + '\n');
}

main().catch(console.error);
