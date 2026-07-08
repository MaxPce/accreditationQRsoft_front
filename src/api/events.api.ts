// src/api/events.api.ts
import api from "./axios";
import { EventItem } from "../types/auth.types";

export async function fetchEvents(): Promise<EventItem[]> {
  const { data } = await api.get("/events");
  return data.events;
}