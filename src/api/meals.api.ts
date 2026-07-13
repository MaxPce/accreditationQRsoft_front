// src/api/meals.api.ts
import api from "./axios";
import type { MealsLookupResponse, MealType } from "../types/accreditation.types";

export async function lookupMealsByQr(qr: string): Promise<MealsLookupResponse> {
  const { data } = await api.get("/meals/lookup", { params: { qr } });
  return data;
}

export async function lookupMealsByDocument(
  doctype: string,
  docnumber: string
): Promise<MealsLookupResponse> {
  const { data } = await api.get("/meals/lookup", { params: { doctype, docnumber } });
  return data;
}

export async function checkMeal(idacreditation: number, mealType: MealType) {
  const { data } = await api.post("/meals/check", { idacreditation, mealType });
  return data;
}

export interface MealHistoryRecord {
  id:             number;
  idacreditation: number;
  meal_type:      string;
  meal_date:      string;
  scanned_at:     string;
  person: { fullname: string; docnumber: string; doctypeName: string; photoUrl:    string | null; };
  role:   { code: string; name: string };
}

export async function getMealsHistory(
  filters: Record<string, string> = {}
): Promise<MealHistoryRecord[]> {
  const { data } = await api.get("/meals/history", { params: filters });
  return data.records;
}
export async function softDeleteMeal(id: number): Promise<void> {
  await api.delete(`/meals/history/${id}`);
}
