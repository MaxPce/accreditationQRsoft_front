// src/api/events.api.ts
import api from "./axios";
import type { EventItem } from "../types/auth.types";

export async function fetchEvents(): Promise<EventItem[]> {
  const { data } = await api.get("/events");
  return Array.isArray(data.events) ? data.events : Array.isArray(data) ? data : [];
}
