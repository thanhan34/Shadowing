const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function practiceUrlForId(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^#?(\d+)\s*(?:RS)?$/i);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number > 0
    ? `https://www.apeuni.com/practice/repeat_sentences/${number}`
    : null;
}

function planUpdates(docs) {
  const updates = [], unchanged = [], invalid = [];
  for (const snapshot of docs) {
    const data = snapshot.data();
    const practiceUrl = practiceUrlForId(data.ID);
    if (!practiceUrl) {
      invalid.push({ documentId: snapshot.id, ID: data.ID ?? null });
    } else if (data.practiceUrl === practiceUrl) {
      unchanged.push(snapshot.id);
    } else {
      updates.push({ snapshot, practiceUrl });
    }
  }
  return { updates, unchanged, invalid };
}

async function main() {
  const Module = require('node:module');
  const ts = require('typescript');
  // Reuse the project's credential resolution; never log service-account contents.
  process.env.NODE_ENV = 'development';
  const filename = path.resolve(__dirname, '../lib/firebaseAdmin.ts');
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
  try {
    const { db } = loaded.exports.firebaseAdmin();
    const project = require('firebase-admin/app').getApps().find(app => app.name === 'clerk-access').options.projectId;
    const snapshot = await db.collection('repeatsentence').get();
    const plan = planUpdates(snapshot.docs);
    console.log(JSON.stringify({
      mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
      project,
      collection: 'repeatsentence',
      total: snapshot.size,
      toUpdate: plan.updates.length,
      unchanged: plan.unchanged.length,
      invalid: plan.invalid,
      examples: plan.updates.slice(0, 5).map(({ snapshot: doc, practiceUrl }) => ({ ID: doc.data().ID, practiceUrl })),
    }, null, 2));
    if (!process.argv.includes('--apply')) return;
    if (plan.invalid.length) throw new Error('Invalid RS IDs found. Resolve them before applying any updates.');
    if (!plan.updates.length) return;

    const backup = path.join(os.tmpdir(), `rs-practice-links-backup-${Date.now()}.json`);
    fs.writeFileSync(backup, JSON.stringify({
      project,
      collection: 'repeatsentence',
      createdAt: new Date().toISOString(),
      documents: plan.updates.map(({ snapshot: doc, practiceUrl }) => ({
        documentId: doc.id,
        ID: doc.data().ID,
        hadPracticeUrl: Object.hasOwn(doc.data(), 'practiceUrl'),
        previousPracticeUrl: doc.data().practiceUrl ?? null,
        practiceUrl,
        updateTime: doc.updateTime.toDate().toISOString(),
      })),
    }, null, 2), { flag: 'wx' });
    console.log(`Backup written: ${backup}`);
    let updated = 0;
    for (let offset = 0; offset < plan.updates.length; offset += 400) {
      const batch = db.batch();
      const chunk = plan.updates.slice(offset, offset + 400);
      chunk.forEach(({ snapshot: doc, practiceUrl }) => {
        // Do not overwrite concurrent edits made after the initial read.
        batch.update(doc.ref, { practiceUrl }, { lastUpdateTime: doc.updateTime });
      });
      await batch.commit();
      updated += chunk.length;
      console.log(`Committed ${updated}/${plan.updates.length}`);
    }
    const verification = await db.collection('repeatsentence').get();
    const remaining = planUpdates(verification.docs);
    console.log(JSON.stringify({ verifiedTotal: verification.size, correctLinks: remaining.unchanged.length, remainingUpdates: remaining.updates.length, invalid: remaining.invalid }, null, 2));
    if (remaining.updates.length || remaining.invalid.length) throw new Error('Post-update verification failed. Rerun dry-run for details.');
  } finally {
    await Promise.all(require('firebase-admin/app').getApps().map(app => app.delete()));
  }
}

module.exports = { practiceUrlForId, planUpdates };
if (require.main === module) main().catch(error => {
  console.error('RS practice link update failed:', error.code || error.message);
  process.exitCode = 1;
});