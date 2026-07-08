// src/api/auth.api.ts
import api from "./axios";
import { LoginResponse, SelectEventResponse } from "../types/auth.types";

export async function loginRequest(payload: {
  idcompany: number;
  username: string;
  password: string;
}): Promise<LoginResponse> {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function selectEventRequest(idevent: number): Promise<SelectEventResponse> {
  const { data } = await api.post("/auth/select-event", { idevent });
  return data;
}