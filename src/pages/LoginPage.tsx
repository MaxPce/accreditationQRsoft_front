// src/pages/LoginPage.tsx
import { type FormEvent, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { loginRequest } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import type { Company } from "../types/company.types";
import { resolveImageUrl } from "../utils/media";

export default function LoginPage() {
  const { idcompany } = useParams();
  const location = useLocation();
  const company = location.state as Company | undefined;
  const navigate = useNavigate();
  const setLoginData = useAuthStore((s) => s.setLoginData);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginRequest({
        idcompany: Number(idcompany),
        username,
        password,
      });
      setLoginData(res.token, res.account, company ?? ({ idcompany: Number(idcompany) } as Company));
      navigate("/events");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-80 flex flex-col gap-4">

        <button
            type="button"
            onClick={() => navigate(-1)}
            className="self-start text-sm text-gray-500 hover:text-black flex items-center gap-1"
        >
            ← Volver
        </button>
        {resolveImageUrl(company?.avatar) && (
            <img src={resolveImageUrl(company?.avatar)!} alt={company?.name} className="h-16 mx-auto object-contain" />
        )}
        <h1 className="text-lg font-semibold text-center">{company?.name || "Iniciar sesión"}</h1>
        <input
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border rounded p-2"
          autoFocus
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded p-2"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded p-2 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}