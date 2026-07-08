// src/api/village.api.ts
import api from "./axios";
import type { Gate, VillageLookupResponse } from "../types/accreditation.types";

export async function lookupVillageByQr(qr: string): Promise<VillageLookupResponse> {
  const { data } = await api.get("/village/lookup", { params: { qr } });
  return data;
}

export async function lookupVillageByDocument(
  doctype: string,
  docnumber: string
): Promise<VillageLookupResponse> {
  const { data } = await api.get("/village/lookup", { params: { doctype, docnumber } });
  return data;
}

export async function registerVillageEntry(idacreditation: number, gate: Gate) {
  const { data } = await api.post("/village/register", { idacreditation, gate });
  return data;
}