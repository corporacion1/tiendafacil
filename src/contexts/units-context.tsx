
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import type { Unit } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
      if (isUserLoading || !user) return null;
      return query(collection(firestore, 'units'));
  }, [firestore, user, isUserLoading]);

  const { data: units, isLoading } = useCollection<Unit>(unitsQuery);

  const addUnit = async (unitData: Omit<Unit, 'id'>) => {
    if (!firestore || !user) return;
    const unitsCollection = collection(firestore, 'units');
    try {
        const docRef = await addDoc(unitsCollection, unitData);
        return docRef?.id;
    } catch(error) {
        console.error("Error adding unit: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: unitsCollection.path, operation: 'create', requestResourceData: unitData }));
        return undefined;
    }
  };

  const updateUnit = async (unitId: string, updatedUnitData: Partial<Omit<Unit, 'id'>>) => {
    if (!firestore || !user) return;
    const unitDoc = doc(firestore, 'units', unitId);
    try {
        await updateDoc(unitDoc, updatedUnitData);
    } catch (error) {
        console.error("Error updating unit: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: unitDoc.path, operation: 'update', requestResourceData: updatedUnitData }));
    }
  };

  const deleteUnit = async (unitId: string) => {
    if (!firestore || !user) return;
    const unitDoc = doc(firestore, 'units', unitId);
    try {
        await deleteDoc(unitDoc);
    } catch (error) {
        console.error("Error deleting unit: ", error);
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: unitDoc.path, operation: 'delete' }));
    }
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
