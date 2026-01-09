"use client";
import { useEffect, useState } from 'react';
import type { CartItem } from '@/lib/types';

export type SavedCartOperation = {
  id: string;
  name: string;
  items: CartItem[];
  total: number;
  date: string;
  storeId: string;
  userId?: string;
  status: 'active' | 'archived';
};

const STORAGE_KEY = 'TIENDA_FACIL_SAVED_CARTS_V1';
const MAX_SAVED = 20;
const CLEANUP_DAYS = 30;

export function useSavedCartOperations(storeId: string, userId?: string) {
  const [operations, setOperations] = useState<SavedCartOperation[]>([]);

  useEffect(() => { load(); }, [storeId, userId]);

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const all: SavedCartOperation[] = raw ? JSON.parse(raw) : [];
      const byStore = all.filter(o => o.storeId === storeId);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - CLEANUP_DAYS);
      const recent = byStore.filter(o => new Date(o.date) >= cutoff);
      const filtered = userId ? recent.filter(o => o.userId === userId) : recent;
      setOperations(filtered);
    } catch {
      setOperations([]);
    }
  };

  useEffect(() => { load(); }, [storeId, userId]);

  const saveCurrentCart = (name: string, items: CartItem[], total: number) => {
    const existingRaw = localStorage.getItem(STORAGE_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as SavedCartOperation[]) : [];
    const op: SavedCartOperation = {
      id: (crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)),
      name,
      items,
      total,
      date: new Date().toISOString(),
      storeId,
      userId,
      status: 'active'
    };
    const updated = [op, ...existing].slice(0, MAX_SAVED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    load();
  };

  const restoreSaved = (id: string, setCart: (items: CartItem[]) => void, setTotal: (n: number) => void) => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedCartOperation[];
      const op = all.find(o => o.id === id);
      if (op) {
        setCart(op.items);
        setTotal(op.total);
      }
    } catch { /* ignore */ }
  };

  const deleteSaved = (id: string) => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedCartOperation[];
      const next = all.filter(o => o.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      load();
    } catch { /* ignore */ }
  };

  const archiveSaved = (id: string) => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedCartOperation[];
      const next = all.map(o => o.id === id ? { ...o, status: 'archived' } : o);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      load();
    } catch { /* ignore */ }
  };

  const cleanupOld = () => {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as SavedCartOperation[];
      const sorted = all.sort((a,b)=> new Date(a.date).getTime() - new Date(b.date).getTime());
      const trimmed = sorted.slice(-MAX_SAVED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      load();
    } catch { /* ignore */ }
  };

  return {
    operations,
    load,
    saveCurrentCart,
    restoreSaved,
    deleteSaved,
    archiveSaved,
    cleanupOld,
  };
}

export default useSavedCartOperations;
