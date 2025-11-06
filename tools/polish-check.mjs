#!/usr/bin/env node

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const VIEWPORT_WIDTHS = [320, 390, 768, 1024, 1280, 1440];
const BASE_FONT_SIZE = 16;
const CSS_SOURCES = [
  'assets/css/base.css',
  'assets/css/layout.css',
  'assets/css/components.css',
  'assets/css/themes.css'
];
const HTML_TARGETS = [
  'index.html',
  'fr/index.html',
  'projects',
  'fr/projets'
];

const statusLabel = (status) => (status === 'PASS' ? 'PASS' : 'FAIL');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class CssInspector {
  constructor(fileContents) {
    this.files = fileContents; // Map(relativePath -> content)
    this.varDefinitions = new Map(); // name -> [{ value, file, line, selectors, media }]
    this.ruleCache = new Map(); // `${file}|${selector}` -> { block, startIndex }
    this._parseVariables();
  }

  _parseVariables() {
    for (const [relativePath, content] of this.files.entries()) {
      const regex = /--([\w-]+)\s*:\s*([^;]+);/g;
      let match;
      while ((match = regex.exec(content))) {
        const name = match[1];
        const value = match[2].trim();
        const index = match.index;
        const contexts = this._contextsForIndex(content, index);
        if (!contexts.length) continue;
        const selectors = contexts.filter((ctx) => !ctx.startsWith('@'));
        const media = contexts.filter((ctx) => ctx.startsWith('@media')).map((ctx) => ctx.replace(/^@media\s*/i, '').trim());
        const line = this._lineNumberFromIndex(content, index);
        const definition = { value, file: relativePath, line, selectors, media };
        if (!this.varDefinitions.has(name)) {
          this.varDefinitions.set(name, []);
        }
        this.varDefinitions.get(name).push(definition);
      }
    }
  }

  _lineNumberFromIndex(content, index) {
    return content.slice(0, index).split('\n').length;
  }

  _contextsForIndex(content, index) {
    const contexts = [];
    let depth = 0;
    for (let i = index; i >= 0; i--) {
      const char = content[i];
      if (char === '}') {
        depth++;
      } else if (char === '{') {
        depth--;
        if (depth <= 0) {
          let end = i - 1;
          while (end >= 0 && /\s/.test(content[end])) end--;
          let start = end;
          while (start >= 0 && content[start] !== '{' && content[start] !== '}') start--;
          const selector = content.slice(start + 1, end + 1).trim();
          if (selector) contexts.push(selector);
          depth = Math.max(depth, 0);
        }
      }
    }
    return contexts;
  }

  getVarEntry(name, viewport, selectors = [':root']) {
    const definitions = this.varDefinitions.get(name);
    if (!definitions || !definitions.length) return null;
    let chosen = null;
    for (const def of definitions) {
      const selectorMatch = selectors.some((selector) => def.selectors.includes(selector));
      if (!selectorMatch) continue;
      if (!this._mediaMatches(def.media, viewport)) continue;
      chosen = def;
    }
    if (!chosen && !selectors.includes(':root')) {
      return this.getVarEntry(name, viewport, [':root']);
    }
    return chosen;
  }

  resolveVar(name, viewport, selectors = [':root'], stack = new Set()) {
    const entry = this.getVarEntry(name, viewport, selectors);
    if (!entry) return null;
    if (stack.has(name)) return { value: '0', entry };
    stack.add(name);
    const resolved = this._resolveValueString(entry.value, viewport, selectors, stack);
    stack.delete(name);
    return { value: resolved, entry };
  }

  _resolveValueString(value, viewport, selectors, stack) {
    return value.replace(/var\((--[\w-]+)(?:,\s*([^)]+))?\)/g, (_match, varName, fallback) => {
      const key = varName.replace(/^--/, '');
      const result = this.resolveVar(key, viewport, selectors, stack);
      if (result) return result.value;
      if (fallback) return this._resolveValueString(fallback, viewport, selectors, stack);
      return '0';
    });
  }

  evaluateLength(value, viewport, selectors = [':root']) {
    const resolved = this._resolveValueString(value, viewport, selectors, new Set());
    return { value: this._evaluateNumeric(resolved, viewport), expression: resolved };
  }

  _evaluateNumeric(expression, viewport) {
    const cleaned = this._normalizeMathExpression(expression, viewport);
    if (!cleaned.length) return 0;
    if (/[^0-9+\-*/()., a-zA-Z_]/.test(cleaned)) {
      return Number.NaN;
    }
    const clampFn = (min, preferred, max) => Math.min(Math.max(preferred, min), max);
    try {
      // eslint-disable-next-line no-new-func
      const evaluator = new Function('clampFn', 'Math', `return ${cleaned};`);
      const result = evaluator(clampFn, Math);
      return typeof result === 'number' && Number.isFinite(result) ? result : Number.NaN;
    } catch (error) {
      return Number.NaN;
    }
  }

  _normalizeMathExpression(expression, viewport) {
    const replacements = [
      { pattern: /calc\(/g, replaceWith: '(' },
      { pattern: /clamp\(/g, replaceWith: 'clampFn(' },
      { pattern: /min\(/g, replaceWith: 'Math.min(' },
      { pattern: /max\(/g, replaceWith: 'Math.max(' },
      { pattern: /env\([^)]+\)/g, replaceWith: '0' }
    ];
    let result = expression;
    for (const { pattern, replaceWith } of replacements) {
      result = result.replace(pattern, replaceWith);
    }
    result = result.replace(/(-?\d*\.?\d+)\s*rem/g, (_m, num) => `(${Number(num)}*${BASE_FONT_SIZE})`);
    result = result.replace(/(-?\d*\.?\d+)\s*px/g, (_m, num) => `(${Number(num)})`);
    result = result.replace(/(-?\d*\.?\d+)\s*vw/g, (_m, num) => `(${Number(num)}*${viewport}/100)`);
    result = result.replace(/(-?\d*\.?\d+)\s*vh/g, (_m, num) => `(${Number(num)}*${Math.round(viewport * 0.5625)}/100)`);
    result = result.replace(/(-?\d*\.?\d+)\s*%/g, (_m, num) => `(${Number(num)}/100)`);
    return result.replace(/\s+/g, '');
  }

  _mediaMatches(mediaQueries, viewport) {
    if (!mediaQueries || !mediaQueries.length) return true;
    return mediaQueries.every((query) => this._mediaQueryMatches(query, viewport));
  }

  _mediaQueryMatches(query, viewport) {
    const iterable = query.toLowerCase().split('and').map((chunk) => chunk.trim());
    let matched = false;
    for (const segment of iterable) {
      const widthMatch = segment.match(/(min|max)-width\s*:\s*(\d+)px/);
      if (!widthMatch) {
        if (segment.startsWith('(') || segment.startsWith('screen') || segment.startsWith('print')) {
          continue;
        }
        continue;
      }
      matched = true;
      const [, type, value] = widthMatch;
      const numeric = Number(value);
      if (type === 'min' && viewport < numeric) return false;
      if (type === 'max' && viewport > numeric) return false;
    }
    return matched ? true : false;
  }

  getDeclaration(selector, property) {
    for (const [relativePath, content] of this.files.entries()) {
      const cacheKey = `${relativePath}|${selector}`;
      let rule = this.ruleCache.get(cacheKey);
      if (!rule) {
        rule = this._extractRule(content, selector);
        if (rule) {
          this.ruleCache.set(cacheKey, { ...rule, file: relativePath });
        }
      }
      if (!rule) continue;
      const { block, blockStartIndex, file } = rule;
      const propRegex = new RegExp(`${property}\\s*:\\s*([^;]+);`);
      const match = propRegex.exec(block);
      if (!match) continue;
      const line = this._lineNumberFromIndex(content, blockStartIndex + match.index);
      return { value: match[1].trim(), file, line };
    }
    return null;
  }

  _extractRule(content, selector) {
    const pattern = new RegExp(`(^|[\\s}])${escapeRegExp(selector)}\\s*{`, 'm');
    const match = pattern.exec(content);
    if (!match) return null;
    const start = match.index + match[1].length;
    const braceIndex = content.indexOf('{', start + selector.length);
    if (braceIndex === -1) return null;
    return this._extractRuleFrom(content, start, braceIndex);
  }

  _extractRuleFrom(content, selectorIndex, braceIndex) {
    let depth = 1;
    let i = braceIndex + 1;
    while (depth > 0 && i < content.length) {
      if (content[i] === '{') depth++;
      if (content[i] === '}') depth--;
      i++;
    }
    const block = content.slice(braceIndex + 1, i - 1);
    return { block, blockStartIndex: braceIndex + 1 };
  }
}

async function loadCssFiles() {
  const map = new Map();
  for (const relative of CSS_SOURCES) {
    const absolute = path.join(root, relative);
    const content = await readFile(absolute, 'utf8');
    map.set(relative, content);
  }
  return map;
}

async function collectHtmlFiles() {
  const results = [];
  for (const target of HTML_TARGETS) {
    const absolute = path.join(root, target);
    await gatherHtml(absolute, target, results);
  }
  return results;
}

async function gatherHtml(absolutePath, relativePath, results) {
  const stats = await stat(absolutePath);
  if (stats.isDirectory()) {
    const entries = await readdir(absolutePath);
    for (const entry of entries) {
      await gatherHtml(path.join(absolutePath, entry), path.join(relativePath, entry), results);
    }
    return;
  }
  if (absolutePath.endsWith('.html')) {
    const content = await readFile(absolutePath, 'utf8');
    results.push({ path: relativePath, content });
  }
}

async function loadDomFactory() {
  let JSDOM = null;
  try {
    ({ JSDOM } = await import('jsdom'));
  } catch {
    return null;
  }
  return (html) => new JSDOM(html, { pretendToBeVisual: true }).window.document;
}

function formatPx(value) {
  return `${Math.round(value * 100) / 100}px`;
}

function distanceFromMultiple(value, base) {
  return Math.abs(value % base);
}

function relativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((channel) => {
    const ratio = channel / 255;
    return ratio <= 0.03928 ? ratio / 12.92 : Math.pow((ratio + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground, background) {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  if (fg == null || bg == null) return null;
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(value) {
  if (!value) return null;
  const clean = value.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

function buildTable(results) {
  const nameWidth = Math.max(...results.map((r) => r.name.length), 12);
  const header = `┌─${'─'.repeat(nameWidth)}─┬────────┐`;
  const divider = `├─${'─'.repeat(nameWidth)}─┼────────┤`;
  const footer = `└─${'─'.repeat(nameWidth)}─┴────────┘`;
  const rows = results.map((result) => {
    const paddedName = result.name.padEnd(nameWidth, ' ');
    const status = statusLabel(result.status).padEnd(6, ' ');
    return `│ ${paddedName} │ ${status} │`;
  });
  return [header, ...rows.slice(0, 1), divider, ...rows.slice(1), footer];
}

function failDetail(message, hint) {
  return hint ? `${message} [${hint}]` : message;
}

function buildHint(file, line) {
  if (!file) return '';
  return `${file}:${line}`;
}

function hintForDeclaration(decl, inspector, selector, property) {
  if (decl?.file) return buildHint(decl.file, decl.line);
  if (!selector || !property) return '';
  for (const [file, content] of inspector.files.entries()) {
    const selectorIndex = content.indexOf(selector);
    if (selectorIndex === -1) continue;
    const propertyIndex = content.indexOf(property, selectorIndex);
    if (propertyIndex === -1) continue;
    const line = content.slice(0, propertyIndex).split('\n').length;
    return `${file}:${line}`;
  }
  return '';
}

function checkOverflow(inspector) {
  const entry = inspector.getVarEntry('gutter', 1280);
  const hints = entry ? [buildHint(entry.file, entry.line)] : [];
  const issues = [];
  for (const width of VIEWPORT_WIDTHS) {
    const evaluation = inspector.resolveVar('gutter', width);
    if (!evaluation) continue;
    const { value } = inspector.evaluateLength(evaluation.value, width);
    if (!Number.isFinite(value)) continue;
    const totalPadding = value * 2;
    if (totalPadding > width * 0.4) {
      issues.push(`viewport ${width}px uses total horizontal padding ${formatPx(totalPadding)}`);
    }
  }
  return {
    name: 'Horizontal overflow @ key widths',
    status: issues.length ? 'FAIL' : 'PASS',
    details: issues.map((issue) => failDetail(issue, hints[0])),
    hints
  };
}

function checkNav(inspector) {
  const paddingDecl = inspector.getDeclaration('.site-header__inner', 'padding-block');
  const brandDecl = inspector.getDeclaration('.brand__mark', 'height');
  const navToggleDecl = inspector.getDeclaration('.nav-toggle', 'height');
  const issues = [];
  for (const width of VIEWPORT_WIDTHS) {
    const padding = paddingDecl ? inspector.evaluateLength(paddingDecl.value, width).value : 0;
    const brand = brandDecl ? inspector.evaluateLength(brandDecl.value, width).value : 0;
    const toggle = navToggleDecl ? inspector.evaluateLength(navToggleDecl.value, width).value : 0;
    const rowHeight = padding * 2 + Math.max(brand, toggle);
    if (rowHeight > 64) {
      const hint = [hintForDeclaration(paddingDecl, inspector, '.site-header__inner', 'padding-block'), hintForDeclaration(brandDecl, inspector, '.brand__mark', 'height')]
        .filter(Boolean)
        .join(', ');
      issues.push(failDetail(`width ${width}px nav row measures ${formatPx(rowHeight)} (>64px)`, hint));
    }
  }
  let status = 'PASS';
  const listWrap = inspector.getDeclaration('.site-nav__list', 'flex-wrap');
  if (listWrap && listWrap.value.trim() !== 'nowrap') {
    status = 'FAIL';
    issues.push(failDetail('Primary nav list allows wrapping; expected nowrap', buildHint(listWrap.file, listWrap.line)));
  }
  return {
    name: 'Navigation height ≤64px',
    status: issues.length ? 'FAIL' : status,
    details: issues
  };
}

function checkTypeScale(inspector) {
  const expectations = [
    { var: 'step-0', expected: 16, tolerance: 0.75, label: 'body' },
    { var: 'step-1', expected: 22, tolerance: 1, label: 'h3' },
    { var: 'step-2', expected: 28, tolerance: 1, label: 'h2' },
    { var: 'step-3', expected: 36, tolerance: 1, label: 'h1' }
  ];
  const issues = [];
  const width = 1280;
  for (const { var: name, expected, tolerance, label } of expectations) {
    const evaluation = inspector.resolveVar(name, width);
    if (!evaluation) continue;
    const pixels = inspector.evaluateLength(evaluation.value, width).value;
    if (!Number.isFinite(pixels)) continue;
    if (Math.abs(pixels - expected) > tolerance) {
      issues.push(
        failDetail(
          `${label} step resolves to ${formatPx(pixels)} (expected ≈${expected}px)`,
          buildHint(evaluation.entry.file, evaluation.entry.line)
        )
      );
    }
  }

  const leadingTight = inspector.resolveVar('leading-tight', width);
  if (leadingTight) {
    const value = inspector.evaluateLength(leadingTight.value, width).value;
    if (Math.abs(value - 1.25) > 0.05) {
      issues.push(
        failDetail(
          `tight line-height resolves to ${value.toFixed(2)} (expected 1.25)`,
          buildHint(leadingTight.entry.file, leadingTight.entry.line)
        )
      );
    }
  }

  const leadingStandard = inspector.resolveVar('leading-standard', width);
  if (leadingStandard) {
    const value = inspector.evaluateLength(leadingStandard.value, width).value;
    if (Math.abs(value - 1.5) > 0.05) {
      issues.push(
        failDetail(
          `standard line-height resolves to ${value.toFixed(2)} (expected 1.50)`,
          buildHint(leadingStandard.entry.file, leadingStandard.entry.line)
        )
      );
    }
  }

  return {
    name: 'Type ramp baseline',
    status: issues.length ? 'FAIL' : 'PASS',
    details: issues
  };
}

function checkSectionRhythm(inspector) {
  const decl = inspector.getDeclaration('.section', 'padding-block');
  const issues = [];
  if (decl) {
    for (const width of VIEWPORT_WIDTHS) {
      const px = inspector.evaluateLength(decl.value, width).value;
      if (!Number.isFinite(px)) continue;
      if (width >= 1024 && px > 80 + 0.1) {
        issues.push(
          failDetail(
            `desktop padding at ${width}px is ${formatPx(px)} (>80px)`,
            hintForDeclaration(decl, inspector, '.section', 'padding-block')
          )
        );
      }
      if (width <= 390 && px > 40 + 0.1) {
        issues.push(
          failDetail(
            `mobile padding at ${width}px is ${formatPx(px)} (>40px)`,
            hintForDeclaration(decl, inspector, '.section', 'padding-block')
          )
        );
      }
      if (distanceFromMultiple(px, 8) > 0.25) {
        issues.push(
          failDetail(
            `padding ${formatPx(px)} is off 8px rhythm`,
            hintForDeclaration(decl, inspector, '.section', 'padding-block')
          )
        );
      }
    }
  }
  return {
    name: 'Section spacing rhythm',
    status: issues.length ? 'FAIL' : 'PASS',
    details: issues
  };
}

function checkContact(inspector, htmlFiles) {
  const issues = [];
  const contactDecl = inspector.getDeclaration('.contact', 'flex-wrap');
  if (!contactDecl || contactDecl.value.trim() !== 'wrap') {
    issues.push(failDetail('contact row must declare flex-wrap: wrap', buildHint(contactDecl?.file, contactDecl?.line)));
  }
  const emailLinkDecl = inspector.getDeclaration('.contact__channels a', 'overflow-wrap');
  if (!emailLinkDecl || emailLinkDecl.value.trim() !== 'anywhere') {
    issues.push(
      failDetail('contact links should set overflow-wrap:anywhere', buildHint(emailLinkDecl?.file, emailLinkDecl?.line))
    );
  }
  const hasContactMarkup = htmlFiles.some(({ content }) => content.includes('class="contact__channels"'));
  if (!hasContactMarkup) {
    issues.push('contact channels markup missing from HTML');
  }
  return {
    name: 'Contact row resiliency',
    status: issues.length ? 'FAIL' : 'PASS',
    details: issues
  };
}

function checkButtons(inspector) {
  const decl = inspector.getDeclaration('.btn', 'min-height');
  const focusDecl = inspector.getDeclaration(':focus-visible', 'outline');
  const issues = [];
  if (decl) {
    const height = inspector.evaluateLength(decl.value, 1280).value;
    if (!Number.isFinite(height) || height < 40) {
      issues.push(failDetail(`button min-height is ${formatPx(height)} (<40px)`, buildHint(decl.file, decl.line)));
    }
  } else {
    issues.push('button min-height missing');
  }
  if (!focusDecl) {
    issues.push('global :focus-visible outline missing');
  }
  return {
    name: 'Buttons sizing & focus',
    status: issues.length ? 'FAIL' : 'PASS',
    details: issues
  };
}

function checkContrast(inspector) {
  const scenarios = [
    { label: 'light', selectors: [':root'] },
    { label: 'dark', selectors: ["html[data-theme='dark']", ':root'] }
  ];
  const issues = [];
  for (const scenario of scenarios) {
    const bg = inspector.resolveVar('surface-900', 1280, scenario.selectors);
    const text = inspector.resolveVar('text-primary', 1280, scenario.selectors);
    if (!bg || !text) continue;
    const ratio = contrastRatio(text.value, bg.value);
    if (ratio == null || ratio < 4.5) {
      const hint = [bg.entry, text.entry]
        .filter(Boolean)
        .map((entry) => buildHint(entry.file, entry.line))
        .join(', ');
      issues.push(failDetail(`${scenario.label} theme foreground contrast ${ratio?.toFixed(2) ?? 'N/A'} (<4.5)`, hint));
    }
  }
  return {
    name: 'Theme contrast tokens',
    status: issues.length ? 'FAIL' : 'PASS',
    details: issues
  };
}

function listTagSequence(htmlSnippet) {
  const matches = [...htmlSnippet.matchAll(/<([a-z0-9-]+)(\s|>)/gi)];
  return matches.map((match) => match[1].toLowerCase());
}

function isolateHero(html) {
  const match = html.match(/<section[^>]+id="hero"[^>]*>([\s\S]+?)<\/section>/i);
  return match ? match[0] : null;
}

function checkHero(htmlFiles, domFactory) {
  const issues = [];
  const locales = [
    { path: 'index.html', label: 'EN' },
    { path: 'fr/index.html', label: 'FR' }
  ];
  const heroSequences = [];
  for (const locale of locales) {
    const file = htmlFiles.find((entry) => entry.path === locale.path);
    if (!file) continue;
    const hero = isolateHero(file.content);
    if (!hero) {
      issues.push(`hero section missing in ${locale.path}`);
      continue;
    }
    const tags = listTagSequence(hero);
    heroSequences.push({ locale: locale.label, tags });
    const pictureMatch = hero.match(/<picture>[\s\S]*?<\/picture>/i);
    if (!pictureMatch) {
      issues.push(`hero picture missing in ${locale.path}`);
      continue;
    }
    const picture = pictureMatch[0];
    const sourceCount = (picture.match(/<source /gi) || []).length;
    if (sourceCount < 1) {
      issues.push(`hero picture needs ≥1 source (${locale.path})`);
    }
    if (!/srcset="[^"]*,\s*[^"]+"/.test(picture)) {
      issues.push(`hero picture should expose multiple candidates in srcset (${locale.path})`);
    }
    if (!/sizes="/.test(picture)) {
      issues.push(`hero responsive sizes missing (${locale.path})`);
    }
  }
  if (heroSequences.length === 2) {
    const [first, second] = heroSequences;
    if (first.tags.join('|') !== second.tags.join('|')) {
      issues.push(`hero element parity mismatch between ${first.locale} and ${second.locale}`);
    }
  }
  return {
    name: 'Hero responsive parity',
    status: issues.length ? 'FAIL' : 'PASS',
    details: issues
  };
}

async function main() {
  const cssMap = await loadCssFiles();
  const inspector = new CssInspector(cssMap);
  const htmlFiles = await collectHtmlFiles();
  const domFactory = await loadDomFactory();

  const results = [
    checkOverflow(inspector),
    checkNav(inspector),
    checkTypeScale(inspector),
    checkSectionRhythm(inspector),
    checkContact(inspector, htmlFiles),
    checkButtons(inspector),
    checkContrast(inspector),
    checkHero(htmlFiles, domFactory)
  ];

  const table = buildTable(results);
  console.log('POLISH CHECK');
  console.log(table.join('\n'));

  const failures = results.filter((result) => result.status !== 'PASS');
  if (failures.length) {
    console.log('\nDETAILS');
    for (const failure of failures) {
      console.log(`- ${failure.name}`);
      for (const detail of failure.details) {
        console.log(`  • ${detail}`);
      }
      if (!failure.details.length) {
        console.log('  • No further detail available.');
      }
    }
  }

  if (domFactory === null) {
    console.log('\nNote: jsdom not available; DOM-dependent checks used static parsing heuristics.');
  }

  process.exit(failures.length ? 1 : 0);
}

main().catch((error) => {
  console.error('polish-check failed with error:', error);
  process.exit(1);
});
