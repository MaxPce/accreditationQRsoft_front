// src/api/mobility.api.ts
import api from "./axios";
import type { MobilityLookupResponse, MobilityLocation, MobilityEventType } from "../types/accreditation.types";

export async function lookupMobilityByQr(qr: string): Promise<MobilityLookupResponse> {
  const { data } = await api.get("/mobility/lookup", { params: { qr } });
  return data;
}

export async function lookupMobilityByDocument(
  doctype: string,
  docnumber: string
): Promise<MobilityLookupResponse> {
  const { data } = await api.get("/mobility/lookup", { params: { doctype, docnumber } });
  return data;
}

export async function registerMobilityLog(
  idacreditation: number,
  location: MobilityLocation,
  event_type: MobilityEventType
): Promise<{ location: MobilityLocation; event_type: MobilityEventType; scannedAt: string }> {
  const { data } = await api.post("/mobility/register", { idacreditation, location, event_type });
  return data;
}