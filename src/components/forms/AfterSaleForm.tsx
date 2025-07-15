"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import { Loader2, Calendar, Plus, Trash2 } from "lucide-react";

// Services
import { getProjects } from "@/services/projectService";
import { addAfterSales } from "@/services/afterSalesService";

// Schema de validación
const formSchema = z.object({
  projectId: z.string().min(1, "Debe seleccionar un proyecto"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  date: z.date({
    required_error: "La fecha es requerida",
  }),
  tasks: z.array(
    z.object({
      id: z.string(),
      description: z.string().min(1, "La tarea no puede estar vacía"),
      completed: z.boolean().default(false),
    })
  ).min(1, "Debe agregar al menos una tarea"),
});

type AfterSaleFormValues = z.infer<typeof formSchema>;

interface AfterSaleFormProps {
  initialData?: any;
  isSubmitting?: boolean;
  onSubmitSuccess?: () => void;
}

export function AfterSaleForm({ 
  initialData, 
  isSubmitting = false,
  onSubmitSuccess 
}: AfterSaleFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Obtener proyectos para el combobox
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });

  // Formulario
  const form = useForm<AfterSaleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      projectId: "",
      description: "",
      date: new Date(),
      tasks: [{ id: Date.now().toString(), description: "", completed: false }],
    },
  });

  // Mutación para crear postventa
  const createMutation = useMutation({
    mutationFn: async (data: AfterSaleFormValues) => {
      const afterSalesData = {
        projectId: data.projectId,
        description: data.description,
        entryDate: data.date,
        afterSalesStatus: 'Ingresada' as const, // Asegurar el tipo correcto
        tasks: data.tasks.map(task => ({
          id: task.id,
          description: task.description,
          isCompleted: task.completed,
          createdAt: new Date(),
          completedAt: task.completed ? new Date() : undefined
        }))
      };
      return await addAfterSales(afterSalesData);
    },
    onSuccess: () => {
      toast({
        title: "Postventa creada",
        description: "La postventa se ha creado correctamente.",
      });
      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else {
        router.push("/aftersales");
      }
    },
    onError: (error) => {
      console.error("Error al crear la postventa:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la postventa. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  // Manejar envío del formulario
  const onSubmit = async (data: AfterSaleFormValues) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
    }
  };

  // Manejar agregar tarea
  const handleAddTask = () => {
    const tasks = form.getValues("tasks");
    form.setValue("tasks", [
      ...tasks,
      { id: Date.now().toString(), description: "", completed: false },
    ]);
  };

  // Manejar eliminar tarea
  const handleRemoveTask = (index: number) => {
    const tasks = form.getValues("tasks");
    form.setValue(
      "tasks",
      tasks.filter((_, i) => i !== index)
    );
  };

  if (isLoadingProjects) {
    return <FormSkeleton />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Proyecto */}
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proyecto</FormLabel>
                <Combobox
                  items={projects.map((project) => ({
                    value: project.id,
                    label: project.projectNumber || `Proyecto ${project.id}`,
                    clientName: project.clientName,
                    glosa: project.glosa,
                  }))}
                  value={field.value}
                  onSelect={field.onChange}
                  placeholder="Buscar proyecto..."
                  emptyText="No se encontraron proyectos"
                  isLoading={isLoadingProjects}
                  renderSelectedItem={(item) => (
                    <div className="flex flex-col">
                      <span className="font-medium">{item.label}</span>
                      {item.clientName && item.glosa && (
                        <span className="text-xs text-muted-foreground">
                          {item.clientName} - {item.glosa}
                        </span>
                      )}
                    </div>
                  )}
                  renderItem={(item) => (
                    <div className="flex flex-col">
                      <span className="font-medium">{item.label}</span>
                      {item.clientName && item.glosa && (
                        <span className="text-xs text-muted-foreground">
                          {item.clientName} - {item.glosa}
                        </span>
                      )}
                    </div>
                  )}
                  disabled={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <div className="w-full">
                <DatePicker
                  date={field.value}
                  onSelect={field.onChange}
                  className="w-full"
                  calendarProps={{
                    disabled: isSubmitting,
                    fromDate: new Date(2020, 0, 1),
                    toDate: new Date(),
                  }}
                />
              </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción de la postventa..."
                    className="min-h-[100px]"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tareas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Tareas</FormLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddTask}
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar tarea
              </Button>
            </div>

            {form.watch("tasks").map((task, index) => (
              <div key={task.id} className="flex items-start space-x-2">
                <FormField
                  control={form.control}
                  name={`tasks.${index}.completed`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`tasks.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Descripción de la tarea"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTask(index)}
                  disabled={isSubmitting || form.watch("tasks").length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {form.formState.errors.tasks && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.tasks.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/aftersales")}
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
              "Guardar"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Componente de carga esquelético
function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
      <div className="flex justify-end space-x-4 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
