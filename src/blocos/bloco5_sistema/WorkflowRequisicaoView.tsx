import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { firestoreService } from "../../lib/firestoreService";
import {
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building2,
  Settings,
  ShieldCheck,
  Plus,
  FileText,
  Search,
  MessageSquare,
  Maximize2,
} from "lucide-react";
import FormularioRequisicaoInterna from "../bloco6_documentos/FormularioRequisicaoInterna";

interface RequisicaoWorkflow {
  id: string;
  numero: string;
  data: string;
  solicitante: string;
  departamento: string;
  status: "Pendente" | "Favorável" | "Desfavorável";
  etapaAtual: number; // 0 to 5
}

const stepsFavoravel = [
  { id: "necessitado", label: "Necessitado", icon: User, role: "Solicitante" },
  {
    id: "secretaria",
    label: "Secretaria",
    icon: Building2,
    role: "Secretaria",
  },
  { id: "economato", label: "Economato", icon: Settings, role: "Economato" },
  {
    id: "chefe",
    label: "Chefe do Departamento",
    icon: ShieldCheck,
    role: "Chefe de Departamento",
  },
  {
    id: "economato_ret",
    label: "Economato (Retorno)",
    icon: Settings,
    role: "Economato",
  },
  {
    id: "setor",
    label: "Setor (Termo de Entrega)",
    icon: CheckCircle2,
    role: "Solicitante",
  },
];

const stepsDesfavoravel = [
  { id: "necessitado", label: "Necessitado", icon: User, role: "Solicitante" },
  {
    id: "secretaria",
    label: "Secretaria",
    icon: Building2,
    role: "Secretaria",
  },
  { id: "economato", label: "Economato", icon: Settings, role: "Economato" },
  {
    id: "chefe",
    label: "Chefe do Departamento",
    icon: ShieldCheck,
    role: "Chefe de Departamento",
  },
  {
    id: "secretaria_ret",
    label: "Secretaria (Retorno)",
    icon: Building2,
    role: "Secretaria",
  },
  {
    id: "setor_com",
    label: "Setor (Comunicado)",
    icon: MessageSquare,
    role: "Solicitante",
  },
];

