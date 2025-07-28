// src/components/calendar/event-modal-deprecated.tsx
// NOTA: Este archivo está marcado como deprecated
// Los eventos de proyecto ahora se manejan con NewProjectEventModal
// Solo se mantiene para compatibilidad temporal con Postventa y Visita

"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EventType } from '@/types/event';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { startOfDay, endOfDay } from '@/lib/calendar-utils';
import { getReferencesByType, type ReferenceItem } from '@/services/eventReferenceService';
import { NewProjectEventModal } from '@/components/modals/calendar/NewProjectEventModal';

interface EventModalDeprecatedProps {
  isOpen: boolean;
  eventData?: EventType | Partial<Omit<EventType, 'id'>> | null;
  onClose: () => void;
  onSave: (event: Omit<EventType, 'id'> & { id?: string }) => void;
  onDelete?: (eventId: string) => void;
  preSelectedType?: 'Proyecto' | 'Postventa' | 'Visita';
}

const defaultColor = 'hsl(var(--primary))';

export function EventModalDeprecated({
  isOpen,
  eventData,
  onClose,
  onSave,
  onDelete,
  preSelectedType,
}: EventModalDeprecatedProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(defaultColor);
  const [type, setType] = useState<'Postventa' | 'Visita' | ''>('');
  const [referenceId, setReferenceId] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [currentId, setCurrentId] = useState<string | undefined>(undefined);
  const [availableReferences, setAvailableReferences] = useState<ReferenceItem[]>([]);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // Estado para controlar redirección a modal de proyecto
  const [showProjectRedirect, setShowProjectRedirect] = useState(false);

  // Si el tipo preseleccionado es 'Proyecto', mostrar advertencia y redireccionar
  useEffect(() => {
    if (preSelectedType === 'Proyecto') {
      setShowProjectRedirect(true);
    }
  }, [preSelectedType]);

  // Cargar opciones de referencia (solo para Postventa y Visita)
  const loadReferenceOptions = async (selectedType: 'Postventa' | 'Visita') => {
    try {
      setLoadingReferences(true);
      const references = await getReferencesByType(selectedType);
      setAvailableReferences(references);
      
      if (references.length === 0) {
        toast({
          title: "Sin opciones disponibles",
          description: `No se encontraron ${selectedType.toLowerCase()}s disponibles.`,
        });
      }
    } catch (error) {
      console.error(`Error al cargar referencias de ${selectedType}:`, error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los ${selectedType.toLowerCase()}s disponibles.`,
        variant: "destructive"
      });
      setAvailableReferences([]);
    } finally {
      setLoadingReferences(false);
    }
  };

  useEffect(() => {
    if (eventData) {
      // Editando un evento existente
      const eventType = (eventData as EventType).type;
      
      if (eventType === 'Proyecto') {
        // Redireccionar eventos de proyecto existentes
        setShowProjectRedirect(true);
        return;
      }
      
      setCurrentId((eventData as EventType).id);
      setName(eventData.name || '');
      setStartDate(eventData.startDate ? new Date(eventData.startDate) : new Date());
      setEndDate(eventData.endDate ? new Date(eventData.endDate) : new Date());
      setDescription(eventData.description || '');
      setColor(eventData.color || defaultColor);
      setType(eventType === 'Postventa' || eventType === 'Visita' ? eventType : '');
      setReferenceId((eventData as EventType).referenceId || '');
      setStatus((eventData as EventType).status);
      
      if (eventType && eventType !== 'Proyecto') {
        loadReferenceOptions(eventType as 'Postventa' | 'Visita');
      }
    } else {
      // Creando un nuevo evento
      const now = new Date();
      setCurrentId(undefined);
      setName('');
      setStartDate(now);
      setEndDate(now);
      setDescription('');
      setColor(defaultColor);
      setType('');
      setReferenceId('');
      setStatus(undefined);
      setAvailableReferences([]);
    }
  }, [eventData]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({ 
        title: "Error de Validación", 
        description: "El nombre de la tarea es obligatorio.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!type) {
      toast({ 
        title: "Error de Validación", 
        description: "El tipo de evento es obligatorio.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (!referenceId) {
      toast({ 
        title: "Error de Validación", 
        description: `Debe seleccionar un ${type.toLowerCase()} de referencia.`, 
        variant: "destructive" 
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({ 
        title: "Error de Validación", 
        description: "Las fechas son obligatorias.", 
        variant: "destructive" 
      });
      return;
    }

    const finalStartDate = startOfDay(startDate);
    const finalEndDate = endOfDay(endDate);

    if (finalEndDate < finalStartDate) {
      toast({ 
        title: "Error de Validación", 
        description: "La fecha de fin no puede ser anterior a la fecha de inicio.", 
        variant: "destructive" 
      });
      return;
    }

    const eventToSave: Omit<EventType, 'id'> & { id?: string } = {
      name,
      startDate: finalStartDate,
      endDate: finalEndDate,
      description,
      color,
      type,
      referenceId,
      status,
    };
    
    if (currentId) {
      eventToSave.id = currentId;
    }
    
    onSave(eventToSave);
  };

  const handleDelete = () => {
    if (currentId && onDelete) {
      onDelete(currentId);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      onClose();
      setShowProjectRedirect(false);
    }
  };

  // Modal de redirección para eventos de proyecto
  if (showProjectRedirect) {
    return (
      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Eventos de Proyecto Actualizados
            </DialogTitle>
            <DialogDescription>
              Los eventos de proyecto ahora se manejan con una modal específica más completa.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Para crear o editar eventos de proyecto, utiliza la nueva funcionalidad 
              específica que incluye campos adicionales como dirección, checklist, 
              y sincronización automática de datos del cliente.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => handleCloseDialog(false)} variant="outline">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Modal para eventos de Postventa y Visita únicamente
  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[480px] shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {currentId ? 'Editar Tarea' : 'Añadir Nueva Tarea'}
          </DialogTitle>
          <DialogDescription>
            {currentId ? 'Modifica los detalles de la tarea existente.' : 'Ingresa los detalles para una nueva tarea.'}
          </DialogDescription>
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
            ⚠️ Nota: Para eventos de proyecto, usa la modal específica de proyectos
          </div>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="grid gap-6 py-6 px-2">
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-sm font-medium">Nombre de la Tarea</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Ej: Revisión postventa"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="event-type" className="text-sm font-medium">Tipo de Evento</Label>
              <Select 
                value={type} 
                onValueChange={(value: 'Postventa' | 'Visita') => {
                  setType(value);
                  setReferenceId('');
                  loadReferenceOptions(value);
                }}
                required
              >
                <SelectTrigger id="event-type" className="w-full">
                  <SelectValue placeholder="Selecciona un tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Postventa">Postventa</SelectItem>
                  <SelectItem value="Visita">Visita</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="reference" className="text-sm font-medium">
                {type === 'Postventa' ? 'Seleccionar Servicio Postventa' : 
                 type === 'Visita' ? 'Seleccionar Visita' :
                 'Seleccionar Referencia'}
              </Label>
              <Select 
                value={referenceId} 
                onValueChange={setReferenceId}
                disabled={!type || availableReferences.length === 0}
                required
              >
                <SelectTrigger id="reference" className="w-full">
                  <SelectValue placeholder={type ? 
                    `Selecciona un ${type.toLowerCase()}` : 
                    "Primero selecciona un tipo"} 
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableReferences.map((ref) => (
                    <SelectItem key={ref.id} value={ref.id}>
                      {ref.name} {ref.status && `(${ref.status})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label className="text-sm font-medium">Fecha de Inicio</Label>
                <InputDate
                  date={startDate}
                  onSelect={setStartDate}
                />
              </div>
              <div className="grid gap-3">
                <Label className="text-sm font-medium">Fecha de Fin</Label>
                <InputDate
                  date={endDate}
                  onSelect={setEndDate}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="description" className="text-sm font-medium">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Opcional: Añade más detalles sobre la tarea"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {currentId && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitleContent>¿Estás seguro?</AlertDialogTitleContent> 
                    <AlertDialogDescriptionContent>
                      Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea.
                    </AlertDialogDescriptionContent>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Sí, eliminar tarea
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> Guardar Tarea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}