"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

// Componentes
import { AfterSaleForm } from "@/components/forms/AfterSaleForm";

export default function NewAfterSalePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Manejar envío exitoso
  const handleSuccess = () => {
    // Invalidar la caché de postventas
    queryClient.invalidateQueries({ queryKey: ["after-sales"] });
    // Redirigir a la lista de postventas
    router.push("/aftersales");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Postventa</h1>
          <p className="text-muted-foreground">
            Complete el formulario para registrar una nueva postventa.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <AfterSaleForm onSubmitSuccess={handleSuccess} />
      </div>
    </div>
  );
}