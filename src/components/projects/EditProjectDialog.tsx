'use client';

import { useState, useRef } from 'react';
import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ProjectForm, ProjectFormValues } from '@/components/forms/ProjectForm';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { updateProject } from '@/services/projectService';
import type { ProjectType } from '@/types/project';
import { ModalLayout } from '@/components/modals/modalLayout'; // Importar ModalLayout

interface EditProjectDialogProps {
  project: ProjectType;
  children: React.ReactNode;
}

export function EditProjectDialog({ project, children }: EditProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null); // Crear la referencia para el formulario

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ProjectFormValues) => updateProject(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Éxito', description: 'Proyecto actualizado correctamente.' });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({ 
        title: 'Error', 
        description: `Hubo un problema al actualizar el proyecto: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: ProjectFormValues) => {
    mutate(data);
  };

  // Mapeo defensivo para asegurar que ningún campo controlado reciba null o undefined.
  const initialData: Partial<ProjectFormValues> = {
    clientId: project.clientId, // Se asume que clientId siempre existe
    projectNumber: project.projectNumber ?? '',
    glosa: project.glosa ?? '',
    date: project.date ? new Date(project.date) : new Date(),
    status: project.status ?? 'ingresado',
    subtotal: project.subtotal ?? 0,
    taxRate: project.taxRate ?? 19, // ?? maneja null y undefined, pero permite 0
    windowsCount: project.windowsCount ?? 0,
    squareMeters: project.squareMeters ?? 0,
    phone: project.phone ?? '',
    fullAddress: project.fullAddress ? {
      ...project.fullAddress,
      placeId: project.fullAddress.placeId || '',
      textoCompleto: project.fullAddress.textoCompleto || '',
      coordenadas: {
        latitude: project.fullAddress.coordenadas?.latitude || 0,
        longitude: project.fullAddress.coordenadas?.longitude || 0
      }
    } : {
      textoCompleto: '',
      placeId: '',
      coordenadas: {
        latitude: 0,
        longitude: 0
      }
    },
    description: project.description ?? '',
    uninstall: project.uninstall ?? false,
    uninstallTypes: project.uninstallTypes ?? [],
  };

  return (
    <>
      {React.cloneElement(children as React.ReactElement, {
        onClick: () => setIsOpen(true),
      })}
      <ModalLayout
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Editar Proyecto"
        onSubmit={() => {
          formRef.current?.dispatchEvent(
            new Event('submit', { cancelable: true, bubbles: true })
          );
        }}
        submitButtonText="Guardar Cambios"
        isSubmitting={isPending}
        className="w-full max-w-md"
      >
        <div className="space-y-4 py-2">
          <ProjectForm
            formRef={formRef}
            initialData={initialData}
            onSubmit={handleSubmit}
            isSubmitting={isPending}
            submitButtonText="Guardar Cambios"
            onCancel={() => setIsOpen(false)}
            hideButtons={true}
          />
        </div>
      </ModalLayout>
    </>
  );
}
