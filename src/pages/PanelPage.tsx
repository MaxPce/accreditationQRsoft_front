// src/pages/PanelPage.tsx
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

const modules = [
  { key: "alimentos", label: "Alimentos", icon: "🍽️" },
  { key: "movilidad", label: "Movilidad", icon: "🚌" },
  { key: "villa", label: "Ingreso a Villa", icon: "🏠" },
  { key: "competencia", label: "Ingreso a Competencia", icon: "🏆" },
];

export default function PanelPage() {
  const { event, account, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate("/events")}
            className="text-sm text-gray-500 hover:text-gray-800 mb-2"
          >
            ← Volver
          </button>
          <h1 className="text-lg font-bold">{event?.name}</h1>
          <p className="text-sm text-gray-500">{account?.username}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-600">Cerrar sesión</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {modules.map((m) => (
          <Link
            key={m.key}
            to={`/panel/${m.key}`}
            className="border rounded-lg p-6 flex flex-col items-center gap-2 hover:shadow-md"
          >
            <span className="text-3xl">{m.icon}</span>
            <span>{m.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}