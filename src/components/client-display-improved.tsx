'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { ProjectType } from '@/types/project';
import { getClientNameById } from '@/services/clientSyncService';
import { Loader2, User, AlertCircle } from 'lucide-react';

interface ClientDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  clientName?: string;
  glosa?: string;
  className?: string;
  showLoading?: boolean;
}

/**
 * Componente mejorado para mostrar el nombre del cliente con estados de carga
 */
export function ClientDisplay({ 
  clientName, 
  glosa, 
  className,
  showLoading = false,
  ...props 
}: ClientDisplayProps) {
  // Si no hay nombre de cliente pero hay glosa, usamos la glosa como texto principal
  const displayText = clientName?.trim() || glosa?.trim() || 'Cliente no especificado';
  // Mostrar la glosa solo si es diferente al texto principal
  const showGlosa = glosa?.trim() && glosa.trim() !== displayText;
  
  // Estado de carga
  if (showLoading) {
    return (
      <div 
        className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
        {...props}
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Cargando cliente...</span>
      </div>
    );
  }
  
  // Determinar ícono apropiado
  const hasValidClient = clientName?.trim() && clientName !== 'Cliente no especificado';
  const IconComponent = hasValidClient ? User : AlertCircle;
  const iconColor = hasValidClient ? 'text-green-600' : 'text-amber-500';

  return (
    <div 
      className={cn('flex items-center gap-2 text-sm text-foreground', className)}
      title={showGlosa ? `${displayText} - ${glosa}` : displayText}
      {...props}
    >
      <IconComponent className={cn('h-3 w-3 flex-shrink-0', iconColor)} />
      <span className="truncate">
        {displayText}
        {showGlosa && (
          <span className="text-muted-foreground"> - {glosa}</span>
        )}
      </span>
    </div>
  );
}

/**
 * Versión del componente que acepta un objeto ProjectType con auto-sincronización
 */
interface ProjectClientDisplayProps extends Omit<ClientDisplayProps, 'clientName' | 'glosa'> {
  project: {
    id: string;
    projectNumber?: string;
    clientName?: string | null;
    clientId?: string;
    glosa?: string | null;
  };
  enableAutoSync?: boolean; // Si true, intenta sincronizar automáticamente el clientName
  showProjectNumber?: boolean;
}

/**
 * Componente mejorado para mostrar la información de un proyecto 
 * con auto-sincronización del nombre del cliente
 */
export function ProjectClientDisplay({ 
  project, 
  enableAutoSync = false,
  showProjectNumber = true,
  className,
  ...props 
}: ProjectClientDisplayProps) {
  const [clientName, setClientName] = useState(project.clientName);
  const [isLoading, setIsLoading] = useState(false);
  const [syncAttempted, setSyncAttempted] = useState(false);
  
  // Auto-sincronización del nombre del cliente
  useEffect(() => {
    const shouldSync = enableAutoSync && 
                      project.clientId && 
                      !clientName && 
                      !syncAttempted;
    
    if (shouldSync) {
      const syncClientName = async () => {
        setIsLoading(true);
        setSyncAttempted(true);
        
        try {
          console.log(`🔄 Auto-sincronizando cliente para proyecto ${project.id}...`);
          const fetchedClientName = await getClientNameById(project.clientId!);
          
          if (fetchedClientName) {
            setClientName(fetchedClientName);
            console.log(`✅ Cliente sincronizado: ${fetchedClientName}`);
          } else {
            console.warn(`⚠️ No se encontró cliente con ID: ${project.clientId}`);
          }
        } catch (error) {
          console.error('❌ Error al sincronizar cliente:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      syncClientName();
    }
  }, [project.clientId, project.id, clientName, enableAutoSync, syncAttempted]);
  
  // Determinar nombre del cliente a mostrar
  const displayClientName = clientName?.trim() || 'Cliente no especificado';
  // Mostrar la glosa solo si existe y es diferente al nombre del cliente
  const showGlosa = project.glosa?.trim() && project.glosa.trim() !== displayClientName;
  
  return (
    <div className={cn('space-y-1', className)} {...props}>
      {showProjectNumber && project.projectNumber && (
        <div className="text-sm font-medium text-primary">
          {project.projectNumber}
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Sincronizando cliente...</span>
          </div>
        ) : (
          <ClientDisplay
            clientName={displayClientName}
            glosa={showGlosa ? project.glosa?.trim() : undefined}
          />
        )}
      </div>
      
      {/* Indicador de auto-sync disponible */}
      {enableAutoSync && project.clientId && !clientName && !isLoading && syncAttempted && (
        <div className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Cliente no encontrado (ID: {project.clientId.substring(0, 8)}...)</span>
        </div>
      )}
    </div>
  );
}

/**
 * Componente de loading skeleton para cliente
 */
export function ClientDisplaySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-3 w-3 bg-muted animate-pulse rounded" />
      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
    </div>
  );
}

/**
 * Hook para obtener nombre de cliente con caché
 */
export function useClientName(clientId: string | undefined) {
  const [clientName, setClientName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!clientId) {
      setClientName(null);
      return;
    }
    
    const fetchClientName = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const name = await getClientNameById(clientId);
        setClientName(name);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setClientName(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientName();
  }, [clientId]);
  
  return { clientName, isLoading, error };
}