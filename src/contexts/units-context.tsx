
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Unit } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';

interface UnitsContextType {
  units: Unit[];
  isLoading: boolean;
  addUnit: (unit: Omit<Unit, 'id'>) => Promise<string | void>;
  updateUnit: (unitId: string, updatedUnit: Partial<Unit>) => Promise<void>;
  deleteUnit: (unitId: string) => Promise<void>;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export const UnitsProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const unitsQuery = useMemoFirebase(() => {
      if (!firestore || !user || isUserLoading) return null;
      return collection(firestore, 'units');
  }, [firestore, user, isUserLoading]);

  const { data: units, isLoading } = useCollection<Unit>(unitsQuery);

  const addUnit = async (unitData: Omit<Unit, 'id'>) => {
    if (!firestore) return;
    const unitsCollection = collection(firestore, 'units');
    const docRef = await addDocumentNonBlocking(unitsCollection, unitData);
    return docRef?.id;
  };

  const updateUnit = async (unitId: string, updatedUnitData: Partial<Unit>) => {
    if (!firestore) return;
    const unitDoc = doc(firestore, 'units', unitId);
    await updateDocumentNonBlocking(unitDoc, updatedUnitData);
  };

  const deleteUnit = async (unitId: string) => {
    if (!firestore) return;
    const unitDoc = doc(firestore, 'units', unitId);
    await deleteDocumentNonBlocking(unitDoc);
  }

  const contextValue = {
    units: units || [],
    isLoading: isLoading || isUserLoading,
    addUnit,
    updateUnit,
    deleteUnit,
  };

  return (
    <UnitsContext.Provider value={contextValue}>
      {children}
    </UnitsContext.Provider>
  );
};

export const useUnits = (): UnitsContextType => {
  const context = useContext(UnitsContext);
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
};

    