export default function WorkflowRequisicaoView({
  user,
  onNew,
  onBack,
}: {
  user: any;
  onNew: () => void;
  onBack?: () => void;
}) {
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [parecerText, setParecerText] = useState("");
  const [nextAction, setNextAction] = useState<
    "Favorável" | "Desfavorável" | null
  >(null);
  const [proximoDestino, setProximoDestino] = useState(
    "Chefia do Departamento",
  );

  const unidadesDestino = [
    "Chefia do Departamento",
    "Gabinete do Diretor-Geral",
    "Secretaria Geral",
    "Economato e Património",
    "Contabilidade e Finanças",
    "Recursos Humanos",
    "Logística",
    "Concluído / Arquivado",
  ];

  useEffect(() => {
    if (!firestoreService || !firestoreService.requisicoes_internas) return;
    const unsub = firestoreService.requisicoes_internas.subscribe(
      (data: any[]) => {
        setRequisicoes(data);
        setIsLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const [selectedReq, setSelectedReq] = useState<any | null>(null);

  const getSteps = (req: any) => {
    return req.status === "Desfavorável" ? stepsDesfavoravel : stepsFavoravel;
  };

  const getNextStepName = (req: any) => {
    const steps = getSteps(req);
    const nextIdx = req.etapaAtual + 1;
    if (nextIdx < steps.length) {
      return steps[nextIdx].label;
    }
    return "Finalização";
  };

  const handleParecer = async () => {
    if (!selectedReq) return;

    // Logic to move to next step or branch
    let newStatus = selectedReq.status;
    let newEtapa = selectedReq.etapaAtual + 1;

    if (selectedReq.etapaAtual === 3) {
      // Chefe de Departamento step
      if (!nextAction) {
        alert(
          "O Chefe deve selecionar se o parecer é Favorável ou Desfavorável.",
        );
        return;
      }
      newStatus = nextAction;
    }

    try {
      const isFinal = proximoDestino === "Concluído / Arquivado";

      await firestoreService.requisicoes_internas.update(selectedReq.id, {
        status: isFinal ? "Concluído" : newStatus,
        etapaAtual: newEtapa,
        destinoAtual: isFinal ? "Arquivo" : proximoDestino,
        historicoPareceres: [
          ...(selectedReq.historicoPareceres || []),
          {
            etapa: selectedReq.etapaAtual,
            unidade: user?.departamento || user?.cargo || "Unidade",
            responsavel: user?.name,
            parecer: parecerText,
            decisao: isFinal
              ? "Concluído"
              : nextAction || `Encaminhado para ${proximoDestino}`,
            data: new Date().toISOString(),
          },
        ],
      });
      setParecerText("");
      setNextAction(null);
      alert(
        isFinal
          ? "Processo concluído e arquivado!"
          : `Parecer submetido! O documento foi encaminhado para: ${proximoDestino}`,
      );
    } catch (error) {
      console.error("Erro ao submeter parecer:", error);
    }
  };

  const canUserAct =
    selectedReq &&
    ((selectedReq.etapaAtual === 0 && selectedReq.solicitante === user?.name) ||
      getSteps(selectedReq)[selectedReq.etapaAtual]?.role === user?.cargo ||
      (getSteps(selectedReq)[selectedReq.etapaAtual]?.role === "Secretaria" &&
        user?.departamento === "Secretaria") ||
      (getSteps(selectedReq)[selectedReq.etapaAtual]?.role === "Economato" &&
        user?.departamento === "Economato"));

  const [showFullDoc, setShowFullDoc] = useState(false);

  if (showFullDoc && selectedReq) {
    return (
      <FormularioRequisicaoInterna
        user={user}
        initialData={selectedReq}
        onCancel={() => setShowFullDoc(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com Ação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 hover:text-slate-900 group"
            >
              <ArrowLeft
                size={24}
                className="group-hover:-translate-x-1 transition-transform"
              />
            </button>
          )}
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tighter">
              Workflow de Requisição Interna
            </h3>
            <p className="text-xs text-slate-500 font-medium italic">
              Rastreamento do caminho administrativo das requisições de bens
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Pesquisar RI..."
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none w-48 transition-all"
            />
          </div>
          <button
            onClick={onNew}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <Plus size={18} /> Nova Requisição
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lista de Requisições */}
        <div className="lg:col-span-5 space-y-4">
          <h4 className="text-[10px] font-black text-slate-400 tracking-widest px-2">
            Requisições Ativas
          </h4>
          {requisicoes.map((req) => (
            <motion.div
              key={req.id}
              whileHover={{ x: 5 }}
              onClick={() => setSelectedReq(req)}
              className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                selectedReq?.id === req.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                  : "bg-white border-slate-200 text-slate-900 hover:border-slate-400"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="font-mono text-xs font-black opacity-60 tracking-wider">
                  {req.numero}
                </div>
                <div
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    req.status === "Favorável"
                      ? "bg-emerald-500 text-white"
                      : req.status === "Desfavorável"
                        ? "bg-red-500 text-white"
                        : "bg-amber-500 text-white"
                  }`}
                >
                  {req.status}
                </div>
              </div>
              <h5 className="font-bold text-sm">{req.solicitante}</h5>
              <div className="text-[10px] font-bold mt-1 opacity-70">
                Local: {req.destinoAtual || "Secretaria"}
              </div>
              <div className="flex items-center justify-between mt-4">
                <span
                  className={`text-[10px] font-bold ${selectedReq?.id === req.id ? "text-slate-400" : "text-slate-500"}`}
                >
                  {req.departamento}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <Clock size={12} /> {req.data}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Visualização do Workflow */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedReq ? (
              <motion.div
                key={selectedReq.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-full"
              >
                <div className="flex items-center gap-4 mb-10 border-b border-slate-100 pb-6">
                  <div className="bg-slate-900 text-white p-3 rounded-2xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tighter">
                      Caminho da Requisição
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">
                      {selectedReq.numero}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFullDoc(true)}
                    className="ml-auto bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border border-slate-200 flex items-center gap-2 transition-all"
                  >
                    <Maximize2 size={14} /> Visualizar Documento Original
                  </button>
                </div>

                <div className="space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {getSteps(selectedReq).map((step, idx) => {
                    const isCompleted = idx < selectedReq.etapaAtual;
                    const isCurrent = idx === selectedReq.etapaAtual;

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-6 relative group"
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 transition-all duration-500 ${
                            isCompleted
                              ? "bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white"
                              : isCurrent
                                ? "bg-blue-600 shadow-lg shadow-blue-600/20 text-white scale-110"
                                : "bg-slate-50 text-slate-300 border-2 border-slate-100"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={24} />
                          ) : (
                            <step.icon size={24} />
                          )}
                        </div>

                        <div className="flex-1">
                          <div
                            className={`text-[10px] font-black tracking-widest mb-1 ${
                              isCurrent
                                ? "text-blue-600"
                                : isCompleted
                                  ? "text-emerald-500"
                                  : "text-slate-400"
                            }`}
                          >
                            Etapa {idx + 1}
                          </div>
                          <div
                            className={`text-base font-black tracking-tighter ${
                              isCurrent ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </div>
                          {isCurrent && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-2 space-y-4"
                            >
                              <div className="text-xs text-slate-500 font-medium italic bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                Aguardando tratamento administrativo nesta
                                unidade.
                              </div>

                              {canUserAct && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                                  <textarea
                                    placeholder="Colocar seu parecer aqui..."
                                    value={parecerText}
                                    onChange={(e) =>
                                      setParecerText(e.target.value)
                                    }
                                    className="w-full p-3 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                                  />

                                  {selectedReq.etapaAtual === 3 && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          setNextAction("Favorável")
                                        }
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest border-2 transition-all ${
                                          nextAction === "Favorável"
                                            ? "bg-emerald-500 border-emerald-500 text-white"
                                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                        }`}
                                      >
                                        Favorável
                                      </button>
                                      <button
                                        onClick={() =>
                                          setNextAction("Desfavorável")
                                        }
                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-widest border-2 transition-all ${
                                          nextAction === "Desfavorável"
                                            ? "bg-red-500 border-red-500 text-white"
                                            : "border-red-200 text-red-600 hover:bg-red-50"
                                        }`}
                                      >
                                        Desfavorável
                                      </button>
                                    </div>
                                  )}

                                  <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                      <label className="block text-[10px] font-black text-slate-400 tracking-widest mb-2">
                                        Próximo Destino
                                      </label>
                                      <select
                                        value={proximoDestino}
                                        onChange={(e) =>
                                          setProximoDestino(e.target.value)
                                        }
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                      >
                                        {unidadesDestino.map((u) => (
                                          <option key={u} value={u}>
                                            {u}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <button
                                      onClick={handleParecer}
                                      className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black tracking-widest hover:bg-blue-700 transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-200"
                                    >
                                      <div className="flex items-center gap-2">
                                        <CheckCircle2 size={16} /> Submeter e
                                        Reencaminhar
                                      </div>
                                      <span className="text-[8px] opacity-70 tracking-normal normal-case">
                                        Destino Selecionado: {proximoDestino}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>

                        {idx < getSteps(selectedReq).length - 1 && (
                          <div
                            className={`absolute left-5.5 top-12 w-0.5 h-12 transition-all duration-1000 ${
                              isCompleted ? "bg-emerald-500" : "bg-slate-100"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedReq.etapaAtual === 5 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mt-12 p-6 rounded-3xl flex items-center gap-6 border-2 border-dashed ${
                      selectedReq.status === "Favorável"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    <div
                      className={
                        selectedReq.status === "Favorável"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    >
                      {selectedReq.status === "Favorável" ? (
                        <CheckCircle2 size={40} />
                      ) : (
                        <XCircle size={40} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-sm">
                        {selectedReq.status === "Favorável"
                          ? "Documento Final: Termo de Entrega"
                          : "Documento Final: Comunicado do Parecer"}
                      </h4>
                      <p className="text-xs font-medium opacity-80 mt-1">
                        O processo foi concluído e o documento normativo foi
                        enviado ao setor solicitante.
                      </p>
                      <button className="mt-4 bg-white/50 hover:bg-white text-xs font-bold px-4 py-2 rounded-xl transition-all border border-current flex items-center gap-2">
                        <FileText size={14} /> Descarregar{" "}
                        {selectedReq.status === "Favorável"
                          ? "Termo de Entrega"
                          : "Comunicado"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="h-full bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center">
                <div className="bg-white p-6 rounded-full shadow-lg text-slate-200 mb-6">
                  <ClipboardList size={64} />
                </div>
                <h3 className="text-lg font-black text-slate-400 tracking-tight">
                  {" "}
                  workflow da Requisição
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mt-2 font-medium">
                  Selecione uma requisição ao lado para visualizar o seu caminho
                  administrativo e etapa atual.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
