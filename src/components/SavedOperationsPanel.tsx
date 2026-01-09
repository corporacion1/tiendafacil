"use client";
import React from 'react';

export type SavedCartItem = {
  id: string;
  name: string;
  itemsCount: number;
  total: number;
  date: string;
  storeId: string;
};

type SavedOperationsPanelProps = {
  open: boolean;
  onClose: () => void;
  items: SavedCartItem[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
};

export function SavedOperationsPanel({ open, onClose, items, onRestore, onDelete }: SavedOperationsPanelProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <strong>Operaciones Guardadas</strong>
          <button onClick={onClose} aria-label="Cerrar panel">✕</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 && <div className="text-sm text-muted-foreground">No hay operaciones guardadas.</div>}
          {items.map((op) => (
            <div key={op.id} className="flex items-center justify-between p-2 border rounded mb-2">
              <div className="flex-1 mr-2">
                <div className="text-sm font-medium truncate">{op.name}</div>
                <div className="text-xs text-muted-foreground">{op.date} • {op.storeId}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-1 rounded" onClick={() => onRestore(op.id)} title="Restaurar">🔄</button>
                <button className="p-1 rounded text-destructive" onClick={() => onDelete(op.id)} title="Eliminar">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
