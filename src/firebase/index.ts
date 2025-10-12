
'use client';

// This file is no longer used for Firebase initialization.
// The app now uses local mock data.
// Exports are kept to prevent breaking imports, but they are effectively dummies.

const mockAuth = {};
const mockFirestore = {};
const mockFirebaseApp = {};

export function initializeFirebase() {
  return {
    firebaseApp: mockFirebaseApp,
    auth: mockAuth,
    firestore: mockFirestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
