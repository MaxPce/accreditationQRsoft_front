// src/pages/modules/AlimentosPage.tsx
import { useState } from "react";
import QrScannerInput from "../../components/QrScannerInput";
import AccreditationCard from "../../components/AccreditationCard";
import { lookupMealsByQr, lookupMealsByDocument, checkMeal } from "../../api/meals.api";
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

type Step = "select_meal" | "scanning" | "confirm" | "result";

interface ScanResult {
  accreditation: Accreditation;
  alreadyTaken: boolean;
  takenAt?: string;
}

export default function AlimentosPage() {
  const [step, setStep] = useState<Step>("select_meal");
  const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scanSession, setScanSession] = useState(0);

  const currentMeal = MEAL_OPTIONS.find(m => m.type === selectedMeal);

  // PASO 1 → PASO 2
  const handleSelectMeal = (meal: MealType) => {
    setSelectedMeal(meal);
    setScanResult(null);
    setError(null);
    setMessage(null);
    setStep("scanning");
  };

  // PASO 2 → PASO 3: solo busca la acreditación, NO registra nada
  const handleScan = async (value: { type: "qr" | "manual"; qr?: string; doctype?: string; docnumber?: string }) => {
    if (!selectedMeal || processing) return;
    setError(null);
    setMessage(null);
    setProcessing(true);

    try {
      const res = value.type === "qr"
        ? await lookupMealsByQr(value.qr!)
        : await lookupMealsByDocument(value.doctype!, value.docnumber!);

      const alreadyTaken = Boolean(res.mealsToday[selectedMeal]);
      const takenAt = res.mealsToday[selectedMeal];

      setScanResult({
        accreditation: res.accreditation,
        alreadyTaken,
        takenAt,
      });
      setStep("confirm");
    } catch (err: any) {
      setError(err.response?.data?.message || "Acreditación no encontrada");
    } finally {
      setProcessing(false);
    }
  };

  // PASO 3 → PASO 4: confirma y registra
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

  // Cancelar desde confirmación → volver al escáner
  const handleCancel = () => {
    setScanResult(null);
    setError(null);
    setMessage(null);
    setScanSession(s => s + 1); 
    setStep("scanning");
  };


  const handleNextScan = () => {
    setScanResult(null);
    setError(null);
    setMessage(null);
    setScanSession(s => s + 1); 
    setStep("scanning");
  };


  // Cambiar comida → volver al inicio
  const handleChangeMeal = () => {
    setSelectedMeal(null);
    setScanResult(null);
    setError(null);
    setMessage(null);
    setStep("select_meal");
  };

  // ─── RENDER ──────────────────────────────────────────────

  // PASO 1: Selección de comida
  if (step === "select_meal") {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold">Control de Alimentación</h1>
          <p className="text-gray-500 text-sm mt-1">
            Selecciona el tipo de comida para comenzar a escanear
          </p>
        </div>
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
      </div>
    );
  }

  // ─── Header compartido para pasos 2, 3 y 4
  const MealHeader = () => (
    <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${currentMeal?.activeColor}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{currentMeal?.icon}</span>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Registrando</p>
          <p className="font-bold text-lg">{currentMeal?.label}</p>
        </div>
      </div>
      <button
        onClick={handleChangeMeal}
        className="text-sm text-gray-600 underline hover:text-black"
      >
        Cambiar
      </button>
    </div>
  );

  // PASO 2: Escaneo
  if (step === "scanning") {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
        <h1 className="text-xl font-bold">Control de Alimentación</h1>
        <MealHeader />
        <QrScannerInput key={scanSession} onResult={handleScan} docTypeOptions={DOC_TYPES} />

        {processing && (
          <p className="text-gray-500 text-sm text-center animate-pulse">Buscando acreditación...</p>
        )}
        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">❌ {error}</p>
        )}
      </div>
    );
  }

  // PASO 3: Confirmación
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
        <h1 className="text-xl font-bold">Control de Alimentación</h1>
        <MealHeader />

        <AccreditationCard accreditation={accreditation} />

        {alreadyTaken ? (
          // Ya fue registrado hoy → solo mostrar advertencia y cancelar
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
          // No registrado → mostrar botones de confirmar / cancelar
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
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">❌ {error}</p>
        )}
      </div>
    );
  }

  // PASO 4: Resultado exitoso
  if (step === "result" && scanResult) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
        <h1 className="text-xl font-bold">Control de Alimentación</h1>
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
      </div>
    );
  }

  return null;
}