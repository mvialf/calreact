'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { format as formatDateFns, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDateForInput } from '@/utils/date-helpers';
import { useToast } from '@/components/ui/use-toast';

// Imports de tipos y constantes correctos
import type { ProjectStatus } from '@/types/project';
import { PROJECT_STATUS_OPTIONS, UNINSTALL_TYPE_OPTIONS } from '@/constants/project';
import { DEFAULT_TAX_RATE, DEFAULT_SUBTOTAL, DEFAULT_WINDOWS_COUNT, DEFAULT_SQUARE_METERS, DEFAULT_COUNTRY } from '@/constants/defaults';

// Tipos locales (sin duplicar ProjectStatus)
type UninstallType = 'retiro_cristales' | 'retiro_marco' | 'retiro_completo' | 'otro';

interface LocalClient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  rut?: string;
  businessName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Servicio para obtener clientes
import { getClients } from '@/services/clientService';

// Función para obtener clientes con el tipo LocalClient
async function fetchClients(): Promise<LocalClient[]> {
  const clients = await getClients();
  // Mapear los clientes al tipo LocalClient
  return clients.map((client) => ({
    id: client.id,
    name: client.name,
    phone: client.phone || '',
    email: client.email || '',
    address: '', // Este campo podría no existir en Client
    rut: '', // Este campo podría no existir en Client
    businessName: '', // Este campo podría no existir en Client
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
  }));
}

// Componentes UI
import { MoneyInput } from '@/components/ui/money-input';
// Eliminada la importación de TaxRateInput ya que usaremos Input
import { AddressInput } from '@/components/ui/addressInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, PlusCircle } from 'lucide-react';
import ClientModal from '@/components/client-modal';
import { cn } from '@/lib/utils';
import { Autocomplete } from '@/components/ui/autocomplete';

// Componentes de formulario de shadcn
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';

// Servicios y tipos
import { getClients as fetchClientsFromService } from '@/services/clientService';
import { FormattedAddress } from '@/types/project'; // Importar el tipo FormattedAddress

// Esquemas de validación centralizados
import { 
  requiredString,
  optionalString,
  requiredDate,
  dynamicEnum,
  phoneSchema,
  fullAddressSchema,
  preprocessedInteger,
  preprocessedNumber,
  commonProjectFields,
  conditionalRequired
} from '@/utils/validation-schemas';

// Esquemas específicos para ProjectForm
const subtotalSchema = z.preprocess(
  (val) =>
    typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val,
  z
    .number({ invalid_type_error: 'Subtotal debe ser un número.' })
    .min(0, 'Subtotal no puede ser negativo.')
);

const taxRateSchema = z.preprocess(
  (val) => {
    if (val === '') return undefined;
    if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
    return val;
  },
  z
    .number({ invalid_type_error: 'IVA debe ser un número.' })
    .min(0, 'El IVA no puede ser negativo.')
    .max(100, 'El IVA no puede ser mayor a 100%')
    .refine(
      (val) => {
        const decimalPart = String(val).split('.')[1];
        return !decimalPart || decimalPart.length <= 2;
      },
      { message: 'Máximo 2 decimales permitidos' }
    )
    .default(19)
);

// Esquema principal del formulario
export const projectFormSchema = z
  .object({
    clientId: requiredString('Cliente'),
    projectNumber: requiredString('Número de proyecto'),
    glosa: optionalString,
    date: requiredDate('Fecha de inicio'),
    status: dynamicEnum(PROJECT_STATUS_OPTIONS, 'Estado'),
    subtotal: subtotalSchema,
    taxRate: taxRateSchema,
    windowsCount: preprocessedInteger("Número de ventanas"),
    squareMeters: preprocessedNumber("Metros cuadrados"),
    phone: phoneSchema,
    fullAddress: fullAddressSchema,
    description: optionalString,
    uninstall: z.boolean().default(false),
    uninstallTypes: z.array(z.string()).optional().default([]),
  })
  .refine((data) => !!data.fullAddress, {
    message: 'La dirección es requerida. Por favor, selecciónala de la lista.',
    path: ['fullAddress'],
  });

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  initialData?: Partial<ProjectFormValues>;
  onSubmit: SubmitHandler<ProjectFormValues>;
  isSubmitting?: boolean;
  submitButtonText?: string;
  onClientAdd?: (client: Omit<LocalClient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel?: () => void;
  /**
   * Si es true, oculta los botones del formulario para ser manejados externamente
   * @default false
   */
  hideButtons?: boolean;
  /**
   * Referencia al formulario para ser controlado externamente
   */
  formRef?: React.RefObject<HTMLFormElement>;
}

