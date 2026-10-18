const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const filename = path.resolve(__dirname, '../components/RepeatSentenceActions.tsx');
const mod = new Module(filename, module);
let states = [false, false, 0, 0], cursor = 0, element;
mod.require = name => {
  if (name === 'react') return { ...React, useRef: () => ({ current: element }), useState: () => { const index = cursor++; return [states[index], value => { states[index] = value; }]; } };
  if (name === './ui/Button') return { __esModule: true, default: () => null };
  return require(name);
};
mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const result = find(child, predicate);
    if (result) return result;
  }
  return null;
}
async function main() {
  const render = () => { cursor = 0; return mod.exports.default({ sentenceId: '#170 RS', audio: 'sample.mp3' }); };
  assert.equal(mod.exports.formatAudioTime(65.9), '1:05');
  assert.equal(mod.exports.formatAudioTime(Infinity), '0:00');
  let tree = render();
  const audio = find(tree, node => node.type === 'audio');
  assert.equal(audio.props.preload, 'none');
  assert.equal(audio.props.autoPlay, undefined);
  assert.equal(audio.props.controls, undefined);
  let currentPaused = 0, otherPaused = 0;
  const current = { pause: () => currentPaused++ };
  global.document = { querySelectorAll: () => [current, { pause: () => otherPaused++ }] };
  audio.props.onPlay({ currentTarget: current });
  assert.equal(currentPaused, 0);
  assert.equal(otherPaused, 1);
  audio.props.onError(); assert.equal(states[0], true);
  tree = render();
  const retry = find(tree, node => node.props?.children === 'Thử lại audio');
  assert.ok(retry);
  let loads = 0, plays = 0;
  element = { paused: true, load: () => loads++, play: async () => { plays++; } };
  tree = render();
  const retryButton = find(tree, node => node.props?.children === 'Thử lại audio');
  retryButton.props.onClick();
  await Promise.resolve();
  assert.equal(loads, 1); assert.equal(plays, 1); assert.equal(states[0], false);
  element.play = async () => { throw new Error('Media unavailable'); };
  retryButton.props.onClick();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(states[0], true);
  audio.props.onPlaying(); assert.equal(states[0], false);
  audio.props.onLoadedMetadata({ currentTarget: { duration: 12 } });
  audio.props.onTimeUpdate({ currentTarget: { currentTime: 3 } });
  tree = render();
  const seek = find(tree, node => node.type === 'input');
  assert.equal(seek.props.max, 12);
  assert.equal(seek.props.value, 3);
  seek.props.onChange({ target: { value: '6' } });
  assert.equal(element.currentTime, 6);
  find(tree, node => node.props?.className === 'rs-audio-restart accent-ring').props.onClick();
  assert.equal(element.currentTime, 0);
  let paused = 0;
  element.paused = false; element.pause = () => paused++;
  find(tree, node => node.props?.className === 'rs-audio-play accent-ring').props.onClick();
  assert.equal(paused, 1);
  audio.props.onPause(); assert.equal(states[1], false);
  audio.props.onEnded(); assert.equal(states[1], false);
  delete global.document;
  console.log('RS audio actions passed: manual-only playback, pause other sentences, playback errors and successful/failed retry. Media mocked.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });