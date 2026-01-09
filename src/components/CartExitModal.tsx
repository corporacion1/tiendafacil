"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';

type CartExitModalProps = {
  open: boolean;
  cartSize: number;
  total: number;
  onClose: () => void;
  onSaveAndExit: () => void;
  onExit: () => void;
};

export function CartExitModal({ open, onClose, onSaveAndExit, onExit, cartSize, total }: CartExitModalProps) {
  return (
    <Dialog open={open} onOpenChange={(_v) => { if (!_v) onClose(); }}>
      <DialogContent className="sm:max-w-md p-4">
        <DialogHeader>
          <DialogTitle>Guardar/Salir</DialogTitle>
          <DialogDescription>
            Tienes {cartSize} productos en el carrito por un total de ${total.toFixed(2)}.
            ¿Qué acción deseas hacer antes de salir?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button variant="outline" onClick={onSaveAndExit}>
            <Save className="mr-2 h-4 w-4" /> Guardar & Salir
          </Button>
          <Button variant="outline" color="destructive" onClick={onExit}>
            <Trash2 className="mr-2 h-4 w-4" /> Salir
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
