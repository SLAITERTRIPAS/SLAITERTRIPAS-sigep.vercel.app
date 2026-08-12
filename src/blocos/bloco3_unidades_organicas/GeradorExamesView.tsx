import React, { useState, useEffect } from "react";
import { firestoreService } from "../../lib/firestoreService";
import { Users, BookOpen, Clock, Save, ShieldAlert, RefreshCw } from "lucide-react";

export const isDocente = (d: any) => {
  if (!d) return false;
  const t = String(d.tipo || "").toLowerCase();
  const c = String(d.carreira || "").toLowerCase();
  const f = String(d.funcao || d.cargo || d.cargoChefia || "").toLowerCase();
  return (
    t.includes("docente") ||
    c.includes("docente") ||
    f.includes("docente") ||
    f.includes("profess") ||
    f.includes("assistente") ||
    (Array.isArray(d.disciplinas) && d.disciplinas.length > 0)
  );
};

export const isChefiaDivisaoEngenharia = (d: any): boolean => {
  if (!d) return false;
  const chefia = String(d.cargoChefia || d.cargo || d.funcao || "").toLowerCase().trim();
  const direcao = String(d.direcao || d.unidade || d.unidadeOrganica || "").toLowerCase();
  const depto = String(d.departamento || "").toLowerCase();

  const isEngenharia =
    direcao.includes("engenharia") ||
    depto.includes("engenharia") ||
    depto.includes("decc") ||
    depto.includes("dee") ||
    depto.includes("decm") ||
    depto.includes("ddg") ||
    depto.includes("dta");

  if (!isEngenharia) return false;

  if (!chefia || chefia === "nenhum" || chefia === "docente" || chefia === "docente tempo inteiro" || chefia === "docente em tempo inteiro") return false;

  return (
    chefia.includes("diretor") ||
    chefia.includes("chefe") ||
    chefia.includes("coordenador") ||
    chefia.includes("responsavel") ||
    chefia.includes("dec") ||
    chefia.includes("decc") ||
    chefia.includes("dee") ||
    chefia.includes("decm") ||
    chefia.includes("ddg") ||
    chefia.includes("dta")
  );
};

