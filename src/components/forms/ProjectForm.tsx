'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { format as formatDateFns, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatDateForInput } from '@/utils/date-helpers';

// Tipos y constantes locales
type ProjectStatus =
  | 'ingresado'
  | 'en_proceso'
  | 'completado'
  | 'facturado'
  | 'pagado'
  | 'cancelado';
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
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import ClientModal from '@/components/client-modal';
import { cn } from '@/lib/utils';
import { Autocomplete } from '@/components/ui/autocomplete';

// Componentes de formulario de shadcn
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Servicios y tipos
import { getClients as fetchClientsFromService } from '@/services/clientService';
import { UNINSTALL_TYPE_OPTIONS, PROJECT_STATUS_OPTIONS } from '@/lib/constants';
import { FormattedAddress } from '@/types/project'; // Importar el tipo FormattedAddress

// Esquema para la dirección
const addressSchema = z.object({
  textoCompleto: z.string().min(1, 'La dirección es requerida'),
  placeId: z.string({ required_error: 'Place ID no es válido' }).min(1, 'Place ID es requerido'),
  coordenadas: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  componentes: z
    .object({
      calle: z.string().optional(),
      numero: z.string().optional(),
      comuna: z.string().optional(),
      ciudad: z.string().optional(),
      region: z.string().optional(),
      pais: z.string().optional(),
      codigoPostal: z.string().optional(),
    })
    .optional(),
  detalle: z.string().optional(),
});

