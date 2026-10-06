// Loads the real server initializer without displaying credentials or document data.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
process.env.NODE_ENV = 'development';
const filename = path.resolve(__dirname, '../lib/firebaseAdmin.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
let stage = 'initialize';
(async () => {
  try {
    loaded._compile(compiled, filename);
    const { db, auth } = loaded.exports.firebaseAdmin();
    stage = 'credentials';
    await auth.app.options.credential.getAccessToken();
    console.log('Firebase credentials: OK');
    stage = 'firestore-read';
    await db.collection('shadowing').limit(1).get();
    console.log('Firestore read: OK (document contents not displayed)');
    stage = 'custom-token-signing';
    await auth.createCustomToken('firebase-credential-diagnostic');
    console.log('Custom token signing: OK (token discarded; no user created)');
  } catch (error) {
    const code = String(error.code || 'unknown');
    console.error('Firebase check failed:', stage, /^[a-zA-Z0-9/_-]+$/.test(code) ? code : 'unknown');
    console.error('No secrets or raw error payloads have been printed.');
    process.exitCode = 1;
  } finally {
    await Promise.all(require('firebase-admin/app').getApps().map(app => app.delete()));
  }
})();