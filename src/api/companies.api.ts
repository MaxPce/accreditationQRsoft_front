// src/api/companies.api.ts
import api from "./axios";
import { Company } from "../types/company.types";

export async function fetchCompanies(): Promise<Company[]> {
  const { data } = await api.get("/companies");
  return data.companies;
}