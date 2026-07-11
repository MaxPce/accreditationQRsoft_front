import { useState } from "react";
import QrScannerInput from "../../components/QrScannerInput";
import AccreditationCard from "../../components/AccreditationCard";
import HistoryPanel from "../../components/HistoryPanel";
import { lookupMealsByQr, lookupMealsByDocument, checkMeal, getMealsHistory, softDeleteMeal } from "../../api/meals.api";
import type { MealHistoryRecord } from "../../api/meals.api";
import type { Accreditation, MealType } from "../../types/accreditation.types";

const DOC_TYPES = [
  { code: "1", label: "DNI" },
  { code: "2", label: "Carnet de Ext." },
  { code: "3", label: "Pasaporte" },
];

const MEAL_OPTIONS: { type: MealType; label: string; icon: string; color: string; activeColor: string }[] = [
  { type: "desayuno", label: "Desayuno", icon: "🌅", color: "bg-orange-50 border-orange-300 hover:bg-orange-100", activeColor: "bg-orange-100 border-orange-400" },
  { type: "almuerzo", label: "Almuerzo", icon: "☀️", color: "bg-yellow-50 border-yellow-300 hover:bg-yellow-100", activeColor: "bg-yellow-100 border-yellow-400" },
  { type: "cena",     label: "Cena",     icon: "🌙", color: "bg-indigo-50 border-indigo-300 hover:bg-indigo-100", activeColor: "bg-indigo-100 border-indigo-400" },
];

const EMPTY_MEAL_FILTERS = { docnumber: "", meal_type: "", date: "" };

type Step = "select_meal" | "scanning" | "confirm" | "result";

interface ScanResult {
  accreditation: Accreditation;
  alreadyTaken: boolean;
  takenAt?: string;
}

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

const makeMealRow = (onDelete: (id: number) => void) =>
  (r: MealHistoryRecord, i: number) => (
    <div key={i} className="border rounded p-3 text-sm flex flex-col gap-1">
      <div className="flex justify-between items-start">
        <p className="font-semibold">{r.person.fullname}</p>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              r.meal_type === "desayuno"
                ? "bg-orange-100 text-orange-700"
                : r.meal_type === "almuerzo"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {r.meal_type.charAt(0).toUpperCase() + r.meal_type.slice(1)}
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
        {new Date(r.scanned_at).toLocaleString("es-PE", { timeZone: "America/Lima" })}
      </p>
    </div>
  );

