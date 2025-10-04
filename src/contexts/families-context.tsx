
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Family } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface FamiliesContextType {
  families: Family[];
  isLoading: boolean;
  addFamily: (family: Omit<Family, 'id'>) => Promise<string | undefined>;
  updateFamily: (familyId: string, updatedFamily: Partial<Omit<Family, 'id'>>) => Promise<void>;
  deleteFamily: (familyId: string) => Promise<void>;
}

const FamiliesContext = createContext<FamiliesContextType | undefined>(undefined);

export const FamiliesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const familiesQuery = useMemoFirebase(() => {
      if (isUserLoading || !user) return null;
      return query(collection(firestore, 'families'));
  }, [firestore, user, isUserLoading]);

  const { data: families, isLoading } = useCollection<Family>(familiesQuery);
  
  const addFamily = async (familyData: Omit<Family, 'id'>) => {
    if (!firestore || !user) return;
    const familiesCollection = collection(firestore, 'families');
    try {
        const docRef = await addDoc(familiesCollection, familyData);
        return docRef?.id;
    } catch (error) {
        console.error("Error adding family: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: familiesCollection.path, operation: 'create', requestResourceData: familyData }));
        return undefined;
    }
  };

  const updateFamily = async (familyId: string, updatedFamilyData: Partial<Omit<Family, 'id'>>) => {
    if (!firestore || !user) return;
    const familyDoc = doc(firestore, 'families', familyId);
    try {
        await updateDoc(familyDoc, updatedFamilyData);
    } catch(error) {
        console.error("Error updating family: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: familyDoc.path, operation: 'update', requestResourceData: updatedFamilyData }));
    }
  };

  const deleteFamily = async (familyId: string) => {
    if (!firestore || !user) return;
    const familyDoc = doc(firestore, 'families', familyId);
    try {
        await deleteDoc(familyDoc);
    } catch (error) {
        console.error("Error deleting family: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: familyDoc.path, operation: 'delete' }));
    }
  }

  const contextValue = {
    families: families || [],
    isLoading: isLoading || isUserLoading,
    addFamily,
    updateFamily,
    deleteFamily,
  };

  return (
    <FamiliesContext.Provider value={contextValue}>
      {children}
    </FamiliesContext.Provider>
  );
};

export const useFamilies = (): FamiliesContextType => {
  const context = useContext(FamiliesContext);
  if (context === undefined) {
    throw new Error('useFamilies must be used within a FamiliesProvider');
  }
  return context;
};
