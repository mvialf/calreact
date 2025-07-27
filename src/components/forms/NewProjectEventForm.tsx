"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

import { getClients } from '@/services/clientService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { AddressInput } from '@/components/ui/addressInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Imports de tipos y constantes
import type { ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_OPTIONS } from '@/constants/project';
import { DEFAULT_WINDOWS_COUNT, DEFAULT_SQUARE_METERS } from '@/constants/defaults';
import type { FormattedAddress } from '@/types/project';

// Esquema de validación para el formulario de evento de proyecto
const formSchema = z.object({
  projectId: z.string().optional(),
  projectNumber: z.string().optional(),
  clientId: z.string().optional(),
  glosa: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  fullAddress: z.any().optional(), // FormattedAddress | null
  status: z.string().min(1, "El estado es requerido"),
  windowsCount: z.number().min(0, "El número de ventanas debe ser positivo"),
  squareMeters: z.number().min(0, "Los metros cuadrados deben ser positivos"),
  uninstall: z.boolean(),
  uninstallTypes: z.array(z.string()).optional(),
  uninstallOther: z.string().optional(),
});

// Tipo para los valores del formulario
export type NewProjectEventFormValues = z.infer<typeof formSchema> & {
  clientName?: string;
  checklist?: Array<{
    id: string;
    description: string;
    isCompleted: boolean;
    createdAt?: Date;
    completedAt?: Date;
  }>;
};

export interface NewProjectEventFormProps {
  formRef?: React.RefObject<HTMLFormElement>;
  onSubmit: (data: NewProjectEventFormValues) => void;
  initialData?: Partial<NewProjectEventFormValues>;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function NewProjectEventForm({
  formRef,
  onSubmit,
  initialData,
  isSubmitting = false,
  disabled = false,
}: NewProjectEventFormProps) {
  const { toast } = useToast();

  // Formulario
  const form = useForm<NewProjectEventFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: initialData?.projectId || "",
      projectNumber: initialData?.projectNumber || "",
      clientId: initialData?.clientId || "",
      glosa: initialData?.glosa || "",
      description: initialData?.description || "",
      phone: initialData?.phone || "",
      fullAddress: initialData?.fullAddress || null,
      status: initialData?.status || "ingresado",
      windowsCount: Number(initialData?.windowsCount) || DEFAULT_WINDOWS_COUNT || 0,
      squareMeters: Number(initialData?.squareMeters) || DEFAULT_SQUARE_METERS || 0,
      uninstall: Boolean(initialData?.uninstall) || false,
      uninstallTypes: Array.isArray(initialData?.uninstallTypes) ? initialData.uninstallTypes : undefined,
      uninstallOther: initialData?.uninstallOther || "",
      checklist: Array.isArray(initialData?.checklist) ? initialData.checklist : [],
    },
  });

  // Obtener la lista de clientes
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients(),
  });

  // Manejar el envío del formulario
  const handleFormSubmit = (data: NewProjectEventFormValues) => {
    onSubmit(data);
  };

  return (
    <form 
      ref={formRef} 
      onSubmit={form.handleSubmit(handleFormSubmit)} 
      className="space-y-6"
    >
      {/* Número de Proyecto - Solo mostrar si no está deshabilitado */}
      {!disabled && (
        <div className="space-y-2">
          <Label htmlFor="projectNumber" className="text-sm font-medium">
            Número de Proyecto
          </Label>
          <Controller
            name="projectNumber"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                id="projectNumber"
                placeholder="Ej: P2024-001"
                disabled={disabled}
              />
            )}
          />
          {form.formState.errors.projectNumber && (
            <p className="text-sm text-destructive">
              {form.formState.errors.projectNumber.message}
            </p>
          )}
        </div>
      )}

      {/* Cliente - Solo mostrar si no está deshabilitado */}
      {!disabled && (
        <div className="space-y-2">
          <Label htmlFor="clientId" className="text-sm font-medium">
            Cliente
          </Label>
          <Controller
            name="clientId"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <SelectTrigger id="clientId">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.clientId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.clientId.message}
            </p>
          )}
        </div>
      )}

      {/* Glosa - Solo mostrar si no está deshabilitado */}
      {!disabled && (
        <div className="space-y-2">
          <Label htmlFor="glosa" className="text-sm font-medium">
            Glosa
          </Label>
          <Controller
            name="glosa"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                id="glosa"
                placeholder="Descripción breve del proyecto"
                disabled={disabled}
              />
            )}
          />
        </div>
      )}



      {/* Teléfono */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium">
          Teléfono de Contacto
        </Label>
        <Controller
          name="phone"
          control={form.control}
          render={({ field }) => (
            <PhoneInput
              {...field}
              id="phone"
              placeholder="Teléfono de contacto"
              onChange={(value) => field.onChange(value)}
              disabled={disabled}
            />
          )}
        />
      </div>

      {/* Dirección */}
      <div className="space-y-2">
        <Label htmlFor="address" className="text-sm font-medium">
          Dirección
        </Label>
        <Controller
          name="fullAddress"
          control={form.control}
          render={({ field }) => (
            <AddressInput
              value={field.value}
              onSelect={field.onChange}
              placeholder="Ingrese la dirección del proyecto"
              disabled={disabled}
            />
          )}
        />
      </div>

      {/* Estado */}
      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">
          Estado
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-sm text-destructive">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      {/* Ventanas y Metros Cuadrados */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="windowsCount" className="text-sm font-medium">
            Cantidad de Ventanas
          </Label>
          <Controller
            name="windowsCount"
            control={form.control}
            render={({ field }) => (
              <Input
                value={field.value?.toString() || '0'}
                id="windowsCount"
                type="number"
                min="0"
                disabled={disabled}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  field.onChange(isNaN(value) ? 0 : value);
                }}
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="squareMeters" className="text-sm font-medium">
            Metros Cuadrados
          </Label>
          <Controller
            name="squareMeters"
            control={form.control}
            render={({ field }) => (
              <Input
                value={field.value?.toString() || '0'}
                id="squareMeters"
                type="number"
                min="0"
                step="0.1"
                disabled={disabled}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  field.onChange(isNaN(value) ? 0 : value);
                }}
              />
            )}
          />
        </div>
      </div>

      {/* Desinstalación */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="uninstall" className="text-sm font-medium">
            Requiere desinstalación
          </Label>
          <Controller
            name="uninstall"
            control={form.control}
            render={({ field }) => (
              <Select 
                value={field.value ? "true" : "false"} 
                onValueChange={(value) => field.onChange(value === "true")}
                disabled={disabled}
              >
                <SelectTrigger id="uninstall">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Sí</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {form.watch('uninstall') && (
          <div className="space-y-2">
            <Label htmlFor="uninstallOther" className="text-sm font-medium">
              Detalles de desinstalación
            </Label>
            <Controller
              name="uninstallOther"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  value={field.value || ""}
                  id="uninstallOther"
                  placeholder="Especificar tipo y detalles de desinstalación necesaria"
                  rows={3}
                  disabled={disabled}
                />
              )}
            />
          </div>
          
        )}
              {/* Descripción */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Descripción
        </Label>
        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="description"
              placeholder="Descripción detallada del proyecto"
              rows={3}
              disabled={disabled}
            />
          )}
        />
      </div>
      </div>
    </form>
  );
}