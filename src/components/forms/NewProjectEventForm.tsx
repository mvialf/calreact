"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

import { getClients } from '@/services/clientService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { AddressInput } from '@/components/ui/addressInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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
    <Form {...form}>
      <form 
        ref={formRef} 
        onSubmit={form.handleSubmit(handleFormSubmit)} 
        className="space-y-6"
      >
        {/* Número de Proyecto - Solo mostrar si no está deshabilitado */}
        {!disabled && (
          <FormField
            control={form.control}
            name="projectNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Proyecto</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ej: P2024-001"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Cliente - Solo mostrar si no está deshabilitado */}
        {!disabled && (
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                    <SelectTrigger>
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Glosa - Solo mostrar si no está deshabilitado */}
        {!disabled && (
          <FormField
            control={form.control}
            name="glosa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Glosa</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Descripción breve del proyecto"
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}



        {/* Teléfono */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono de Contacto</FormLabel>
              <FormControl>
                <PhoneInput
                  {...field}
                  placeholder="Teléfono de contacto"
                  onChange={(value) => field.onChange(value)}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dirección */}
        <FormField
          control={form.control}
          name="fullAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <AddressInput
                  value={field.value}
                  onSelect={field.onChange}
                  placeholder="Ingrese la dirección del proyecto"
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estado */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <SelectTrigger>
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
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ventanas y Metros Cuadrados */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="windowsCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad de Ventanas</FormLabel>
                <FormControl>
                  <Input
                    value={field.value?.toString() || '0'}
                    type="number"
                    min="0"
                    disabled={disabled}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="squareMeters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Metros Cuadrados</FormLabel>
                <FormControl>
                  <Input
                    value={field.value?.toString() || '0'}
                    type="number"
                    min="0"
                    step="0.1"
                    disabled={disabled}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Desinstalación */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="uninstall"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requiere desinstalación</FormLabel>
                <FormControl>
                  <Select 
                    value={field.value ? "true" : "false"} 
                    onValueChange={(value) => field.onChange(value === "true")}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Sí</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch('uninstall') && (
            <FormField
              control={form.control}
              name="uninstallOther"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalles de desinstalación</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Especificar tipo y detalles de desinstalación necesaria"
                      rows={3}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Descripción detallada del proyecto"
                  rows={3}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}