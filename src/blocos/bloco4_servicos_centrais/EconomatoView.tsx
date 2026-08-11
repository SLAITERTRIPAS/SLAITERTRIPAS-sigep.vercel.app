import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Package,
  ClipboardList,
  BarChart3,
  LayoutGrid,
  Monitor,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  PlusCircle,
  X,
  ShieldCheck,
} from "lucide-react";
import { Bem } from "../../types";
import { firestoreService } from "../../lib/firestoreService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import FormularioEntradaEstoque from "../bloco6_documentos/FormularioEntradaEstoque";
import FormularioRequisicaoInterna from "../bloco6_documentos/FormularioRequisicaoInterna";
import VisaoGeralLayout from "../bloco8_gerais/VisaoGeralLayout";
import MatrixView from "../bloco5_sistema/MatrixView";
import CalendarView from "../bloco5_sistema/CalendarView";
import AssinaturaDigitalView from "../bloco5_sistema/AssinaturaDigitalView";
import DocumentosView from "../bloco6_documentos/DocumentosView";
import GestaoDocumentosView from "../bloco4_servicos_centrais/GestaoDocumentosView";
import ReportsView from "../bloco7_relatorios/ReportsView";
import { Pen, Calendar, FileText, FolderOpen } from "lucide-react";
import BalancoMensalView from "../bloco4_servicos_centrais/BalancoMensalView";
import BalancoActividadesView from "../bloco4_servicos_centrais/BalancoActividadesView";
import { isSuperBossUser, isPatrimonioBossOrAdmin } from "../../lib/auth";

