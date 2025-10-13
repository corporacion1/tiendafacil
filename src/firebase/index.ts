
"use client";

import { useMemo } from 'react';
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

import { firebaseConfig } from './config';
import { useUser } from './auth/use-user';
import { useCollection, WithId } from './firestore/use-collection';
import { CollectionReference, DocumentReference, Query, doc, collection } from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

if (getApps().length) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

auth = getAuth(app);
firestore = getFirestore(app);

const useAuth = () => auth;
const useFirestore = () => firestore;
const useFirebaseApp = () => app;

function useMemoFirebase<T extends DocumentReference | CollectionReference | Query>(
  factory: () => T | null,
  deps: React.DependencyList
): (T & {__memo: boolean}) | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const result = useMemo(factory, deps);
  if (result) {
    (result as any).__memo = true;
  }
  return result as (T & {__memo: boolean}) | null;
}

export {
  useUser,
  useCollection,
  useFirebaseApp,
  useFirestore,
  useAuth,
  useMemoFirebase,
  doc,
  collection
};

export type {
  FirebaseApp,
  Firestore,
  Auth,
  WithId,
  DocumentReference,
  CollectionReference
};
