'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { FormattedAddress } from '@/types/project';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { addProject } from '@/services/projectService';
import { addClient } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';
import type { ProjectType } from '@/types/project';
import type { ProjectFormValues } from '@/components/forms/ProjectForm';

export function NewProjectPopover() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);

  // Mutación para crear un nuevo cliente
  const addClientMutation = useMutation({
    mutationFn: (clientData: { name: string; email?: string; phone?: string }) => {
      const clientToAdd = {
        name: clientData.name,
        email: clientData.email || '',
        phone: clientData.phone || ''
      };
      return addClient(clientToAdd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente Agregado',
        description: 'El cliente ha sido agregado exitosamente.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al Agregar Cliente',
        description: error.message || 'Ocurrió un error al agregar el cliente.',
        variant: 'destructive',
      });
    },
  });

  // Función para manejar la adición de un nuevo cliente
  const handleAddClient = async (client: { name: string; email?: string; phone?: string }) => {
    try {
      await addClientMutation.mutateAsync(client);
    } catch (error) {
      console.error('Error al agregar cliente:', error);
      throw error;
    }
  };

  // Mutación para crear un nuevo proyecto
  const addProjectMutation = useMutation({
    mutationFn: (
      projectData: Omit<ProjectType, 'id' | 'createdAt' | 'updatedAt' | 'total' | 'balance'>
    ) => addProject(projectData),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: 'Proyecto Creado',
        description: `El proyecto "${newProject.projectNumber}" ha sido creado exitosamente.`,
      });
      setOpen(false); // Cerrar el popover después de crear el proyecto
      router.refresh(); // Refrescar la página para mostrar el nuevo proyecto
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al Crear Proyecto',
        description: error.message || 'No se pudo crear el proyecto.',
        variant: 'destructive',
      });
    },
  });

  // Manejador de envío del formulario
  const handleFormSubmit = async (formData: ProjectFormValues) => {
    try {
      // Calcular total y balance
      const subtotal = Number(formData.subtotal) || 0;
      const taxRate = Number(formData.taxRate) || 0;
      const total = subtotal * (1 + taxRate / 100);

      // Preparar los datos para la creación
      // Creamos un objeto que cumpla exactamente con la interfaz FormattedAddress
      const fullAddress: FormattedAddress | undefined = formData.fullAddress ? {
        // Solo incluimos las propiedades definidas en FormattedAddress
        textoCompleto: formData.fullAddress.textoCompleto || '',
        placeId: formData.fullAddress.placeId || undefined,
        coordenadas: {
          latitude: formData.fullAddress.coordenadas?.latitude || 0,
          longitude: formData.fullAddress.coordenadas?.longitude || 0
        },
        // Incluimos componentes solo si existen
        ...(formData.fullAddress.componentes && {
          componentes: {
            calle: formData.fullAddress.componentes.calle || undefined,
            numero: formData.fullAddress.componentes.numero || undefined,
            comuna: formData.fullAddress.componentes.comuna || undefined,
            ciudad: formData.fullAddress.componentes.ciudad || undefined,
            region: formData.fullAddress.componentes.region || undefined,
            pais: formData.fullAddress.componentes.pais || undefined,
            codigoPostal: formData.fullAddress.componentes.codigoPostal || undefined
          }
        }),
        // Incluimos detalle si existe
        ...(formData.fullAddress.detalle && { detalle: formData.fullAddress.detalle })
      } : undefined;

      // Creamos un nuevo objeto con solo las propiedades necesarias para ProjectType
      const projectData: Omit<ProjectType, 'id' | 'createdAt' | 'updatedAt' | 'total' | 'balance'> = {
        // Propiedades básicas
        projectNumber: formData.projectNumber,
        clientId: formData.clientId,
        description: formData.description,
        date: formData.date,
        status: formData.status,
        phone: formData.phone,
        windowsCount: formData.windowsCount,
        squareMeters: formData.squareMeters,
        uninstall: formData.uninstall || false,
        uninstallTypes: formData.uninstallTypes || [],
        glosa: formData.glosa,
        // Valores calculados
        subtotal,
        taxRate,
        // Dirección formateada correctamente
        fullAddress,
      };

      // Crear el proyecto
      await addProjectMutation.mutateAsync(projectData);
    } catch (error) {
      console.error('Error al crear el proyecto:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="default" size="sm" className="h-8 gap-1">
          <Plus className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Nuevo Proyecto
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[28rem] p-6" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Nuevo Proyecto</h3>
            <p className="text-sm text-muted-foreground">
              Complete los detalles del nuevo proyecto
            </p>
          </div>
          <div className="space-y-4">
            <ProjectForm
              onSubmit={handleFormSubmit}
              isSubmitting={addProjectMutation.isPending}
              submitButtonText='Crear Proyecto'
              onCancel={() => setOpen(false)}
              onClientAdd={handleAddClient}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
