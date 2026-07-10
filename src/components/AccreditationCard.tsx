// src/components/AccreditationCard.tsx
import type { Accreditation } from "../types/accreditation.types";
import { getCountryName } from "../utils/country";

// Fallback por si algún rol no tiene param2 en la DB (ej: OM, C)
const ROLE_COLOR_FALLBACK: Record<string, string> = {
  OM: "80,80,160",
  C:  "100,100,100",
};

export default function AccreditationCard({ accreditation }: { accreditation: Accreditation }) {
  const { person, role } = accreditation;

  const rgb = role.color ?? ROLE_COLOR_FALLBACK[role.code] ?? "80,80,80";
  const badgeStyle: React.CSSProperties = {
    backgroundColor: `rgb(${rgb})`,
    color: "white",
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-lg font-semibold leading-tight">{person.fullname}</p>
        <span
          style={badgeStyle}
          className="shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
        >
          {role.name}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <p>País: {getCountryName(person.idcountry)}</p>
        <p>{person.doctypeName}: {person.docnumber}</p>
        <p>ID Acreditación: {accreditation.idacreditation}</p>
      </div>
    </div>
  );
}