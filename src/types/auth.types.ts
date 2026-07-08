// src/types/auth.types.ts
export type Stage = "company_logged" | "event_selected";

export interface Account {
  idcompany: number;
  idaccount: number;
  username: string;
  avatar: string | null;
  email: string | null;
}

export interface EventItem {
  idcompany: number;
  idevent: number;
  name: string;
  tipo: string;
  place: string | null;
  startdate: string;
  enddate: string;
  logo: string | null;
  slug: string;
}

export interface LoginResponse {
  ok: boolean;
  token: string;
  account: Account;
}

export interface SelectEventResponse {
  ok: boolean;
  token: string;
  event: EventItem;
}