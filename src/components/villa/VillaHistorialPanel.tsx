// src/components/villa/VillaHistorialPanel.tsx
import { useState } from "react";
import HistoryPanel from "../HistoryPanel";
import { getVillageHistory, type VillageHistoryRecord, type VillageBuilding } from "../../api/village.api";

const GATE_LABELS: Record<string, string> = {
  puerta1: "Puerta 1",
  puerta2: "Puerta 2",
};

interface Props {
  buildings: VillageBuilding[];
}

export default function VillaHistorialPanel({ buildings }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    docnumber:  "",
    idbuilding: "",
    gate:       "",
    date:       today,
  });

  const set = (key: keyof typeof filters) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  const clearFilters = () =>
    setFilters({ docnumber: "", idbuilding: "", gate: "", date: "" });

  const filterSlot = (
    <div className="flex flex-col gap-2">
      {/* Fecha */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Fecha</label>
        <input
            type="date"
            value={filters.date}
            onChange={set("date")}
            className="w-full border rounded p-2 text-sm bg-white"
            />
      </div>

      {/* Edificio */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Edificio</label>
        <select
            value={filters.idbuilding}
            onChange={set("idbuilding")}
            className="w-full border rounded p-2 text-sm bg-white"
            >
            <option value="">Todos</option>
            <option value="__null__">Sin edificio</option>   {/* ← añadir */}
            {buildings.map((b) => (
                <option key={b.idbuilding} value={b.idbuilding}>
                {b.name_es}
                </option>
            ))}
            </select>
      </div>

      {/* Puerta */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Puerta</label>
        <select
          value={filters.gate}
          onChange={set("gate")}
          className="w-full border rounded p-2 text-sm bg-white"
        >
          <option value="">Todas</option>
          <option value="puerta1">Puerta 1</option>
          <option value="puerta2">Puerta 2</option>
          <option value="__null__">Sin puerta (edificio)</option>
        </select>
      </div>

      {/* Documento */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Nº Documento</label>
        <input
          type="text"
          placeholder="Buscar por documento..."
          value={filters.docnumber}
          onChange={set("docnumber")}
          className="w-full border rounded p-2 text-sm"
        />
      </div>
    </div>
  );

  const renderRow = (r: VillageHistoryRecord, i: number) => (
    <div key={i} className="border rounded px-3 py-3 flex flex-col gap-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{r.person.fullname}</span>
        <span className="text-xs text-gray-400">
          {new Date(r.scanned_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5">
        <span>Doc: {r.person.docnumber}</span>
        {r.country_name && <span>🌎 {r.country_name}</span>}
        {r.role?.name   && <span>🎫 {r.role.name}</span>}
      </div>
      <div className="text-xs flex gap-2 mt-0.5">
        {r.building_name && (
          <span className="bg-gray-100 rounded px-2 py-0.5">🏢 {r.building_name}</span>
        )}
        {r.gate && (
          <span className="bg-gray-100 rounded px-2 py-0.5">🚪 {GATE_LABELS[r.gate] ?? r.gate}</span>
        )}
        {!r.gate && !r.building_name && (
          <span className="text-gray-300 italic">Sin detalle</span>
        )}
      </div>
    </div>
  );

  return (
    <HistoryPanel<VillageHistoryRecord>
      fetchFn={getVillageHistory}
      renderRow={renderRow}
      filterSlot={filterSlot}
      filters={filters}
      onClearFilters={clearFilters}
      emptyText="No hay registros para los filtros seleccionados"
    />
  );
}