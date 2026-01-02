'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CancelDeliveryDialogProps {
  open: boolean;
  onClose: () => void;
  onCancel: (reason: string) => void;
  loading?: boolean;
}

export const CancelDeliveryDialog = ({
  open,
  onClose,
  onCancel,
  loading = false
}: CancelDeliveryDialogProps) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      return;
    }

    onCancel(reason);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Cancelar Reparto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            ¿Estás seguro que deseas cancelar este reparto? Por favor proporciona el motivo de la cancelación.
          </div>

          <div>
            <Label htmlFor="reason">Motivo de cancelación *</Label>
            <Textarea
              id="reason"
              placeholder="Describe el motivo de la cancelación..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Volver
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={!reason.trim() || loading}
            >
              {loading ? 'Cancelando...' : 'Cancelar Reparto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
