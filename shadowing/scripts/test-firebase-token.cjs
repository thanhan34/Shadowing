const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../pages/api/firebase-token.ts');
const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
async function check(failure, admin = true, provisioned = false, support = false) {
  let writes = 0;
  let tokens = 0;
  const fail = stage => { if (failure === stage) throw new Error('SECRET_MUST_NOT_LEAK'); };
  const loaded = new Module(filename, module);
  loaded.require = name => {
    if (name.endsWith('serverAccess')) return { requireAccess: async () => {
      fail('CLERK_ACCESS');
      return { user: { id: 'test' }, access: { admin, support, staff: admin || support } };
    } };
    if (name.endsWith('firebaseAdmin')) return { firebaseAdmin: () => {
      fail('FIREBASE_INIT');
      return {
        auth: { createCustomToken: async () => { tokens++; fail('FIREBASE_TOKEN'); return 'test-token'; } },
        db: { collection: () => ({ doc: () => ({
          set: async () => { writes++; fail('FIRESTORE_PROVISION'); },
          get: async () => { fail('FIRESTORE_ACCESS'); return { data: () => ({ approved: provisioned, admin: provisioned && admin, support: provisioned && support }) }; },
        }) }) },
      };
    } };
    if (name.endsWith('firebaseDiagnostics')) {
      const diagnosticFile = path.resolve(__dirname, '../lib/firebaseDiagnostics.ts');
      const diagnosticModule = new Module(diagnosticFile, module);
      diagnosticModule._compile(ts.transpileModule(fs.readFileSync(diagnosticFile, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }).outputText, diagnosticFile);
      return diagnosticModule.exports;
    }
    return require(name);
  };
  loaded._compile(code, filename);
  const res = { statusCode: 200, headers: {}, setHeader(k,v) { this.headers[k]=v; },
    status(n) { this.statusCode=n; return this; }, json(body) { this.body=body; }, end() {} };
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args);
  try { await loaded.exports.default({ method: 'POST' }, res); }
  finally { console.error = original; }
  const denied = !admin && !support && !provisioned;
  assert.equal(res.statusCode, failure ? 503 : denied ? 403 : 200);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  if (failure) assert.equal(res.body.diagnostic, failure);
  else if (denied) { assert.equal(tokens, 0); assert.equal(writes, 0); }
  else {
    assert.equal(res.body.token, 'test-token');
    assert.equal(writes, (admin || support) && !provisioned ? 1 : 0);
  }
  assert.ok(!JSON.stringify([res.body, logs]).includes('SECRET_MUST_NOT_LEAK'));
}
(async () => {
  for (const stage of [null, 'CLERK_ACCESS', 'FIREBASE_INIT', 'FIRESTORE_PROVISION', 'FIRESTORE_ACCESS', 'FIREBASE_TOKEN']) await check(stage);
  await check(null, true, true);
  await check(null, false, true);
  await check(null, false, false);
  await check(null, false, false, true);
  await check(null, false, true, true);
  console.log('Firebase token: success and five failure-stage tests passed; secrets not leaked.');
})().catch(() => { console.error('Firebase token tests failed'); process.exitCode = 1; });