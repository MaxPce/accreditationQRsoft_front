// src/pages/modules/VillaPage.tsx
import { useEffect, useState } from "react";
import QrScannerInput from "../../components/QrScannerInput";
import AccreditationCard from "../../components/AccreditationCard";
import {
  lookupVillageByQr,
  lookupVillageByDocument,
  registerVillageEntry,
  listBuildings,
  getBuildingCountries,
  assignCountryToBuilding,
  removeCountryFromBuilding,
  listAllCountries,
  type VillageBuilding,
  type BuildingCountry,
  type CountryOption,
} from "../../api/village.api";
import type { Accreditation, Gate, VillageEntry } from "../../types/accreditation.types";

const DOC_TYPES = [
  { code: "1", label: "DNI" },
  { code: "2", label: "Carnet de Ext." },
  { code: "3", label: "Pasaporte" },
];

const GATE_LABELS: Record<Gate, string> = {
  puerta1: "Puerta 1",
  puerta2: "Puerta 2",
};

type MainTab = "scanner" | "edificios";

export default function VillaPage() {
  const [mainTab, setMainTab]   = useState<MainTab>("scanner");
  const [gate, setGate]         = useState<Gate>("puerta1");
  const [buildings, setBuildings]         = useState<VillageBuilding[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [accreditation, setAccreditation] = useState<Accreditation | null>(null);
  const [entriesToday, setEntriesToday]   = useState<VillageEntry[]>([]);
  const [error, setError]       = useState<string | null>(null);
  const [message, setMessage]   = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    listBuildings().then(setBuildings).catch(() => {});
  }, []);
  const resetScan = () => {
    setAccreditation(null);
    setError(null);
    setMessage(null);
    setEntriesToday([]);
  };



  const handleScan = async (value: {
    type: "qr" | "manual";
    qr?: string;
    doctype?: string;
    docnumber?: string;
  }) => {
    setError(null);
    setMessage(null);
    try {
      const res =
        value.type === "qr"
          ? await lookupVillageByQr(value.qr!)
          : await lookupVillageByDocument(value.doctype!, value.docnumber!);
      setAccreditation(res.accreditation);
      setEntriesToday(res.entriesToday);
    } catch (err: any) {
      setAccreditation(null);
      setError(err.response?.data?.message || "Acreditación no encontrada");
    }
  };

  const handleRegister = async () => {
    if (!accreditation) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await registerVillageEntry(
        accreditation.idacreditation,
        gate,
        selectedBuilding || undefined
      );
      setEntriesToday((prev) => [
        { gate, idbuilding: res.idbuilding, scanned_at: res.scannedAt },
        ...prev,
      ]);
      setMessage(
        `Ingreso registrado por ${GATE_LABELS[gate]}${selectedBuilding ? ` — ${buildings.find((b) => b.idbuilding === selectedBuilding)?.name_es ?? selectedBuilding}` : ""}`
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo registrar el ingreso");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
      {/* Tab principal */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setMainTab("scanner")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            mainTab === "scanner" ? "border-black text-black" : "border-transparent text-gray-400"
          }`}
        >
          📷 Escáner
        </button>
        <button
          onClick={() => setMainTab("edificios")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            mainTab === "edificios" ? "border-black text-black" : "border-transparent text-gray-400"
          }`}
        >
          🏢 Edificios
        </button>
      </div>

      <h1 className="text-xl font-bold">Ingreso a Villa</h1>

      {/* ── TAB SCANNER ─────────────────────────────────────────────────── */}
      {mainTab === "scanner" && (
        <>
          {/* Selector de puerta */}
          <div>
            <label className="block text-sm font-medium mb-1">Puerta</label>
            <div className="flex gap-2">
              {(Object.keys(GATE_LABELS) as Gate[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGate(g)}
                  className={`px-4 py-2 rounded text-sm ${
                    gate === g ? "bg-black text-white" : "bg-gray-100"
                  }`}
                >
                  {GATE_LABELS[g]}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de edificio (opcional) */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Edificio{" "}
              <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <select
              className="w-full border rounded p-2 bg-white text-sm"
              value={selectedBuilding}
              onChange={(e) => {
                setSelectedBuilding(e.target.value);
                resetScan();
              }}

            >
              <option value="">Sin filtro de edificio</option>
              {buildings.map((b) => (
                <option key={b.idbuilding} value={b.idbuilding}>
                  {b.name_es}
                </option>
              ))}
            </select>
          </div>

          <QrScannerInput onResult={handleScan} docTypeOptions={DOC_TYPES} />

          {error   && <p className="text-red-600 text-sm font-medium">{error}</p>}
          {message && <p className="text-green-600 text-sm font-medium">{message}</p>}

          {accreditation && (
            <>
              <AccreditationCard accreditation={accreditation} />
              <button
                onClick={handleRegister}
                disabled={processing}
                className="bg-black text-white rounded p-3 disabled:opacity-50 text-sm"
              >
                Registrar ingreso por {GATE_LABELS[gate]}
                {selectedBuilding &&
                  ` — ${buildings.find((b) => b.idbuilding === selectedBuilding)?.name_es ?? selectedBuilding}`}
              </button>

              {entriesToday.length > 0 && (
                <div className="text-sm text-gray-600">
                  <p className="font-semibold mb-1">Ingresos de hoy:</p>
                  {entriesToday.map((e, i) => (
                    <p key={i}>
                      {GATE_LABELS[e.gate]}
                      {e.idbuilding &&
                        ` — ${buildings.find((b) => b.idbuilding === e.idbuilding)?.name_es ?? e.idbuilding}`}
                      {" — "}
                      {new Date(e.scanned_at).toLocaleTimeString("es-PE")}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── TAB EDIFICIOS ────────────────────────────────────────────────── */}
      {mainTab === "edificios" && (
        <BuildingsConfigPanel buildings={buildings} />
      )}
    </div>
  );
}

// ── Sub-componente: configuración de edificios ────────────────────────────────
function BuildingsConfigPanel({ buildings }: { buildings: VillageBuilding[] }) {
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [assignedCountries, setAssignedCountries] = useState<BuildingCountry[]>([]);
  const [allCountries, setAllCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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

  // Países que aún no están asignados al edificio seleccionado
  const availableCountries = allCountries.filter(
    (c) => !assignedCountries.some((a) => a.idcountry === c.idcountry)
  );
  

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Configura qué países tienen acceso a cada edificio. Al escanear con edificio seleccionado,
        solo se permitirá el ingreso si el país del atleta está asignado.
      </p>

      {/* Selector de edificio */}
      <div>
        <label className="block text-sm font-medium mb-1">Selecciona un edificio</label>
        <select
          className="w-full border rounded p-2 bg-white text-sm"
          value={selectedBuilding}
          onChange={(e) => setSelectedBuilding(e.target.value)}
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
          {/* Países asignados */}
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

          {/* Agregar país */}
          <div className="flex gap-2">
            <select
              className="border rounded p-2 bg-white text-sm flex-1"
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
              className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-40"
            >
              Asignar
            </button>
          </div>

          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </>
      )}
    </div>
  );
}