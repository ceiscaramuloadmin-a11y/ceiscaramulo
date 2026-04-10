import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

type FirebaseServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function normalizePrivateKey(value: string) {
  return value.replace(/\\n/g, '\n');
}

function getFirebaseServiceAccount(): FirebaseServiceAccount {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();

  if (rawJson) {
    const parsed = JSON.parse(rawJson) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON está incompleto.');
    }

    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: normalizePrivateKey(parsed.private_key),
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim() || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim() || '';
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim() || '';

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Defina FIREBASE_SERVICE_ACCOUNT_JSON ou FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.'
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: normalizePrivateKey(privateKey),
  };
}

export function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccount = getFirebaseServiceAccount();

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKey: serviceAccount.privateKey,
    }),
    projectId: serviceAccount.projectId,
  });
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}
