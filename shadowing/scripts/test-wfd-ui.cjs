const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const sample = { id: 'test', text: 'Students should check the library opening hours.', audio: { Brian: '' }, occurrence: 12, questionType: 'New', topic: 'Education', vietnameseTranslation: 'Sinh viên nên kiểm tra giờ mở cửa của thư viện.' };
const backgroundImage = `data:image/jpeg;base64,${fs.readFileSync(path.join(root, 'public/beautiful-mountains-landscape-pink.jpg')).toString('base64')}`;
let fixture = { backgroundImage, loading: false, showAnswer: true, sortedAudioSamples: [sample], currentAudioSample: sample };
let staffAccess = false;
function load(filename) {
  const instance = new Module(filename, module);
  instance.filename = filename;
  instance.paths = module.paths;
  instance.require = name => {
    if (name === 'next/head') return { __esModule: true, default: () => null };
    if (name === 'next/link') return { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) };
    if (name === 'next/router') return { useRouter: () => ({ query: {} }) };
    if (name.includes('notifications/client')) return {};
    if (name.includes('useStaffAccess')) return { useStaffAccess: () => staffAccess };
    if (name.includes('useWriteFromDictation')) return { useWriteFromDictation: () => new Proxy({
      ...fixture, currentIndex: 0, selectedVoice: 'Brian', playbackRate: 1, sortingOption: 'occurrence', filterOption: 'All', topicFilter: 'All', remainingRandomSentenceCount: 1,
      inputText: 'Students check the library hours.', score: 5, maxScore: 8, wordStatuses: [{ word: 'students', status: 'correct' }, { word: 'should', status: 'missing' }, { word: 'checks', status: 'incorrect' }],
    }, { get: (target, key) => key in target ? target[key] : key.startsWith('handle') || key === 'toggleRepeatMode' ? () => {} : false }) };
    if (name.includes('useWfdGamification')) return { useWfdGamification: () => ({ session: { practiced: 0 }, celebrations: [], prepare() {}, resetTicket() {} }) };
    if (name.startsWith('.') || name.startsWith('@/')) {
      const base = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
      return load(['.tsx', '.ts'].map(ext => base + ext).find(file => fs.existsSync(file)));
    }
    return require(name);
  };
  instance._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
  return instance.exports;
}
async function main() {
  const { WeeklyTopThree } = load(path.join(root, 'components/writefromdictation/GamificationPanel.tsx'));
  const leaders = [4, 2, 1, 3].map(rank => ({ rank, userId: `user-${rank}`, name: `Học viên ${rank}`, avatar: '', xp: 1000 - rank }));
  const leaderboardData = { week: '2026-10-05', leaderboard: leaders, me: leaders[1] };
  const renderTop = data => renderToStaticMarkup(React.createElement(WeeklyTopThree, { data }));
  const topHtml = renderTop(leaderboardData);
  assert.equal((topHtml.match(/<li /g) || []).length, 3);
  assert.ok(!topHtml.includes('Học viên 4'));
  assert.ok(topHtml.indexOf('Học viên 1') < topHtml.indexOf('Học viên 2'));
  assert.ok(topHtml.indexOf('Học viên 2') < topHtml.indexOf('Học viên 3'));
  assert.ok(topHtml.includes('Bạn'));
  assert.ok(topHtml.includes('href="/wfd/leaderboard"'));
  assert.equal(leaders[0].rank, 4, 'Rendering must not reorder dashboard data');
  assert.ok(renderTop({ ...leaderboardData, leaderboard: [] }).includes('Chưa có xếp hạng tuần này'));
  assert.equal((renderTop({ ...leaderboardData, leaderboard: [leaders[1]], me: null }).match(/<li /g) || []).length, 1);
  assert.ok(!renderTop({ ...leaderboardData, me: null }).includes('>Bạn<'));
  const Page = load(path.join(root, 'pages/writefromdictation.tsx')).default;
  const render = () => renderToStaticMarkup(React.createElement(Page));
  const html = render();
  assert.ok(!html.includes('Xuất CSV'), 'Students and unresolved access must not see export');
  staffAccess = true;
  assert.ok(render().includes('Xuất CSV'), 'Verified staff must see export');
  staffAccess = false;
  assert.ok(html.includes('wfd-audio-panel'));
  assert.ok(html.includes('aria-describedby="wfd-input-hint"'));
  assert.ok(html.includes('wfd-word-missing'));
  assert.ok(html.includes('Kiểm tra đáp án'));
  assert.ok(html.includes(backgroundImage));
  fixture = { ...fixture, loading: true };
  assert.ok(render().includes('Đang tải bài luyện'));
  fixture = { ...fixture, loading: false, sortedAudioSamples: [], currentAudioSample: null };
  assert.ok(render().includes('Không có câu phù hợp'));
  const config = (await import(require('node:url').pathToFileURL(path.join(root, 'tailwind.config.js')))).default;
  const css = await require('postcss')([require('tailwindcss')(config)]).process(fs.readFileSync(path.join(root, 'styles/globals.css'), 'utf8'), { from: path.join(root, 'styles/globals.css') });
  const browser = await require('puppeteer').launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.css}</style></head><body>${html}</body></html>`);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 1000 });
      assert.equal(await page.$$eval('.wfd-settings-disclosure[open]', nodes => nodes.length), 0, 'Settings start collapsed');
      const settings = await page.$('.wfd-settings-disclosure');
      await settings.$eval('summary', el => el.click());
      assert.equal(await settings.evaluate(el => el.open), true);
      await page.select('#sorting-select', 'newest');
      await settings.$eval('summary', el => el.click());
      assert.equal(await settings.evaluate(el => el.open), false);
      await settings.$eval('summary', el => el.click());
      assert.equal(await page.$eval('#sorting-select', el => el.value), 'newest', 'Closing must preserve selection');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Expanded settings must fit');
      await settings.$eval('summary', el => el.click());
      const layout = await page.evaluate(() => {
        const practice = document.querySelector('.wfd-practice-column').getBoundingClientRect();
        const sidebar = document.querySelector('.wfd-sidebar').getBoundingClientRect();
        return { practiceRight: practice.right, practiceBottom: practice.bottom, sidebarLeft: sidebar.left, sidebarTop: sidebar.top };
      });
      if (width >= 1024) assert.ok(layout.sidebarLeft > layout.practiceRight, 'Desktop learning rail should sit beside practice');
      else assert.ok(layout.sidebarTop >= layout.practiceBottom, 'Mobile should prioritize practice before the learning rail');
      for (const colorScheme of ['light', 'dark']) {
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: colorScheme }]);
        const result = await page.evaluate(() => {
          const input = getComputedStyle(document.querySelector('#txtInput'));
          const label = getComputedStyle(document.querySelector('label[for="sorting-select"]'));
          const surface = selector => getComputedStyle(document.querySelector(selector)).backgroundColor;
          const contrast = (foreground, background) => {
            const luminance = rgb => {
              const channels = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
                const c = value / 255;
                return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
              });
              return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
            };
            const a = luminance(foreground), b = luminance(background);
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          };
          const secondary = getComputedStyle(document.querySelector('.wfd-actions .ui-button-secondary'));
          const activeTab = getComputedStyle(document.querySelector('.ui-tab-active'));
          return {
            overflow: document.documentElement.scrollWidth > innerWidth, color: input.color, background: input.backgroundColor, label: label.color,
            surfaces: ['.wfd-header', '.wfd-workspace', '.wfd-mode-bar'].map(surface),
            inputContrast: contrast(input.color, input.backgroundColor), buttonContrast: contrast(secondary.color, secondary.backgroundColor),
            activeTabBackground: activeTab.backgroundColor, activeTabColor: activeTab.color,
            primaryColors: [...document.querySelectorAll('.ui-button-primary, .wfd-play-disc')].map(el => getComputedStyle(el).color),
            titleAccent: getComputedStyle(document.querySelector('.wfd-hero-copy h1 span')).color,
          };
        });
        assert.equal(result.overflow, false, `Horizontal overflow at ${width}/${colorScheme}`);
        assert.equal(result.color, 'rgb(243, 244, 246)');
        assert.equal(result.background, 'rgb(11, 18, 32)');
        assert.equal(result.label, 'rgb(203, 213, 225)');
        assert.deepEqual(result.surfaces, Array(3).fill('rgb(16, 23, 36)'));
        assert.ok(result.inputContrast >= 4.5);
        assert.ok(result.buttonContrast >= 4.5);
        assert.equal(result.activeTabBackground, 'rgb(252, 93, 1)');
        assert.equal(result.titleAccent, 'rgb(252, 93, 1)');
        assert.equal(result.activeTabColor, 'rgb(255, 255, 255)');
        assert.ok(result.primaryColors.length > 0);
        assert.ok(result.primaryColors.every(color => color === 'rgb(255, 255, 255)'), 'Orange controls must use white labels/icons');
      }
      await page.screenshot({ path: path.join(os.tmpdir(), `wfd-ui-${width}.png`), fullPage: true });
    }
    await page.evaluate(() => {
      const background = document.querySelector('.wfd-background');
      background.style.backgroundImage = 'none';
      background.style.backgroundColor = '#fff';
    });
    assert.equal(await page.$eval('.wfd-workspace', el => getComputedStyle(el).backgroundColor), 'rgb(16, 23, 36)');
    await page.screenshot({ path: path.join(os.tmpdir(), 'wfd-ui-bright-background.png'), fullPage: true });
    await page.setContent(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.css}</style></head><body><main class="wfd-page"><div class="ui-card" style="width:280px">${topHtml}</div></main></body></html>`);
    await page.setViewport({ width: 320, height: 800 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.$$eval('.wfd-weekly-top li', rows => rows.length), 3);
    assert.equal(await page.$eval('.wfd-weekly-top li[value="1"]', el => getComputedStyle(el).borderTopColor), 'rgba(252, 93, 1, 0.45)');
    console.log('Weekly top 3: rank ordering, three-entry limit, current-user highlight, empty/partial results, link and narrow-card layout passed.');
    console.log('WFD UI: populated/loading/empty states; original photo preserved; 320/390/768/1440px without overflow; opaque reading surfaces on bright backgrounds; input/button contrast >= 4.5:1 in light/dark system themes passed.');
    console.log(`Screenshots: ${os.tmpdir()}\\wfd-ui-{390,768,1440}.png`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });