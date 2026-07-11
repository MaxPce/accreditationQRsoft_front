// src/components/AccreditationCard.tsx
import { useState } from "react";
import type { Accreditation } from "../types/accreditation.types";
import { getCountryName } from "../utils/country";

const ROLE_COLOR_FALLBACK: Record<string, string> = {
  OM: "80,80,160",
  C:  "100,100,100",
};

export default function AccreditationCard({ accreditation }: { accreditation: Accreditation }) {
  const { person, role } = accreditation;
  const [imgError, setImgError] = useState(false);

  const rgb = role.color ?? ROLE_COLOR_FALLBACK[role.code] ?? "80,80,80";
  const badgeStyle: React.CSSProperties = {
    backgroundColor: `rgb(${rgb})`,
    color: "white",
  };

  const showPhoto = !!person.photoUrl && !imgError;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      {/* Cabecera: foto + nombre + badge */}
      <div className="flex items-start gap-3 mb-3">

        {/* FOTO o INICIAL de fallback */}
        {showPhoto ? (
          <img
            src={person.photoUrl!}
            alt={person.fullname}
            onError={() => setImgError(true)}
            className="w-16 h-16 rounded-full object-cover border-2 shrink-0"
            style={{ borderColor: `rgb(${rgb})` }}
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ backgroundColor: `rgb(${rgb})` }}
          >
            {person.fullname.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Nombre + badge */}
        <div className="flex-1 flex items-start justify-between gap-2">
          <p className="text-lg font-semibold leading-tight">{person.fullname}</p>
          <span
            style={badgeStyle}
            className="shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
          >
            {role.name}
          </span>
        </div>
      </div>

      {/* Datos */}
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <p>País: {getCountryName(person.idcountry)}</p>
        <p>{person.doctypeName}: {person.docnumber}</p>
        <p>ID Acreditación: {accreditation.idacreditation}</p>
      </div>
    </div>
  );
}