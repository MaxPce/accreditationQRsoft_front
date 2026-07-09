// src/types/accreditation.types.ts
export interface AccreditationPerson {
  idperson: number;
  fullname: string;
  idcountry: string;
  doctype: string;
  doctypeName: string;
  docnumber: string;
}

export interface AccreditationRole {
  code: string;
  name: string;
}

export interface Accreditation {
  idacreditation: number;
  idevent: number;
  idsport: number;
  idinstitution: number;
  role: AccreditationRole;
  person: AccreditationPerson;
}

export type MealType = "desayuno" | "almuerzo" | "cena";

export interface MealsLookupResponse {
  ok: boolean;
  accreditation: Accreditation;
  mealsToday: Partial<Record<MealType, string>>;
}

export type Gate = "puerta1" | "puerta2";

export interface VillageEntry {
  gate: Gate;
  scanned_at: string;
}

export interface VillageLookupResponse {
  ok: boolean;
  accreditation: Accreditation;
  entriesToday: VillageEntry[];
}

export type MobilityLocation = "videna" | "villa_panamericana";
export type MobilityEventType = "salida" | "llegada";

export interface MobilityLog {
  location: MobilityLocation;
  event_type: MobilityEventType;
  scanned_at: string;
}

export interface MobilityLookupResponse {
  ok: boolean;
  accreditation: Accreditation;
  logsToday: MobilityLog[];
}
