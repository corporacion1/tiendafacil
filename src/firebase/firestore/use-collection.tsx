
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
  
  const shouldFetch = !!memoizedTargetRefOrQuery && !isUserLoading;

  useEffect(() => {
    // This effect handles resetting the state when the query becomes invalid.
    if (!shouldFetch) {
      setData(null);
      setError(null);
    }
  }, [shouldFetch]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    
    if (shouldFetch) {
      setError(null); // Reset error on new subscription attempt.
      
      unsubscribe = onSnapshot(
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
    }

    // The main cleanup function. It is called on unmount or when dependencies change.
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [memoizedTargetRefOrQuery, isUserLoading]); // Reruns only if the query or user loading state changes.

  const isLoading = (shouldFetch && data === null && error === null) || isUserLoading;

  return { data, isLoading, error };
}
