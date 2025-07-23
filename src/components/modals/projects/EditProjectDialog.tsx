'use client';

import { useState, useRef } from 'react';
import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectForm, ProjectFormValues } from '@/components/forms/ProjectForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateProject } from '@/services/projectService';
import type { ProjectType } from '@/types/project';
import { ModalLayout } from '@/components/modals/modalLayout';
import { DialogErrorBoundary } from '@/components/error-boundary/DialogErrorBoundary';

interface EditProjectDialogProps {
  project: ProjectType;
  children: React.ReactNode;
}

export function EditProjectDialog({ project, children }: EditProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  // Validación defensiva del proyecto
  if (!project || !project.id) {
    console.error('EditProjectDialog: proyecto inválido o sin ID', project);
    return null;
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      try {
        return await updateProject(project.id, data);
      } catch (error) {
        console.error('Error en mutationFn:', error);
        throw error;
      }
    },
    onSuccess: () => {
      try {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        toast({ 
          title: 'Éxito', 
          description: 'Proyecto actualizado correctamente.',
          variant: 'default'
        });
        setIsOpen(false);
      } catch (error) {
        console.error('Error en onSuccess:', error);
      }
    },
    onError: (error) => {
      console.error('Error en mutación updateProject:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({ 
        title: 'Error al actualizar proyecto', 
        description: `Hubo un problema al actualizar el proyecto: ${errorMessage}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = React.useCallback((data: ProjectFormValues) => {
    try {
      console.log('EditProjectDialog: Enviando datos del formulario:', data);
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

  // Mapeo defensivo para asegurar que ningún campo controlado reciba null o undefined.
  const initialData: Partial<ProjectFormValues> = React.useMemo(() => {
    try {
      return {
        clientId: project?.clientId || '', // Validación adicional
        projectNumber: project?.projectNumber ?? '',
        glosa: project?.glosa ?? '',
        date: project?.date ? new Date(project.date) : new Date(),
        status: project?.status ?? 'ingresado',
        subtotal: Number(project?.subtotal) || 0,
        taxRate: Number(project?.taxRate) || 19,
        windowsCount: Number(project?.windowsCount) || 0,
        squareMeters: Number(project?.squareMeters) || 0,
        phone: project?.phone ?? '',
        fullAddress: project?.fullAddress ? {
          ...project.fullAddress,
          placeId: project.fullAddress.placeId || '',
          textoCompleto: project.fullAddress.textoCompleto || '',
          coordenadas: {
            latitude: Number(project.fullAddress.coordenadas?.latitude) || 0,
            longitude: Number(project.fullAddress.coordenadas?.longitude) || 0
          }
        } : {
          textoCompleto: '',
          placeId: '',
          coordenadas: {
            latitude: 0,
            longitude: 0
          }
        },
        description: project?.description ?? '',
        uninstall: Boolean(project?.uninstall),
        uninstallTypes: Array.isArray(project?.uninstallTypes) ? project.uninstallTypes : [],
      };
    } catch (error) {
      console.error('Error al mapear datos iniciales:', error);
      // Retornar datos por defecto seguros
      return {
        clientId: '',
        projectNumber: '',
        glosa: '',
        date: new Date(),
        status: 'ingresado' as const,
        subtotal: 0,
        taxRate: 19,
        windowsCount: 0,
        squareMeters: 0,
        phone: '',
        fullAddress: {
          textoCompleto: '',
          placeId: '',
          coordenadas: { latitude: 0, longitude: 0 }
        },
        description: '',
        uninstall: false,
        uninstallTypes: [],
      };
    }
  }, [project]);

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
        console.error('Error en EditProjectDialog:', error, errorInfo);
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
        title="Editar Proyecto"
        formRef={formRef}
        submitButtonText="Guardar Cambios"
        isSubmitting={isPending}
        showDefaultButtons={true}
        className="w-full max-w-md"
      >
        <div className="space-y-4 py-2">
          <DialogErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Error en ProjectForm dentro de EditProjectDialog:', error, errorInfo);
            }}
          >
            <ProjectForm
              formRef={formRef}
              initialData={initialData}
              onSubmit={handleSubmit}
              isSubmitting={isPending}
              submitButtonText="Guardar Cambios"
              onCancel={handleClose}
              hideButtons={true}
            />
          </DialogErrorBoundary>
        </div>
      </ModalLayout>
    </DialogErrorBoundary>
  );
}
