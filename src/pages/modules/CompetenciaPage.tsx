// src/pages/modules/CompetenciaPage.tsx
import { useEffect, useState } from "react";
import QrScannerInput from "../../components/QrScannerInput";
import AccreditationCard from "../../components/AccreditationCard";
import {
  listCompetitionSports,
  validateCompetitionByQr,
  validateCompetitionByDocument,
  type Sport,
  type CompetitionValidationResponse,
} from "../../api/competition.api";

const DOC_TYPES = [
  { code: "1", label: "DNI" },
  { code: "2", label: "Carnet de Ext." },
  { code: "3", label: "Pasaporte" },
];

export default function CompetenciaPage() {
  const [sports, setSports]           = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [result, setResult]           = useState<CompetitionValidationResponse | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    listCompetitionSports()
      .then(setSports)
      .catch(() => setError("No se pudieron cargar los deportes"));
  }, []);

  const handleScan = async (value: {
    type: "qr" | "manual";
    qr?: string;
    doctype?: string;
    docnumber?: string;
  }) => {
    if (!selectedSport) {
      setError("Selecciona un deporte antes de escanear");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res =
        value.type === "qr"
          ? await validateCompetitionByQr(value.qr!, selectedSport)
          : await validateCompetitionByDocument(value.doctype!, value.docnumber!, selectedSport);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.message || "Acreditación no encontrada");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-bold">Ingreso a Competencia</h1>

      {/* Selector de deporte */}
      <div>
        <label className="block text-sm font-medium mb-1">Deporte</label>
        <select
          className="w-full border rounded p-2 bg-white"
          value={selectedSport ?? ""}
          onChange={(e) => {
            setSelectedSport(Number(e.target.value));
            setResult(null);
            setError(null);
          }}
        >
          <option value="" disabled>Selecciona un deporte...</option>
          {sports.map((s) => (
            <option key={s.idsport} value={s.idsport}>
              {s.name_es} ({s.acronym})
            </option>
          ))}
        </select>
      </div>

      <QrScannerInput onResult={handleScan} docTypeOptions={DOC_TYPES} />

      {loading && <p className="text-gray-500 text-sm">Validando...</p>}
      {error   && <p className="text-red-600 text-sm font-medium">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3">
          {/* Badge resultado */}
          <div
            className={`rounded-lg p-4 text-center font-bold text-lg ${
              result.authorized
                ? "bg-green-100 text-green-700 border border-green-400"
                : "bg-red-100 text-red-700 border border-red-400"
            }`}
          >
            {result.authorized ? "✅ AUTORIZADO" : "❌ NO AUTORIZADO"}
            {result.reason && (
              <p className="text-sm font-normal mt-1">{result.reason}</p>
            )}
          </div>

          {/* Card del atleta — usa el tipo Accreditation existente sin cambios */}
          <AccreditationCard accreditation={result.accreditation} />

          {/* Pruebas inscritas (solo si está autorizado) */}
          {result.authorized && result.tests.length > 0 && (
            <div className="border rounded p-3 text-sm">
              <p className="font-semibold mb-2">Pruebas inscritas:</p>
              <ul className="flex flex-col gap-1">
                {result.tests.map((t, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{t.name}</span>
                    <span className="ml-auto text-gray-500 text-xs">
                      Niv. {t.level} / Cat. {t.category}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}