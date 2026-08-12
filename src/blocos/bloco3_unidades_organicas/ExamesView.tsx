import React, { useState, useEffect } from "react";
import { firestoreService } from "../../lib/firestoreService";
import { printElementById } from "../../lib/printUtils";
import { Calendar, BookOpen, Printer, CheckCircle, Clock, MapPin, User, FileText, Shuffle, ShieldAlert } from "lucide-react";
import ConfiguracaoExamesView from "./ConfiguracaoExamesView";
import GeradorExamesView, { isDocente, isChefiaDivisaoEngenharia } from "./GeradorExamesView";

export default function ExamesView({ user, onShowAlert }: { user: any; onShowAlert: (msg: string) => void }) {
  const [periods, setPeriods] = useState<any>(null);
  const [disciplinasComExame, setDisciplinasComExame] = useState<any[]>([]);
  const [examesGerados, setExamesGerados] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"calendario" | "gerador" | "config">("calendario");

  useEffect(() => {
    const unsubConfig = firestoreService.configuracoes.subscribe((data: any) => {
      const exameConfig = data.find((d: any) => d.id === "exame_periods");
      if (exameConfig) {
        setPeriods(exameConfig.data);
      } else {
        setPeriods({
          p1: { inicio: "07:00", fim: "12:30", duracao: 50 },
          p2: { inicio: "13:00", fim: "17:50", duracao: 50 },
          p3: { inicio: "18:50", fim: "23:00", duracao: 50 },
        });
      }
    });

    const unsubDisc = firestoreService.disciplinas_academicas.subscribe((data: any[]) => {
      // Pull strictly disciplines classified as "com_exame"
      const comExame = (data || []).filter((d) => d.classificacaoExame !== "sem_exame");
      setDisciplinasComExame(comExame);
    });

    const unsubExames = firestoreService.exames.subscribe((data: any[]) => {
      setExamesGerados(data || []);
    });

    const unsubDoc = firestoreService.colaboradores.subscribe((data: any[]) => {
      setDocentes((data || []).filter((d) => d.tipo === "Docente"));
    });

    const unsubSalas = firestoreService.espacos_fisicos.subscribe((data: any[]) => {
      setSalas(data || []);
    });

    return () => {
      unsubConfig();
      unsubDisc();
      unsubExames();
      unsubDoc();
      unsubSalas();
    };
  }, []);

  const handlePrintReport = () => {
    printElementById(
      "calendario-exames-print-area",
      "Calendário Oficial de Exames - Instituto Superior Politécnico de Songo",
      "landscape",
      "A4"
    );
  };

  if (!periods) return <div className="p-8 text-center text-slate-500">Carregando calendário de exames...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Calendar className="text-blue-600" size={26} /> Calendário de Exame e Relatório Académico
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Gestão integrada de exames com base nas disciplinas regulamentadas e alocação de docentes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintReport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition"
          >
            <Printer size={18} /> Imprimir / PDF A4
          </button>
        </div>
      </div>

      {/* Navigation tabs for Exam Management */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("calendario")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "calendario"
              ? "bg-blue-900 text-white shadow-sm"
              : "bg-white text-slate-700 border hover:bg-slate-50"
          }`}
        >
          📅 Calendário Consolidado ({disciplinasComExame.length} Disciplinas com Exame)
        </button>
        <button
          onClick={() => setActiveTab("gerador")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "gerador"
              ? "bg-blue-900 text-white shadow-sm"
              : "bg-white text-slate-700 border hover:bg-slate-50"
          }`}
        >
          ⚡ Gerador e Agendamento de Exames
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "config"
              ? "bg-blue-900 text-white shadow-sm"
              : "bg-white text-slate-700 border hover:bg-slate-50"
          }`}
        >
          ⚙️ Configuração de Períodos
        </button>
      </div>

      {activeTab === "calendario" && (
        <div id="calendario-exames-print-area" className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
          <div className="hidden print:block text-center pb-6 border-b-2 border-blue-900 mb-6">
            <h1 className="text-xl font-black text-blue-900 uppercase">República de Moçambique</h1>
            <h2 className="text-sm font-bold text-slate-700">Ministério da Ciência, Tecnologia e Ensino Superior</h2>
            <h3 className="text-lg font-black text-blue-900 mt-2">Instituto Superior Politécnico de Songo (ISPS)</h3>
            <h4 className="text-md font-bold text-slate-800 mt-1">CALENDÁRIO OFICIAL DE EXAMES - CORRENTE ANO ACADÉMICO</h4>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-blue-900 text-sm">Resumo da Convocatória de Exames</h4>
              <p className="text-xs text-slate-600">Todas as disciplinas regulamentadas com exame obrigatório foram carregadas automaticamente.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 bg-white rounded-xl shadow-sm border">
                  <span className="block text-lg font-black text-blue-900">{disciplinasComExame.length}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Disciplinas com Exame</span>
                </div>
                <div className="text-center px-4 py-2 bg-white rounded-xl shadow-sm border">
                  <span className="block text-lg font-black text-emerald-700">{examesGerados.length}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Exames Agendados</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (examesGerados.length === 0) {
                    onShowAlert("Não existem exames agendados para baralhar vigilantes.");
                    return;
                  }
                  const eligible = docentes.filter((d) => isDocente(d) && !isChefiaDivisaoEngenharia(d));
                  if (eligible.length === 0) {
                    onShowAlert("Não foram encontrados docentes elegíveis sem cargo de chefia na Divisão de Engenharia.");
                    return;
                  }
                  try {
                    const shuffledDocentes = [...eligible].sort(() => Math.random() - 0.5);
                    let vIdx = 0;
                    for (const exam of examesGerados) {
                      const disc = disciplinasComExame.find((d) => d.id === exam.disciplina || d.nome === exam.disciplinaNome);
                      const docId = disc?.docenteId;
                      const docNome = disc?.docenteNome;

                      let picked = shuffledDocentes.find((doc) => doc.id !== docId && doc.nome !== docNome);
                      if (!picked) {
                        picked = shuffledDocentes[vIdx % shuffledDocentes.length];
                      }
                      vIdx++;

                      await firestoreService.exames.update(exam.id, {
                        vigilante: picked.id,
                        vigilanteNome: picked.nome,
                      });
                    }
                    onShowAlert("Vigilantes baralhados com sucesso! Nenhum docente vigia a sua própria disciplina e chefias da Divisão de Engenharia foram excluídas.");
                  } catch (err) {
                    onShowAlert("Erro ao baralhar vigilantes.");
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
                title="Baralhar e Distribuir Vigilantes sem Conflito de Interesses ou Chefias"
              >
                <Shuffle size={16} /> Baralhar Vigilantes
              </button>
              <button
                onClick={async () => {
                  if (disciplinasComExame.length === 0) {
                    onShowAlert("Não existem disciplinas com exame para gerar.");
                    return;
                  }
                  try {
                    const defaultSala = salas[0]?.id || "Sala 101";
                    const eligibleDocentes = docentes.filter((d) => isDocente(d) && !isChefiaDivisaoEngenharia(d));

                    const getBusinessDate = (startOffsetDays: number, index: number) => {
                      const d = new Date();
                      d.setDate(d.getDate() + startOffsetDays);
                      while (d.getDay() === 0 || d.getDay() === 6) {
                        d.setDate(d.getDate() + 1);
                      }
                      let added = 0;
                      while (added < index) {
                        d.setDate(d.getDate() + 1);
                        if (d.getDay() !== 0 && d.getDay() !== 6) {
                          added++;
                        }
                      }
                      return d;
                    };

                    const formatISO = (d: Date) => d.toISOString().split('T')[0];

                    let discIdx = 0;
                    for (const disc of disciplinasComExame) {
                      const normalDateObj = getBusinessDate(3, discIdx);
                      const normalDateStr = formatISO(normalDateObj);

                      const recDateObj = new Date(normalDateObj);
                      recDateObj.setDate(recDateObj.getDate() + 7);
                      while (recDateObj.getDay() === 0 || recDateObj.getDay() === 6) {
                        recDateObj.setDate(recDateObj.getDate() + 1);
                      }
                      const recDateStr = formatISO(recDateObj);

                      const validVigs = eligibleDocentes.filter(d => d.id !== disc.docenteId && d.nome !== disc.docenteNome);
                      const assignedVig = validVigs[discIdx % Math.max(1, validVigs.length)] || eligibleDocentes[0] || docentes[0];

                      const existsNormal = examesGerados.find(e => e.disciplina === disc.id && e.tipo === "Normal");
                      if (!existsNormal) {
                        await firestoreService.exames.add({
                          tipo: "Normal",
                          disciplina: disc.id,
                          disciplinaNome: disc.nome,
                          data: normalDateStr,
                          horario: "07:00 - 09:00",
                          duracaoMinutos: 120,
                          intervaloMinutos: 10,
                          sala: defaultSala,
                          vigilante: assignedVig?.id || "",
                          vigilanteNome: assignedVig?.nome || "",
                          createdAt: new Date().toISOString(),
                        });
                      }

                      const existsRec = examesGerados.find(e => e.disciplina === disc.id && e.tipo === "Recorrência");
                      if (!existsRec) {
                        await firestoreService.exames.add({
                          tipo: "Recorrência",
                          disciplina: disc.id,
                          disciplinaNome: disc.nome,
                          data: recDateStr,
                          horario: "09:10 - 11:10",
                          duracaoMinutos: 120,
                          intervaloMinutos: 10,
                          sala: defaultSala,
                          vigilante: assignedVig?.id || "",
                          vigilanteNome: assignedVig?.nome || "",
                          createdAt: new Date().toISOString(),
                        });
                      }

                      discIdx++;
                    }
                    onShowAlert("Calendário de exames gerado com atribuição de vigilantes em conformidade com o regulamento!");
                  } catch (err) {
                    onShowAlert("Erro ao gerar calendário automático.");
                  }
                }}
                className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
              >
                <Calendar size={16} /> Gerar Calendário (Normal & Recorrência)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b">
                  <th className="p-3">Código</th>
                  <th className="p-3">Disciplina com Exame</th>
                  <th className="p-3">Curso</th>
                  <th className="p-3">Docente Responsável</th>
                  <th className="p-3">Data / Período</th>
                  <th className="p-3">Sala / Vigilante</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disciplinasComExame.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhuma disciplina com exame registada. Vá ao menu "Disciplina" para registar e classificar as cadeiras como "Com Exame".
                    </td>
                  </tr>
                ) : (
                  disciplinasComExame.map((disc, idx) => {
                    const exameMatch = examesGerados.find((e) => e.disciplina === disc.id || e.disciplinaNome === disc.nome);
                    const doc = docentes.find((d) => d.id === disc.docenteId);
                    const sala = salas.find((s) => s.id === exameMatch?.sala);
                    const vigilante = docentes.find((d) => d.id === exameMatch?.vigilante);

                    return (
                      <tr key={disc.id || idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-blue-900">{disc.codigo || `DISC-${idx + 1}`}</td>
                        <td className="p-3 font-bold text-slate-800">{disc.nome}</td>
                        <td className="p-3 font-medium text-slate-700">{disc.curso || "Geral"}</td>
                        <td className="p-3 text-slate-700">{doc ? doc.nome : "A definir"}</td>
                        <td className="p-3">
                          {exameMatch?.data ? (
                            <div>
                              <span className="font-bold text-blue-900 block">{exameMatch.data} ({exameMatch.tipo || "Normal"})</span>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block mt-0.5">
                                ⏱️ {exameMatch.horario || "07:00 - 09:00"} (2h + 10m int)
                              </span>
                            </div>
                          ) : (
                            <span className="text-amber-600 italic">Pendente de Agendamento</span>
                          )}
                        </td>
                        <td className="p-3">
                          {exameMatch ? (
                            <div>
                              <span className="font-bold">{sala ? sala.sala : "Sala 101"}</span>
                              <div className="text-[10px] text-slate-500">Vig: {vigilante ? vigilante.nome : "A designar"}</div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {exameMatch ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle size={12} /> Agendado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              <Clock size={12} /> Aguardando
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="hidden print:grid grid-cols-2 gap-12 mt-20 text-center text-xs font-bold leading-relaxed">
            <div>
              <p className="border-t border-slate-900 pt-2">O Diretor de Curso / Registo Académico</p>
            </div>
            <div>
              <p className="border-t border-slate-900 pt-2">O Diretor Geral do ISPS</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "gerador" && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <GeradorExamesView user={user} onShowAlert={onShowAlert} />
        </div>
      )}

      {activeTab === "config" && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <ConfiguracaoExamesView onShowAlert={onShowAlert} />
        </div>
      )}
    </div>
  );
}
