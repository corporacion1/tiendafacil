
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  const appName = 'default';
  if (getApps().length > 0) {
      const app = getApp(appName);
      return getSdks(app);
  }
  const firebaseApp = initializeApp(firebaseConfig, appName);
  return getSdks(firebaseApp);
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
export * from './errors';
export * from './error-emitter';
