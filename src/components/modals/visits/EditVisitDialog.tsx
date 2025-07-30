'use client';

import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VisitForm, VisitFormValues } from '@/components/forms/VisitForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { updateVisit } from '@/services/visitService';
import type { Visit, VisitStatus } from '@/types/visit';
import { DEFAULT_VISIT_STATUS } from '@/types/visit';
import { ModalLayout } from '@/components/modals/modalLayout';
import { DialogErrorBoundary } from '@/components/error-boundary/DialogErrorBoundary';

interface EditVisitDialogProps {
  visit: Visit;
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function EditVisitDialog({ visit, children, onSuccess }: EditVisitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // Validación defensiva de la visita
  if (!visit) {
    console.error('EditVisitDialog: visita es undefined o null');
    return null;
  }
  
  // Asegurarse de que la visita tenga un ID
  const visitWithId = visit as Visit & { id: string };
  if (!visitWithId.id) {
    console.error('EditVisitDialog: la visita no tiene un ID válido', visit);
    return null;
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: VisitFormValues) => {
      try {
        // Preparar datos para actualización
        const updateData = {
          name: data.name,
          phone: data.phone,
          status: data.status as VisitStatus,
          address: data.fullAddress?.textoCompleto || data.address || '',
          municipality: data.fullAddress?.componentes?.comuna || data.municipality || '',
          observations: data.observations || '',
        };
        
        await updateVisit(visitWithId.id, updateData);
        return updateData;
      } catch (error) {
        console.error('Error en mutationFn:', error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['visits'] });
        queryClient.invalidateQueries({ queryKey: ['visits', visit.id] });
        
        toast({ 
          title: 'Éxito', 
          description: 'Visita actualizada correctamente.',
          variant: 'default'
        });
        setIsOpen(false);
        onSuccess?.();
      } catch (error) {
        console.error('Error en onSuccess:', error);
      }
    },
    onError: (error) => {
      console.error('Error en mutación updateVisit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({ 
        title: 'Error al actualizar visita', 
        description: `Hubo un problema al actualizar la visita: ${errorMessage}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = React.useCallback((data: VisitFormValues) => {
    try {
      console.log('EditVisitDialog: Enviando datos del formulario:', data);
      mutate(data);
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      toast({ 
        title: 'Error', 
        description: 'Error inesperado al procesar el formulario',
        variant: 'destructive',
      });
    }
  }, [mutate, toast]);

  // Mapeo defensivo para asegurar que ningún campo controlado reciba null o undefined
  const initialData: Partial<VisitFormValues> = React.useMemo(() => {
    try {
      // Si ya tenemos una estructura fullAddress en la visita, la usamos directamente
      if (visit?.fullAddress) {
        return {
          name: visit.name || '',
          phone: visit.phone || '',
          status: visit.status || DEFAULT_VISIT_STATUS,
          scheduledDate: visit.scheduledDate ? new Date(visit.scheduledDate) : new Date(),
          observations: visit.observations || '',
          address: visit.fullAddress.textoCompleto || '',
          municipality: visit.fullAddress.componentes?.comuna || '',
          fullAddress: {
            ...visit.fullAddress,
            placeId: visit.fullAddress.placeId || '',
            textoCompleto: visit.fullAddress.textoCompleto || '',
            // Asegurarse de que las coordenadas existan
            coordenadas: visit.fullAddress.coordenadas || { latitude: 0, longitude: 0 },
            // Asegurarse de que los componentes existan
            componentes: {
              calle: visit.fullAddress.componentes?.calle || '',
              numero: visit.fullAddress.componentes?.numero || '',
              comuna: visit.fullAddress.componentes?.comuna || '',
              ciudad: visit.fullAddress.componentes?.ciudad || '',
              region: visit.fullAddress.componentes?.region || '',
              pais: visit.fullAddress.componentes?.pais || 'Chile',
              codigoPostal: visit.fullAddress.componentes?.codigoPostal || '',
            },
          },
        };
      }
      
      // Si no hay fullAddress, construirlo desde los campos básicos
      return {
        name: visit?.name || '',
        phone: visit?.phone || '',
        status: visit?.status || DEFAULT_VISIT_STATUS,
        scheduledDate: visit?.scheduledDate ? new Date(visit.scheduledDate) : new Date(),
        observations: visit?.observations || '',
        // Mantener compatibilidad con campos de dirección
        address: visit?.address || '',
        municipality: visit?.municipality || '',
        // Estructura de fullAddress para el AddressInput
        fullAddress: {
          textoCompleto: visit?.address || '',
          placeId: visit?.placeId || '',
          coordenadas: visit?.coordinates || { latitude: 0, longitude: 0 },
          componentes: {
            calle: '',
            numero: '',
            comuna: visit?.municipality || '',
            ciudad: '',
            region: '',
            pais: 'Chile',
            codigoPostal: '',
          },
        },
      };
    } catch (error) {
      console.error('Error al mapear datos iniciales:', error);
      // Retornar datos por defecto seguros
      return {
        name: '',
        phone: '',
        status: DEFAULT_VISIT_STATUS,
        scheduledDate: new Date(),
        observations: '',
        address: '',
        municipality: '',
        fullAddress: {
          textoCompleto: '',
          placeId: '',
          coordenadas: { latitude: 0, longitude: 0 },
          componentes: {
            calle: '',
            numero: '',
            comuna: '',
            ciudad: '',
            region: '',
            pais: '',
            codigoPostal: '',
          },
        },
      };
    }
  }, [visit]);

  const handleClose = React.useCallback(() => {
    try {
      setIsOpen(false);
    } catch (error) {
      console.error('Error al cerrar modal:', error);
    }
  }, []);

  const handleOpen = React.useCallback(() => {
    try {
      setIsOpen(true);
    } catch (error) {
      console.error('Error al abrir modal:', error);
    }
  }, []);

  return (
    <DialogErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Error en EditVisitDialog:', error, errorInfo);
        toast({
          title: 'Error inesperado',
          description: 'Ha ocurrido un error al cargar el diálogo. Por favor, recarga la página.',
          variant: 'destructive',
        });
      }}
    >
      {React.cloneElement(children as React.ReactElement, {
        onClick: handleOpen,
      })}
      <ModalLayout
        isOpen={isOpen}
        onClose={handleClose}
        title="Editar Visita"
        formRef={formRef}
        submitButtonText="Guardar Cambios"
        isSubmitting={isPending}
        showDefaultButtons={true}
        className="w-full max-w-lg"
      >
        <div className="space-y-4 py-2">
          <DialogErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Error en VisitForm dentro de EditVisitDialog:', error, errorInfo);
            }}
          >
            <VisitForm
              formRef={formRef}
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={isPending}
              hideButtons={true}
            />
          </DialogErrorBoundary>
        </div>
      </ModalLayout>
    </DialogErrorBoundary>
  );
}
