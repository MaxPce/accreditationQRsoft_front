// src/api/village.api.ts
import api from "./axios";
import type { Gate, VillageLookupResponse } from "../types/accreditation.types";

export interface VillageBuilding {
  idbuilding: string;
  name_es: string;
  name_en: string;
}

export interface BuildingCountry {
  id: number;
  idcountry: string;       
  country_name: string;    
}


export interface CountryOption {
  idcountry: string;       
  name: string;            
}

export interface VillageHistoryRecord {
  idacreditation: number;
  gate:           string | null;
  idbuilding:     string | null;
  building_name:  string | null;
  scanned_at:     string;
  person: {
    fullname:  string;
    docnumber: string;
  };
  role:         { code: string; name: string };
  country_name: string | null;
}


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

export async function registerVillageEntry(
  idacreditation: number,
  gate: Gate | null,        
  idbuilding?: string
) {
  const { data } = await api.post("/village/register", {
    idacreditation,
    gate,                   
    ...(idbuilding ? { idbuilding } : {}),
  });
  return data;
}

export async function listBuildings(): Promise<VillageBuilding[]> {
  const { data } = await api.get("/village/buildings");
  return data.buildings;
}

export async function getBuildingCountries(idbuilding: string): Promise<BuildingCountry[]> {
  const { data } = await api.get(`/village/buildings/${idbuilding}/countries`);
  return data.countries;
}

export async function assignCountryToBuilding(idbuilding: string, idcountry: string) {
  const { data } = await api.post(`/village/buildings/${idbuilding}/countries`, { idcountry });
  return data;
}

export async function removeCountryFromBuilding(idbuilding: string, idcountry: string) {
  const { data } = await api.delete(`/village/buildings/${idbuilding}/countries/${idcountry}`);
  return data;
}

export async function listAllCountries(): Promise<CountryOption[]> {
  const { data } = await api.get("/village/countries"); 
  return data.countries;
}

export async function getVillageHistory(
  filters: Record<string, string>
): Promise<VillageHistoryRecord[]> {
  const { data } = await api.get("/village/history", { params: filters });
  return data.records;
}
