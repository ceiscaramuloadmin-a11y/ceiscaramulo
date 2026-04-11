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
  it('returns the current Firebase user immediately when already available', async () => {
    const currentUser = { uid: 'ready-user' };
    getAuth.mockReturnValueOnce({ currentUser });

    const { getFirebaseCurrentUser } = await import('@/lib/firebase-client');

    await expect(getFirebaseCurrentUser()).resolves.toBe(currentUser);
    expect(onAuthStateChanged).not.toHaveBeenCalled();
  });

  it('falls back to null if Firebase auth state never resolves', async () => {
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
