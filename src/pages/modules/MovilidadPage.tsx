import { useState } from "react";
import QrScannerInput from "../../components/QrScannerInput";
import AccreditationCard from "../../components/AccreditationCard";
import HistoryPanel from "../../components/HistoryPanel";
import {
  lookupMobilityByQr,
  lookupMobilityByDocument,
  registerMobilityLog,
  getMobilityHistory,
  softDeleteMobilityLog,
} from "../../api/mobility.api";
import type { MobilityHistoryRecord } from "../../api/mobility.api";
import type {
  Accreditation,
  MobilityLog,
  MobilityLocation,
  MobilityEventType,
} from "../../types/accreditation.types";

const DOC_TYPES = [
  { code: "1", label: "DNI" },
  { code: "2", label: "Carnet de Ext." },
  { code: "3", label: "Pasaporte" },
];

const LOCATION_LABELS: Record<MobilityLocation, string> = {
  videna: "Videna",
  villa_panamericana: "Villa Panamericana",
};

const EVENT_TYPE_LABELS: Record<MobilityEventType, string> = {
  salida: "📍 Salida",
  llegada: "📍 Llegada",
};

const EVENT_TYPE_COLORS: Record<MobilityEventType, string> = {
  salida: "bg-blue-600",
  llegada: "bg-green-600",
};

const EMPTY_MOBILITY_FILTERS = { docnumber: "", location: "", date: "" };

const makeMobilityRow = (onDelete: (id: number) => void) =>
  (r: MobilityHistoryRecord, i: number) => (
    <div key={i} className="border rounded p-3 text-sm flex flex-col gap-1">
      <div className="flex justify-between items-start">
        <p className="font-semibold">{r.person.fullname}</p>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              r.event_type === "salida"
                ? "bg-blue-100 text-blue-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {r.event_type === "salida" ? "Salida" : "Llegada"}
          </span>
          <button
            onClick={() => onDelete(r.id)}
            title="Eliminar registro"
            className="text-red-400 hover:text-red-600 text-xs px-1"
          >
            🗑️
          </button>
        </div>
      </div>
      <p className="text-gray-500">
        {r.person.doctypeName}: {r.person.docnumber}
      </p>
      <p className="text-gray-400 text-xs">
        {r.location === "videna" ? "Videna" : "Villa Panamericana"} —{" "}
        {new Date(r.scanned_at).toLocaleString("es-PE", { timeZone: "America/Lima" })}
      </p>
    </div>
  );

