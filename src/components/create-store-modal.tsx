"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus } from "lucide-react"
import { businessCategories } from "@/lib/data"

import type { Store } from "@/lib/types";

interface CreateStoreModalProps {
  onStoreCreated?: (store: Store) => void
}

export function CreateStoreModal({ onStoreCreated }: CreateStoreModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    businessType: '',
    ownerUid: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.ownerUid.trim()) {
      toast({
        variant: "destructive",
        title: "Campos requeridos",
        description: "El nombre de la tienda y UID del propietario son obligatorios"
      })
      return
    }
    
    try {
      setLoading(true)
      
      const response = await fetch('/api/stores/create-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al crear la tienda')
      }
      
      toast({
        title: "¡Tienda creada!",
        description: `${result.store.name} (${result.store.storeId}) ha sido creada y sembrada exitosamente`,
        duration: 5000
      })
      
      // Resetear formulario
      setFormData({
        name: '',
        businessType: '',
        ownerUid: ''
      })
      
      onStoreCreated?.(result.store)
      setOpen(false)
      
    } catch (error) {
      console.error('Error creating store:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la tienda"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tienda
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto invisible-scroll mx-auto my-4">
        <DialogHeader>
          <DialogTitle>Crear Nueva Tienda</DialogTitle>
          <DialogDescription>
            Crea una nueva tienda con datos demo. Se generará automáticamente un StoreID único.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Tienda *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Mi Nueva Tienda"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessType">Tipo de Negocio</Label>
            <Select
              value={formData.businessType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de negocio" />
              </SelectTrigger>
              <SelectContent>
                {businessCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ownerUid">UID del Propietario *</Label>
            <Input
              id="ownerUid"
              value={formData.ownerUid}
              onChange={(e) => setFormData(prev => ({ ...prev, ownerUid: e.target.value }))}
              placeholder="user_1234567890_abc123def"
              required
            />
            <p className="text-xs text-muted-foreground">
              UID del usuario que será el administrador de esta tienda
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Tienda
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}