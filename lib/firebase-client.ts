'use client';

import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { browserLocalPersistence, getAuth, onAuthStateChanged, setPersistence, type Auth, type User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDVgLJbzVx5wg1xSlYYORK0_nRGSiWMKNI',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ceiscaramulo-db2a2.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'ceiscaramulo-db2a2',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ceiscaramulo-db2a2.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '436329467350',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:436329467350:web:0b192f867458e5916b2877',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-F2PN1PJ3WR',
};

let authSingleton: Auth | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;
export const FIREBASE_AUTH_STATE_TIMEOUT_MS = 2500;

export function getFirebaseClientApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
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
