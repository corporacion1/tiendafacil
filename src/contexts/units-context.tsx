
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Unit } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';

interface UnitsContextType {
  units: Unit[];
  isLoading: boolean;
  addUnit: (unit: Omit<Unit, 'id'>) => Promise<string | undefined>;
  updateUnit: (unitId: string, updatedUnit: Partial<Omit<Unit, 'id'>>) => Promise<void>;
  deleteUnit: (unitId: string) => Promise<void>;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export const UnitsProvider = ({ children }: { children: React.ReactNode }) => {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const unitsQuery = useMemoFirebase(() => {
      if (!firestore || isUserLoading || !user) return null;
      return query(collection(firestore, 'units'));
  }, [firestore, user, isUserLoading]);

  const { data: units, isLoading } = useCollection<Unit>(unitsQuery);

  const addUnit = async (unitData: Omit<Unit, 'id'>) => {
    if (!firestore || !user) return;
    const unitsCollection = collection(firestore, 'units');
    const docRef = await addDoc(unitsCollection, unitData);
    return docRef?.id;
  };

  const updateUnit = async (unitId: string, updatedUnitData: Partial<Omit<Unit, 'id'>>) => {
    if (!firestore || !user) return;
    const unitDoc = doc(firestore, 'units', unitId);
    await updateDoc(unitDoc, updatedUnitData);
  };

  const deleteUnit = async (unitId: string) => {
    if (!firestore || !user) return;
    const unitDoc = doc(firestore, 'units', unitId);
    await deleteDoc(unitDoc);
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
