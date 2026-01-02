'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeliveryFeeRules } from '@/hooks/useDeliveryFeeRules';
import { useSettings } from '@/contexts/settings-context';
import { FeeRuleForm } from '@/components/deliveries/fee-rule-form';
import { Calculator, Plus, Pencil, Trash2, Clock, DollarSign, MapPin } from 'lucide-react';
import type { DeliveryFeeRule } from '@/lib/types';

export default function FeeRulesPage() {
  const { activeStoreId } = useSettings();
  const { rules, loading, createRule, updateRule, deleteRule } = useDeliveryFeeRules(activeStoreId || '');
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<DeliveryFeeRule | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const getFeeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fixed: 'Fija',
      by_zone: 'Por Zona',
      by_distance: 'Por Distancia',
      combination: 'Combinada',
    };
    return labels[type] || type;
  };

  const handleEdit = (rule: DeliveryFeeRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setRuleToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteRule(ruleToDelete);
      setShowDeleteDialog(false);
      setRuleToDelete(null);
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reglas de Tarifa</h1>
          <p className="text-muted-foreground">Configura las reglas de cálculo de tarifas de delivery</p>
        </div>
        <Button onClick={() => {
          setEditingRule(null);
          setShowForm(true);
        }}>
          <Plus className="mr-2 h-4" />
          Nueva Regla
        </Button>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calculator className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No hay reglas de tarifa configuradas
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingRule(null);
                setShowForm(true);
              }}
              className="mt-4"
            >
              <Plus className="mr-2 h-4" />
              Crear primera regla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rules.map((rule: DeliveryFeeRule) => (
            <Card key={rule.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <Badge variant={rule.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                      {rule.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClick(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rule.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {rule.description}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calculator className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{getFeeTypeLabel(rule.feeType)}</span>
                  </div>
                  {rule.fixedFeeAmount && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>${rule.fixedFeeAmount.toFixed(2)} fijo</span>
                    </div>
                  )}
                  {rule.distanceBaseFee && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span>${rule.distanceBaseFee.toFixed(2)} + ${rule.perKmFee?.toFixed(2)}/km</span>
                    </div>
                  )}
                  {rule.minimumOrderAmount && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>Mínimo: ${rule.minimumOrderAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {rule.freeDeliveryThreshold && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>Gratis desde: ${rule.freeDeliveryThreshold.toFixed(2)}</span>
                    </div>
                  )}
                  {rule.isPeakHours && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        Peak: {rule.peakHoursStart} - {rule.peakHoursEnd} (x{rule.peakHoursMultiplier})
                      </span>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Prioridad: {rule.priority}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FeeRuleForm
        open={showForm}
        onClose={() => setShowForm(false)}
        rule={editingRule}
        onSave={() => setShowForm(false)}
      />

      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Eliminar Regla</h3>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Estás seguro que deseas eliminar esta regla de tarifa?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowDeleteDialog(false);
                setRuleToDelete(null);
              }}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
