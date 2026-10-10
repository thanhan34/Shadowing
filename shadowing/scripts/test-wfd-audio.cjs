const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
let effects, messages, controls, element;
const filename = path.resolve(__dirname, '../components/AudioPlayer.tsx');
const m = new Module(filename, module);
m.require = name => {
  if (name === './ui/Button') return { __esModule: true, default: () => null };
  if (name === 'react') return { ...React, forwardRef: fn => fn, useRef: value => ({ current: value === null ? element : value }), useId: () => 'speed', useCallback: fn => fn,
    useState: () => ['', value => messages.push(value)], useEffect: fn => effects.push(fn), useImperativeHandle: (ref, fn) => { controls = fn(); } };
  return require(name);
};
m._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
function mount(audio = 'sample.mp3') {
  effects = []; messages = [];
  m.exports.default({ audio, playbackRate: 1, onEnded() {}, onPlaybackRateChange() {} }, {});
}
(async () => {
  element = { play: async () => { throw Object.assign(new Error(), { name: 'NotAllowedError' }); }, pause() {}, load() {} };
  mount(); await controls.play(); assert.ok(messages.at(-1).includes('Phát audio'));
  element.play = async () => {}; await controls.play(); assert.equal(messages.at(-1), '');
  element.play = async () => { throw Object.assign(new Error(), { name: 'NotSupportedError' }); };
  await controls.play(); assert.ok(messages.at(-1).includes('Không phát được'));
  mount(''); await controls.play(); assert.ok(messages.at(-1).includes('chưa có audio'));
  let rejectPending;
  element.play = () => new Promise((resolve, reject) => { rejectPending = reject; });
  mount(); const pending = controls.play(); await controls.stop(); rejectPending(new Error('old source')); await pending;
  assert.equal(messages.length, 0, 'Stopped playback must ignore stale failures');
  let calls = 0; element.play = async () => { calls++; };
  mount(); effects.forEach(effect => effect()); await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1, 'Only source effect should autoplay');
  console.log('WFD audio: blocked autoplay, manual retry, missing/broken audio, stale promises and single autoplay passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });