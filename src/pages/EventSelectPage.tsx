// src/pages/EventSelectPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchEvents } from "../api/events.api";
import { selectEventRequest } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import type { EventItem } from "../types/auth.types";

export default function EventSelectPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(null);
  const navigate = useNavigate();
  const setEventData = useAuthStore((s) => s.setEventData);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (idevent: number) => {
    setSelecting(idevent);
    try {
      const res = await selectEventRequest(idevent);
      setEventData(res.token, res.event);
      navigate("/panel");
    } finally {
      setSelecting(null);
    }
  };

  if (loading) return <p>Cargando eventos...</p>;

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Selecciona el evento</h1>
        <button onClick={logout} className="text-sm text-red-600">Cerrar sesión</button>
      </div>
      <div className="grid gap-4">
        {events.map((ev) => (
          <button
            key={ev.idevent}
            onClick={() => handleSelect(ev.idevent)}
            disabled={selecting === ev.idevent}
            className="border rounded-lg p-4 text-left hover:shadow-md flex gap-4 items-center disabled:opacity-50"
          >
            {ev.logo && <img src={ev.logo} className="h-14 w-14 object-cover rounded" />}
            <div>
              <p className="font-semibold">{ev.name}</p>
              <p className="text-sm text-gray-500">{ev.place}</p>
              <p className="text-xs text-gray-400">
                {new Date(ev.startdate).toLocaleDateString()} - {new Date(ev.enddate).toLocaleDateString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}