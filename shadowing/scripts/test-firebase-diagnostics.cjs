const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../lib/firebaseDiagnostics.ts');
const loaded = new Module(filename, module);
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, filename);
const { firebaseDiagnostic, firebaseCredentialPresence } = loaded.exports;
const cases = [
  [new Error('Could not load the default credentials. SECRET'), 'ADC_NOT_AVAILABLE'],
  [new Error('invalid_grant: Invalid JWT Signature. SECRET'), 'CREDENTIAL_REJECTED'],
  [new Error('Invalid PEM private key SECRET'), 'PRIVATE_KEY_FORMAT'],
  [new Error('API has not been used or is disabled SECRET'), 'API_DISABLED'],
  [{ cause: { code: 7, message: 'SECRET' } }, 'PERMISSION_DENIED'],
  [{ code: 16 }, 'UNAUTHENTICATED'],
  [{ code: 5 }, 'RESOURCE_NOT_FOUND'],
  [{ code: 'ETIMEDOUT' }, 'NETWORK_OR_TIMEOUT'],
  [{ code: 'SECRET', message: 'SECRET' }, 'UNCLASSIFIED'],
  [null, 'UNCLASSIFIED'],
];
for (const [error, category] of cases) {
  const diagnostic = firebaseDiagnostic(error);
  assert.equal(diagnostic.category, category);
  assert.ok(!JSON.stringify(diagnostic).includes('SECRET'));
}
const circular = {}; circular.cause = circular;
assert.equal(firebaseDiagnostic(circular).category, 'UNCLASSIFIED');
assert.equal(firebaseDiagnostic({ cause: { code: 7 } }).code, '7');
assert.ok(Object.values(firebaseCredentialPresence()).every(value => typeof value === 'boolean'));
console.log('Firebase diagnostics: classification, nested causes, cycles and secret safety passed.');