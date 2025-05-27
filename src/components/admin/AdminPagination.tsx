
import { Button } from '@/components/ui/button';

/**
 * Componente de Paginação para Administração
 * 
 * Fornece controles de navegação entre páginas com informações
 * sobre quantos itens estão sendo exibidos e total de páginas.
 * 
 * Props:
 * - currentPage: página atual (baseada em 1)
 * - totalPages: total de páginas disponíveis
 * - itemsPerPage: itens por página
 * - totalItems: total de itens
 * - startIndex: índice do primeiro item da página atual
 * - onPageChange: função para mudar de página
 */

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  onPageChange: (page: number) => void;
}

export const AdminPagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  onPageChange
}: AdminPaginationProps) => {
  // Não exibir paginação se só houver uma página
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-4">
      {/* Informações sobre os itens exibidos */}
      <p className="text-sm text-gray-600">
        Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, totalItems)} de {totalItems} clínicas
      </p>
      
      {/* Controles de navegação */}
      <div className="flex items-center gap-2">
        {/* Botão página anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
        >
          Anterior
        </Button>
        
        {/* Indicador da página atual */}
        <span className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded">
          {currentPage} de {totalPages}
        </span>
        
        {/* Botão próxima página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
};
