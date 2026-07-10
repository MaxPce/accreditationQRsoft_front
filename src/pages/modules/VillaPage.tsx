// src/pages/modules/VillaPage.tsx
import { useEffect, useState } from "react";
import { listBuildings, type VillageBuilding } from "../../api/village.api";
import VillaScannerPanel  from "../../components/villa/VillaScannerPanel";
import VillaEdificiosPanel from "../../components/villa/VillaEdificiosPanel";
import VillaPaisesPanel   from "../../components/villa/VillaPaisesPanel";
import VillaHistorialPanel from "../../components/villa/VillaHistorialPanel";


type MainTab = "scanner" | "edificios" | "paises" | "historial";


const TABS: { key: MainTab; label: string }[] = [
  { key: "scanner",   label: "📷 Escáner"  },
  { key: "edificios", label: "🏢 Edificios" },
  { key: "paises",    label: "🌎 Países"    },
  { key: "historial", label: "📋 Historial" },
];

export default function VillaPage() {
  const [mainTab, setMainTab]     = useState<MainTab>("scanner");
  const [buildings, setBuildings] = useState<VillageBuilding[]>([]);

  useEffect(() => {
    listBuildings().then(setBuildings).catch(() => {});
  }, []);

  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col gap-4">

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setMainTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              mainTab === t.key
                ? "border-black text-black"
                : "border-transparent text-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <h1 className="text-xl font-bold">Ingreso a Villa</h1>

      {mainTab === "scanner"   && <VillaScannerPanel   buildings={buildings} />}
      {mainTab === "edificios" && <VillaEdificiosPanel buildings={buildings} />}
      {mainTab === "paises"    && <VillaPaisesPanel    buildings={buildings} />}
      {mainTab === "historial" && <VillaHistorialPanel buildings={buildings} />}

    </div>
  );
}