const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const root = path.resolve(__dirname, '..');
let states, cursor, refs, refCursor, writes, uploads, saved, saving, failSave;
function load(filename) {
  const mod = new Module(filename, module);
  mod.require = name => {
    if (name === 'react') return { ...React,
      useState: initial => { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
      useRef: initial => { const i = refCursor++; return refs[i] ?? (refs[i] = { current: initial }); },
    };
    if (name === '../firebase') return { db: {}, storage: {} };
    if (name === 'firebase/firestore') return { doc: (...args) => args, updateDoc: async (doc, patch) => { if (failSave) throw new Error('Save denied'); writes.push(patch); } };
    if (name === 'firebase/storage') return { ref: (storage, value) => value, uploadBytes: async (ref, file) => { uploads.push(file); return { ref }; }, getDownloadURL: async () => 'https://storage.example/new.mp3' };
    if (name === './ui/Button' || name === './ui/Input') return { __esModule: true, default: () => null };
    if (name === '../lib/repeatSentenceResources') return load(path.join(root, 'lib/repeatSentenceResources.ts'));
    return require(name);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return mod.exports;
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props?.children)) { const result = find(child, predicate); if (result) return result; }
  return null;
}
async function main() {
  const { validateRepeatSentenceResources: validate } = load(path.join(root, 'lib/repeatSentenceResources.ts'));
  assert.deepEqual(validate(' https://example.com/a.mp3 ', ''), { audioUrl: 'https://example.com/a.mp3', practiceUrl: '' });
  for (const bad of ['javascript:alert(1)', 'http://example.com', 'invalid', 'https://user:pass@example.com']) assert.throws(() => validate(bad, ''));
  assert.throws(() => validate('', 'https://evil.example'));
  const link = 'https://www.apeuni.com/practice/repeat_sentences/171';
  const Editor = load(path.join(root, 'components/RepeatSentenceResourceEditor.tsx')).default;
  const props = { id: 'a', audioUrl: 'https://example.com/old.mp3', practiceUrl: '', onSaved: (...values) => saved.push(values), onSavingChange: value => saving.push(value) };
  const reset = () => { states = []; refs = []; writes = []; uploads = []; saved = []; saving = []; failSave = false; };
  const render = () => { cursor = 0; refCursor = 0; return Editor(props); };
  const input = (tree, id) => find(tree, node => node.props?.id === id);
  const save = tree => find(tree, node => node.props?.children === 'Lưu audio & link').props.onClick();
  const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
  reset(); let tree = render();
  input(tree, 'rs-practice-url-a').props.onChange({ target: { value: link } });
  save(render()); await flush();
  assert.deepEqual(writes, [{ practiceUrl: link }]);
  assert.deepEqual(saving, [true, false]);
  reset(); tree = render();
  input(tree, 'rs-audio-url-a').props.onChange({ target: { value: '' } });
  save(render()); await flush();
  assert.deepEqual(writes, [{ 'audio.Ryan': '' }]);
  reset(); tree = render();
  input(tree, 'rs-audio-url-a').props.onChange({ target: { value: 'javascript:alert(1)' } });
  save(render()); await flush(); assert.equal(writes.length, 0); assert.equal(saved.length, 0);
  reset(); tree = render();
  input(tree, 'rs-audio-file-a').props.onChange({ target: { files: [{ name: 'new.mp3', size: 10 }] } });
  assert.equal(uploads.length, 0, 'Selecting a file must not upload it');
  failSave = true; save(render()); await flush();
  assert.equal(uploads.length, 1); assert.equal(saved.length, 0);
  failSave = false; save(render()); await flush();
  assert.equal(uploads.length, 1, 'Retry must reuse already uploaded URL');
  assert.deepEqual(writes, [{ 'audio.Ryan': 'https://storage.example/new.mp3' }]);
  reset(); tree = render();
  input(tree, 'rs-practice-url-a').props.onChange({ target: { value: link } });
  find(render(), node => node.props?.children === 'Reset audio & link').props.onClick();
  assert.equal(states[1], ''); assert.equal(writes.length, 0);
  console.log('RS resource editor passed: URL validation, changed-field-only save, clear Ryan, file upload on Save, failed-save retry without duplicate upload, Reset. Firebase mocked.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });