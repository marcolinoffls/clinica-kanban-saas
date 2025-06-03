
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Componente de Estado de Carregamento para Contatos
 * 
 * Exibe skeletons enquanto os dados dos contatos estão sendo carregados.
 * Simula a estrutura da tabela de contatos.
 */

export const ContactsLoadingState = () => {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      
      {/* Table skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
};
