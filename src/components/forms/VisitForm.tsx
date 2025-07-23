'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VisitStatus, VISIT_STATUS_OPTIONS, DEFAULT_VISIT_STATUS } from '@/types/visit';
import { AddressInput } from '@/components/ui/addressInput';
import { InputDate } from '@/components/ui/date-picker';
import type { FormattedAddress } from '@/types/project';

// Esquema para la dirección completa
export const fullAddressSchema = z.union([
  z.object({
    textoCompleto: z.string(),
    placeId: z.string().min(1, 'Place ID es requerido'),
    coordenadas: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    componentes: z.object({
      calle: z.string().optional(),
      numero: z.string().optional(),
      comuna: z.string().optional(),
      ciudad: z.string().optional(),
      region: z.string().optional(),
      pais: z.string().optional(),
      codigoPostal: z.string().optional(),
    }).optional(),
  }),
  z.null()
]).optional();

const formSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  phone: z.string().min(9, { message: 'El teléfono debe tener al menos 9 dígitos.' }),
  status: z.enum(VISIT_STATUS_OPTIONS as [string, ...string[]], {
    required_error: 'Debe seleccionar un estado.',
  }),
  fullAddress: fullAddressSchema,
  address: z.string().optional(), // Campo opcional para compatibilidad
  municipality: z.string().optional(), // Campo opcional para compatibilidad
  observations: z.string().optional(),
  scheduledDate: z.date({
    required_error: 'La fecha programada es requerida',
  }),
});

export type VisitFormValues = z.infer<typeof formSchema>;

interface VisitFormProps {
  onSubmit: (data: VisitFormValues) => void | Promise<void>;
  initialData?: Partial<VisitFormValues>;
  isSubmitting?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
  hideButtons?: boolean;
  onCancel?: () => void;
}

export const VisitForm: React.FC<VisitFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting = false,
  formRef,
  hideButtons = false,
  onCancel,
}) => {
  const form = useForm<VisitFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      phone: initialData?.phone || '',
      status: initialData?.status || (DEFAULT_VISIT_STATUS as VisitStatus),
      fullAddress: initialData?.fullAddress || undefined,
      address: initialData?.address || '',
      municipality: initialData?.municipality || '',
      observations: initialData?.observations || '',
      scheduledDate: initialData?.scheduledDate || new Date(),
    },
  });

  // Función para manejar la selección de dirección
  const handleAddressSelect = React.useCallback((address: FormattedAddress | null) => {
    console.log('handleAddressSelect llamado con:', address);
    
    if (address) {
      // Crear un nuevo objeto para asegurar que se detecte el cambio
      const newAddress = {
        ...address,
        // Asegurarse de que los componentes existan
        componentes: {
          calle: address.componentes?.calle || '',
          numero: address.componentes?.numero || '',
          comuna: address.componentes?.comuna || '',
          ciudad: address.componentes?.ciudad || '',
          region: address.componentes?.region || '',
          pais: address.componentes?.pais || 'Chile',
          codigoPostal: address.componentes?.codigoPostal || '',
        }
      };
      
      form.setValue('fullAddress', newAddress, { shouldValidate: true, shouldDirty: true });
      // Mantenemos los campos legacy actualizados por compatibilidad
      form.setValue('address', newAddress.textoCompleto, { shouldDirty: true });
      form.setValue('municipality', newAddress.componentes?.comuna || '', { shouldDirty: true });
      
      console.log('Dirección establecida:', newAddress);
    } else {
      console.log('Limpiando dirección...');
      form.setValue('fullAddress', null, { shouldValidate: true, shouldDirty: true });
      form.setValue('address', '', { shouldDirty: true });
      form.setValue('municipality', '', { shouldDirty: true });
    }
  }, [form]);

  const handleInternalSubmit = React.useCallback(async (data: VisitFormValues) => {
    try {
      // Preparar los datos para guardar
      const visitData = {
        ...data,
        // Asegurarse de que el status sea del tipo correcto
        status: data.status as VisitStatus,
        // Asegurarse de que la fecha sea un objeto Date
        scheduledDate: data.scheduledDate || new Date(),
      };

      await onSubmit(visitData);
    } catch (error) {
      console.error('Error en VisitForm:', error);
      throw error;
    }
  }, [onSubmit]);

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(handleInternalSubmit)}
        className="space-y-2"
      >
        {/* Fila 1 - Nombre y Teléfono */}
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1 w-full">
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem className="space-y-1 w-64">
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <InputDate
                    date={field.value}
                    onSelect={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
        </div>

        {/* Fila 2 - Fecha y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    excludeCountryCode={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VISIT_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fila 3 - Dirección */}
        <FormField
          control={form.control}
          name="fullAddress"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <AddressInput
                  onPlaceSelected={handleAddressSelect}
                  value={field.value ?? null}
                  placeholder="Buscar dirección..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fila 4 - Observaciones */}
        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botones - Solo se muestran si hideButtons es false */}
        {!hideButtons && (
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};
