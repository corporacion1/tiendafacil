
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  Unsubscribe,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useUser } from '../auth/use-user';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} memoizedTargetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>))  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const { isUserLoading } = useUser();
  const [data, setData] = useState<StateDataType>(null);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  
  const shouldFetch = !!memoizedTargetRefOrQuery && !isUserLoading;

  useEffect(() => {
    // If we shouldn't fetch, clear any existing data and unsubscribe.
    if (!shouldFetch) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setData(null);
      setError(null);
      return;
    }

    // New query is valid, set up the listener.
    setError(null);
    
    // Unsubscribe from the previous listener if it exists.
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null); // Clear previous errors on successful fetch
      },
      (err: FirestoreError) => {
        let path = 'desconocido';
        if ('path' in memoizedTargetRefOrQuery) {
            path = (memoizedTargetRefOrQuery as CollectionReference).path;
        } else {
            path = `Query on collection: ${(memoizedTargetRefOrQuery as any)._query?.path?.segments?.join('/') || ''}`;
        }
        
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: path,
        })

        setError(contextualError)
        setData(null)

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    // Main cleanup function when the component unmounts
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [memoizedTargetRefOrQuery, isUserLoading]);

  const isLoading = (shouldFetch && data === null && error === null) || isUserLoading;

  return { data, isLoading, error };
}

