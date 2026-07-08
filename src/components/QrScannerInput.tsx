// src/components/QrScannerInput.tsx
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface Props {
  onResult: (value: { type: "qr" | "manual"; qr?: string; doctype?: string; docnumber?: string }) => void;
  docTypeOptions: { code: string; label: string }[];
}

export default function QrScannerInput({ onResult, docTypeOptions }: Props) {
  const [mode, setMode] = useState<"qr" | "manual">("qr");
  const [doctype, setDoctype] = useState(docTypeOptions[0]?.code ?? "");
  const [docnumber, setDocnumber] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-reader-region";
  const lastScanRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== "qr") return;

    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (decodedText === lastScanRef.current) return;
          lastScanRef.current = decodedText;
          onResult({ type: "qr", qr: decodedText });
          setTimeout(() => (lastScanRef.current = null), 2000);
        }
      )
      .catch((err) => console.error("No se pudo iniciar la cámara", err));

    return () => {
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [mode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docnumber) return;
    onResult({ type: "manual", doctype, docnumber });
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

      {mode === "qr" && <div id={regionId} className="w-full max-w-sm mx-auto" />}

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