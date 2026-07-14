// src/api/companies.api.ts
import api from "./axios";
import type { Company } from "../types/company.types";

export async function fetchCompanies(): Promise<Company[]> {
  const { data } = await api.get("/companies");
  return Array.isArray(data.companies) ? data.companies : Array.isArray(data) ? data : [];
}