// Esquema principal del formulario
export const projectFormSchema = z
  .object({
    clientId: z.string().min(1, 'Cliente es requerido.'),
    projectNumber: z.string().min(1, 'Número de proyecto es requerido.'),
    glosa: z.string().optional(),
    date: z.date({ required_error: 'Fecha de inicio es requerida.' }),
    status: z.enum(PROJECT_STATUS_OPTIONS as unknown as [string, ...string[]], {
      required_error: 'Estado es requerido.',
    }),
    subtotal: z.preprocess(
      (val) =>
        typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val,
      z
        .number({ invalid_type_error: 'Subtotal debe ser un número.' })
        .min(0, 'Subtotal no puede ser negativo.')
    ),
    taxRate: z.preprocess(
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
    ),
    windowsCount: z.preprocess(
      (val) =>
        val === '' || val === undefined || val === null
          ? 0
          : typeof val === 'string'
            ? parseInt(val, 10)
            : val,
      z.number().int().min(0).optional().default(0)
    ),
    squareMeters: z.preprocess(
      (val) =>
        val === '' || val === undefined || val === null
          ? 0
          : typeof val === 'string'
            ? parseFloat(val)
            : val,
      z.number().min(0).optional().default(0)
    ),
    phone: z.string().optional(),
    fullAddress: addressSchema.optional(),
    description: z.string().optional(),
    uninstall: z.boolean().default(false),
    uninstallTypes: z.array(z.string()).optional().default([]),
  })
  .refine((data) => !!data.fullAddress, {
    message: 'La dirección es requerida. Por favor, selecciónala de la lista.',
    path: ['fullAddress'],
  });

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>;
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
  defaultValues = {},
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Guardar',
  onClientAdd,
  onCancel,
  hideButtons = false,
  formRef,
}: ProjectFormProps) {
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
      subtotal: 0,
      taxRate: 19,
      windowsCount: 0,
      squareMeters: 0,
      phone: '',
      description: '',
      uninstall: false,
      uninstallTypes: [],
      fullAddress: {
        textoCompleto: '',
        coordenadas: { latitude: 0, longitude: 0 },
        componentes: {
          calle: '',
          numero: '',
          comuna: '',
          ciudad: '',
          region: '',
          pais: 'Chile',
          codigoPostal: '',
        },
      },
      ...defaultValues,
    },
  });

  const { control, watch, setValue } = form;

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
        onSubmit={form.handleSubmit(onSubmit)} 
        className='space-y-6'
      >
        <div className='w-full gap-3 space-y-1.5'>
          <div className='w-full flex row gap-4'>
            {/* Campo de Cliente */}
            <FormField
              control={form.control}
              name='clientId'
              render={({ field }) => (
                <FormItem className='w-64 space-y-1.5'>
                  <div className='flex items-center justify-start'>
                    <FormLabel>Cliente *</FormLabel>
                    {onClientAdd && (
                      <Button 
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='text-sm text-primary pl-2 h-auto'
                        onClick={() => {
                          setIsClientModalOpen(true);
                        }}
                      >
                        <PlusCircle className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                  <Autocomplete
                    items={clients.map(client => ({
                      value: client.id,
                      label: client.name,
                      ...client
                    }))}
                    value={field.value}
                    onSelect={field.onChange}
                    placeholder="Seleccionar cliente..."
                    emptyText="No se encontraron clientes."
                    searchPlaceholder="Buscar cliente..."
                    disabled={isLoadingClients}
                    isLoading={isLoadingClients}
                    className="w-full"
                  />
                  <FormMessage />
                  {onClientAdd && (
                    <ClientModal
                      isOpen={isClientModalOpen}
                      onClose={() => setIsClientModalOpen(false)}
                      onSave={async (newClient) => {
                        try {
                          // Asegurarse de que los tipos sean correctos
                          const clientToAdd = {
                            name: String(newClient.name || ''),
                            email: newClient.email ? String(newClient.email) : undefined,
                            phone: newClient.phone ? String(newClient.phone) : undefined,
                          } as Omit<LocalClient, 'id' | 'createdAt' | 'updatedAt'>;

                          await onClientAdd(clientToAdd);
                          // Recargar la lista de clientes
                          await refetchClients();
                          // Cerrar el modal
                          setIsClientModalOpen(false);
                        } catch (error) {
                          console.error('Error al guardar el cliente:', error);
                        }
                      }}
                    />
                  )}
                </FormItem>
              )}
            />

            {/* Campo de Número de Proyecto */}
            <FormField
              control={form.control}
              name='projectNumber'
              render={({ field }) => (
                <FormItem className='w-36 space-y-1.5'>
                  <div className='flex items-center justify-start'>
                    <FormLabel>Proyecto</FormLabel>
                  </div>
                  <Input 
                    {...field} 
                    className='w-full'
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className='flex flex-row gap-4'>
            {/* Glosa */}
            <FormField
              control={form.control}
              name='glosa'
              render={({ field }) => (
                <FormItem className='w-64 space-y-1.5'>
                  <Input 
                    label='Glosa'
                    placeholder='Descripción breve del proyecto' 
                    {...field} 
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Teléfono */}
            <FormField
              control={form.control}
              name='phone'
              render={({ field }) => (
                <FormItem className='w-36 space-y-1.5'>
                  <div className='flex items-center justify-start'>
                    <FormLabel>Teléfono</FormLabel>
                  </div>
                  <Input 
                    {...field} 
                    className='w-full'
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex flex-row gap-4'>
            {/* Campo de Fecha */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="w-48 space-y-1.5">
                  <div className="flex items-center justify-start">
                    <FormLabel>Fecha *</FormLabel>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            formatDateFns(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de Estado */}
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem className='w-48 space-y-1.5'>
                  <div className='flex items-center justify-start'>
                    <FormLabel>Estado *</FormLabel>
                  </div>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Seleccionar estado' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PROJECT_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex gap-4'>
            {/* Subtotal */}
            <FormField
              control={form.control}
              name='subtotal'
              render={({ field }) => (
                <FormItem className='w-40 space-y-1.5'>
                  <div className='flex items-center justify-start'>
                    <FormLabel>Subtotal *</FormLabel>
                  </div>
                  <MoneyInput
                    value={field.value as number}
                    onValueChange={field.onChange}
                    placeholder='0,00'
                    className='w-full'
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* IVA */}
            <FormField
              control={form.control}
              name='taxRate'
              render={({ field }) => (
                <FormItem className='w-20 space-y-1.5'>
                  <div className='flex items-center justify-start'>
                    <FormLabel>IVA *</FormLabel>
                  </div>
                  <div className='relative'>
                    <Input
                      type='text'
                      inputMode='decimal'
                      value={field.value !== undefined && field.value !== null ? 
                        `${field.value.toString().replace('.', ',')} %` : 
                        ''
                      }
                      onChange={(e) => {
                        // Permitir solo números, coma y punto
                        const value = e.target.value
                          .replace(/[^0-9,.]/g, '') // Solo números, coma y punto
                          .replace(/(\..*)\./g, '$1') // Solo un punto decimal
                          .replace(/(,.*),/g, '$1'); // Solo una coma decimal
                        
                        // Si el campo está vacío, limpiar el valor
                        if (value === '') {
                          field.onChange(null);
                          return;
                        }
                        
                        // Reemplazar coma por punto para el parseo
                        const normalizedValue = value.replace(',', '.');
                        
                        // Validar que sea un número válido entre 0 y 100
                        if (/^\d*([.,]\d{0,2})?$/.test(value) || value === ',' || value === '.') {
                          const numValue = parseFloat(normalizedValue);
                          if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                            field.onChange(normalizedValue);
                          } else if (value === ',' || value === '.') {
                            field.onChange('0.');
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Formatear a 2 decimales al perder el foco
                        if (field.value !== undefined && field.value !== null) {
                          const numValue = parseFloat(field.value.toString());
                          if (!isNaN(numValue)) {
                            const formattedValue = Math.min(Math.max(0, numValue), 100);
                            field.onChange(Number(formattedValue.toFixed(2)));
                          }
                        }
                      }}
                      className='w-full text-right'
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className='w-full'>
  {/* Dirección */}
  <FormField
    control={form.control}
    name='fullAddress' // Este campo en tu Zod schema debe ser de tipo `any()` o un `z.object({...})` que coincida con FormattedAddress
    render={({ field }) => (
      <FormItem className='w-96 md:col-span-2'>
        <FormLabel>Dirección *</FormLabel>
        <FormControl>
          {/*
            La integración correcta es mucho más simple. El cambio clave es
            asegurarse de que el valor pasado a `AddressInput` siempre
            cumpla con el tipo `FormattedAddress | null`.
          */}
          <AddressInput
            // FIX: Se añade una comprobación para pasar `null` si `field.value`
            // no es un objeto válido (le falta `placeId`), lo que soluciona el error de tipo.
            value={field.value && field.value.placeId ? field.value : null}
            onPlaceSelected={(address: FormattedAddress | null) => {
              field.onChange(address); // Se pasa el objeto completo o null al estado del formulario.
            }}
            placeholder='Buscar por calle, comuna o ciudad...'
            className='w-full'
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>      

          {/* Descripción */}
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='w-96 md:col-span-2 space-y-1.5'>
                <div className='flex items-center justify-start'>
                  <FormLabel>Descripción</FormLabel>
                </div>
                <FormControl>
                  <Textarea placeholder='Descripción detallada del proyecto...' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className='flex flex-row gap-4'>
          {/* Contadores */}
          <FormField
            control={form.control}
            name='windowsCount'
            render={({ field }) => (
              <FormItem className='w-32 space-y-1.5'>
                <div className='flex items-center justify-start'>
                  <FormLabel>N° Ventanas</FormLabel>
                </div>
                <Input
                  type='number'
                  min='0'
                  {...field}
                  value={field.value || ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                  }
                  className='w-full'
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='squareMeters'
            render={({ field }) => (
              <FormItem className='w-32 space-y-1.5'>
                <div className='flex items-center justify-start'>
                  <FormLabel>m²</FormLabel>
                </div>
                <Input
                  type='number'
                  step='0.01'
                  min='0'
                  {...field}
                  value={field.value || ''}
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? 0 : Number(e.target.value))
                  }
                  className='w-full'
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          {/* Opciones de Desinstalación */}
          <div className='space-y-4 md:col-span-2'>
            <FormField
              control={form.control}
              name='uninstall'
              render={({ field }) => (
                <FormItem className='flex items-center space-x-2'>
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
                          const newTypes = checked
                            ? [...watchUninstallTypes, type]
                            : watchUninstallTypes.filter((t) => t !== type);
                          setValue('uninstallTypes', newTypes);
                        }}
                      />
                      <Label htmlFor={`uninstall-${type}`} className='font-normal'>
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones del formulario */}
          {!hideButtons && (
            <div className='flex justify-end space-x-4 pt-6'>
              {onCancel && (
                <Button type='button' variant='outline' onClick={onCancel} disabled={isSubmitting}>
                  Cancelar
                </Button>
              )}
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {submitButtonText}
              </Button>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}

export default ProjectForm;
