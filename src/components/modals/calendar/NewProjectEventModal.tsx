"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { ModalLayout } from '../modalLayout';
import { getProjects } from '@/services/projectService';
import { getClients } from '@/services/clientService';
import { ProjectType } from '@/types/project';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Autocomplete, type AutocompleteItem } from '@/components/ui/autocomplete';
import { ProjectClientDisplay } from '@/components/client-display';
import { X } from 'lucide-react';

// Importar el nuevo formulario
import { NewProjectEventForm, type NewProjectEventFormValues } from '@/components/forms/NewProjectEventForm';

export interface NewProjectEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewProjectEventFormValues) => void;
  initialData?: Partial<NewProjectEventFormValues>;
  isSubmitting?: boolean;
}

export function NewProjectEventModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}: NewProjectEventModalProps) {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<ProjectType | null>(null);
  const [formData, setFormData] = useState<Partial<NewProjectEventFormValues>>(initialData || {});
  const formRef = useRef<HTMLFormElement>(null);

  // Obtener la lista de proyectos
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
    enabled: isOpen,
  });

  // Filtrar proyectos: excluir completados y pagados
  const filteredProjects = React.useMemo(() => {
    return projects.filter(project => 
      project.status !== 'completado' && project.isPaid !== true
    );
  }, [projects]);

  // Convertir proyectos a items del autocomplete
  const projectItems: AutocompleteItem[] = React.useMemo(() => {
    return filteredProjects.map(project => ({
      value: project.id,
      label: `${project.projectNumber} - ${project.clientName || 'Cliente no especificado'}`,
      project // Guardamos el proyecto completo para acceso posterior
    }));
  }, [filteredProjects]);

  // Efecto para establecer el proyecto seleccionado si hay projectId inicial
  React.useEffect(() => {
    if (formData.projectId && projects.length > 0 && !selectedProject) {
      const project = projects.find(p => p.id === formData.projectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [projects, formData.projectId, selectedProject]);

  // Efecto para resetear cuando se cierra la modal
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedProject(null);
      setFormData(initialData || {});
    }
  }, [isOpen, initialData]);

  // Función para renderizar items del autocomplete
  const renderProjectItem = React.useCallback((item: AutocompleteItem) => {
    if (item.project) {
      return (
        <ProjectClientDisplay 
          project={item.project}
          className="w-full"
        />
      );
    }
    return <span className="truncate">{item.label}</span>;
  }, []);

  // Manejar selección de proyecto
  const handleProjectSelect = React.useCallback((projectId: string) => {
    const project = filteredProjects.find(p => p.id === projectId);
    setSelectedProject(project || null);
    
    // Auto-completar datos del formulario con datos del proyecto
    if (project) {
      const updatedFormData: Partial<NewProjectEventFormValues> = {
        projectId: project.id,
        projectNumber: project.projectNumber,
        clientId: project.clientId,
        glosa: project.glosa || '',
        description: project.description || '',
        phone: project.phone || '',
        fullAddress: project.fullAddress || null,
        status: project.status,
        windowsCount: project.windowsCount || 0,
        squareMeters: project.squareMeters || 0,
        uninstall: project.uninstall || false,
        uninstallTypes: project.uninstallTypes,
        uninstallOther: project.uninstallOther || '',
        clientName: project.clientName,
        checklist: initialData?.checklist || [],
      };
      setFormData(updatedFormData);
    }
  }, [filteredProjects, initialData?.checklist]);

  // Función para limpiar la selección
  const handleClearSelection = React.useCallback(() => {
    setSelectedProject(null);
    setFormData(initialData || {});
  }, [initialData]);

  // Manejar el envío del formulario
  const handleFormSubmit = (data: NewProjectEventFormValues) => {
    // Añadir información adicional del proyecto seleccionado
    const eventData = {
      ...data,
      clientName: selectedProject?.clientName || data.clientName || '',
      checklist: data.checklist || [],
    };
    onSubmit(eventData);
  };

  return (
    <ModalLayout
      isOpen={isOpen}
      title="Crear Evento de Proyecto"
      onClose={onClose}
      onSubmit={() => {
        formRef.current?.requestSubmit();
      }}
      submitButtonText={isSubmitting ? 'Guardando...' : 'Crear Evento'}
      isSubmitting={isSubmitting || isLoadingProjects}
      className="w-full max-w-4xl"
    >
      <div className="space-y-6">
        {/* Autocomplete de Proyectos */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Proyecto</Label>
          {!selectedProject ? (
            <Autocomplete
              items={projectItems}
              value={formData.projectId || ''}
              onSelect={handleProjectSelect}
              placeholder="Buscar proyecto..."
              renderItem={renderProjectItem}
              disabled={isLoadingProjects}
              className="w-full"
            />
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
              <ProjectClientDisplay 
                project={selectedProject}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Formulario */}
        <NewProjectEventForm
          formRef={formRef}
          onSubmit={handleFormSubmit}
          initialData={formData}
          isSubmitting={isSubmitting}
          disabled={!!selectedProject} // Deshabilitar campos cuando hay proyecto seleccionado
        />
      </div>
    </ModalLayout>
  );
}