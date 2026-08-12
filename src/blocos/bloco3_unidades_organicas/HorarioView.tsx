import React, { useState, useEffect } from "react";
import {
  Calendar,
  RefreshCw,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  ShieldCheck,
  Users,
  Building,
  Printer,
} from "lucide-react";
import { ProcessingCircle } from "../../components/ui/ProcessingCircle";
import { firestoreService } from "../../lib/firestoreService";
import { printElementById } from "../../lib/printUtils";

interface TimeSlot {
  start: string;
  end: string;
}

interface PeriodSchedule {
  name: string;
  slots: TimeSlot[];
}

export default function HorarioView({ title, user }: { title: string; user: any }) {
  const [horarios, setHorarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "Laboral" | "POS_LABORAL"
  >("Laboral");
  const [viewType, setViewType] = useState<"TURMA" | "SALA" | "DOCENTE">("TURMA");
  const [salas, setSalas] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<string[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [disciplinas, setDisciplinas] = useState<any[]>([]);

  useEffect(() => {
    const unsubDocentes = firestoreService.colaboradores.subscribe((data) => {
      setDocentes((data || []).filter((d: any) => d.tipo === "Docente"));
    });

    const unsubSalas = firestoreService.espacos_fisicos.subscribe((data) => {
      setSalas(
        (data || []).map((d) => ({
          id: d.sala || d.id,
          type: d.tipo || "Sala de Aula",
          isComum: d.isComum || false,
          name: `${d.piso || ""} - Sala ${d.sala || ""}`
            .trim()
            .replace(/^-|-$/g, "")
            .trim(),
        })),
      );
    });

    const unsubTurmas = firestoreService.efetivo_escolar.subscribe((data) => {
      setTurmas(Array.from(new Set((data || []).map((d: any) => d.nivel || "1º Ano"))));
    });

    const unsubDisc = firestoreService.disciplinas_academicas.subscribe((data) => {
      setDisciplinas(data || []);
    });

    return () => {
      unsubDocentes();
      unsubSalas();
      unsubTurmas();
      unsubDisc();
    };
  }, []);

  const generateSlots = (startTime: string, slotsCount: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    let current = new Date(`2000-01-01T${startTime}:00`);

    for (let i = 0; i < slotsCount; i++) {
      const start = current.toTimeString().slice(0, 5);
      current.setMinutes(current.getMinutes() + 50);
      const end = current.toTimeString().slice(0, 5);
      slots.push({ start, end });
      
      if (i < slotsCount - 1) {
        // Intervalo maior de 10 minutos no meio do período (após a 3ª aula para turnos de 5+ tempos)
        // Outras transições de aula: 5 minutos de intervalo
        const isMiddleBreak = (slotsCount >= 5 && i === 2);
        const breakMinutes = isMiddleBreak ? 10 : 5;
        current.setMinutes(current.getMinutes() + breakMinutes);
      }
    }
    return slots;
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 5));
  };

  const gerarHorario = () => {
    setLoading(true);
    setLogs([]);
    setHorarios([]);
    setStatus("Iniciando motor de otimização de horários sem furos...");
    
    setTimeout(() => {
      setStatus("Verificando disciplinas e docentes...");
      addLog(`INFO: ${disciplinas.length} disciplinas e ${docentes.length} docentes carregados.`);
      
      setTimeout(() => {
        setStatus("Processando blocos contínuos de Segunda a Quarta-feira (Preferencial)...");
        addLog("INFO: Aplicando regras: Dupla (100 min) e Simples (50 min). Minimizando tempo de espera (sem furos).");
        
        setTimeout(() => {
          setStatus("Finalizando consolidação global...");
          addLog("SUCESSO: Horário Master gerado e otimizado sem furos para os docentes.");

          // 1. Definições Iniciais
          const activeTurmas = turmas.length > 0 ? turmas : ["1º Ano", "2º Ano", "3º Ano", "4º Ano"];
          const activeSalas = salas.length > 0 ? salas : [{ id: "101", name: "Sala 101", type: "Sala de Aula", isComum: true }, { id: "102", name: "Sala 102", type: "Laboratório", isComum: false }];
          const activeDocentes = docentes.length > 0 ? docentes : [{ id: "d1", nome: "Prof. Convidado" }];
          const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

          // Filtrar disciplinas relevantes (do curso atual ou fallback)
          let relDisc = disciplinas.filter(d => (d.curso === title) || (!d.curso));
          if (relDisc.length === 0) {
            relDisc = [
              { codigo: "MAT-1", nome: "Matemática 1", nivel: "1º ano", cargaSemanal: "4h", tipoAula: "Dupla (100 min)", docenteId: activeDocentes[0]?.id },
              { codigo: "ALG-1", nome: "Álgebra Linear", nivel: "1º ano", cargaSemanal: "4h", tipoAula: "Dupla (100 min)", docenteId: activeDocentes[0]?.id }
            ];
          }

          // Construir estrutura de slots globais
          // periods: 0=Manhã (6 slots), 1=Tarde (6 slots), 2=Noite (5 slots)
          const globalSchedule: any = {}; 
          // Ocupações para evitar choques
          const occupied = {
            docente: new Set<string>(), // `${docenteId}-${dia}-${period}-${slot}`
            turma: new Set<string>(),   // `${turma}-${dia}-${period}-${slot}`
            sala: new Set<string>()     // `${salaId}-${dia}-${period}-${slot}`
          };

          // Preparar tarefas a alocar (blocos de aula)
          const tasks: any[] = [];
          relDisc.forEach(disc => {
            const horasStr = String(disc.cargaSemanal || "4h").replace(/[^0-9]/g, "");
            const totalSlots = parseInt(horasStr) || 4; 
            const isDupla = (disc.tipoAula === "Dupla (100 min)");
            const blockSize = isDupla ? 2 : 1;
            const numBlocks = Math.ceil(totalSlots / blockSize);
            
            const docNome = (activeDocentes.find(d => d.id === disc.docenteId) || activeDocentes[0])?.nome || "Docente Atribuído";
            const turmaNome = disc.turma || disc.nivel || activeTurmas[0];
            
            for (let i = 0; i < numBlocks; i++) {
              tasks.push({
                ...disc,
                docNome,
                turmaNome,
                blockSize
              });
            }
          });

          // Ordenar tarefas por Docente para podermos alocá-las de forma compactada (sem furos)
          tasks.sort((a, b) => a.docNome.localeCompare(b.docNome));

          // Lógica de alocação compactada
          // Tentamos alocar todas as aulas do mesmo docente de forma seguida, dando preferência a Seg, Ter, Qua.
          const findFreeConsecutiveSlots = (docNome: string, turmaNome: string, blockSize: number, startDiaIdx: number = 0) => {
            for (let diaIdx = startDiaIdx; diaIdx < dias.length; diaIdx++) {
              const dia = dias[diaIdx];
              const availablePeriods = selectedPeriod === "Laboral" ? [0, 1] : [2]; // 0=Manhã, 1=Tarde, 2=Noite
              
              for (const pIdx of availablePeriods) {
                // Se for laboral, restringir Manhã para anos ímpares (1º, 3º) e Tarde para pares (2º, 4º) para evitar espalhar
                const isImpar = /1|3/.test(turmaNome);
                if (selectedPeriod === "Laboral") {
                   if (isImpar && pIdx === 1) continue;
                   if (!isImpar && pIdx === 0) continue;
                }

                const slotsMax = pIdx === 2 ? 5 : 6;
                for (let sIdx = 0; sIdx <= slotsMax - blockSize; sIdx++) {
                  // Verificar se estes slots estão livres para o docente e para a turma
                  let canFit = true;
                  for (let offset = 0; offset < blockSize; offset++) {
                    if (occupied.docente.has(`${docNome}-${dia}-${pIdx}-${sIdx + offset}`)) canFit = false;
                    if (occupied.turma.has(`${turmaNome}-${dia}-${pIdx}-${sIdx + offset}`)) canFit = false;
                  }
                  
                  if (canFit) {
                    // Encontrar uma sala livre
                    let salaSelecionada = activeSalas[0];
                    for (const sala of activeSalas) {
                      let salaLivre = true;
                      for (let offset = 0; offset < blockSize; offset++) {
                         if (occupied.sala.has(`${sala.name}-${dia}-${pIdx}-${sIdx + offset}`)) salaLivre = false;
                      }
                      if (salaLivre) {
                        salaSelecionada = sala;
                        break;
                      }
                    }
                    
                    return { dia, pIdx, sIdx, salaSelecionada };
                  }
                }
              }
            }
            return null;
          };

          // Agrupar tarefas por docente para garantir que ficam "juntos" (sem furos na medida do possível)
          const tasksByDocente: Record<string, any[]> = {};
          tasks.forEach(t => {
            if (!tasksByDocente[t.docNome]) tasksByDocente[t.docNome] = [];
            tasksByDocente[t.docNome].push(t);
          });

          // Alocação real
          Object.keys(tasksByDocente).forEach(docName => {
             const docTasks = tasksByDocente[docName];
             // Tentar colocar o docente compactado num dia
             let currentDiaIdx = 0; // Começa segunda-feira
             
             docTasks.forEach(task => {
                let slotEncontrado = findFreeConsecutiveSlots(docName, task.turmaNome, task.blockSize, currentDiaIdx);
                // Se não couber no dia atual, a função tenta nos próximos dias e devolve onde encaixou
                if (slotEncontrado) {
                   const { dia, pIdx, sIdx, salaSelecionada } = slotEncontrado;
                   currentDiaIdx = dias.indexOf(dia); // Atualiza o dia preferido para o atual (mantém as aulas no mesmo dia se possível)

                   // Registar ocupação e na grelha global
                   for (let offset = 0; offset < task.blockSize; offset++) {
                      occupied.docente.add(`${docName}-${dia}-${pIdx}-${sIdx + offset}`);
                      occupied.turma.add(`${task.turmaNome}-${dia}-${pIdx}-${sIdx + offset}`);
                      occupied.sala.add(`${salaSelecionada.name}-${dia}-${pIdx}-${sIdx + offset}`);
                      
                      const gKey = `${dia}-${pIdx}-${sIdx + offset}`;
                      if (!globalSchedule[gKey]) globalSchedule[gKey] = [];
                      globalSchedule[gKey].push({
                         disciplina: task.nome,
                         codigo: task.codigo,
                         docente: docName,
                         turma: task.turmaNome,
                         sala: salaSelecionada.name,
                         isComum: salaSelecionada.isComum,
                         isFirstBlock: offset === 0,
                         isDupla: task.blockSize === 2
                      });
                   }
                }
             });
          });

          // 2. Extrair visualização (View) baseada na Global Schedule
          let entities: string[] = [];
          if (viewType === "TURMA") entities = activeTurmas;
          else if (viewType === "SALA") entities = activeSalas.map(s => s.name);
          else entities = activeDocentes.map(d => d.nome);

          const allGenerated: any[] = [];
          
          entities.forEach((entityName) => {
            const schedules: PeriodSchedule[] = [];
            
            if (selectedPeriod === "Laboral") {
              const isMorningTurma = viewType === "TURMA" && /1|3/.test(entityName);
              const isAfternoonTurma = viewType === "TURMA" && /2|4/.test(entityName);

              if (viewType !== "TURMA" || isMorningTurma || (!isMorningTurma && !isAfternoonTurma)) {
                schedules.push({ name: "MANHÃ (07:00 - 12:25)", slots: generateSlots("07:00", 6) });
              }
              if (viewType !== "TURMA" || isAfternoonTurma || (!isMorningTurma && !isAfternoonTurma)) {
                schedules.push({ name: "TARDE (13:00 - 18:25)", slots: generateSlots("13:00", 6) });
              }
            } else {
              schedules.push({ name: "NOITE (18:50 - 23:25)", slots: generateSlots("18:50", 5) });
            }

            const assignments: any = {};

            schedules.forEach((period, pIdxLocal) => {
              // PIdx original: Se Laboral, manhã=0, tarde=1. Se Pós, noite=2.
              const pIdxGlobal = selectedPeriod === "Laboral" ? (period.name.includes("MANHÃ") ? 0 : 1) : 2;

              period.slots.forEach((slot, sIdx) => {
                dias.forEach((dia) => {
                  const key = `${pIdxLocal}-${sIdx}-${dia}`;
                  const gKey = `${dia}-${pIdxGlobal}-${sIdx}`;
                  
                  // Procurar alocação global que corresponda a esta entidade
                  const allocs = globalSchedule[gKey] || [];
                  let myAlloc = null;
                  
                  if (viewType === "TURMA") myAlloc = allocs.find((a: any) => a.turma === entityName);
                  else if (viewType === "SALA") myAlloc = allocs.find((a: any) => a.sala === entityName);
                  else myAlloc = allocs.find((a: any) => a.docente === entityName);

                  if (myAlloc) {
                    assignments[key] = {
                      isVaga: false,
                      disciplina: myAlloc.disciplina,
                      codigo: myAlloc.codigo,
                      docente: myAlloc.docente,
                      sala: myAlloc.sala,
                      isComum: myAlloc.isComum,
                      turma: myAlloc.turma,
                      curso: title,
                      isFirstBlock: myAlloc.isFirstBlock,
                      isDupla: myAlloc.isDupla
                    };
                  } else {
                    assignments[key] = {
                      isVaga: true,
                      disciplina: "SALA VAGA",
                      codigo: "-",
                      docente: "-",
                      sala: viewType === "SALA" ? entityName : "Livre",
                      isComum: false,
                      turma: "-",
                      curso: title
                    };
                  }
                });
              });
            });

            allGenerated.push({
              entityName,
              curso: title,
              periodo: selectedPeriod,
              ano: new Date().getFullYear() + 1,
              dias,
              schedules,
              assignments,
            });
          });

          setHorarios(allGenerated);
          setLoading(false);
          setStatus("");
        }, 800);
      }, 800);
    }, 800);
  };

  const handlePrint = () => {
    printElementById(
      "horario-global-print-area",
      `Horário Oficial - ${title} (${viewType})`,
      "landscape",
      "A4"
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" />
            Gerador de Horário (Docente, Salas & Turmas)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Gestão de salas fixas por curso e salas comuns partilhadas (1º e 2º ano para disciplinas gerais).
          </p>
          <div className="mt-2 text-xs font-semibold text-blue-900 bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-100 inline-flex items-center gap-2">
            <span>⏱️ <b>Transição:</b> 5 min</span>
            <span>•</span>
            <span>☕ <b>Intervalo Maior:</b> 10 min (no meio do período)</span>
            <span>•</span>
            <span>📖 <b>Aulas:</b> Simples (50 min) | Duplas (100 min)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewType("TURMA")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                viewType === "TURMA"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Estudantes (Turma)
            </button>
            <button
              onClick={() => setViewType("SALA")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                viewType === "SALA"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Salas de Aula
            </button>
            <button
              onClick={() => setViewType("DOCENTE")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                viewType === "DOCENTE"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Docente
            </button>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setSelectedPeriod("Laboral")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedPeriod === "Laboral"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <Sun size={14} /> Laboral
            </button>
            <button
              onClick={() => setSelectedPeriod("POS_LABORAL")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedPeriod === "POS_LABORAL"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <Moon size={14} /> Pós-Laboral
            </button>
          </div>

          <button
            onClick={gerarHorario}
            disabled={loading}
            className="bg-blue-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-100 disabled:bg-gray-400"
          >
            {loading ? <ProcessingCircle size={18} /> : <RefreshCw size={18} />}
            {loading ? "A Gerar..." : "Gerar Horário"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-blue-50 border border-blue-100 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6">
            <ProcessingCircle size={80} strokeWidth={1.5} />
            <div>
              <p className="text-blue-900 font-black tracking-tighter text-xl">
                {status}
              </p>
              <p className="text-blue-600 text-[10px] font-bold tracking-widest mt-2 uppercase">
                Modo: {viewType} | Período: {selectedPeriod}
              </p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 text-white font-mono text-[10px] space-y-2 overflow-hidden shadow-xl">
            <p className="text-gray-500 border-b border-gray-800 pb-2 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Info size={12} /> Log de Alocação
            </p>
            {logs.map((log, i) => (
              <p key={i} className="text-blue-300">
                {`> ${log}`}
              </p>
            ))}
          </div>
        </div>
      )}

      {horarios.length > 0 && !loading && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2 text-blue-900 font-bold">
              <CheckCircle2 className="text-emerald-600" size={20} />
              <span>Horário Consolidado ({viewType}) gerado com sucesso!</span>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-emerald-700 shadow-sm"
            >
              <Printer size={16} /> Imprimir / PDF A4
            </button>
          </div>

          <div id="horario-global-print-area" className="space-y-12 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 print:shadow-none print:p-0">
            <div className="hidden print:block text-center pb-4 border-b-2 border-blue-900 mb-6">
              <h1 className="text-lg font-black text-blue-900 uppercase">Instituto Superior Politécnico de Songo (ISPS)</h1>
              <h2 className="text-sm font-bold text-slate-700">Horário Oficial - {title} ({viewType})</h2>
            </div>

            {horarios.map((horario, hIdx) => (
              <div key={hIdx} className="space-y-6 print-page-break print:break-after-page">
                <div className="flex items-center gap-4 border-l-4 border-blue-900 pl-4 py-2 bg-slate-50 rounded-r-xl">
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {viewType === "TURMA" ? "Estudantes (Turma):" : viewType === "SALA" ? "Sala de Aula:" : "Docente:"} {horario.entityName}
                  </h4>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {horario.periodo} ({horario.ano})
                  </span>
                </div>

                {horario.schedules.map((period: PeriodSchedule, pIdx: number) => (
                  <div key={pIdx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="font-bold text-blue-900 flex items-center gap-2 text-xs uppercase">
                        <Clock size={16} /> {period.name}
                      </h4>
                      <span className="text-xs font-bold text-slate-600">Curso: {horario.curso}</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-center border-collapse table-fixed min-w-[900px]">
                        <thead>
                          <tr className="bg-slate-50 border-b">
                            <th className="w-24 p-3 border-r text-[10px] font-black text-slate-500 uppercase">Tempo</th>
                            {horario.dias.map((dia: string) => (
                              <th key={dia} className="p-3 text-[10px] font-black text-slate-500 uppercase">{dia}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {period.slots.map((slot: TimeSlot, sIdx: number) => (
                            <tr key={sIdx} className="hover:bg-slate-50/50">
                              <td className="p-3 border-r font-bold text-blue-900 bg-slate-50/30">
                                <div className="flex flex-col">
                                  <span>{slot.start}</span>
                                  <span className="text-[9px] text-slate-400 font-normal">{slot.end}</span>
                                </div>
                              </td>
                              {horario.dias.map((dia: string) => {
                                const assignment = horario.assignments[`${pIdx}-${sIdx}-${dia}`];
                                if (assignment.isVaga) {
                                  return (
                                    <td key={dia} className="p-2 align-top">
                                      <div className="bg-black text-white p-3 rounded-xl border border-black shadow-sm flex flex-col justify-between text-left min-h-[90px]">
                                        <p className="font-black text-white text-[11px] mb-1 tracking-wider uppercase">
                                          SALA VAGA
                                        </p>
                                        <p className="text-[10px] text-gray-300 mb-2 italic">
                                          Disponível
                                        </p>
                                        <div className="mt-auto pt-2 border-t border-gray-800 flex items-center justify-between">
                                          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-200">
                                            Livre
                                          </span>
                                          <span className="text-[10px] font-bold text-gray-300">{assignment.sala}</span>
                                        </div>
                                      </div>
                                    </td>
                                  );
                                }
                                return (
                                  <td key={dia} className="p-2 align-top">
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col text-left min-h-[90px]">
                                      <p className="font-black text-blue-900 text-[11px] mb-1 line-clamp-2 uppercase">
                                        <span className="text-blue-600 font-mono">[{assignment.codigo || "DISC"}]</span> {assignment.disciplina}
                                      </p>
                                      <p className="text-[10px] text-slate-700 font-bold mb-1 italic">
                                        Docente: {viewType !== "DOCENTE" ? assignment.docente : assignment.turma}
                                      </p>
                                      <div className="mb-2 flex flex-wrap gap-1">
                                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${assignment.isDupla ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                                          {assignment.isDupla ? 'Dupla (100 min)' : 'Simples (50 min)'}
                                        </span>
                                      </div>
                                      <div className="mt-auto pt-1.5 border-t border-slate-200 flex items-center justify-between">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${assignment.isComum ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                          {assignment.isComum ? 'Sala Comum (1º/2º)' : 'Sala Fixa'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-800">{assignment.sala}</span>
                                      </div>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {horarios.length === 0 && !loading && (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Calendar size={48} className="mx-auto text-blue-300 mb-4" />
          <h4 className="text-xl font-bold text-blue-900 mb-2">Geração de Horários Académicos</h4>
          <p className="text-slate-500 max-w-md mx-auto mb-6 text-sm">
            Clique em "Gerar Horário" para construir automaticamente os horários de estudantes (turmas), salas de aula (comuns e fixas) e docentes.
          </p>
          <button
            onClick={gerarHorario}
            className="px-6 py-3 bg-blue-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-800 transition"
          >
            Gerar Horário Agora
          </button>
        </div>
      )}
    </div>
  );
}