export function ProjectForm({
  initialData = {},
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Guardar',
  onClientAdd,
  onCancel,
  hideButtons = false,
  formRef,
}: ProjectFormProps) {
  const { toast } = useToast();
  
  const {
    data: clients = [],
    isLoading: isLoadingClients,
    refetch: refetchClients,
  } = useQuery<LocalClient[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      clientId: '',
      projectNumber: '',
      glosa: '',
      date: new Date(),
      status: 'ingresado',
      subtotal: DEFAULT_SUBTOTAL,
      taxRate: DEFAULT_TAX_RATE,
      windowsCount: DEFAULT_WINDOWS_COUNT,
      squareMeters: DEFAULT_SQUARE_METERS,
      phone: initialData?.phone || '',
      description: '',
      uninstall: false,
      uninstallTypes: [],
      fullAddress: undefined,
      ...initialData,
    },
  });

  const { control, watch, setValue, formState: { errors } } = form;

  // Mostrar toasts cuando hay errores de validación
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Mostrar un toast general de error de validación
      toast({
        title: 'Error de validación',
        description: 'Por favor, revisa los campos marcados en rojo.',
        variant: 'destructive',
      });
    }
  }, [errors, toast]);

  // Manejador de envío personalizado
  const handleFormSubmit = async (data: ProjectFormValues) => {
    try {
      await onSubmit(data);
      toast({
        title: '¡Éxito!',
        description: 'El proyecto se ha guardado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error al guardar el proyecto',
        variant: 'destructive',
      });
    }
  };

  const watchUninstall = watch('uninstall');
  const watchUninstallTypes = watch('uninstallTypes') || [];
  const watchClientId = watch('clientId');

  // Efecto para cargar datos del cliente seleccionado
  useEffect(() => {
    if (watchClientId) {
      const selectedClient = clients.find((c) => c.id === watchClientId);
      if (selectedClient) {
        setValue('phone', selectedClient.phone || '');
        // No intentamos establecer la dirección ya que no es parte del tipo Client
      }
    }
  }, [watchClientId, clients, setValue]);
  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(handleFormSubmit)}
      >
        <div className='space-y-1.5'>

          {/* Bloque de campos con espaciado interno */}
          <div className='w-full space-y-1.5'>
            {/* Fila Cliente y Proyecto */}
            <div className='flex w-full flex-row items-start gap-4'>
              <FormField
                control={form.control}
                name='clientId'
                render={({ field }) => (
                  <FormItem className='w-64 space-y-1'>
                    
                    <FormLabel className='inline-flex items-center gap-1'>
                      Cliente *
                      {onClientAdd && (
                        <Button 
                          type='button' 
                          variant='ghost' 
                          size='icon' 
                          className='h-4 w-4 p-0 -mr-1 text-primary hover:bg-transparent hover:text-primary/80' 
                          onClick={() => setIsClientModalOpen(true)}
                        >
                          <PlusCircle className='h-3.5 w-3.5' />
                        </Button>
                      )}
                    </FormLabel>
                    <Autocomplete
                      items={clients.map(client => ({ value: client.id, label: client.name, ...client }))}
                      value={field.value}
                      onSelect={field.onChange}
                      placeholder="Seleccionar cliente..."
                      emptyText="No se encontraron clientes."
                      searchPlaceholder="Buscar cliente..."
                      disabled={isLoadingClients}
                      isLoading={isLoadingClients}
                      className="w-full"
                    />

                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='projectNumber'
                render={({ field }) => (
                  <FormItem className='w-36 space-y-1'>
                    <FormLabel>Proyecto</FormLabel>
                    <Input {...field} className='w-full' />

                  </FormItem>
                )}
              />
            </div>

            {/* Fila Glosa y Teléfono */}
            <div className='flex flex-row items-start gap-4'>
              <FormField
                control={form.control}
                name='glosa'
                render={({ field }) => ( 
                  <FormItem className='w-1/2 space-y-1'>
                    <FormLabel>Glosa</FormLabel>
                    <Input placeholder='Descripción breve del proyecto' {...field} />

                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem className='w-1/2 space-y-1'>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <PhoneInput {...field} />
                    </FormControl>
                    <p className='text-xs text-muted-foreground'>
                      Formato: +56912345678 o 912345678
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* Fila Fecha y Estado */}
            <div className='flex flex-row items-start gap-4'>
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="w-36 space-y-1">
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          field.onChange(date);
                        }}
                        className="w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='w-40 space-y-1'>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder='Seleccionar estado' /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_STATUS_OPTIONS.map((status) => (<SelectItem key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</SelectItem>))}
                      </SelectContent>
                    </Select>

                  </FormItem>
                )}
              />
            </div>

            {/* Fila Elementos, m², IVA y Subtotal */}
            <div className='flex items-start gap-4'>
              <FormField
                control={form.control}
                name='windowsCount'
                render={({ field }) => (
                  <FormItem className='w-20 space-y-1'>
                    <FormLabel>Elementos</FormLabel>
                    <Input type='number' min='0' {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} className='w-full' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='squareMeters'
                render={({ field }) => (
                  <FormItem className='w-20 space-y-1'>
                    <FormLabel>m²</FormLabel>
                    <Input type='number' step='0.01' min='0' {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))} className='w-full' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='taxRate'
                render={({ field }) => (
                  <FormItem className='w-16 space-y-1'>
                    <FormLabel>IVA *</FormLabel>
                    <Input
                      type='text'
                      value={field.value != null ? `${String(field.value).replace('.', ',')} %` : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9,.]/g, '');
                        if (value === '') { field.onChange(null); return; }
                        const normalizedValue = value.replace(',', '.');
                        if (/^\d*([.,]\d{0,2})?$/.test(value) || value === ',' || value === '.') {
                          const numValue = parseFloat(normalizedValue);
                          if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                            field.onChange(normalizedValue);
                          } else if (value === ',' || value === '.') {
                            field.onChange('0.');
                          }
                        }
                      }}
                      onBlur={() => {
                        if (field.value != null) {
                          const numValue = parseFloat(String(field.value));
                          if (!isNaN(numValue)) {
                            const formattedValue = Math.min(Math.max(0, numValue), 100);
                            field.onChange(Number(formattedValue.toFixed(2)));
                          }
                        }
                      }}
                      className='w-full text-right'
                    />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='subtotal'
                render={({ field }) => (
                  <FormItem className='w-32 space-y-1'>
                    <FormLabel>Subtotal *</FormLabel>
                    <MoneyInput value={field.value} onValueChange={field.onChange} placeholder='$ 0' className='w-full' />
                  </FormItem>
                )}
              />
            </div>

            {/* Fila Dirección */}
            <FormField
              control={form.control}
              name='fullAddress'
              render={({ field }) => (
                <FormItem className='w-96 space-y-1'>
                  <FormLabel>Dirección *</FormLabel>
                  <FormControl>
                    <AddressInput
                      value={field.value ?? null}
                      onSelect={(address) => {
                        if (!address) {
                          field.onChange(null);
                          return;
                        }
                        
                        // Asegurar que la dirección tenga la estructura completa
                        const completeAddress = {
                          ...address,
                          placeId: address.placeId || '',
                          textoCompleto: address.textoCompleto || '',
                          coordenadas: address.coordenadas || { latitude: 0, longitude: 0 },
                          componentes: {
                            ...(address.componentes || {}),
                            calle: address.componentes?.calle || '',
                            numero: address.componentes?.numero || '',
                            comuna: address.componentes?.comuna || '',
                            ciudad: address.componentes?.ciudad || '',
                            region: address.componentes?.region || '',
                            pais: address.componentes?.pais || DEFAULT_COUNTRY,
                            codigoPostal: address.componentes?.codigoPostal || ''
                          }
                        };
                        
                        field.onChange(completeAddress);
                      }}
                      placeholder='Buscar por calle, comuna o ciudad...'
                      className='w-full'
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          {/* Opciones de Desinstalación */}
          <div className='space-y-2 py-2'>
            <FormField
              control={form.control}
              name='uninstall'
              render={({ field }) => (
                <FormItem className='flex items-center space-x-2 space-y-2'>
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className='!mt-0'>Requiere desinstalación</FormLabel>
                </FormItem>
              )}
            />
            {watchUninstall && (
              <div className='pl-6 space-y-2'>
                <Label>Tipos de desinstalación</Label>
                <div className='flex flex-wrap gap-2'>
                  {UNINSTALL_TYPE_OPTIONS.map((type) => (
                    <div key={type} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`uninstall-${type}`}
                        checked={watchUninstallTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          const newTypes = checked ? [...watchUninstallTypes, type] : watchUninstallTypes.filter((t) => t !== type);
                          setValue('uninstallTypes', newTypes);
                        }}
                      />
                      <Label htmlFor={`uninstall-${type}`} className='font-normal'>{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
          {/* Campo Descripción */}
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='w-96 space-y-1'>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea placeholder='Descripción detallada del proyecto...' {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        

        {/* Botones del Formulario */}
        {!hideButtons && (
          <div className='flex justify-end space-x-4 pt-6'>
            {onCancel && (<Button type='button' variant='outline' onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>)}
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {submitButtonText}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}