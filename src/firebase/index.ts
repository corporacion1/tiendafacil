
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
// This function ensures that Firebase is initialized only once.
export function initializeFirebase() {
  const appName = 'default';
  if (getApps().length) {
    const app = getApp(appName);
    return getSdks(app);
  }
  const firebaseApp = initializeApp(firebaseConfig, appName);
  return getSdks(firebaseApp);
}

// Helper to get all the SDKs in one place
function getSdks(firebaseApp: FirebaseApp) {
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
