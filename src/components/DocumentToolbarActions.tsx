import React, { useRef } from "react";
import { Printer, Upload, Download, FileText, CheckCircle2 } from "lucide-react";

export interface DocumentToolbarActionsProps {
  onPrint?: () => void;
  onImport?: (data: any, file: File) => void;
  onExport?: () => void;
  title?: string;
  className?: string;
  showExport?: boolean;
}

export const DocumentToolbarActions: React.FC<DocumentToolbarActionsProps> = ({
  onPrint,
  onImport,
  onExport,
  title = "Documento",
  className = "",
  showExport = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let parsed: any = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = { rawText: text, fileName: file.name };
        }

        if (onImport) {
          onImport(parsed, file);
        } else {
          alert(`Ficheiro "${file.name}" importado com sucesso para o documento!`);
        }
      } catch (err) {
        console.error("Erro ao importar ficheiro:", err);
        alert("Erro ao processar o ficheiro importado.");
      }
    };

    if (file.name.endsWith(".json") || file.name.endsWith(".txt") || file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }

    // Reset input
    e.target.value = "";
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 print:hidden ${className}`}>
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,.csv,.txt,.xlsx,.xls,.pdf,.doc,.docx"
        className="hidden"
      />

      {/* Botão IMPORTAR */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400 shadow-sm transition-all active:scale-95"
        title="Importar dados ou ficheiro para este documento"
      >
        <Upload size={15} className="text-blue-700" />
        <span>Importar</span>
      </button>

      {/* Botão IMPRIMIR */}
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all active:scale-95"
        title="Imprimir ou gerar PDF deste documento"
      >
        <Printer size={15} className="text-amber-400" />
        <span>Imprimir</span>
      </button>

      {/* Botão EXPORTAR (Opcional) */}
      {showExport && onExport && (
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm transition-all active:scale-95"
          title="Exportar dados do documento"
        >
          <Download size={15} />
          <span>Exportar</span>
        </button>
      )}
    </div>
  );
};
