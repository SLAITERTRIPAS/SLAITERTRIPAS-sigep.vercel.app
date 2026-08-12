import React, { useState, useEffect } from "react";
import { Save, Clock } from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";

export default function ConfiguracaoExamesView({ onShowAlert }: { onShowAlert: (msg: string) => void }) {
  const [periods, setPeriods] = useState({
    p1: { inicio: "07:00", fim: "12:30", duracao: 120, intervalo: 10 },
    p2: { inicio: "13:00", fim: "17:50", duracao: 120, intervalo: 10 },
    p3: { inicio: "18:50", fim: "23:00", duracao: 120, intervalo: 10 },
  });

  useEffect(() => {
    // Load existing config
    const unsub = firestoreService.configuracoes.subscribe((data: any) => {
        const exameConfig = data.find((d: any) => d.id === "exame_periods");
        if (exameConfig) {
            setPeriods(exameConfig.data);
        }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    try {
      await firestoreService.configuracoes.set("exame_periods", { data: periods });
      onShowAlert("Configurações de exames atualizadas com sucesso!");
    } catch (error) {
      onShowAlert("Erro ao atualizar configurações.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-blue-900 mb-1 flex items-center gap-2">
          <Clock size={20} />
          Configuração dos Períodos e Duração dos Exames
        </h3>
        <p className="text-xs text-slate-500">
          Regulamento: Exames têm duração estipulada de 2 horas (120 min) com 10 minutos de intervalo de transição para o próximo exame.
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(periods).map(([key, p]: [string, any]) => (
          <div key={key} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">{key.replace("p", "Período / Turno ")}</span>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Início do Turno</label>
              <input type="time" value={p.inicio || "07:00"} onChange={(e) => setPeriods({...periods, [key]: {...p, inicio: e.target.value}})} className="w-full p-2 border rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Fim do Turno</label>
              <input type="time" value={p.fim || "12:30"} onChange={(e) => setPeriods({...periods, [key]: {...p, fim: e.target.value}})} className="w-full p-2 border rounded-lg text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Duração (Minutos)</label>
              <input type="number" value={p.duracao ?? 120} onChange={(e) => setPeriods({...periods, [key]: {...p, duracao: parseInt(e.target.value) || 120}})} className="w-full p-2 border rounded-lg text-xs font-bold text-blue-900" placeholder="120 min (2h)" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Intervalo (Minutos)</label>
              <input type="number" value={p.intervalo ?? 10} onChange={(e) => setPeriods({...periods, [key]: {...p, intervalo: parseInt(e.target.value) || 10}})} className="w-full p-2 border rounded-lg text-xs font-bold text-emerald-800" placeholder="10 min" />
            </div>
          </div>
        ))}
        <button onClick={handleSave} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm transition">
          <Save size={16} />
          Guardar Configurações dos Exames
        </button>
      </div>
    </div>
  );
}
