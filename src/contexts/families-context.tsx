
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Family } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface FamiliesContextType {
  families: Family[];
  isLoading: boolean;
  addFamily: (family: Omit<Family, 'id' | 'storeId'>) => Promise<string | undefined>;
  updateFamily: (familyId: string, updatedFamily: Partial<Omit<Family, 'id'>>) => Promise<void>;
  deleteFamily: (familyId: string) => Promise<void>;
}

const FamiliesContext = createContext<FamiliesContextType | undefined>(undefined);

export const FamiliesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const storeId = "test-store"; // This should come from user session or a higher-level context

  const familiesQuery = useMemoFirebase(() => {
      if (isUserLoading || !user || !firestore) return null;
      return query(collection(firestore, 'families'), where('storeId', '==', storeId));
  }, [firestore, user, isUserLoading, storeId]);

  const { data: familiesData, isLoading: familiesLoading } = useCollection<Family>(familiesQuery);
  const families = useMemo(() => familiesData || [], [familiesData]);
  const isLoading = isUserLoading || familiesLoading;
  
  const addFamily = async (familyData: Omit<Family, 'id' | 'storeId'>) => {
    if (!firestore || !user) return;
    const familiesCollection = collection(firestore, 'families');
    const dataToSave = { ...familyData, storeId, userId: user.uid };
    try {
        const docRef = await addDoc(familiesCollection, dataToSave);
        return docRef?.id;
    } catch (error) {
        console.error("Error adding family: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: familiesCollection.path, operation: 'create', requestResourceData: dataToSave }));
        return undefined;
    }
  };

  const updateFamily = async (familyId: string, updatedFamilyData: Partial<Omit<Family, 'id'>>) => {
    if (!firestore || !user) return;
    const familyDoc = doc(firestore, 'families', familyId);
    const dataToSave = { ...updatedFamilyData, storeId };
    try {
        await updateDoc(familyDoc, dataToSave);
    } catch(error) {
        console.error("Error updating family: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: familyDoc.path, operation: 'update', requestResourceData: dataToSave }));
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
    families: families,
    isLoading,
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
