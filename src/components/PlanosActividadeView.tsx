import React, { useState } from "react";
import { ArrowLeft, Building2, Calendar, Clock } from "lucide-react";

interface Activity {
  id: string;
  title: string;
  status: "em_curso" | "proximo_mes";
  dataExecucao: string;
  direcao: string;
  departamento: string;
  reparticao: string;
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "1",
    title: "Revisão de Planos",
    status: "em_curso",
    dataExecucao: "2026-07-12",
    direcao: "DAF",
    departamento: "Finanças",
    reparticao: "Orçamento",
  },
  {
    id: "2",
    title: "Auditoria Interna",
    status: "proximo_mes",
    dataExecucao: "2026-08-05",
    direcao: "DPEP",
    departamento: "Pedagógico",
    reparticao: "Ensino",
  },
];

export default function PlanosActividadeView({
  onBack,
}: {
  onBack: () => void;
}) {
  const [view, setView] = useState<"main" | "drilldown" | "execucao">("main");

  return (
    <div className="w-full space-y-6 pb-10">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
      >
        <ArrowLeft size={16} /> Voltar para Visão Geral
      </button>
      <h2 className="text-2xl font-black text-slate-900">
        Planos de Actividade
      </h2>

      {/* Resumo Direções */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["DAF", "DPEP", "DC"].map((dir) => (
          <div
            key={dir}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md"
          >
            <h3 className="text-lg font-black text-slate-800">{dir}</h3>
            <p className="text-sm text-slate-500">
              12 Actividades | 500,000 MZN
            </p>
          </div>
        ))}
      </div>

      {/* Actividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <h4 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
            <Clock size={20} /> Actividades em Curso
          </h4>
          <div className="space-y-4">
            {MOCK_ACTIVITIES.filter((a) => a.status === "em_curso").map((a) => (
              <div key={a.id} className="p-4 bg-slate-50 rounded-xl font-bold">
                {a.title} - {a.dataExecucao}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <h4 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
            <Calendar size={20} /> Próximo Mês
          </h4>
          <div className="space-y-4">
            {MOCK_ACTIVITIES.filter((a) => a.status === "proximo_mes").map(
              (a) => (
                <div
                  key={a.id}
                  className="p-4 bg-slate-50 rounded-xl font-bold"
                >
                  {a.title} - {a.dataExecucao}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
