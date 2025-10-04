
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // Always initialize with the explicit config to ensure consistency across all environments and prevent stale instances.
  const appName = 'default';
  try {
      return getSdks(getApp(appName));
  } catch (e) {
      const firebaseApp = initializeApp(firebaseConfig, appName);
      return getSdks(firebaseApp);
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
