// src/pages/modules/CompetenciaPage.tsx
import { useEffect, useState } from "react";
import QrScannerInput from "../../components/QrScannerInput";
import AccreditationCard from "../../components/AccreditationCard";
import HistoryPanel from "../../components/HistoryPanel";
import {
  listCompetitionSports,
  validateCompetitionByQr,
  validateCompetitionByDocument,
  getCompetitionHistory,
  listCompetitionTests,
  type Sport,
  type CompetitionValidationResponse,
  type CompetitionHistoryRecord,
  type CompetitionTest_Param,
} from "../../api/competition.api";

const DOC_TYPES = [
  { code: "1", label: "DNI" },
  { code: "2", label: "Carnet de Ext." },
  { code: "3", label: "Pasaporte" },
];

const EMPTY_FILTERS: Record<string, string> = {
  docnumber: "",
  idsport:   "",
  idtest:    "",
};

const TabBar = ({
  tab,
  onChange,
}: {
  tab: "scanner" | "historial";
  onChange: (t: "scanner" | "historial") => void;
}) => (
  <div className="flex gap-1 border-b">
    <button
      onClick={() => onChange("scanner")}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        tab === "scanner" ? "border-black text-black" : "border-transparent text-gray-400"
      }`}
    >
      📷 Escáner
    </button>
    <button
      onClick={() => onChange("historial")}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        tab === "historial" ? "border-black text-black" : "border-transparent text-gray-400"
      }`}
    >
      📋 Historial
    </button>
  </div>
);

const renderCompetitionRow = (r: CompetitionHistoryRecord, i: number) => (
  <div key={i} className="border rounded p-3 text-sm flex flex-col gap-1">
    <div className="flex justify-between items-start">
      <p className="font-semibold">{r.person.fullname}</p>
      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
        {r.sport_acronym}
      </span>
    </div>
    <p className="text-gray-500">
      {r.person.doctypeName}: {r.person.docnumber}
    </p>
    <p className="text-gray-400 text-xs">
      {r.test_name ?? "Solo deporte"}
    </p>
    <p className="text-gray-400 text-xs">
      {new Date(r.scanned_at).toLocaleString("es-PE", { timeZone: "America/Lima" })}
    </p>
  </div>
);

export default function CompetenciaPage() {
  const [sports, setSports]               = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [result, setResult]               = useState<CompetitionValidationResponse | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [tab, setTab]                     = useState<"scanner" | "historial">("scanner");
  const [filters, setFilters]             = useState<Record<string, string>>(EMPTY_FILTERS);
  const [historialSport, setHistorialSport] = useState<string>("");
  const [availableTests, setAvailableTests] = useState<CompetitionTest_Param[]>([]);

  // ── NUEVO: estado para la prueba seleccionada en el escáner ──
  const [selectedParam, setSelectedParam] = useState<string>("");
  const [scannerTests, setScannerTests]   = useState<CompetitionTest_Param[]>([]);

  useEffect(() => {
    listCompetitionSports()
      .then(setSports)
      .catch(() => setError("No se pudieron cargar los deportes"));
  }, []);

  // Historial: cargar pruebas al cambiar deporte
  useEffect(() => {
    if (!historialSport) {
      setAvailableTests([]);
      setFilters((f) => ({ ...f, idtest: "" }));
      return;
    }
    listCompetitionTests(historialSport)
      .then(setAvailableTests)
      .catch(() => setAvailableTests([]));
  }, [historialSport]);

  // ── NUEVO: Escáner: cargar pruebas al cambiar deporte seleccionado ──
  useEffect(() => {
    if (!selectedSport) {
      setScannerTests([]);
      setSelectedParam("");
      return;
    }
    listCompetitionTests(String(selectedSport))
      .then(setScannerTests)
      .catch(() => setScannerTests([]));
  }, [selectedSport]);

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
      // ── MODIFICADO: pasar selectedParam opcionalmente ──
      const paramCode = selectedParam || undefined;
      const res =
        value.type === "qr"
          ? await validateCompetitionByQr(value.qr!, selectedSport, paramCode)
          : await validateCompetitionByDocument(value.doctype!, value.docnumber!, selectedSport, paramCode);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.message || "Acreditación no encontrada");
    } finally {
      setLoading(false);
    }
  };

  const HistorySection = () => (
    <HistoryPanel
      fetchFn={getCompetitionHistory}
      filters={filters}
      onClearFilters={() => {
        setFilters(EMPTY_FILTERS);
        setHistorialSport("");
        setAvailableTests([]);
      }}
      emptyText="No hay registros de ingreso a competencia"
      filterSlot={
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Número de documento..."
            value={filters.docnumber ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, docnumber: e.target.value }))}
            className="border rounded px-3 py-2 text-sm w-full"
          />
          <div className="flex gap-2">
            <select
              value={historialSport}
              onChange={(e) => {
                const val = e.target.value;
                setHistorialSport(val);
                setFilters((f) => ({ ...f, idsport: val, idtest: "" }));
              }}
              className="border rounded px-3 py-2 text-sm flex-1 bg-white"
            >
              <option value="">Todos los deportes</option>
              {sports.map((s) => (
                <option key={s.idsport} value={String(s.idsport)}>
                  {s.name_es} ({s.acronym})
                </option>
              ))}
            </select>
            <select
              value={filters.idtest ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, idtest: e.target.value }))}
              disabled={!historialSport || availableTests.length === 0}
              className="border rounded px-3 py-2 text-sm flex-1 bg-white disabled:opacity-40"
            >
              <option value="">Todas las pruebas</option>
              {availableTests.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      }
      renderRow={renderCompetitionRow}
    />
  );

  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
      <TabBar tab={tab} onChange={setTab} />
      <h1 className="text-xl font-bold">Ingreso a Competencia</h1>

      {tab === "scanner" && (
        <>
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
                setSelectedParam(""); // limpiar prueba al cambiar deporte
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

          {/* ── NUEVO: Selector de prueba/categoría (opcional) ── */}
          {scannerTests.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Prueba / Categoría{" "}
                <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <select
                className="w-full border rounded p-2 bg-white"
                value={selectedParam}
                onChange={(e) => {
                  setSelectedParam(e.target.value);
                  setResult(null);
                  setError(null);
                }}
              >
                <option value="">Todas las pruebas</option>
                {scannerTests.map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <QrScannerInput onResult={handleScan} docTypeOptions={DOC_TYPES} />

          {loading && <p className="text-gray-500 text-sm">Validando...</p>}
          {error   && <p className="text-red-600 text-sm font-medium">{error}</p>}

          {result && (
            <div className="flex flex-col gap-3">
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

              <AccreditationCard accreditation={result.accreditation} />

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
        </>
      )}

      {tab === "historial" && <HistorySection />}
    </div>
  );
}