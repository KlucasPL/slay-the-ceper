import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, 'src', 'styles', 'layout');

/**
 * @param {string} css
 * @param {string[]} context
 * @returns {Array<{context:string, selector:string, body:string}>}
 */
function extractRules(css, context = []) {
  const rules = [];
  let i = 0;

  while (i < css.length) {
    const openIdx = css.indexOf('{', i);
    if (openIdx === -1) break;

    let prelude = css.slice(i, openIdx).trim();
    const lastSemi = prelude.lastIndexOf(';');
    const lastClose = prelude.lastIndexOf('}');
    const cut = Math.max(lastSemi, lastClose);
    if (cut !== -1) {
      prelude = prelude.slice(cut + 1).trim();
    }

    let depth = 1;
    let j = openIdx + 1;

    while (j < css.length && depth > 0) {
      const ch = css[j];
      const next = css[j + 1];

      if (ch === '"' || ch === "'") {
        const quote = ch;
        j += 1;
        while (j < css.length) {
          if (css[j] === '\\') {
            j += 2;
            continue;
          }
          if (css[j] === quote) {
            j += 1;
            break;
          }
          j += 1;
        }
        continue;
      }

      if (ch === '/' && next === '*') {
        j += 2;
        while (j < css.length && !(css[j] === '*' && css[j + 1] === '/')) {
          j += 1;
        }
        j += 2;
        continue;
      }

      if (ch === '{') depth += 1;
      if (ch === '}') depth -= 1;
      j += 1;
    }

    const body = css.slice(openIdx + 1, j - 1).trim();
    const normalizedPrelude = prelude.replace(/\s+/g, ' ').trim();

    if (normalizedPrelude.startsWith('@media') || normalizedPrelude.startsWith('@supports')) {
      rules.push(...extractRules(body, [...context, normalizedPrelude]));
    } else if (
      normalizedPrelude &&
      !normalizedPrelude.startsWith('@keyframes') &&
      !normalizedPrelude.startsWith('@-webkit-keyframes')
    ) {
      rules.push({
        context: context.join(' | '),
        selector: normalizedPrelude,
        body: body.replace(/\s+/g, ' ').trim(),
      });
    }

    i = j;
  }

  return rules;
}

/**
 * @returns {string[]}
 */
function getCssFiles() {
  return fs
    .readdirSync(TARGET_DIR)
    .filter((name) => name.endsWith('.css'))
    .sort()
    .map((name) => path.join(TARGET_DIR, name));
}

const errors = [];

for (const filePath of getCssFiles()) {
  const css = fs.readFileSync(filePath, 'utf8');
  const rules = extractRules(css);
  const seen = new Map();

  for (const rule of rules) {
    const key = `${rule.context}@@${rule.selector}@@${rule.body}`;
    if (!seen.has(key)) {
      seen.set(key, 1);
      continue;
    }

    const rel = path.relative(ROOT, filePath);
    errors.push(
      `${rel}: exact duplicate block for selector "${rule.selector}" in context "${rule.context || '(root)'}"`
    );
    seen.set(key, seen.get(key) + 1);
  }
}

if (errors.length > 0) {
  console.error('CSS duplicate-block check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('CSS duplicate-block check passed.');
