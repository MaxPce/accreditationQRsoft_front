// src/pages/modules/AlimentosPage.tsx
import { useState } from "react";
import QrScannerInput from "../../components/QrScannerInput";
import AccreditationCard from "../../components/AccreditationCard";
import { lookupMealsByQr, lookupMealsByDocument, checkMeal } from "../../api/meals.api";
import { Accreditation, MealType } from "../../types/accreditation.types";

const DOC_TYPES = [
  { code: "1", label: "DNI" },
  { code: "2", label: "Carnet de Ext." },
  { code: "3", label: "Pasaporte" },
];

const MEAL_LABELS: Record<MealType, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
};

export default function AlimentosPage() {
  const [accreditation, setAccreditation] = useState<Accreditation | null>(null);
  const [mealsToday, setMealsToday] = useState<Partial<Record<MealType, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleScan = async (value: { type: "qr" | "manual"; qr?: string; doctype?: string; docnumber?: string }) => {
    setError(null);
    setMessage(null);
    try {
      const res = value.type === "qr"
        ? await lookupMealsByQr(value.qr!)
        : await lookupMealsByDocument(value.doctype!, value.docnumber!);
      setAccreditation(res.accreditation);
      setMealsToday(res.mealsToday);
    } catch (err: any) {
      setAccreditation(null);
      setError(err.response?.data?.message || "Acreditación no encontrada");
    }
  };

  const handleMarkMeal = async (mealType: MealType) => {
    if (!accreditation) return;
    setProcessing(true);
    setError(null);
    try {
      await checkMeal(accreditation.idacreditation, mealType);
      setMealsToday((prev) => ({ ...prev, [mealType]: new Date().toISOString() }));
      setMessage(`${MEAL_LABELS[mealType]} registrado correctamente`);
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo registrar la comida");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-bold">Control de Alimentación</h1>

      <QrScannerInput onResult={handleScan} docTypeOptions={DOC_TYPES} />

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {message && <p className="text-green-600 text-sm">{message}</p>}

      {accreditation && (
        <>
          <AccreditationCard accreditation={accreditation} />
          <div className="grid grid-cols-3 gap-3 mt-2">
            {(Object.keys(MEAL_LABELS) as MealType[]).map((meal) => {
              const alreadyTaken = Boolean(mealsToday[meal]);
              return (
                <button
                  key={meal}
                  disabled={alreadyTaken || processing}
                  onClick={() => handleMarkMeal(meal)}
                  className={`p-4 rounded-lg border flex flex-col items-center gap-1 ${
                    alreadyTaken ? "bg-gray-100 text-gray-400" : "bg-white hover:shadow-md"
                  }`}
                >
                  <span>{MEAL_LABELS[meal]}</span>
                  {alreadyTaken && (
                    <span className="text-xs">
                      {new Date(mealsToday[meal]!).toLocaleTimeString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}