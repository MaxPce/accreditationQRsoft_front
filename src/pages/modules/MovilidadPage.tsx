// src/pages/modules/MovilidadPage.tsx
import { useState } from "react";
import QrScannerInput from "../../components/QrScannerInput";
import AccreditationCard from "../../components/AccreditationCard";
import {
  lookupMobilityByQr,
  lookupMobilityByDocument,
  registerMobilityLog,
} from "../../api/mobility.api";
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

export default function MovilidadPage() {
  const [location, setLocation] = useState<MobilityLocation>("videna");
  const [eventType, setEventType] = useState<MobilityEventType>("salida");
  const [accreditation, setAccreditation] = useState<Accreditation | null>(null);
  const [logsToday, setLogsToday] = useState<MobilityLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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
      setMessage(
        `Registrado: ${EVENT_TYPE_LABELS[eventType]} en ${LOCATION_LABELS[location]}`
      );
      setAccreditation(null); // limpiar para siguiente escaneo
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo registrar");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-bold">Movilidad</h1>

      {/* Selector de escenario */}
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

      {/* Selector de tipo de evento */}
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

      {error && <p className="text-red-600 text-sm">{error}</p>}
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
    </div>
  );
}