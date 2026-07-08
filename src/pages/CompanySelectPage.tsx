// src/pages/CompanySelectPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCompanies } from "../api/companies.api";
import type { Company } from "../types/company.types";
import { resolveImageUrl } from "../utils/media";


export default function CompanySelectPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies()
      .then(setCompanies)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando federaciones...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-xl font-bold">Selecciona la organización</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {companies.map((c) => (
          <button
            key={c.idcompany}
            onClick={() => navigate(`/login/${c.idcompany}`, { state: c })}
            className="border rounded-lg p-4 flex flex-col items-center hover:shadow-md transition"
          >
            {resolveImageUrl(c.avatar) && (
                <img src={resolveImageUrl(c.avatar)!} alt={c.name} className="h-16 object-contain mb-2" />
            )}
            <span className="text-sm text-center">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}