'use client';

import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AfterSaleForm, AfterSaleFormValues } from '@/components/forms/AfterSaleForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { updateAfterSales } from '@/services/afterSalesService';
import type { AfterSales } from '@/types/afterSales';
import { ModalLayout } from '@/components/modals/modalLayout';
import { DialogErrorBoundary } from '@/components/error-boundary/DialogErrorBoundary';

interface EditAfterSaleDialogProps {
  afterSale: AfterSales;
  children: React.ReactNode;
}

export function EditAfterSaleDialog({ afterSale, children }: EditAfterSaleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // Validación defensiva de la postventa
  if (!afterSale || !afterSale.id) {
    console.error('EditAfterSaleDialog: postventa inválida o sin ID', afterSale);
    return null;
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AfterSaleFormValues) => {
      try {
        // Preparar datos para actualización
        const updateData = {
          projectId: data.projectId,
          description: data.description,
          entryDate: data.date,
          phone: data.phone,
          address: data.address,
          tasks: data.tasks,
        };
        
        await updateAfterSales(afterSale.id, updateData);
        return updateData;
      } catch (error) {
        console.error('Error en mutationFn:', error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['afterSales'] });
        queryClient.invalidateQueries({ queryKey: ['afterSales', afterSale.id] });
        queryClient.invalidateQueries({ queryKey: ['afterSalesForProject', afterSale.projectId] });
        
        toast({ 
          title: 'Éxito', 
          description: 'Postventa actualizada correctamente.',
          variant: 'default'
        });
        setIsOpen(false);
      } catch (error) {
        console.error('Error en onSuccess:', error);
      }
    },
    onError: (error) => {
      console.error('Error en mutación updateAfterSales:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({ 
        title: 'Error al actualizar postventa', 
        description: `Hubo un problema al actualizar la postventa: ${errorMessage}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = React.useCallback((data: AfterSaleFormValues) => {
    try {
      console.log('EditAfterSaleDialog: Enviando datos del formulario:', data);
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
  const initialData: Partial<AfterSaleFormValues> = React.useMemo(() => {
    try {
      return {
        projectId: afterSale?.projectId || '',
        description: afterSale?.description || '',
        date: afterSale?.entryDate ? new Date(afterSale.entryDate) : new Date(),
        phone: (afterSale as any)?.phone || '', // phone puede no estar en el tipo base
        address: (afterSale as any)?.address || null, // address puede no estar en el tipo base
        tasks: Array.isArray(afterSale?.tasks) ? afterSale.tasks.map(task => ({
          id: task.id || crypto.randomUUID(),
          description: task.description || '',
          isCompleted: Boolean(task.isCompleted),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
          createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
        })) : [],
      };
    } catch (error) {
      console.error('Error al mapear datos iniciales:', error);
      // Retornar datos por defecto seguros
      return {
        projectId: '',
        description: '',
        date: new Date(),
        phone: '',
        address: null,
        tasks: [],
      };
    }
  }, [afterSale]);

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
        console.error('Error en EditAfterSaleDialog:', error, errorInfo);
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
        title="Editar Postventa"
        formRef={formRef}
        submitButtonText="Guardar Cambios"
        isSubmitting={isPending}
        showDefaultButtons={true}
        className="w-full max-w-2xl"
      >
        <div className="space-y-4 py-2">
          <DialogErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Error en AfterSaleForm dentro de EditAfterSaleDialog:', error, errorInfo);
            }}
          >
            <AfterSaleForm
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
