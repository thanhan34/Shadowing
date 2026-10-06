import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function adminCredential() {
  const { FIREBASE_ADMIN_PROJECT_ID: projectId, FIREBASE_ADMIN_CLIENT_EMAIL: clientEmail,
    FIREBASE_ADMIN_PRIVATE_KEY: privateKey } = process.env;
  if (privateKey || clientEmail) {
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin: configure all three FIREBASE_ADMIN_* credential variables, or remove the incomplete email/private-key settings to use a credential file.');
    }
    return cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') });
  }
  // Explicit ADC configuration takes priority, including workload identity credentials.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return applicationDefault();
  const localFile = resolve(process.cwd(), 'serviceAccountKey.json');
  // Never implicitly load a developer's key in production or bundle its contents.
  if (process.env.NODE_ENV === 'development' && existsSync(localFile)) return cert(localFile);
  return applicationDefault();
}

export function firebaseAdmin() {
  const app = getApps().find(app => app.name === 'clerk-access') || initializeApp({
    credential: adminCredential(),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || 'pteshadowing',
  }, 'clerk-access');
  return { auth: getAuth(app), db: getFirestore(app), messaging: getMessaging(app) };
}