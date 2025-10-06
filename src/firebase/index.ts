
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const appName = 'default';
  // Avoid re-initializing the app on every render.
  if (getApps().length > 0) {
      const app = getApp(appName);
      return getSdks(app);
  }
  const firebaseApp = initializeApp(firebaseConfig, appName);
  return getSdks(firebaseApp);
}

// Helper to get all the SDKs in one place
export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

// Export all the hooks and providers from the centralized provider file
export * from './provider';
export * from './client-provider';
export * from './errors';
export * from './error-emitter';
