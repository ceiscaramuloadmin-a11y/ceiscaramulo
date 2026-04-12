/* @vitest-environment node */

import { afterEach, describe, expect, it, vi } from 'vitest';

const initializeApp = vi.fn(() => ({ name: 'mock-app' }));
const getApp = vi.fn(() => ({ name: 'existing-app' }));
const getApps = vi.fn(() => []);
const getAuth = vi.fn(() => ({ currentUser: null }));
const setPersistence = vi.fn(() => Promise.resolve());
const onAuthStateChanged = vi.fn();

vi.mock('firebase/app', () => ({
  initializeApp,
  getApp,
  getApps,
}));

vi.mock('firebase/auth', () => ({
  browserLocalPersistence: 'local',
  getAuth,
  onAuthStateChanged,
  setPersistence,
}));

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn(async () => false),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.useRealTimers();
});

describe('firebase client auth state handling', () => {
  const ensureFirebaseEnv = () => {
    process.env.FIREBASE_API_KEY = 'test-api-key';
    process.env.FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.FIREBASE_MESSAGING_SENDER_ID = '123456';
    process.env.FIREBASE_APP_ID = 'test-app-id';
  };

  it('reports missing Firebase public configuration instead of falling back to a hardcoded key', async () => {
    const previousApiKey = process.env.FIREBASE_API_KEY;
    const previousAuthDomain = process.env.FIREBASE_AUTH_DOMAIN;
    const previousProjectId = process.env.FIREBASE_PROJECT_ID;
    const previousStorageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    const previousMessagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;
    const previousAppId = process.env.FIREBASE_APP_ID;

    delete process.env.FIREBASE_API_KEY;
    delete process.env.FIREBASE_AUTH_DOMAIN;
    delete process.env.FIREBASE_PROJECT_ID;
    delete process.env.FIREBASE_STORAGE_BUCKET;
    delete process.env.FIREBASE_MESSAGING_SENDER_ID;
    delete process.env.FIREBASE_APP_ID;

    const { getFirebaseClientConfigError } = await import('@/lib/firebase-client');

    expect(getFirebaseClientConfigError()).toContain('Firebase client config incompleta.');
    expect(getFirebaseClientConfigError()).toContain('apiKey');

    if (previousApiKey === undefined) delete process.env.FIREBASE_API_KEY;
    else process.env.FIREBASE_API_KEY = previousApiKey;
    if (previousAuthDomain === undefined) delete process.env.FIREBASE_AUTH_DOMAIN;
    else process.env.FIREBASE_AUTH_DOMAIN = previousAuthDomain;
    if (previousProjectId === undefined) delete process.env.FIREBASE_PROJECT_ID;
    else process.env.FIREBASE_PROJECT_ID = previousProjectId;
    if (previousStorageBucket === undefined) delete process.env.FIREBASE_STORAGE_BUCKET;
    else process.env.FIREBASE_STORAGE_BUCKET = previousStorageBucket;
    if (previousMessagingSenderId === undefined) delete process.env.FIREBASE_MESSAGING_SENDER_ID;
    else process.env.FIREBASE_MESSAGING_SENDER_ID = previousMessagingSenderId;
    if (previousAppId === undefined) delete process.env.FIREBASE_APP_ID;
    else process.env.FIREBASE_APP_ID = previousAppId;
  });

  it('returns the current Firebase user immediately when already available', async () => {
    ensureFirebaseEnv();
    const currentUser = { uid: 'ready-user' };
    getAuth.mockReturnValueOnce({ currentUser });

    const { getFirebaseCurrentUser } = await import('@/lib/firebase-client');

    await expect(getFirebaseCurrentUser()).resolves.toBe(currentUser);
    expect(onAuthStateChanged).not.toHaveBeenCalled();
  });

  it('falls back to null if Firebase auth state never resolves', async () => {
    ensureFirebaseEnv();
    vi.useFakeTimers();

    let unsubscribeCalls = 0;
    getAuth.mockReturnValueOnce({ currentUser: null });
    onAuthStateChanged.mockImplementationOnce(() => () => {
      unsubscribeCalls += 1;
    });

    const { FIREBASE_AUTH_STATE_TIMEOUT_MS, getFirebaseCurrentUser } = await import('@/lib/firebase-client');

    const pendingUser = getFirebaseCurrentUser();
    await vi.advanceTimersByTimeAsync(FIREBASE_AUTH_STATE_TIMEOUT_MS + 10);

    await expect(pendingUser).resolves.toBeNull();
    expect(unsubscribeCalls).toBe(1);
  });
});
