// src/components/QrScannerInput.tsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onResult: (value: { type: "qr" | "manual"; qr?: string; doctype?: string; docnumber?: string }) => void;
  docTypeOptions: { code: string; label: string }[];
}

// ✅ regionId único por instancia para evitar colisión entre desmonte y remonte
let instanceCounter = 0;

export default function QrScannerInput({ onResult, docTypeOptions }: Props) {
  const [mode, setMode] = useState<"qr" | "manual">("qr");
  const [doctype, setDoctype] = useState(docTypeOptions[0]?.code ?? "");
  const [docnumber, setDocnumber] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false); // ✅ controla si mostrar el div

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const lastScanRef = useRef<string | null>(null);
  const onResultRef = useRef(onResult);
  // ✅ ID único por cada montaje del componente
  const regionIdRef = useRef(`qr-reader-${++instanceCounter}`);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (mode !== "qr") return;

    // Reset de estado al arrancar un nuevo ciclo
    lastScanRef.current = null;
    setCameraError(null);
    setCameraReady(false);

    let cancelled = false; // ✅ evita race condition si cleanup llega antes de que arranque

    // ✅ Pequeño delay para asegurar que el div ya está en el DOM
    const timer = setTimeout(async () => {
      if (cancelled) return;

      const regionId = regionIdRef.current;
      const el = document.getElementById(regionId);
      if (!el) {
        setCameraError("No se pudo inicializar el lector. Intenta recargar.");
        return;
      }

      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (decodedText === lastScanRef.current) return;
            lastScanRef.current = decodedText;
            onResultRef.current({ type: "qr", qr: decodedText });
            setTimeout(() => { lastScanRef.current = null; }, 2000);
          },
          undefined
        );

        if (!cancelled) {
          isRunningRef.current = true;
          setCameraReady(true); // ✅ solo mostrar cuando la cámara realmente arrancó
        } else {
          // Se montó y desmontó muy rápido, parar inmediatamente
          await scanner.stop().catch(() => {});
          scanner.clear();
        }
      } catch (err: any) {
        isRunningRef.current = false;
        if (cancelled) return;
        const msg = err?.message || String(err);
        if (msg.includes("not supported") || msg.includes("getUserMedia")) {
          setCameraError("La cámara no está disponible. Usa HTTPS o localhost, o ingresa el documento manualmente.");
        } else {
          setCameraError("No se pudo iniciar la cámara: " + msg);
        }
      }
    }, 150); // ✅ 150ms es suficiente para que React termine de pintar el div

    return () => {
      cancelled = true;
      clearTimeout(timer);
      lastScanRef.current = null;
      setCameraReady(false);

      const scanner = scannerRef.current;
      if (scanner && isRunningRef.current) {
        isRunningRef.current = false;
        scanner.stop()
          .then(() => { scanner.clear(); })
          .catch(() => { try { scanner.clear(); } catch (_) {} });
      } else if (scanner) {
        try { scanner.clear(); } catch (_) {}
      }
      scannerRef.current = null;
    };
  }, [mode]);

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!docnumber) return;
    onResultRef.current({ type: "manual", doctype, docnumber });
    setDocnumber("");
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("qr")}
          className={`px-3 py-1 rounded ${mode === "qr" ? "bg-black text-white" : "bg-gray-100"}`}
        >
          Cámara (QR)
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`px-3 py-1 rounded ${mode === "manual" ? "bg-black text-white" : "bg-gray-100"}`}
        >
          Manual
        </button>
      </div>

      {mode === "qr" && (
        <>
          {cameraError ? (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
              ⚠️ {cameraError}
            </div>
          ) : (
            <div className="relative w-full max-w-sm mx-auto min-h-[200px]">
              {/* ✅ El div del scanner siempre está en el DOM cuando mode === "qr" */}
              <div id={regionIdRef.current} className="w-full" />
              {/* Spinner mientras la cámara no está lista */}
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    <span className="text-xs">Iniciando cámara...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {mode === "manual" && (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
          <select
            value={doctype}
            onChange={(e) => setDoctype(e.target.value)}
            className="border rounded p-2"
          >
            {docTypeOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            placeholder="Número de documento"
            value={docnumber}
            onChange={(e) => setDocnumber(e.target.value)}
            className="border rounded p-2"
            autoFocus
          />
          <button type="submit" className="bg-black text-white rounded p-2">
            Buscar
          </button>
        </form>
      )}
    </div>
  );
}