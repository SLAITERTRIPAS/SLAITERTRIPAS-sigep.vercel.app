import React, { useState } from "react";
import { Pen, CheckCircle2, AlertCircle } from "lucide-react";
import { Expediente } from "../../types";

export default function GerarDespachoSection({
  expedientes,
  user,
  onUpdateExpediente,
}: {
  expedientes: Expediente[];
  user: any;
  onUpdateExpediente: (e: Expediente) => void;
}) {
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string>("");
  const [parecer, setParecer] = useState<
    "É DE AUTORIZAR" | "NÃO É DE AUTORIZAR" | ""
  >("");

  const pendingExpedientes = expedientes.filter((e) => e.status === "Pendente");

  const handleGerarDespacho = () => {
    if (!selectedExpedienteId || !parecer) return;

    const expediente = expedientes.find((e) => e.id === selectedExpedienteId);
    if (!expediente) return;

    const updated = {
      ...expediente,
      status: "Concluído" as const, // Changed to a valid status
      historico: [
        ...(expediente.historico || []),
        {
          setor: user.cargoChefia || "Chefia",
          data: new Date().toISOString(),
          acao: `Parecer gerado: ${parecer}`,
          parecer: `Despacho: ${parecer}`,
        },
      ],
    };

    onUpdateExpediente(updated);
    alert("Despacho gerado e enviado com sucesso!");
    setSelectedExpedienteId("");
    setParecer("");
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-12 space-y-8">
      <h2 className="text-3xl font-black text-amber-600 tracking-tighter font-serif">
        Gerar Despacho
      </h2>

      <div className="space-y-4">
        <label className="block text-sm font-bold text-gray-700">
          Selecione o Expediente
        </label>
        <select
          className="w-full p-4 rounded-2xl border-2 border-gray-200 outline-none focus:border-amber-500"
          value={selectedExpedienteId}
          onChange={(e) => setSelectedExpedienteId(e.target.value)}
        >
          <option value="">Selecione um expediente...</option>
          {pendingExpedientes.map((e) => (
            <option key={e.id} value={e.id}>
              {e.numero} - {e.assunto}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-bold text-gray-700">Parecer</label>
        <select
          className="w-full p-4 rounded-2xl border-2 border-gray-200 outline-none focus:border-amber-500"
          value={parecer}
          onChange={(e) => setParecer(e.target.value as any)}
        >
          <option value="">Selecione o parecer...</option>
          <option value="É DE AUTORIZAR">É DE AUTORIZAR</option>
          <option value="NÃO É DE AUTORIZAR">NÃO É DE AUTORIZAR</option>
        </select>
      </div>

      <button
        onClick={handleGerarDespacho}
        disabled={!selectedExpedienteId || !parecer}
        className="w-full py-6 bg-amber-600 text-white rounded-2xl font-black text-lg hover:bg-amber-700 disabled:bg-gray-300 transition-all flex items-center justify-center gap-3"
      >
        <Pen size={24} /> Gerar Despacho
      </button>
    </div>
  );
}
