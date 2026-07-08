// src/api/meals.api.ts
import api from "./axios";
import { MealsLookupResponse, MealType } from "../types/accreditation.types";

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