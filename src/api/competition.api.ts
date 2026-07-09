// src/api/competition.api.ts
import api from "./axios";
import type { Accreditation } from "../types/accreditation.types";

export interface CompetitionTest {
  idtest:   string;
  name:     string;
  level:    string;
  category: string;
}

export interface CompetitionValidationResponse {
  ok:            boolean;
  authorized:    boolean;
  reason:        string | null;
  accreditation: Accreditation;
  tests:         CompetitionTest[];
}

export interface Sport {
  idsport: number;
  name_es: string;
  acronym: string;
}

export async function listCompetitionSports(): Promise<Sport[]> {
  const { data } = await api.get("/competition/sports");
  return data.sports;
}

export async function validateCompetitionByQr(
  qr: string,
  idsport: number
): Promise<CompetitionValidationResponse> {
  const { data } = await api.get("/competition/validate", {
    params: { qr, idsport },
  });
  return data;
}

export async function validateCompetitionByDocument(
  doctype: string,
  docnumber: string,
  idsport: number
): Promise<CompetitionValidationResponse> {
  const { data } = await api.get("/competition/validate-doc", {
    params: { doctype, docnumber, idsport },
  });
  return data;
}