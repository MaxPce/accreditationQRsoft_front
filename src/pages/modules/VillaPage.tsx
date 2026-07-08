// src/pages/modules/VillaPage.tsx
import { useState } from "react";
import QrScannerInput from "../../components/QrScannerInput";
import AccreditationCard from "../../components/AccreditationCard";
import { lookupVillageByQr, lookupVillageByDocument, registerVillageEntry } from "../../api/village.api";
import { Accreditation, Gate, VillageEntry } from "../../types/accreditation.types";

const DOC_TYPES = [
  { code: "1", label: "DNI" },
  { code: "2", label: "Carnet de Ext." },
  { code: "3", label: "Pasaporte" },
];

const GATE_LABELS: Record<Gate, string> = {
  puerta1: "Puerta 1",
  puerta2: "Puerta 2",
};

export default function VillaPage() {
  const [gate, setGate] = useState<Gate>("puerta1");
  const [accreditation, setAccreditation] = useState<Accreditation | null>(null);
  const [entriesToday, setEntriesToday] = useState<VillageEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleScan = async (value: { type: "qr" | "manual"; qr?: string; doctype?: string; docnumber?: string }) => {
    setError(null);
    setMessage(null);
    try {
      const res = value.type === "qr"
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
      const res = await registerVillageEntry(accreditation.idacreditation, gate);
      setEntriesToday((prev) => [{ gate, scanned_at: res.scannedAt }, ...prev]);
      setMessage(`Ingreso registrado por ${GATE_LABELS[gate]}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo registrar el ingreso");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-bold">Ingreso a Villa</h1>

      <div className="flex gap-2">
        {(Object.keys(GATE_LABELS) as Gate[]).map((g) => (
          <button
            key={g}
            onClick={() => setGate(g)}
            className={`px-4 py-2 rounded ${gate === g ? "bg-black text-white" : "bg-gray-100"}`}
          >
            {GATE_LABELS[g]}
          </button>
        ))}
      </div>

      <QrScannerInput onResult={handleScan} docTypeOptions={DOC_TYPES} />

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {message && <p className="text-green-600 text-sm">{message}</p>}

      {accreditation && (
        <>
          <AccreditationCard accreditation={accreditation} />
          <button
            onClick={handleRegister}
            disabled={processing}
            className="bg-black text-white rounded p-3 disabled:opacity-50"
          >
            Registrar ingreso por {GATE_LABELS[gate]}
          </button>

          {entriesToday.length > 0 && (
            <div className="text-sm text-gray-600">
              <p className="font-semibold mb-1">Ingresos de hoy:</p>
              {entriesToday.map((e, i) => (
                <p key={i}>
                  {GATE_LABELS[e.gate]} — {new Date(e.scanned_at).toLocaleTimeString()}
                </p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}