export default function GeradorExamesView({ user, onShowAlert }: { user: any; onShowAlert: (msg: string) => void }) {
  const [docentes, setDocentes] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [config, setConfig] = useState({ tipo: "Normal", disciplina: "", data: "", horario: "07:00 - 09:00", sala: "", vigilante: "" });

  const horariosturnos = [
    { label: "Manhã - 1º Slot (07:00 - 09:00)", val: "07:00 - 09:00" },
    { label: "Manhã - 2º Slot (09:10 - 11:10)", val: "09:10 - 11:10" },
    { label: "Tarde - 1º Slot (13:00 - 15:00)", val: "13:00 - 15:00" },
    { label: "Tarde - 2º Slot (15:10 - 17:10)", val: "15:10 - 17:10" },
    { label: "Noite - 1º Slot (18:50 - 20:50)", val: "18:50 - 20:50" },
    { label: "Noite - 2º Slot (21:00 - 23:00)", val: "21:00 - 23:00" },
  ];

  useEffect(() => {
    const unsubDocentes = firestoreService.colaboradores.subscribe((data: any) => {
      setDocentes((data || []).filter(isDocente));
    });
    const unsubSalas = firestoreService.espacos_fisicos.subscribe((data: any) => {
      setSalas(data || []);
    });
    const unsubDisc = firestoreService.disciplinas_academicas.subscribe((data: any[]) => {
      const comExame = (data || []).filter((d) => d.classificacaoExame !== "sem_exame");
      setDisciplinas(comExame);
    });
    return () => {
      unsubDocentes();
      unsubSalas();
      unsubDisc();
    };
  }, []);

  const selectedDisciplinaObj = disciplinas.find(d => d.id === config.disciplina);

  const eligibleVigilantes = docentes.filter(d => {
    if (!isDocente(d)) return false;
    if (isChefiaDivisaoEngenharia(d)) return false;
    if (selectedDisciplinaObj && (d.id === selectedDisciplinaObj.docenteId || d.nome === selectedDisciplinaObj.docenteNome)) return false;
    return true;
  });

  const handleGenerate = async () => {
    if (!config.disciplina || !config.sala || !config.vigilante || !config.data) {
      onShowAlert("Preencha todos os dados obrigatórios.");
      return;
    }
    const disciplina = disciplinas.find(d => d.id === config.disciplina);
    if (disciplina?.docenteId === config.vigilante) {
      onShowAlert("O vigilante não pode ser o docente da disciplina!");
      return;
    }
    const vigilanteObj = docentes.find(d => d.id === config.vigilante);
    if (isChefiaDivisaoEngenharia(vigilanteObj)) {
      onShowAlert("Docentes com cargos de chefia na Divisão de Engenharia não podem vigiar exames!");
      return;
    }

    try {
      await firestoreService.exames.add({
        ...config,
        disciplinaNome: disciplina?.nome || "",
        vigilanteNome: vigilanteObj?.nome || "",
        createdAt: new Date().toISOString(),
      });
      onShowAlert("Exame gerado e agendado com sucesso!");
      setConfig({ tipo: "Normal", disciplina: "", data: "", horario: "07:00 - 09:00", sala: "", vigilante: "" });
    } catch (err) {
      onShowAlert("Erro ao agendar exame.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-blue-900">Gerador e Agendamento de Exames</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          ⏱️ Regulamento Oficial: Exames com duração rigorosa de 2 Horas (120 min) e intervalo de 10 minutos para o próximo exame.
        </p>
      </div>

      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
        <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Regras de Vigilância de Exames:</span>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-800">
            <li>Exames são vigiados <strong>exclusivamente por Docentes</strong>.</li>
            <li>Docentes <strong>não podem vigiar</strong> as suas próprias disciplinas lecionadas.</li>
            <li>Docentes com <strong>cargos de chefia na Divisão de Engenharia</strong> estão isentos de vigilância.</li>
          </ul>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <button className={`px-4 py-2 rounded-xl text-xs font-bold transition ${config.tipo === "Normal" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-slate-700"}`} onClick={() => setConfig({...config, tipo: "Normal"})}>Exame Normal</button>
        <button className={`px-4 py-2 rounded-xl text-xs font-bold transition ${config.tipo === "Recorrência" ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-slate-700"}`} onClick={() => setConfig({...config, tipo: "Recorrência"})}>Exame de Recorrência</button>
        <button className={`px-4 py-2 rounded-xl text-xs font-bold transition ${config.tipo === "Especial" ? "bg-amber-600 text-white shadow-sm" : "bg-amber-50 text-amber-800 border border-amber-200"}`} onClick={() => setConfig({...config, tipo: "Especial"})}>⭐ Exame Especial (Criado pelo Diretor de Curso)</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Disciplina com Exame *</label>
          <select className="w-full p-2.5 border rounded-xl text-sm" value={config.disciplina} onChange={e => setConfig({...config, disciplina: e.target.value})}>
            <option value="">Selecione Disciplina com Exame</option>
            {disciplinas.map(d => <option key={d.id} value={d.id}>{d.codigo} - {d.nome} ({d.curso})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Data do Exame *</label>
          <input type="date" className="w-full p-2.5 border rounded-xl text-sm" value={config.data} onChange={e => setConfig({...config, data: e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Horário (2h Duração + 10min Intervalo) *</label>
          <select className="w-full p-2.5 border rounded-xl text-sm font-semibold text-blue-900" value={config.horario} onChange={e => setConfig({...config, horario: e.target.value})}>
            {horariosturnos.map(h => <option key={h.val} value={h.val}>{h.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Sala / Anfiteatro *</label>
          <select className="w-full p-2.5 border rounded-xl text-sm" value={config.sala} onChange={e => setConfig({...config, sala: e.target.value})}>
            <option value="">Selecione Sala</option>
            {salas.map(s => <option key={s.id} value={s.id}>{s.sala || s.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">Docente Vigilante (Docentes elegíveis sem chefia) *</label>
          <select className="w-full p-2.5 border rounded-xl text-sm" value={config.vigilante} onChange={e => setConfig({...config, vigilante: e.target.value})}>
            <option value="">Selecione Vigilante Elegível</option>
            {eligibleVigilantes.map(d => <option key={d.id} value={d.id}>{d.nome} ({d.departamento || "Docente"})</option>)}
          </select>
        </div>
      </div>
      <button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition">
        <Save size={16} /> Registar Agendamento de Exame
      </button>
    </div>
  );
}
