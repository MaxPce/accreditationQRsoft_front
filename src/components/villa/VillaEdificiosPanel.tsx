// src/components/villa/VillaEdificiosPanel.tsx
import { useEffect, useState } from "react";
import QrScannerInput from "../QrScannerInput";
import AccreditationCard from "../AccreditationCard";
import {
  lookupVillageByQr,
  lookupVillageByDocument,
  registerVillageEntry,
  getBuildingCountries,
  type VillageBuilding,
  type BuildingCountry,
} from "../../api/village.api";
import type { Accreditation, VillageEntry } from "../../types/accreditation.types";

const DOC_TYPES = [
  { code: "1", label: "DNI" },
  { code: "2", label: "Carnet de Ext." },
  { code: "3", label: "Pasaporte" },
];

interface Props {
  buildings: VillageBuilding[];
}

type BuildingCountriesMap = Record<string, BuildingCountry[]>;

export default function VillaEdificiosPanel({ buildings }: Props) {
  const [activeBuilding, setActiveBuilding] = useState<VillageBuilding | null>(null);
  const [countriesByBuilding, setCountriesByBuilding] = useState<BuildingCountriesMap>({});
  const [loadingCountries, setLoadingCountries] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCountries = async () => {
      if (buildings.length === 0) {
        setCountriesByBuilding({});
        return;
      }

      setLoadingCountries(true);
      try {
        const results = await Promise.all(
          buildings.map(async (b) => {
            try {
              const countries = await getBuildingCountries(b.idbuilding);
              return [b.idbuilding, countries] as const;
            } catch {
              return [b.idbuilding, []] as const;
            }
          })
        );

        if (cancelled) return;

        setCountriesByBuilding(
          Object.fromEntries(results)
        );
      } finally {
        if (!cancelled) setLoadingCountries(false);
      }
    };

    loadCountries();

    return () => {
      cancelled = true;
    };
  }, [buildings]);

  if (activeBuilding) {
    return (
      <BuildingScannerView
        building={activeBuilding}
        onBack={() => setActiveBuilding(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        Selecciona un edificio para iniciar el escaneo de acreditados.
      </p>

      {buildings.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No hay edificios registrados.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {buildings.map((b) => {
            const countries = countriesByBuilding[b.idbuilding] ?? [];

            return (
              <button
                key={b.idbuilding}
                onClick={() => setActiveBuilding(b)}
                className="border rounded px-4 py-4 flex items-center justify-between text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-base">{b.name_es}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{b.idbuilding}</p>

                  <div className="mt-2">
                    {loadingCountries && !(b.idbuilding in countriesByBuilding) ? (
                      <p className="text-xs text-gray-400">Cargando países...</p>
                    ) : countries.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {countries.map((country) => (
                          <span
                            key={`${b.idbuilding}-${country.idcountry}`}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                          >
                            {country.country_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-300 italic">
                        Sin países asignados
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-gray-400 text-lg shrink-0">›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Vista de escáner por edificio ─────────────────────────────────────────────
interface ScannerViewProps {
  building: VillageBuilding;
  onBack: () => void;
}

function BuildingScannerView({ building, onBack }: ScannerViewProps) {
  const [accreditation, setAccreditation] = useState<Accreditation | null>(null);
  const [entriesToday, setEntriesToday] = useState<VillageEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // ── NUEVO: países asignados a este edificio ──
  const [countries, setCountries] = useState<BuildingCountry[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoadingCountries(true);
    getBuildingCountries(building.idbuilding)
      .then((res) => {
        if (!cancelled) setCountries(res);
      })
      .catch(() => {
        if (!cancelled) setCountries([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCountries(false);
      });

    return () => {
      cancelled = true;
    };
  }, [building.idbuilding]);

  const handleScan = async (value: {
    type: "qr" | "manual";
    qr?: string;
    doctype?: string;
    docnumber?: string;
  }) => {
    setError(null);
    setMessage(null);
    setAccreditation(null);

    try {
      const res =
        value.type === "qr"
          ? await lookupVillageByQr(value.qr!, building.idbuilding)
          : await lookupVillageByDocument(value.doctype!, value.docnumber!, building.idbuilding);

      setAccreditation(res.accreditation);
      setEntriesToday(res.entriesToday);
    } catch (err: any) {
      setError(err.response?.data?.message || "Acreditación no encontrada");
    }
  };

  const handleRegister = async () => {
    if (!accreditation) return;

    setProcessing(true);
    setError(null);

    try {
      const res = await registerVillageEntry(
        accreditation.idacreditation,
        null,
        building.idbuilding
      );

      setEntriesToday((prev) => [
        { gate: null, idbuilding: res.idbuilding, scanned_at: res.scannedAt },
        ...prev,
      ]);
      setMessage(`Ingreso registrado — ${building.name_es}`);
      setAccreditation(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo registrar el ingreso");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-black transition-colors"
        >
          ‹ Volver
        </button>
        <div>
          <p className="font-bold text-base">{building.name_es}</p>
          <p className="text-xs text-gray-400">{building.idbuilding}</p>

          {/* ── NUEVO: chips de países asignados ── */}
          <div className="mt-1">
            {loadingCountries ? (
              <p className="text-xs text-gray-400">Cargando países...</p>
            ) : countries.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {countries.map((country) => (
                  <span
                    key={country.idcountry}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
                  >
                    {country.country_name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-300 italic">Sin países asignados</p>
            )}
          </div>
        </div>
      </div>

      <QrScannerInput onResult={handleScan} docTypeOptions={DOC_TYPES} />

      {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
      {message && <p className="text-green-600 text-sm font-medium">{message}</p>}

      {accreditation && (
        <>
          <AccreditationCard accreditation={accreditation} />

          {accreditation.hosting ? (
            <button
              onClick={handleRegister}
              disabled={processing}
              className="w-full bg-black text-white rounded p-3 disabled:opacity-50 text-sm"
            >
              Registrar ingreso — {building.name_es}
            </button>
          ) : (
            <div className="rounded-xl bg-red-50 border-2 border-red-500 p-4 flex flex-col items-center gap-1 text-center">
              <span className="text-3xl">🚫</span>
              <p className="text-red-700 font-bold text-sm uppercase tracking-wide">
                Sin permiso de hospedaje
              </p>
              <p className="text-red-500 text-xs">
                Este acreditado no puede registrarse en edificios de la villa
              </p>
            </div>
          )}
        </>
      )}

      {entriesToday.length > 0 && (
        <div className="text-sm text-gray-600">
          <p className="font-semibold mb-1">Ingresos de hoy en {building.name_es}:</p>
          {entriesToday.map((e, i) => (
            <p key={i}>
              {new Date(e.scanned_at).toLocaleTimeString("es-PE")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}