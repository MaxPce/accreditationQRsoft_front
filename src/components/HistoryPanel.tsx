import { useState, useCallback } from "react";

interface HistoryPanelProps<T> {
  fetchFn: (filters: Record<string, string>) => Promise<T[]>;
  renderRow: (record: T, index: number) => React.ReactNode;
  filterSlot?: React.ReactNode;
  filters: Record<string, string>;
  onClearFilters?: () => void;
  emptyText?: string;
}

export default function HistoryPanel<T>({
  fetchFn,
  renderRow,
  filterSlot,
  filters,
  onClearFilters,
  emptyText = "Sin registros",
}: HistoryPanelProps<T>) {
  const [records, setRecords]   = useState<T[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const clean = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v.trim() !== "")
      );
      const data = await fetchFn(clean);
      setRecords(data);
      setSearched(true);
    } catch {
      setError("No se pudo cargar el historial");
    } finally {
      setLoading(false);
    }
  }, [fetchFn, filters]);

  const hasActiveFilters = Object.values(filters).some((v) => v.trim() !== "");

  return (
    <div className="flex flex-col gap-3">
      {filterSlot}

      <div className="flex gap-2">
        <button
          onClick={load}
          className="flex-1 px-4 py-2 bg-black text-white rounded text-sm font-medium"
        >
          Buscar
        </button>
        {hasActiveFilters && onClearFilters && (
          <button
            onClick={() => {
              onClearFilters();
              setRecords([]);
              setSearched(false);
            }}
            title="Limpiar filtros"
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-600"
          >
            ✕ Limpiar
          </button>
        )}
        <button
          onClick={load}
          title="Recargar"
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
        >
          🔄
        </button>
      </div>

      {loading && (
        <p className="text-gray-500 text-sm text-center animate-pulse">Cargando...</p>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {searched && !loading && (
        records.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">{emptyText}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-400">{records.length} registro(s)</p>
            {records.map((r, i) => renderRow(r, i))}
          </div>
        )
      )}
    </div>
  );
}