const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToString } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const sources = {};
const cache = {};
const icons = Object.fromEntries(['BookOpen', 'Search'].map(name => [name, props => React.createElement('svg', { ...props, width: props.size, height: props.size })]));
function load(filename) {
  if (cache[filename]) return cache[filename].exports;
  const instance = { exports: {} };
  cache[filename] = instance;
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const mappings = {};
  function localRequire(name) {
    if (name === 'next/head') return { __esModule: true, default: () => null };
    if (name === 'react-feather') return icons;
    if (!name.startsWith('.')) return require(name);
    const base = path.resolve(path.dirname(filename), name);
    const resolved = ['.tsx', '.ts'].map(ext => base + ext).find(fs.existsSync);
    assert.ok(resolved, `Cannot resolve ${name}`);
    mappings[name] = resolved;
    return load(resolved);
  }
  new Function('require', 'module', 'exports', output)(localRequire, instance, instance.exports);
  sources[filename] = { output, mappings };
  return instance.exports;
}

async function main() {
  const { grammarSections } = load(path.join(root, 'data/grammar.ts'));
  const { filterGrammarSections, normalizeGrammarSearch } = load(path.join(root, 'lib/grammar.ts'));
  assert.equal(grammarSections.length, 75);
  assert.equal(new Set(grammarSections.map(section => section.id)).size, 75);
  for (const section of grammarSections) {
    for (const row of section.rows || []) assert.equal(row.length, section.headers.length);
  }
  assert.equal(normalizeGrammarSearch(' ĐẾM ĐƯỢC '), 'dem duoc');
  assert.equal(filterGrammarSections(grammarSections, 'nouns', 'so nhieu').length, 2);
  assert.equal(filterGrammarSections(grammarSections, 'prefixes', 'underpayment').length, 2);
  assert.equal(filterGrammarSections(grammarSections, 'articles', 'zzzz').length, 0);
  assert.equal(filterGrammarSections(grammarSections, 'verbs', '').length, 10);
  assert.equal(filterGrammarSections(grammarSections, 'verbs', 'khuyet thieu')[0].id, 'verb-modals');
  assert.equal(filterGrammarSections(grammarSections, 'verbs', 'retain the receipts')[0].id, 'verb-actions');
  assert.equal(filterGrammarSections(grammarSections, 'verbs', 'look forward to learning')[0].id, 'verb-positions');
  assert.equal(filterGrammarSections(grammarSections, 'adjectives', '').length, 6);
  assert.deepEqual(filterGrammarSections(grammarSections, 'adjectives', 'so sanh nhat').map(section => section.id), ['adjective-positions', 'adjective-comparisons']);
  assert.equal(filterGrammarSections(grammarSections, 'adjectives', 'significant impact')[0].id, 'adjective-collocations');
  assert.equal(filterGrammarSections(grammarSections, 'adjectives', 'zzzz').length, 0);
  assert.equal(filterGrammarSections(grammarSections, 'adverbs', '').length, 6);
  assert.equal(filterGrammarSections(grammarSections, 'adverbs', 'dau hieu')[0].id, 'adverb-signals');
  assert.equal(filterGrammarSections(grammarSections, 'adverbs', 'Group B')[0].id, 'adverb-connectors');
  assert.equal(filterGrammarSections(grammarSections, 'adverbs', 'zzzz').length, 0);
  assert.equal(filterGrammarSections(grammarSections, 'word-family', '').length, 6);
  assert.equal(filterGrammarSections(grammarSections, 'word-family', 'meo hoc nhanh')[0].id, 'word-family-study-tips');
  assert.equal(filterGrammarSections(grammarSections, 'word-family', 'automatic')[0].id, 'word-family-adjective-adverb');
  assert.equal(filterGrammarSections(grammarSections, 'word-family', 'zzzz').length, 0);
  assert.equal(filterGrammarSections(grammarSections, 'conjunctions', '').length, 4);
  assert.equal(filterGrammarSections(grammarSections, 'conjunctions', 'chu cai')[0].id, 'fanboys-definition');
  assert.equal(filterGrammarSections(grammarSections, 'conjunctions', 'Worrall')[0].id, 'fanboys-examples');
  assert.equal(filterGrammarSections(grammarSections, 'conjunctions', 'zzzz').length, 0);
  assert.equal(filterGrammarSections(grammarSections, 'parallelism', '').length, 4);
  assert.equal(filterGrammarSections(grammarSections, 'parallelism', 'cong thuc co ban')[0].id, 'parallelism-patterns');
  assert.equal(filterGrammarSections(grammarSections, 'parallelism', 'Chimpanzees')[0].id, 'parallelism-examples');
  assert.equal(filterGrammarSections(grammarSections, 'parallelism', 'zzzz').length, 0);
  assert.equal(filterGrammarSections(grammarSections, 'clause-markers', '').length, 9);
  assert.equal(filterGrammarSections(grammarSections, 'clause-markers', 'inasmuch')[0].id, 'clause-markers-reason');
  assert.equal(filterGrammarSections(grammarSections, 'clause-markers', 'He talks')[0].id, 'clause-markers-manner');
  assert.equal(filterGrammarSections(grammarSections, 'clause-markers', 'zzzz').length, 0);
  assert.equal(filterGrammarSections(grammarSections, 'conjunctive-adverbs', '').length, 11);
  assert.equal(filterGrammarSections(grammarSections, 'conjunctive-adverbs', 'dau cau')[0].id, 'conjunctive-adverbs-structure');
  assert.equal(filterGrammarSections(grammarSections, 'conjunctive-adverbs', 'tennis')[0].id, 'conjunctive-adverbs-examples');
  assert.equal(filterGrammarSections(grammarSections, 'conjunctive-adverbs', 'zzzz').length, 0);
  assert.equal(filterGrammarSections(grammarSections, 'relative-clauses', '').length, 7);
  assert.equal(filterGrammarSections(grammarSections, 'relative-clauses', 'rut gon')[0].id, 'relative-clauses-reduction');
  assert.equal(filterGrammarSections(grammarSections, 'relative-clauses', '500 people')[0].id, 'relative-clauses-reading');
  assert.equal(filterGrammarSections(grammarSections, 'relative-clauses', 'zzzz').length, 0);
  const filename = path.join(root, 'pages/grammar.tsx');
  const Page = load(filename).default;
  const html = renderToString(React.createElement(Page));
  assert.ok(html.includes('Students need to study.'));
  assert.ok(fs.readFileSync(path.join(root, 'components/Navigation.tsx'), 'utf8').includes('href: "/grammar"'));
  const config = (await import(require('node:url').pathToFileURL(path.join(root, 'tailwind.config.js')))).default;
  const css = await require('postcss')([require('tailwindcss')(config)]).process(fs.readFileSync(path.join(root, 'styles/globals.css'), 'utf8'), { from: path.join(root, 'styles/globals.css') });
  const browser = await require('puppeteer').launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.css}</style></head><body><div id="root">${html}</div></body></html>`);
    await page.addScriptTag({ path: path.join(root, 'node_modules/react/umd/react.development.js') });
    await page.addScriptTag({ path: path.join(root, 'node_modules/react-dom/umd/react-dom.development.js') });
    await page.evaluate(({ sources, filename }) => {
      const cache = {};
      function load(id) {
        if (id === 'react') return window.React;
        if (id === 'react/jsx-runtime') return {
          jsx: (type, props, key) => window.React.createElement(type, { ...props, key }),
          jsxs: (type, props, key) => window.React.createElement(type, { ...props, key }),
        };
        if (id === 'next/head') return { __esModule: true, default: () => null };
        if (id === 'react-feather') return Object.fromEntries(['BookOpen', 'Search'].map(name => [name, props => window.React.createElement('svg', { ...props, width: props.size, height: props.size })]));
        if (cache[id]) return cache[id].exports;
        const instance = { exports: {} };
        cache[id] = instance;
        const source = sources[id];
        new Function('require', 'module', 'exports', source.output)(name => load(source.mappings[name] || name), instance, instance.exports);
        return instance.exports;
      }
      window.ReactDOM.hydrateRoot(document.getElementById('root'), window.React.createElement(load(filename).default));
    }, { sources, filename });
    await page.waitForSelector('#grammar-search');
    assert.equal(await page.$$eval('.grammar-topic-group', nodes => nodes.length), 3);
    assert.equal(await page.$$eval('[role="tab"]', nodes => nodes.length), 12);
    assert.ok(await page.$$eval('[role="tab"]', nodes => nodes.every(node => node.dataset.marker && node.dataset.description)), 'Topic tiles need their own symbol and description');
    assert.equal(await page.$eval('.grammar-hero-cta', node => node.getAttribute('href')), '#grammar-library');
    assert.ok(await page.$('.grammar-example-card'), 'Hero should include CSS-only grammar artwork');
    await page.$eval('.grammar-topic-disclosure summary', node => node.click());
    assert.equal(await page.$eval('.grammar-topic-disclosure', node => node.open), false);
    assert.ok(await page.$('#noun-positions'), 'Collapsing the topic picker must preserve lesson content');
    await page.$eval('.grammar-topic-disclosure summary', node => node.click());
    assert.equal(await page.$eval('.grammar-topic-disclosure', node => node.open), true);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow at ${width}px`);
      assert.equal(await page.$$eval('.grammar-section', nodes => nodes.length), 6);
      assert.ok(await page.$eval('.grammar-table-wrap', node => node.scrollWidth <= node.clientWidth + 1), `Table overflow at ${width}px`);
      assert.ok(await page.$$eval('[role="tab"]', nodes => nodes.every(node => node.getBoundingClientRect().height >= 44)), 'Topic tap targets must be at least 44px');
      if (width < 640) {
        assert.equal(await page.$eval('.grammar-table td', node => getComputedStyle(node).display), 'block');
        assert.ok(await page.$eval('.grammar-table td', node => node.dataset.label.length > 0), 'Mobile table fields need readable labels');
      }
    }
    await page.type('#grammar-search', 'so nhieu');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 2);
    await page.type('#grammar-search', ' zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Tiền tố (Prefixes)').click());
    await page.waitForFunction(() => document.querySelector('#grammar-search').value === '' && document.querySelectorAll('.grammar-section').length === 2);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('underpayment')));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Mạo từ “the”').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 4);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('The dog was barking.')));
    await page.type('#grammar-search', 'zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Xem toàn bộ chủ đề'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xem toàn bộ chủ đề').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 4);
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Động từ (Verbs)').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 10);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('The economy grows rapidly.')));
    assert.equal(await page.$$eval('.grammar-contents nav a', nodes => nodes.length), 10);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Verbs page overflow at ${width}px`);
    }
    await page.type('#grammar-search', 'khuyet thieu');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#verb-modals'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xóa tìm kiếm').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 10);
    await page.type('#grammar-search', 'zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Danh từ (Nouns)').click());
    await page.waitForFunction(() => document.querySelector('#grammar-search').value === '' && document.querySelectorAll('.grammar-section').length === 6);
    await page.type('#grammar-search', 'zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Tính từ (Adjectives)').click());
    await page.waitForFunction(() => document.querySelector('#grammar-search').value === '' && document.querySelectorAll('.grammar-section').length === 6);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('The result is surprising.')));
    assert.equal(await page.$$eval('.grammar-contents nav a', nodes => nodes.length), 6);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Adjectives page overflow at ${width}px`);
    }
    await page.type('#grammar-search', 'so sanh nhat');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 2);
    assert.ok(await page.$('#adjective-comparisons'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xóa tìm kiếm').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 6);
    await page.type('#grammar-search', 'significant impact');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#adjective-collocations'));
    await page.type('#grammar-search', ' zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xem toàn bộ chủ đề').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 6);
    await page.type('#grammar-search', 'zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Trạng từ (Adverbs)').click());
    await page.waitForFunction(() => document.querySelector('#grammar-search').value === '' && document.querySelectorAll('.grammar-section').length === 6);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('She sings beautifully.')));
    assert.equal(await page.$$eval('.grammar-contents nav a', nodes => nodes.length), 6);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Adverbs page overflow at ${width}px`);
    }
    await page.type('#grammar-search', 'dau hieu');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#adverb-signals'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xóa tìm kiếm').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 6);
    await page.type('#grammar-search', 'Group B');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#adverb-connectors'));
    await page.type('#grammar-search', ' zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xem toàn bộ chủ đề').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 6);
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Danh từ (Nouns)').click());
    await page.waitForFunction(() => !!document.querySelector('#noun-positions'));
    await page.type('#grammar-search', 'zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Word Family – Tạo từ').click());
    await page.waitForFunction(() => document.querySelector('#grammar-search').value === '' && document.querySelectorAll('.grammar-section').length === 6);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('act → action, decide → decision')));
    assert.equal(await page.$$eval('.grammar-contents nav a', nodes => nodes.length), 6);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Word Family page overflow at ${width}px`);
    }
    await page.type('#grammar-search', 'meo hoc nhanh');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#word-family-study-tips'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xóa tìm kiếm').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 6);
    await page.type('#grammar-search', 'automatic');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#word-family-adjective-adverb'));
    await page.type('#grammar-search', ' zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xem toàn bộ chủ đề').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 6);
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Danh từ (Nouns)').click());
    await page.waitForFunction(() => !!document.querySelector('#noun-positions'));
    await page.type('#grammar-search', 'zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Liên từ – FANBOYS').click());
    await page.waitForFunction(() => document.querySelector('#grammar-search').value === '' && document.querySelectorAll('.grammar-section').length === 4);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('S + V(f) + (O), FANBOYS')));
    assert.equal(await page.$$eval('.grammar-contents nav a', nodes => nodes.length), 4);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `FANBOYS page overflow at ${width}px`);
    }
    await page.type('#grammar-search', 'chu cai');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#fanboys-definition'));
    assert.equal(await page.$$eval('#fanboys-definition tbody tr', nodes => nodes.length), 7);
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xóa tìm kiếm').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 4);
    await page.type('#grammar-search', 'Worrall');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#fanboys-examples'));
    await page.type('#grammar-search', ' zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xem toàn bộ chủ đề').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 4);
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Danh từ (Nouns)').click());
    await page.waitForFunction(() => !!document.querySelector('#noun-positions'));
    await page.type('#grammar-search', 'zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Parallelism – Song song').click());
    await page.waitForFunction(() => document.querySelector('#grammar-search').value === '' && document.querySelectorAll('.grammar-section').length === 4);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('Reading, writing, and speaking are essential skills.')));
    assert.equal(await page.$$eval('.grammar-contents nav a', nodes => nodes.length), 4);
    assert.equal(await page.$$eval('#parallelism-structures tbody tr', nodes => nodes.length), 8);
    assert.equal(await page.$$eval('#parallelism-examples tbody tr', nodes => nodes.length), 11);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Parallelism page overflow at ${width}px`);
    }
    await page.type('#grammar-search', 'cong thuc co ban');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#parallelism-patterns'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xóa tìm kiếm').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 4);
    await page.type('#grammar-search', 'Chimpanzees');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#parallelism-examples'));
    await page.type('#grammar-search', ' zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xem toàn bộ chủ đề').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 4);
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Danh từ (Nouns)').click());
    await page.waitForFunction(() => !!document.querySelector('#noun-positions'));
    await page.type('#grammar-search', 'zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Clause Markers – Từ nối').click());
    await page.waitForFunction(() => document.querySelector('#grammar-search').value === '' && document.querySelectorAll('.grammar-section').length === 9);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('By the time we arrived, he had left.')));
    assert.equal(await page.$$eval('.grammar-contents nav a', nodes => nodes.length), 9);
    assert.equal(await page.$$eval('#clause-markers-summary tbody tr', nodes => nodes.length), 8);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Clause Markers page overflow at ${width}px`);
    }
    await page.type('#grammar-search', 'ly do');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length > 0 && document.querySelectorAll('.grammar-section').length < 9);
    assert.ok(await page.$('#clause-markers-reason'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xóa tìm kiếm').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 9);
    await page.type('#grammar-search', 'He talks');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#clause-markers-manner'));
    await page.type('#grammar-search', ' zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xem toàn bộ chủ đề').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 9);
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Danh từ (Nouns)').click());
    await page.waitForFunction(() => !!document.querySelector('#noun-positions'));
    await page.type('#grammar-search', 'zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Conjunctive Adverbs – Liên kết').click());
    await page.waitForFunction(() => document.querySelector('#grammar-search').value === '' && document.querySelectorAll('.grammar-section').length === 11);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('We, however, still went out.')));
    assert.equal(await page.$$eval('.grammar-contents nav a', nodes => nodes.length), 11);
    assert.equal(await page.$$eval('#conjunctive-adverbs-summary tbody tr', nodes => nodes.length), 8);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Conjunctive Adverbs page overflow at ${width}px`);
    }
    await page.type('#grammar-search', 'dau cau');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length > 0 && document.querySelectorAll('.grammar-section').length < 11);
    assert.ok(await page.$('#conjunctive-adverbs-structure'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xóa tìm kiếm').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 11);
    await page.type('#grammar-search', 'tennis');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#conjunctive-adverbs-examples'));
    await page.type('#grammar-search', ' zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xem toàn bộ chủ đề').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 11);
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Danh từ (Nouns)').click());
    await page.waitForFunction(() => !!document.querySelector('#noun-positions'));
    await page.type('#grammar-search', 'zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Relative Clauses – Quan hệ').click());
    await page.waitForFunction(() => document.querySelector('#grammar-search').value === '' && document.querySelectorAll('.grammar-section').length === 7);
    assert.ok(await page.evaluate(() => document.body.textContent.includes('The man who is standing there is my uncle.')));
    assert.equal(await page.$$eval('.grammar-contents nav a', nodes => nodes.length), 7);
    assert.equal(await page.$$eval('#relative-clauses-markers tbody tr', nodes => nodes.length), 8);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Relative Clauses page overflow at ${width}px`);
    }
    await page.type('#grammar-search', 'rut gon');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#relative-clauses-reduction'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xóa tìm kiếm').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 7);
    await page.type('#grammar-search', '500 people');
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 1);
    assert.ok(await page.$('#relative-clauses-reading'));
    await page.type('#grammar-search', ' zzzz');
    await page.waitForFunction(() => document.body.textContent.includes('Không tìm thấy nội dung phù hợp'));
    await page.$$eval('button', nodes => nodes.find(node => node.textContent === 'Xem toàn bộ chủ đề').click());
    await page.waitForFunction(() => document.querySelectorAll('.grammar-section').length === 7);
    await page.$$eval('[role="tab"]', nodes => nodes.find(node => node.textContent === 'Danh từ (Nouns)').click());
    await page.waitForFunction(() => !!document.querySelector('#noun-positions'));
    assert.deepEqual(errors, []);
    console.log('PASS: grammar data, search, SSR, hydrated interactions, topic switching, empty/reset states, and responsive layout at 320/390/768/1440px.');
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });