// src/components/villa/VillaScannerPanel.tsx
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

export default function VillaScannerPanel({ buildings }: Props) {
  const [gate, setGate]                         = useState<Gate>("puerta1");
  const [selectedBuilding] = useState<string>("");
  const [accreditation, setAccreditation]       = useState<Accreditation | null>(null);
  const [entriesToday, setEntriesToday]         = useState<VillageEntry[]>([]);
  const [error, setError]                       = useState<string | null>(null);
  const [message, setMessage]                   = useState<string | null>(null);
  const [processing, setProcessing]             = useState(false);

  

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
        `Ingreso registrado por ${GATE_LABELS[gate]}${
          selectedBuilding
            ? ` — ${buildings.find((b) => b.idbuilding === selectedBuilding)?.name_es ?? selectedBuilding}`
            : ""
        }`
      );
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo registrar el ingreso");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">

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

      

      <QrScannerInput onResult={handleScan} docTypeOptions={DOC_TYPES} />

      {error   && <p className="text-red-600 text-sm font-medium">{error}</p>}
      {message && <p className="text-green-600 text-sm font-medium">{message}</p>}

      {accreditation && (
        <>
          <AccreditationCard accreditation={accreditation} />

          {/* Badge informativo de hospedaje */}
          {accreditation.hosting ? (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-300
                            rounded-lg px-3 py-2 text-sm text-blue-700">
              <span>🏨</span>
              <span className="font-medium">Acreditado con hospedaje en villa</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 border border-green-300
                            rounded-lg px-3 py-2 text-sm text-green-700">
              <span>🏠</span>
              <span className="font-medium">Solo acceso a villa</span>
            </div>
          )}

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
                  {new Date(e.scanned_at).toLocaleTimeString("es-PE")}
                </p>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}