export default function AlimentosPage() {
  const [step, setStep]                 = useState<Step>("select_meal");
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
  const [scanResult, setScanResult]     = useState<ScanResult | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [message, setMessage]           = useState<string | null>(null);
  const [processing, setProcessing]     = useState(false);
  const [scanSession, setScanSession]   = useState(0);
  const [tab, setTab]                   = useState<"scanner" | "historial">("scanner");
  const [mealFilters, setMealFilters]   = useState({ docnumber: "", meal_type: "", date: "" });
  const [historyKey, setHistoryKey] = useState(0);


  const currentMeal = MEAL_OPTIONS.find((m) => m.type === selectedMeal);

  const handleSelectMeal = (meal: MealType) => {
    setSelectedMeal(meal);
    setScanResult(null);
    setError(null);
    setMessage(null);
    setStep("scanning");
  };

  const handleDeleteMeal = async (id: number) => {
    if (!confirm("¿Eliminar este registro del historial? Quedará guardado quién y cuándo lo eliminó.")) return;
    try {
      await softDeleteMeal(id);
      setHistoryKey((k) => k + 1);
    } catch {
      alert("No se pudo eliminar el registro");
    }
  };


  const handleScan = async (value: {
    type: "qr" | "manual";
    qr?: string;
    doctype?: string;
    docnumber?: string;
  }) => {
    if (!selectedMeal || processing) return;
    setError(null);
    setMessage(null);
    setProcessing(true);
    try {
      const res =
        value.type === "qr"
          ? await lookupMealsByQr(value.qr!)
          : await lookupMealsByDocument(value.doctype!, value.docnumber!);
      setScanResult({
        accreditation: res.accreditation,
        alreadyTaken: Boolean(res.mealsToday[selectedMeal]),
        takenAt: res.mealsToday[selectedMeal],
      });
      setStep("confirm");
    } catch (err: any) {
      setError(err.response?.data?.message || "Acreditación no encontrada");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!scanResult || !selectedMeal || processing) return;
    setProcessing(true);
    setError(null);
    try {
      await checkMeal(scanResult.accreditation.idacreditation, selectedMeal);
      setMessage(`✅ ${currentMeal?.label} registrado correctamente`);
      setStep("result");
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo registrar la comida");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    setScanResult(null);
    setError(null);
    setMessage(null);
    setScanSession((s) => s + 1);
    setStep("scanning");
  };

  const handleNextScan = () => {
    setScanResult(null);
    setError(null);
    setMessage(null);
    setScanSession((s) => s + 1);
    setStep("scanning");
  };

  const handleChangeMeal = () => {
    setSelectedMeal(null);
    setScanResult(null);
    setError(null);
    setMessage(null);
    setStep("select_meal");
  };

  const MealHeader = () => (
    <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${currentMeal?.activeColor}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{currentMeal?.icon}</span>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Registrando</p>
          <p className="font-bold text-lg">{currentMeal?.label}</p>
        </div>
      </div>
      <button onClick={handleChangeMeal} className="text-sm text-gray-600 underline hover:text-black">
        Cambiar
      </button>
    </div>
  );

  const MealHistorySection = () => (
    <HistoryPanel
      key={historyKey}
      fetchFn={getMealsHistory}
      filters={mealFilters}
      onClearFilters={() => setMealFilters(EMPTY_MEAL_FILTERS)}
      emptyText="No hay registros de alimentación"
      filterSlot={
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Número de documento..."
            value={mealFilters.docnumber}
            onChange={(e) => setMealFilters((f) => ({ ...f, docnumber: e.target.value }))}
            className="border rounded px-3 py-2 text-sm w-full"
          />
          <div className="flex gap-2">
            <select
              value={mealFilters.meal_type}
              onChange={(e) => setMealFilters((f) => ({ ...f, meal_type: e.target.value }))}
              className="border rounded px-3 py-2 text-sm flex-1 bg-white"
            >
              <option value="">Todas las comidas</option>
              <option value="desayuno">🌅 Desayuno</option>
              <option value="almuerzo">☀️ Almuerzo</option>
              <option value="cena">🌙 Cena</option>
            </select>
            <input
              type="date"
              value={mealFilters.date}
              onChange={(e) => setMealFilters((f) => ({ ...f, date: e.target.value }))}
              className="border rounded px-3 py-2 text-sm flex-1"
            />
          </div>
        </div>
      }
      renderRow={makeMealRow(handleDeleteMeal)}
    />
  );

  if (step === "select_meal") {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
        <TabBar tab={tab} onChange={setTab} />
        <h1 className="text-xl font-bold">Control de Alimentación</h1>

        {tab === "scanner" && (
          <>
            <p className="text-gray-500 text-sm">
              Selecciona el tipo de comida para comenzar a escanear
            </p>
            <div className="flex flex-col gap-3">
              {MEAL_OPTIONS.map((meal) => (
                <button
                  key={meal.type}
                  onClick={() => handleSelectMeal(meal.type)}
                  className={`flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all ${meal.color}`}
                >
                  <span className="text-3xl">{meal.icon}</span>
                  <div>
                    <p className="font-semibold text-lg">{meal.label}</p>
                    <p className="text-gray-500 text-xs">Toca para empezar a escanear</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "historial" && <MealHistorySection />}
      </div>
    );
  }

  if (step === "scanning") {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
        <TabBar tab={tab} onChange={setTab} />
        <h1 className="text-xl font-bold">Control de Alimentación</h1>

        {tab === "scanner" && (
          <>
            <MealHeader />
            <QrScannerInput key={scanSession} onResult={handleScan} docTypeOptions={DOC_TYPES} />
            {processing && (
              <p className="text-gray-500 text-sm text-center animate-pulse">
                Buscando acreditación...
              </p>
            )}
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                ❌ {error}
              </p>
            )}
          </>
        )}

        {tab === "historial" && <MealHistorySection />}
      </div>
    );
  }

  if (step === "confirm" && scanResult) {
    const { accreditation, alreadyTaken, takenAt } = scanResult;
    const hora = takenAt
      ? new Date(takenAt).toLocaleTimeString("es-PE", {
          timeZone: "America/Lima",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
        <TabBar tab={tab} onChange={setTab} />
        <h1 className="text-xl font-bold">Control de Alimentación</h1>

        {tab === "scanner" && (
          <>
            <MealHeader />
            <AccreditationCard accreditation={accreditation} />
            {alreadyTaken ? (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-amber-700 font-semibold text-sm">
                  ⚠️ {currentMeal?.label} ya fue registrado hoy a las {hora}
                </p>
                <button
                  onClick={handleCancel}
                  className="w-full py-3 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700"
                >
                  Volver al escáner
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-gray-600 text-sm text-center">
                  ¿Confirmas el registro de <strong>{currentMeal?.label}</strong> para esta persona?
                </p>
                <button
                  onClick={handleConfirm}
                  disabled={processing}
                  className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
                >
                  {processing ? "Registrando..." : `✅ Confirmar ${currentMeal?.label}`}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={processing}
                  className="w-full py-3 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold text-gray-700 disabled:opacity-50"
                >
                  ❌ Cancelar
                </button>
              </div>
            )}
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                ❌ {error}
              </p>
            )}
          </>
        )}

        {tab === "historial" && <MealHistorySection />}
      </div>
    );
  }

  if (step === "result" && scanResult) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
        <TabBar tab={tab} onChange={setTab} />
        <h1 className="text-xl font-bold">Control de Alimentación</h1>

        {tab === "scanner" && (
          <>
            <MealHeader />
            <div className="bg-green-50 border border-green-300 rounded-xl p-5 text-center">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-green-700 font-bold text-lg">{message}</p>
            </div>
            <AccreditationCard accreditation={scanResult.accreditation} />
            <button
              onClick={handleNextScan}
              className="w-full py-3 rounded-lg bg-black text-white font-semibold hover:bg-gray-800"
            >
              Siguiente escaneo
            </button>
          </>
        )}

        {tab === "historial" && <MealHistorySection />}
      </div>
    );
  }

  return null;
}