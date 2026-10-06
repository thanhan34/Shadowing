const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const compile = file => ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const policy = { exports: {} };
vm.runInNewContext(compile('lib/access.ts'), policy);
let metadata = {};
let signedIn = true;
let unavailable = false;
const response = (kind, destination) => ({ kind, destination, headers: new Map() });
class NextResponse {
  constructor() { this.kind = 'error'; }
  static next() { return response('next'); }
  static redirect(url) { return response('redirect', url.pathname); }
  static json(body, options) { return { kind: 'json', status: options.status }; }
}
const context = { exports: {}, URL, require(name) {
  if (name === './lib/access') return policy.exports;
  if (name === 'next/server') return { NextResponse };
  if (name === '@clerk/nextjs/server') return {
    clerkMiddleware: handler => handler,
    clerkClient: async () => ({ users: { getUser: async () => {
      if (unavailable) throw new Error('offline');
      return { privateMetadata: metadata };
    } } }),
  };
  throw new Error('Unexpected module');
} };
vm.runInNewContext(compile('middleware.ts'), context);
async function run(pathname) {
  return context.exports.default(async () => ({ userId: signedIn ? 'test' : null }), {
    nextUrl: { pathname }, url: `https://example.test${pathname}`,
  });
}
(async () => {
  for (const approvalStatus of ['pending', 'revoked']) {
    metadata = { approvalStatus };
    assert.equal((await run('/pending-approval')).kind, 'next');
  }
  metadata = { approvalStatus: 'approved' };
  const approved = await run('/pending-approval');
  assert.equal(approved.destination, '/shadow');
  assert.equal(approved.headers.get('Cache-Control'), 'private, no-store');
  assert.equal((await run('/shadow')).kind, 'next');
  assert.equal((await run('/admin/students')).destination, '/shadow');
  assert.equal((await run('/api/admin/students')).status, 403);
  metadata = { role: 'admin' };
  assert.equal((await run('/pending-approval')).destination, '/admin/students');
  assert.equal((await run('/admin/students')).kind, 'next');
  metadata = { role: 'support' };
  assert.equal((await run('/pending-approval')).destination, '/admin/students');
  assert.equal((await run('/admin/students')).kind, 'next');
  assert.equal((await run('/api/admin/students')).kind, 'next');
  assert.equal((await run('/EditAudioSamplePage')).kind, 'next');
  unavailable = true;
  assert.equal((await run('/pending-approval')).kind, 'error');
  unavailable = false;
  signedIn = false;
  assert.equal((await run('/pending-approval')).destination, '/sign-in');
  console.log('Pending redirects: approved, pending, revoked, admin, anonymous and failure cases passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });