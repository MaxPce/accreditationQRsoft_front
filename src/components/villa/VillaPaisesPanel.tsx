// src/components/villa/VillaPaisesPanel.tsx
import { useEffect, useState } from "react";
import {
  getBuildingCountries,
  assignCountryToBuilding,
  removeCountryFromBuilding,
  listAllCountries,
  type VillageBuilding,
  type BuildingCountry,
  type CountryOption,
} from "../../api/village.api";

interface Props {
  buildings: VillageBuilding[];
}

export default function VillaPaisesPanel({ buildings }: Props) {
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [assignedCountries, setAssignedCountries] = useState<BuildingCountry[]>([]);
  const [allCountries, setAllCountries]           = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry]     = useState<string>("");
  const [loading, setLoading]                     = useState(false);
  const [msg, setMsg]                             = useState<string | null>(null);
  const [err, setErr]                             = useState<string | null>(null);

  useEffect(() => {
    listAllCountries().then(setAllCountries).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBuilding) { setAssignedCountries([]); return; }
    setLoading(true);
    getBuildingCountries(selectedBuilding)
      .then(setAssignedCountries)
      .catch(() => setAssignedCountries([]))
      .finally(() => setLoading(false));
  }, [selectedBuilding]);

  const handleAssign = async () => {
    if (!selectedBuilding || !selectedCountry) return;
    setMsg(null); setErr(null);
    try {
      await assignCountryToBuilding(selectedBuilding, selectedCountry);
      const updated = await getBuildingCountries(selectedBuilding);
      setAssignedCountries(updated);
      setSelectedCountry("");
      setMsg("País asignado correctamente");
    } catch (e: any) {
      setErr(e.response?.data?.message || "Error al asignar país");
    }
  };

  const handleRemove = async (idcountry: string) => {
    if (!selectedBuilding) return;
    setMsg(null); setErr(null);
    try {
      await removeCountryFromBuilding(selectedBuilding, idcountry);
      setAssignedCountries((prev) => prev.filter((c) => c.idcountry !== idcountry));
      setMsg("País removido");
    } catch (e: any) {
      setErr(e.response?.data?.message || "Error al remover país");
    }
  };

  const availableCountries = allCountries.filter(
    (c) => !assignedCountries.some((a) => a.idcountry === c.idcountry)
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Asigna los países que tienen acceso a cada edificio. Solo ingresará si el
        país del atleta está asignado al edificio seleccionado.
      </p>

      <div>
        <label className="block text-sm font-medium mb-1">Selecciona un edificio</label>
        <select
          className="w-full border rounded p-2 bg-white text-sm"
          value={selectedBuilding}
          onChange={(e) => { setSelectedBuilding(e.target.value); setMsg(null); setErr(null); }}
        >
          <option value="">-- Seleccionar --</option>
          {buildings.map((b) => (
            <option key={b.idbuilding} value={b.idbuilding}>
              {b.name_es}
            </option>
          ))}
        </select>
      </div>

      {selectedBuilding && (
        <>
          <div>
            <p className="text-sm font-medium mb-2">Países asignados:</p>
            {loading ? (
              <p className="text-sm text-gray-400">Cargando...</p>
            ) : assignedCountries.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Sin países asignados</p>
            ) : (
              <div className="flex flex-col gap-1">
                {assignedCountries.map((c) => (
                  <div
                    key={c.idcountry}
                    className="flex items-center justify-between border rounded px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-medium">{c.idcountry}</span> — {c.country_name}
                    </span>
                    <button
                      onClick={() => handleRemove(c.idcountry)}
                      className="text-red-500 text-xs hover:underline ml-3"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <select
              className="w-full border rounded p-2 bg-white text-sm"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
            >
              <option value="">Agregar país...</option>
              {availableCountries.map((c) => (
                <option key={c.idcountry} value={c.idcountry}>
                  {c.idcountry} — {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedCountry}
              className="w-full bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40"
            >
              + Asignar país
            </button>
          </div>

          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </>
      )}
    </div>
  );
}