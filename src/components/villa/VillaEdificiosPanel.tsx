// src/components/villa/VillaEdificiosPanel.tsx
import { useState } from "react";
import QrScannerInput from "../QrScannerInput";
import AccreditationCard from "../AccreditationCard";
import {
  lookupVillageByQr,
  lookupVillageByDocument,
  registerVillageEntry,
  type VillageBuilding,
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

interface Props {
  buildings: VillageBuilding[];
}

export default function VillaEdificiosPanel({ buildings }: Props) {
  const [activeBuilding, setActiveBuilding] = useState<VillageBuilding | null>(null);

  if (activeBuilding) {
    return (
      <BuildingScannerView
        building={activeBuilding}
        onBack={() => setActiveBuilding(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        Selecciona un edificio para iniciar el escaneo de acreditados.
      </p>
      {buildings.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No hay edificios registrados.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {buildings.map((b) => (
            <button
              key={b.idbuilding}
              onClick={() => setActiveBuilding(b)}
              className="border rounded px-4 py-4 flex items-center justify-between text-sm
                         hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div>
                <p className="font-semibold text-base">{b.name_es}</p>
                <p className="text-gray-400 text-xs mt-0.5">{b.idbuilding}</p>
              </div>
              <span className="text-gray-400 text-lg">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Vista de escáner enfocada en un edificio ──────────────────────────────────
interface ScannerViewProps {
  building: VillageBuilding;
  onBack: () => void;
}

function BuildingScannerView({ building, onBack }: ScannerViewProps) {
  const [gate, setGate]                   = useState<Gate>("puerta1");
  const [accreditation, setAccreditation] = useState<Accreditation | null>(null);
  const [entriesToday, setEntriesToday]   = useState<VillageEntry[]>([]);
  const [error, setError]                 = useState<string | null>(null);
  const [message, setMessage]             = useState<string | null>(null);
  const [processing, setProcessing]       = useState(false);

  const handleScan = async (value: {
    type: "qr" | "manual";
    qr?: string;
    doctype?: string;
    docnumber?: string;
  }) => {
    setError(null);
    setMessage(null);
    setAccreditation(null);
    try {
      const res =
        value.type === "qr"
          ? await lookupVillageByQr(value.qr!)
          : await lookupVillageByDocument(value.doctype!, value.docnumber!);
      setAccreditation(res.accreditation);
      setEntriesToday(res.entriesToday);
    } catch (err: any) {
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
        building.idbuilding   // ← siempre fijo al edificio activo
      );
      setEntriesToday((prev) => [
        { gate, idbuilding: res.idbuilding, scanned_at: res.scannedAt },
        ...prev,
      ]);
      setMessage(`Ingreso registrado — ${building.name_es} — ${GATE_LABELS[gate]}`);
      setAccreditation(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo registrar el ingreso");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">

      {/* Header con botón volver */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          ‹ Volver
        </button>
        <div>
          <p className="font-bold text-base">{building.name_es}</p>
          <p className="text-xs text-gray-400">{building.idbuilding}</p>
        </div>
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
            className="w-full bg-black text-white rounded p-3 disabled:opacity-50 text-sm"
          >
            Registrar ingreso — {building.name_es} — {GATE_LABELS[gate]}
          </button>
        </>
      )}

      {entriesToday.length > 0 && (
        <div className="text-sm text-gray-600">
          <p className="font-semibold mb-1">Ingresos de hoy en {building.name_es}:</p>
          {entriesToday.map((e, i) => (
            <p key={i}>
              {GATE_LABELS[e.gate]} — {new Date(e.scanned_at).toLocaleTimeString("es-PE")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}