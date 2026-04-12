'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, type Auth, type User } from 'firebase/auth';

let authSingleton: Auth | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;
export const FIREBASE_AUTH_STATE_TIMEOUT_MS = 2500;

function getFirebaseClientConfig() {
  return {
    apiKey: process.env.FIREBASE_API_KEY?.trim() || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN?.trim() || '',
    projectId: process.env.FIREBASE_PROJECT_ID?.trim() || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim() || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
    appId: process.env.FIREBASE_APP_ID?.trim() || '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID?.trim() || '',
  };
}

export function getFirebaseClientConfigError() {
  const config = getFirebaseClientConfig();
  const missing = Object.entries(config)
    .filter(([key, value]) => key !== 'measurementId' && !value)
    .map(([key]) => key);

  if (missing.length === 0) {
    return null;
  }

  return `Firebase client config incompleta. Defina: ${missing.join(', ')}.`;
}

export function getFirebaseClientApp(): FirebaseApp {
  const configError = getFirebaseClientConfigError();

  if (configError) {
    throw new Error(configError);
  }

  return getApps().length > 0 ? getApp() : initializeApp(getFirebaseClientConfig());
}

export function getFirebaseClientAuth() {
  if (authSingleton) {
    return authSingleton;
  }

  authSingleton = getAuth(getFirebaseClientApp());
  void setPersistence(authSingleton, browserLocalPersistence).catch(() => undefined);
  return authSingleton;
}

export async function getFirebaseCurrentUser(): Promise<User | null> {
  const auth = getFirebaseClientAuth();

  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const finish = (user: User | null) => {
      if (settled) {
        return;
      }

      settled = true;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      unsubscribe();
      resolve(user);
    };

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        finish(user);
      },
      () => {
        finish(null);
      }
    );

    // Prevent the backoffice from waiting forever if Firebase never resolves auth state.
    timeoutId = setTimeout(() => finish(null), FIREBASE_AUTH_STATE_TIMEOUT_MS);
  });
}

export async function initializeFirebaseAnalytics() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (getFirebaseClientConfigError()) {
    return null;
  }

  if (analyticsPromise) {
    return analyticsPromise;
  }

  analyticsPromise = (async () => {
    if (!(await isSupported())) {
      return null;
    }

    return getAnalytics(getFirebaseClientApp());
  })();

  return analyticsPromise;
}