export default function EconomatoView({
  user,
  onBack,
}: {
  user: any;
  onBack: () => void;
}) {
  const [bens, setBens] = React.useState<Bem[]>([]);
  const [activeSubView, setActiveSubView] = useState("plano");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [stockEntries, setStockEntries] = React.useState<any[]>([]);
  const [movements, setMovements] = React.useState<any[]>([]);
  const [matrixActivities, setMatrixActivities] = React.useState<any[]>([]);

  // Dados fictícios para o ERP (Giro de Estoque)
  const turnoverData = [
    { name: "Jan", entradas: 400, saidas: 240, giro: 0.6 },
    { name: "Fev", entradas: 300, saidas: 139, giro: 0.5 },
    { name: "Mar", entradas: 200, saidas: 980, giro: 1.2 },
    { name: "Abr", entradas: 278, saidas: 390, giro: 0.8 },
    { name: "Mai", entradas: 189, saidas: 480, giro: 0.9 },
  ];

  const stockDistribution = [
    { name: "Limpeza", value: 400 },
    { name: "Escritório", value: 300 },
    { name: "Consumíveis", value: 300 },
    { name: "Outros", value: 200 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  React.useEffect(() => {
    const unsub1 = firestoreService.materiais_bens.subscribe(setBens);
    const unsub2 = firestoreService.movimentos_economato.subscribe(
      (data: any[]) => {
        setMovements(data);
        // Filter for entries that might be "pending" or just the latest ones
        setStockEntries(data.filter((m) => m.tipo === "Entrada").slice(0, 10));
      },
    );
    const unsub3 =
      firestoreService.matrixActivities.subscribe(setMatrixActivities);
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [showExitForm, setShowExitForm] = useState(false);

  const filteredBens = bens.filter(
    (b) =>
      b.setor === "Economato" &&
      (categoryFilter === "Todos" || b.categoria === categoryFilter),
  );

  const sideItems = [
    { id: "plano", title: "Plano", icon: ClipboardList },
    { id: "calendario", title: "Calendário", icon: Calendar },
    { id: "assinatura_digital", title: "Assinatura Digital", icon: Pen },
    {
      id: "documentos_normativos",
      title: "Documentos Normativos",
      icon: FileText,
    },
    {
      id: "gestao_expediente",
      title: "Gestão de Expediente",
      icon: FolderOpen,
    },
    { id: "relatorios", title: "Relatórios", icon: BarChart3 },
    { id: "balanco", title: "Balanço", icon: TrendingUp },
    { id: "estoque", title: "Estoque", icon: Package },
    { id: "erp", title: "Gestão ERP", icon: Monitor },
  ];

  const handleStockSubmit = async (data: any) => {
    try {
      // 1. Registar o movimento no ERP
      await firestoreService.movimentos_economato.add({
        ...data,
        tipo: "Entrada",
        origem: "Fornecedor",
        operador: user?.name || "Sistema",
        timestamp: new Date().toISOString(),
      });

      // 2. Atualizar/Criar o item no inventário (materiais_bens)
      const existingItem = bens.find(
        (b) => b.nome.toLowerCase() === (data.descricao || "").toLowerCase(),
      );

      if (existingItem) {
        const newQty =
          Number(existingItem.quantidadeDisponivel || 0) +
          Number(data.quantidade || 0);
        await firestoreService.materiais_bens.update(existingItem.id, {
          quantidadeDisponivel: newQty,
          updatedBy: user?.email,
          necessidade: data.necessidade || existingItem.necessidade || "",
        });
      } else {
        await firestoreService.materiais_bens.add({
          nome: data.descricao || "Item sem nome",
          quantidadeDisponivel: Number(data.quantidade || 0),
          localizacaoAtual: data.localizacao || "Almoxarifado",
          grupo: data.grupo || "Geral",
          estado: data.estado || "Novo",
          setor: "Economato",
          updatedBy: user?.email,
          necessidade: data.necessidade || "",
        });
      }

      setShowEntryForm(false);
    } catch (error) {
      console.error("Erro ao guardar entrada:", error);
      alert("Falha na comunicação com o sistema ERP (Firestore).");
    }
  };

  const handleExitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const itemId = formData.get("item") as string;
    const qtd = Number(formData.get("quantidade"));
    const dept = formData.get("departamento") as string;

    const selectedItem = bens.find((b) => b.id === itemId);
    if (!selectedItem) {
      alert("Item não encontrado no inventário.");
      return;
    }

    if (Number(selectedItem.quantidadeDisponivel || 0) < qtd) {
      alert("Quantidade insuficiente em estoque!");
      return;
    }

    try {
      // 1. Registar a saída para consumo interno
      await firestoreService.movimentos_economato.add({
        descricao: selectedItem.nome,
        quantidade: qtd,
        departamento: dept,
        tipo: "SAIDA_CONSUMO",
        origem: "Almoxarifado",
        operador: user?.name || "Sistema",
        timestamp: new Date().toISOString(),
      });

      // 2. Decrementar do estoque real
      const newQty = Number(selectedItem.quantidadeDisponivel || 0) - qtd;
      await firestoreService.materiais_bens.update(selectedItem.id, {
        quantidadeDisponivel: newQty,
        updatedBy: user?.email,
      });

      alert(
        `Saída de ${qtd} unid. de ${selectedItem.nome} para ${dept} registada com sucesso!`,
      );
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Erro ao registar saída:", error);
      alert("Falha ao registar saída para consumo.");
    }
  };

  const renderContent = () => {
    if (showEntryForm) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEntryForm(false)}
                className="bg-slate-100 p-2.5 rounded-xl text-[#121c60] hover:bg-slate-200 hover:scale-105 transition-all flex items-center justify-center shadow-sm"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Voltar para o Módulo de Suprimentos
                </span>
                <h3 className="text-sm font-black text-slate-850">
                  Registo ERP de Entrada de Produtos
                </h3>
              </div>
            </div>
            <button
              onClick={() => setShowEntryForm(false)}
              className="text-xs font-bold text-[#121c60] hover:text-[#0b113a] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all"
            >
              Retornar ao Almoxarifado
            </button>
          </div>
          <FormularioEntradaEstoque
            user={user}
            onCancel={() => setShowEntryForm(false)}
            onSubmit={handleStockSubmit}
          />
        </div>
      );
    }

    if (showExitForm) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExitForm(false)}
                className="bg-slate-100 p-2.5 rounded-xl text-[#121c60] hover:bg-slate-200 hover:scale-105 transition-all flex items-center justify-center shadow-sm"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Voltar para o Módulo de Suprimentos
                </span>
                <h3 className="text-sm font-black text-slate-850">
                  Requisição & Saída Consolidada de Consumos
                </h3>
              </div>
            </div>
            <button
              onClick={() => setShowExitForm(false)}
              className="text-xs font-bold text-[#121c60] hover:text-[#0b113a] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-all"
            >
              Retornar ao Almoxarifado
            </button>
          </div>
          <FormularioRequisicaoInterna
            user={user}
            onCancel={() => setShowExitForm(false)}
            onSubmit={() => setShowExitForm(false)}
          />
        </div>
      );
    }

    switch (activeSubView) {
      case "visao_geral":
        return <VisaoGeralLayout title="Economato" />;
      case "plano":
        return (
          <MatrixView
            title="Plano do Economato"
            isDepartment={true}
            externalActivities={[]}
            setExternalActivities={() => {}}
            onDeleteActivity={() => {}}
            onUpdateActivity={() => {}}
          />
        );
      case "calendario":
        return (
          <CalendarView
            events={[]}
            notes={[]}
            title="Economato"
            onAddEvent={async () => {}}
            onUpdateEvent={async () => {}}
            onDeleteEvent={async () => {}}
            onAgendar={() => {}}
            onNota={() => {}}
          />
        );
      case "documentos_normativos":
        return <DocumentosView title="Economato" user={user} />;
      case "gestao_expediente":
        return (
          <GestaoDocumentosView
            title="Economato"
            expedientes={[]}
            onUpdateExpediente={() => {}}
            onBack={() => {}}
            onTrackingClick={() => {}}
            hideHeader={true}
          />
        );
      case "assinatura_digital":
        return <AssinaturaDigitalView user={user} onBack={() => {}} />;
      case "balanco":
        return (
          <BalancoActividadesView
            activities={matrixActivities}
            user={user}
            onBack={() => setActiveSubView("plano")}
            sectorTitle="Economato"
          />
        );
      case "estoque":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                <div className="text-[10px] font-bold text-emerald-600 mb-1 tracking-wider">
                  Acuracidade do Estoque
                </div>
                <div className="text-xl font-bold text-emerald-900">98.5%</div>
                <div className="text-[10px] text-emerald-700/60">
                  Físico vs Sistema (Tempo Real)
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
                <div className="text-[10px] font-bold text-blue-600 mb-1 tracking-wider">
                  Itens Endereçados
                </div>
                <div className="text-xl font-bold text-blue-900">100%</div>
                <div className="text-[10px] text-blue-700/60">
                  Espaço Físico Mapeado
                </div>
              </div>
              <button
                onClick={() => setShowEntryForm(true)}
                className="bg-slate-900 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md group"
              >
                <PlusCircle
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
                <span className="text-sm">Nova Entrada</span>
              </button>
              <button
                onClick={() => setShowExitForm(true)}
                className="bg-blue-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md group"
              >
                <ArrowUpRight
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
                <span className="text-sm">Saída p/ Consumo</span>
              </button>
            </div>

            {/* Independent page rendering handled by renderContent top switcher */}

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-center overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
                Categorias:
              </span>
              {[
                "Todos",
                "Imóveis",
                "Móveis",
                "Consumíveis",
                "Inconsumíveis",
                "Bens Duráveis",
                "Bens Não Duráveis",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${categoryFilter === cat ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-bl">
                      Inventário Consolidado
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">
                        Produtos em Inventário
                      </h3>
                      <p className="text-xs text-slate-500">
                        Itens conferidos, etiquetados e alocados no espaço
                        físico
                      </p>
                    </div>
                    <button className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg">
                      <LayoutGrid size={14} /> Mapa de Alocação
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-3 text-slate-400 font-bold text-[10px] tracking-wider">
                            Item Consumo
                          </th>
                          <th className="pb-3 text-slate-400 font-bold text-[10px] tracking-wider">
                            Localização Física
                          </th>
                          <th className="pb-3 text-slate-400 font-bold text-[10px] tracking-wider text-center">
                            Disponibilidade
                          </th>
                          <th className="pb-3 text-slate-400 font-bold text-[10px] tracking-wider text-right">
                            Integridade
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bens.map((bem) => (
                          <tr
                            key={bem.id}
                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-4">
                              <div className="font-bold text-slate-700 text-sm">
                                {bem.nome}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Patr/Ref: SKU-{bem.id?.slice(0, 5)}
                              </div>
                            </td>
                            <td className="py-4">
                              <span className="font-mono text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">
                                P-ALM.{bem.localizacaoAtual || "Geral"}
                              </span>
                            </td>
                            <td className="py-4 text-center">
                              <span
                                className={`font-bold text-sm ${Number(bem.quantidadeDisponivel) < 5 ? "text-red-500" : "text-slate-800"}`}
                              >
                                {bem.quantidadeDisponivel || 0}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-[10px] font-bold text-emerald-600 tracking-tighter">
                                  Verificado
                                </span>
                                <div className="bg-emerald-100 p-1 rounded-full">
                                  <ShieldCheck
                                    size={12}
                                    className="text-emerald-600"
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {bens.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-12 text-center text-slate-400 italic text-sm"
                            >
                              <Package
                                size={32}
                                className="mx-auto mb-2 opacity-20"
                              />
                              Aguardando atualização do Inventário Físico...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-900 border-opacity-10 relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
                  <div className="absolute top-0 right-0 p-2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl tracking-widest">
                      Fluxo de Entrada ERP
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-bold text-lg text-blue-900">
                        Entradas Recentes de Mercadorias
                      </h3>
                      <p className="text-xs text-blue-600/70">
                        Produtos registados via fornecedor, aguardando alocação
                        física no Almoxarifado
                      </p>
                    </div>
                    <div className="bg-blue-600/10 text-blue-700 text-xs px-3 py-1 rounded-full font-bold border border-blue-600/20">
                      {stockEntries.length} Lotes Hoje
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-blue-100">
                          <th className="pb-3 text-blue-400 font-bold text-[10px] tracking-wider">
                            Especificação
                          </th>
                          <th className="pb-3 text-blue-400 font-bold text-[10px] tracking-wider">
                            Volume
                          </th>
                          <th className="pb-3 text-blue-400 font-bold text-[10px] tracking-wider">
                            Registo Hora
                          </th>
                          <th className="pb-3 text-blue-400 font-bold text-[10px] tracking-wider text-right">
                            Controle ERP
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockEntries.length > 0 ? (
                          stockEntries.map((entry, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-slate-50 hover:bg-white/50 transition-colors"
                            >
                              <td className="py-4">
                                <div className="font-bold text-slate-700 text-sm">
                                  {entry.descricao}
                                </div>
                                <div className="text-[10px] text-blue-500 font-medium">
                                  Origem:{" "}
                                  {entry.fornecedor || "Fornecedor Local"}
                                </div>
                              </td>
                              <td className="py-4 font-black text-blue-700">
                                {entry.quantidade}
                              </td>
                              <td className="py-4 text-[10px] font-mono text-slate-500">
                                {entry.timestamp || "Recente"}
                              </td>
                              <td className="py-4 text-right">
                                <button className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-all tracking-tight shadow-sm">
                                  Posicionar
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-12 text-center text-slate-400 italic text-sm"
                            >
                              Sem novos lançamentos de entrada processados nas
                              últimas 24h.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Monitoramento em Tempo Real - Saída de Materiais */}
                <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                    <Monitor size={20} className="text-emerald-400" /> Fluxo de
                    Saída de Materiais (Tempo Real)
                  </h3>
                  <div className="space-y-3">
                    {movements
                      .filter(
                        (m) => m.tipo === "Saida" || m.tipo === "SAIDA_CONSUMO",
                      )
                      .slice(0, 5)
                      .map((log, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                        >
                          <div className="text-[10px] font-mono text-slate-500 bg-black/20 px-2 py-1 rounded">
                            {log.createdAt
                              ? log.createdAt.toDate
                                ? log.createdAt.toDate().toLocaleTimeString()
                                : new Date(log.createdAt).toLocaleTimeString()
                              : "Recente"}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-100">
                              {log.descricao}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Destino:{" "}
                              {log.setorDestino ||
                                log.departamento ||
                                "Não especificado"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-red-400">
                              -{log.quantidade} un
                            </div>
                            <div className="text-[9px] text-slate-500 font-bold">
                              Out
                            </div>
                          </div>
                        </div>
                      ))}
                    {movements.filter((m) => m.tipo === "Saida").length ===
                      0 && (
                      <div className="text-center py-8 text-slate-500 text-xs italic">
                        Nenhuma saída registada recentemente.
                      </div>
                    )}
                  </div>
                </div>

                {/* FormularioEntradaEstoque is rendered in full view handled by renderContent switcher */}

                <div className="bg-[#121c60]/5 p-6 rounded-2xl border border-[#121c60]/10 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-[#121c60] text-sm mb-2 flex items-center gap-2">
                      <ArrowDownRight size={18} className="text-[#FF9500]" />
                      Requisitar Material
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
                      Abra a ficha oficial de Saída para Consumo Interno de
                      forma independente e com atualização em tempo real.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowExitForm(true)}
                    className="w-full bg-[#121c60] text-white font-bold py-3 rounded-xl hover:bg-black transition-all shadow-md text-xs tracking-wider flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight size={14} /> Abrir Ficha de Saída
                  </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                    <Monitor size={18} className="text-blue-500" />
                    Mapeamento Automatizado
                  </h4>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                        <TrendingUp size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700">
                          Previsão Inteligente
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          Sugestão de compra baseada no giro histórico de
                          consumo
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform">
                        <LayoutGrid size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700">
                          Otimização de Espaço
                        </div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                          Reorganização lógica das prateleiras para itens mais
                          solicitados
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      case "erp":
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-slate-400 tracking-widest">
                    Giro ERP (Mês)
                  </span>
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                    <TrendingUp size={20} />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-800">1.25x</div>
                <div className="text-[11px] text-emerald-600 mt-2 font-bold flex items-center gap-1">
                  <ArrowUpRight size={14} /> Performance Superior vs Plano
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-slate-400 tracking-widest">
                    Monitoramento E/S
                  </span>
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                    <Package size={20} />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-800">
                  420 / 215
                </div>
                <div className="text-[11px] text-slate-500 mt-2 font-medium">
                  Entradas / Saídas Processadas (24h)
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-slate-400 tracking-widest">
                    Eficiência ERP
                  </span>
                  <div className="bg-purple-100 text-purple-600 p-2 rounded-xl">
                    <Monitor size={20} />
                  </div>
                </div>
                <div className="text-4xl font-black text-slate-800">97.8%</div>
                <div className="text-[11px] text-purple-600 mt-2 font-bold">
                  Taxa de Sincronização de Inventário
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
                  <TrendingUp size={22} className="text-blue-600" />
                  Monitoramento Real de Giro
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={turnoverData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="giro"
                        name="Giro Gestão"
                        stroke="#3b82f6"
                        strokeWidth={4}
                        dot={{
                          fill: "#3b82f6",
                          r: 6,
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
                  <Package size={22} className="text-emerald-600" />
                  Relação Entrada / Consumo ERP
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={turnoverData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
                      />
                      <Tooltip cursor={{ fill: "#f8fafc" }} />
                      <Bar
                        dataKey="entradas"
                        fill="#3b82f6"
                        radius={[6, 6, 0, 0]}
                        barSize={24}
                      />
                      <Bar
                        dataKey="saidas"
                        fill="#ef4444"
                        radius={[6, 6, 0, 0]}
                        barSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <div className="bg-emerald-500 h-3 w-3 rounded-full animate-pulse"></div>
              </div>
              <h3 className="font-bold text-xl mb-8 flex items-center gap-3">
                <Monitor size={24} className="text-emerald-400" /> Real-Time
                Management Logs
              </h3>
              <div className="space-y-3">
                {movements.slice(0, 6).map((log, i) => (
                  <div
                    key={log.id || i}
                    className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
                  >
                    <div className="text-slate-500 font-mono text-[11px] w-20">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleTimeString()
                        : "--:--:--"}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold group-hover:text-emerald-300 transition-colors">
                        {log.descricao}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {log.tipo === "Entrada"
                          ? `Entrada de ${log.quantidade} unid`
                          : `Saída de ${log.quantidade} unid para ${log.departamento || "N/A"}`}
                      </div>
                    </div>
                    <div
                      className={`text-[9px] font-black px-3 py-1 rounded-full ${log.tipo === "Entrada" ? "bg-emerald-500" : "bg-red-500"} text-white  tracking-tighter`}
                    >
                      {log.tipo}
                    </div>
                  </div>
                ))}
                {movements.length === 0 && (
                  <div className="text-center py-8 text-slate-500 italic text-sm italic">
                    Nenhum evento registado em tempo real.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case "relatorios":
        return (
          <ReportsView
            user={user}
            onShowAlert={(msg) => alert(msg)}
            initialDirection="Economato"
            onBack={() => setActiveSubView("visao_geral")}
          />
        );
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      <div className="w-64 bg-slate-900 text-white flex flex-col p-4 shadow-xl">
        {/* Voltar Button */}
        {isPatrimonioBossOrAdmin(user) && (
          <button
            onClick={onBack}
            className="w-full flex items-center gap-3 p-3 mb-4 rounded-xl transition-all duration-200 bg-slate-800/50 hover:bg-slate-800 text-amber-500 hover:text-amber-400 font-bold border border-slate-700/50 hover:border-slate-600 shadow-sm"
          >
            <ArrowLeft size={18} />
            <span>Voltar ao Menu</span>
          </button>
        )}

        <div className="flex-1 space-y-2">
          {sideItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubView(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${activeSubView === item.id ? "bg-slate-800" : "hover:bg-slate-800"}`}
            >
              <item.icon size={20} />
              {item.title}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Economato - {sideItems.find((i) => i.id === activeSubView)?.title}
        </h2>
        {renderContent()}
      </div>
    </div>
  );
}
