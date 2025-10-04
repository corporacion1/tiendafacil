
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Family } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, where, query } from 'firebase/firestore';

interface FamiliesContextType {
  families: Family[];
  isLoading: boolean;
  addFamily: (family: Omit<Family, 'id' | 'storeId'>) => Promise<string | undefined>;
  updateFamily: (familyId: string, updatedFamily: Partial<Family>) => Promise<void>;
  deleteFamily: (familyId: string) => Promise<void>;
}

const FamiliesContext = createContext<FamiliesContextType | undefined>(undefined);

export const FamiliesProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const storeId = "test-store"; // Placeholder

  const familiesQuery = useMemoFirebase(() => {
      if (!firestore || !user || isUserLoading || !storeId) return null;
      return query(collection(firestore, 'families'), where("storeId", "==", storeId));
  }, [firestore, user, isUserLoading, storeId]);

  const { data: families, isLoading } = useCollection<Family>(familiesQuery);
  
  const addFamily = async (familyData: Omit<Family, 'id' | 'storeId'>) => {
    if (!firestore || !storeId) return;
    const familiesCollection = collection(firestore, 'families');
    const docRef = await addDoc(familiesCollection, { ...familyData, storeId });
    return docRef?.id;
  };

  const updateFamily = async (familyId: string, updatedFamilyData: Partial<Family>) => {
    if (!firestore || !storeId) return;
    const familyDoc = doc(firestore, 'families', familyId);
    await updateDoc(familyDoc, updatedFamilyData);
  };

  const deleteFamily = async (familyId: string) => {
    if (!firestore || !storeId) return;
    const familyDoc = doc(firestore, 'families', familyId);
    await deleteDoc(familyDoc);
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
