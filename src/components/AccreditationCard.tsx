// src/components/AccreditationCard.tsx
import type { Accreditation } from "../types/accreditation.types";
import { getCountryName } from "../utils/country";

export default function AccreditationCard({ accreditation }: { accreditation: Accreditation }) {
  const { person, role } = accreditation;
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <p className="text-lg font-semibold">{person.fullname}</p>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
        <p>País: {getCountryName(person.idcountry)}</p>
        <p>Rol: {role.name}</p>
        <p>{person.doctypeName}: {person.docnumber}</p>
        <p>ID Acreditación: {accreditation.idacreditation}</p>
      </div>
    </div>
  );
}