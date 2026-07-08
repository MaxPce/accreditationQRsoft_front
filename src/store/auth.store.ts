// src/store/auth.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Account, EventItem, Stage } from "../types/auth.types";
import { Company } from "../types/company.types";

interface AuthState {
  token: string | null;
  stage: Stage | null;
  company: Company | null;
  account: Account | null;
  event: EventItem | null;
  setLoginData: (token: string, account: Account, company: Company) => void;
  setEventData: (token: string, event: EventItem) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      stage: null,
      company: null,
      account: null,
      event: null,
      setLoginData: (token, account, company) =>
        set({ token, account, company, stage: "company_logged", event: null }),
      setEventData: (token, event) =>
        set({ token, event, stage: "event_selected" }),
      logout: () =>
        set({ token: null, stage: null, company: null, account: null, event: null }),
    }),
    { name: "accreditation-qr-auth" }
  )
);