export default function MovilidadPage() {
  const [tab, setTab]                       = useState<"scanner" | "historial">("scanner");
  const [location, setLocation]             = useState<MobilityLocation>("videna");
  const [eventType, setEventType]           = useState<MobilityEventType>("salida");
  const [accreditation, setAccreditation]   = useState<Accreditation | null>(null);
  const [logsToday, setLogsToday]           = useState<MobilityLog[]>([]);
  const [error, setError]                   = useState<string | null>(null);
  const [message, setMessage]               = useState<string | null>(null);
  const [processing, setProcessing]         = useState(false);
  const [mobilityFilters, setMobilityFilters] = useState({ docnumber: "", location: "", date: "" });
  const [historyKey, setHistoryKey] = useState(0);

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
          ? await lookupMobilityByQr(value.qr!)
          : await lookupMobilityByDocument(value.doctype!, value.docnumber!);
      setAccreditation(res.accreditation);
      setLogsToday(res.logsToday);
    } catch (err: any) {
      setAccreditation(null);
      setError(err.response?.data?.message || "Acreditación no encontrada");
    }
  };

  const handleDeleteMobility = async (id: number) => {
    if (!confirm("¿Eliminar este registro del historial? Quedará guardado quién y cuándo lo eliminó.")) return;
    try {
      await softDeleteMobilityLog(id);
      setHistoryKey((k) => k + 1);
    } catch {
      alert("No se pudo eliminar el registro");
    }
  };


  const handleRegister = async () => {
    if (!accreditation) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await registerMobilityLog(
        accreditation.idacreditation,
        location,
        eventType
      );
      setLogsToday((prev) => [
        { location: res.location, event_type: res.event_type, scanned_at: res.scannedAt },
        ...prev,
      ]);
      setMessage(`Registrado: ${EVENT_TYPE_LABELS[eventType]} en ${LOCATION_LABELS[location]}`);
      setAccreditation(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo registrar");
    } finally {
      setProcessing(false);
    }
  };

  const MobilityHistorySection = () => (
    <HistoryPanel
      key={historyKey}
      fetchFn={getMobilityHistory}
      filters={mobilityFilters}
      onClearFilters={() => setMobilityFilters(EMPTY_MOBILITY_FILTERS)}
      emptyText="No hay registros de movilidad"
      filterSlot={
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Número de documento..."
            value={mobilityFilters.docnumber}
            onChange={(e) => setMobilityFilters((f) => ({ ...f, docnumber: e.target.value }))}
            className="border rounded px-3 py-2 text-sm w-full"
          />
          <div className="flex gap-2">
            <select
              value={mobilityFilters.location}
              onChange={(e) => setMobilityFilters((f) => ({ ...f, location: e.target.value }))}
              className="border rounded px-3 py-2 text-sm flex-1 bg-white"
            >
              <option value="">Todos los escenarios</option>
              <option value="videna">Videna</option>
              <option value="villa_panamericana">Villa Panamericana</option>
            </select>
            <input
              type="date"
              value={mobilityFilters.date}
              onChange={(e) => setMobilityFilters((f) => ({ ...f, date: e.target.value }))}
              className="border rounded px-3 py-2 text-sm flex-1"
            />
          </div>
        </div>
      }
      renderRow={makeMobilityRow(handleDeleteMobility)}
    />
  );

  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("scanner")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "scanner" ? "border-black text-black" : "border-transparent text-gray-400"
          }`}
        >
          📷 Escáner
        </button>
        <button
          onClick={() => setTab("historial")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "historial" ? "border-black text-black" : "border-transparent text-gray-400"
          }`}
        >
          📋 Historial
        </button>
      </div>

      <h1 className="text-xl font-bold">Movilidad</h1>

      {tab === "scanner" && (
        <>
          <div>
            <p className="text-sm text-gray-500 mb-1 font-medium">Escenario</p>
            <div className="flex gap-2">
              {(Object.keys(LOCATION_LABELS) as MobilityLocation[]).map((loc) => (
                <button
                  key={loc}
                  onClick={() => setLocation(loc)}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    location === loc ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {LOCATION_LABELS[loc]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1 font-medium">Tipo de registro</p>
            <div className="flex gap-2">
              {(Object.keys(EVENT_TYPE_LABELS) as MobilityEventType[]).map((et) => (
                <button
                  key={et}
                  onClick={() => setEventType(et)}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    eventType === et
                      ? `${EVENT_TYPE_COLORS[et]} text-white`
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {EVENT_TYPE_LABELS[et]}
                </button>
              ))}
            </div>
          </div>

          <QrScannerInput onResult={handleScan} docTypeOptions={DOC_TYPES} />

          {error   && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm font-medium">{message}</p>}

          {accreditation && (
            <>
              <AccreditationCard accreditation={accreditation} />
              <button
                onClick={handleRegister}
                disabled={processing}
                className={`text-white rounded p-3 disabled:opacity-50 font-semibold ${EVENT_TYPE_COLORS[eventType]}`}
              >
                {processing ? "Registrando..." : `Confirmar ${EVENT_TYPE_LABELS[eventType]}`}
              </button>

              {logsToday.length > 0 && (
                <div className="text-sm text-gray-600 border rounded p-3">
                  <p className="font-semibold mb-2">Movimientos de hoy:</p>
                  {logsToday.map((log, i) => (
                    <p key={i} className="flex justify-between">
                      <span>
                        {LOCATION_LABELS[log.location]} —{" "}
                        <span
                          className={`font-medium ${
                            log.event_type === "salida" ? "text-blue-600" : "text-green-600"
                          }`}
                        >
                          {log.event_type === "salida" ? "Salida" : "Llegada"}
                        </span>
                      </span>
                      <span>{new Date(log.scanned_at).toLocaleTimeString()}</span>
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "historial" && <MobilityHistorySection />}
    </div>
  );
}