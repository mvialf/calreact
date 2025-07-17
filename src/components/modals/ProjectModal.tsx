"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

import { ModalLayout } from './modalLayout';
import { getProjects } from '@/services/projectService';
import { ProjectType } from '@/types/project';
import { toast } from '@/components/ui/use-toast';
import { ProjectForm, type ProjectFormValues } from '@/components/forms/ProjectForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipo para los valores del formulario heredado del ProjectForm
type FormValues = ProjectFormValues & {
  // Agregar campos adicionales específicos de ProjectModal si son necesarios
  projectId?: string;
  clientName?: string;
  checklist?: Array<{
    id: string;
    description: string;
    isCompleted: boolean;
    createdAt?: Date;
    completedAt?: Date;
  }>;
};

export interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormValues) => void;
  initialData?: Partial<FormValues>;
  isSubmitting?: boolean;
}

export function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}: ProjectModalProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectType | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Obtener la lista de proyectos
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
    enabled: isOpen, // Solo cargar cuando la modal esté abierta
  });

  // Mapear los valores iniciales al formato de ProjectForm
  const mapToProjectFormValues = (data: Partial<FormValues>): Partial<ProjectFormValues> => {
    return {
      projectNumber: data.projectNumber || '',
      glosa: data.glosa || '',
      description: data.description || '',
      phone: data.phone || '',
      // Mapear otros campos según sea necesario
    };
  };

  // Mapear los valores de ProjectForm al formato esperado por onSubmit
  const mapToFormValues = (data: ProjectFormValues): FormValues => {
    return {
      ...data,
      projectId: selectedProject?.id || '',
      clientName: selectedProject?.clientName || '',
      // Mantener el checklist si existe
      checklist: initialData?.checklist || [],
    };
  };

  // Manejar el envío del formulario
  const handleSubmit = (data: ProjectFormValues) => {
    onSubmit(mapToFormValues(data));
  };

  // Manejar la adición de un nuevo cliente
  const handleAddClient = async (client: { name: string; email?: string; phone?: string }) => {
    // Implementar la lógica para agregar un nuevo cliente si es necesario
    toast({
      title: 'Cliente agregado',
      description: `${client.name} ha sido agregado correctamente.`,
    });
  };

  return (
    <ModalLayout
      isOpen={isOpen}
      title="Agendar Proyecto"
      onClose={onClose}
      onSubmit={() => {
        // Disparar manualmente el evento submit del formulario
        formRef.current?.dispatchEvent(
          new Event('submit', { cancelable: true, bubbles: true })
        );
      }}
      submitButtonText={isSubmitting ? 'Guardando...' : 'Guardar'}
      isSubmitting={isSubmitting || isLoadingProjects}
      className="w-full max-w-3xl"
    >
      <div className="space-y-4">
        {/* Selector de proyecto existente */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Proyecto existente</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project || null);
            }}
          >
            <option value="">Seleccionar proyecto existente...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.projectNumber} - {project.clientName || 'Sin cliente'}
              </option>
            ))}
          </select>
        </div>

        {/* Formulario de proyecto */}
        <ProjectForm
          formRef={formRef}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitButtonText="Guardar"
          onClientAdd={handleAddClient}
          hideButtons={true}
          initialData={mapToProjectFormValues(initialData || {})}
        />

        {selectedProject && (
          <div className="space-y-2 rounded-lg border p-4">
            <h3 className="font-medium">Información del proyecto seleccionado</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p>{selectedProject.clientName || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p>{selectedProject.phone || 'No especificado'}</p>
              </div>
            </div>
            {selectedProject.address && (
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p>{selectedProject.address}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ModalLayout>
  );
}