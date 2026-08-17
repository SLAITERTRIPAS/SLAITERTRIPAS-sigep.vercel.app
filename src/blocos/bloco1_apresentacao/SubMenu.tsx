import React, { useState } from "react";
import {
  ArrowLeft,
  Maximize2,
  LogOut,
  Power,
  User,
  FileText,
  DollarSign,
  ChevronRight,
  BookOpen,
  LayoutGrid,
} from "lucide-react";
import LibraryVisitForm from "../bloco3_unidades_organicas/LibraryVisitForm";
import BookRegistrationForm from "../bloco3_unidades_organicas/BookRegistrationForm";
import ArchiveView from "../bloco5_sistema/ArchiveView";

import { LibraryRegistration, BookRegistration } from "../../types";
import { isSuperBossUser, isPatrimonioBossOrAdmin, isDPEPUser, isChefeDPEPUser } from "../../lib/auth";
import { DEPARTAMENTOS } from "../../constants/formOptions";
import MainHeader from "../bloco1_apresentacao/MainHeader";

const getSubBlockLabel = (parentTitle: string, itemTitle: string) => {
  const pt = parentTitle.toUpperCase();
  const it = itemTitle.toUpperCase();

  // Bloco 3: Órgão de Direção e Gestão
  if (pt.includes("DIREÇÃO E GESTÃO") || pt.includes("DIRECAO E GESTAO")) {
    if (it.includes("REPRESENTANTES")) return "Sub-bloco 3.2";
    if (it.includes("GABINETE DO DIRETOR") || it.includes("GABINETE DO DIRECTOR")) return "Sub-bloco 3.1";
    if (it.includes("ADMINISTRATIVO")) return "Sub-bloco 3.3";
    if (it.includes("TÉCNICO") || it.includes("TECNICO")) return "Sub-bloco 3.4";
  }

  // Bloco 3.1: Gabinete do Diretor-Geral
  if (pt.includes("GABINETE DO DIRETOR") || pt.includes("GABINETE DO DIRECTOR") || pt.includes("DIRETOR-GERAL") || pt.includes("DIRECTOR-GERAL")) {
    if (it.includes("DIRETOR-GERAL") || it.includes("DIRECTOR-GERAL")) return "Sub-bloco 3.1.1";
    if (it.includes("CHEFE DO GDG") || it === "CHEFE GDG" || it.includes("CHEFE DO GABINETE")) return "Sub-bloco 3.1.2";
    if (it.includes("SECRETARIA EXECUTIVA") || it.includes("SECRETARIA")) return "Sub-bloco 3.1.3";
    if (it.includes("PLANIFICAÇÃO") || it.includes("PLANIFICACAO") || it.includes("ESTUDOS E PROJETOS")) return "Sub-bloco 3.1.4";
    if (it.includes("UGEA") || it.includes("AQUISIÇÕES") || it.includes("AQUISICOES") || it.includes("CONTRATAÇÃO")) return "Sub-bloco 3.1.5";
    if (it.includes("COOPERAÇÃO") || it.includes("COOPERACAO")) return "Sub-bloco 3.1.6";
    if (it.includes("CONTROLO TÉCNICO") || it.includes("CONTROLO TECNICO")) return "Sub-bloco 3.1.7";
    if (it.includes("JURÍDICO") || it.includes("JURIDICO")) return "Sub-bloco 3.1.8";
  }

  // Bloco 4: Unidade Orgânica
  if (pt.includes("UNIDADE ORGÂNICA") || pt.includes("UNIDADE ORGANICA")) {
    if (it.includes("DIVISÃO DE ENGENHARIA") || it.includes("DIVISAO DE ENGENHARIA") || it.includes("ENGENHARIA")) return "Sub-bloco 4.1";
    if (it.includes("INCUBAÇÃO") || it.includes("INCUBACAO") || it.includes("CIE")) return "Sub-bloco 4.2";
    if (it.includes("CENTROS")) return "Sub-bloco 4.3";
  }

  // Bloco 4.1: Divisão de Engenharia
  if (pt.includes("DIVISÃO DE ENGENHARIA") || pt.includes("DIVISAO DE ENGENHARIA") || pt.includes("ENGENHARIA")) {
    if (it.includes("DIRETOR DA DIVISÃO") || it.includes("DIRECTOR DA DIVISAO")) return "Sub-bloco 4.1.1";
    if (it.includes("PEDAGÓGICO") || it.includes("PEDAGOGICO") || it.includes("ADJUNTO")) return "Sub-bloco 4.1.2";
    if (it.includes("PESQUISA")) return "Sub-bloco 4.1.3";
    if (it.includes("ELETROTÉCNICA") || it.includes("ELETROTECNICA")) return "Sub-bloco 4.1.4";
    if (it.includes("CONSTRUÇÃO CIVIL") || it.includes("CONSTRUCO CIVIL")) return "Sub-bloco 4.1.5";
    if (it.includes("MECÂNICA") || it.includes("MECANICA") || it.includes("CONSTRUÇÃO MECÂNICA")) return "Sub-bloco 4.1.6";
    if (it.includes("DISCIPLINAS GERAIS")) return "Sub-bloco 4.1.7";
    if (it.includes("TÉCNICO E DE APOIO") || it.includes("TECNICO E DE APOIO") || it.includes("APOIO")) return "Sub-bloco 4.1.8";
  }

  // Bloco 4.2: Centro de Incubação de Empresas
  if (pt.includes("INCUBAÇÃO DE EMPRESAS") || pt.includes("INCUBACAO DE EMPRESAS") || pt.includes("CIE")) {
    if (it.includes("DIRETOR") || it.includes("DIRECTOR") || it === "DIRETOR DO CIE") return "Sub-bloco 4.2.1";
    if (it.includes("PRÁTICAS DE GERAÇÃO") || it.includes("PRATICAS DE GERACAO") || it.includes("DPGNDE")) return "Sub-bloco 4.2.2";
    if (it.includes("CONSULTORIA") || it.includes("DCPAF")) return "Sub-bloco 4.2.3";
    if (it.includes("PROSPECÇÃO") || it.includes("PROSPECCAO") || it.includes("DPONE")) return "Sub-bloco 4.2.4";
  }

  // Bloco 5: Serviços Centrais
  if (pt.includes("SERVIÇOS CENTRAIS") || pt.includes("SERVICOS CENTRAIS")) {
    if (it.includes("DICOSAFA")) return "Sub-bloco 5.1";
    if (it.includes("DICOSSER")) return "Sub-bloco 5.2";
  }

  // Bloco 5.1: DICOSAFA
  if (pt.includes("DICOSAFA") || pt.includes("DICOSSAFA")) {
    if (it.includes("DIRETOR DA DICOSAFA") || it.includes("DIRECTOR DA DICOSAFA")) return "Sub-bloco 5.1.1";
    if (it.includes("RECURSOS HUMANOS") || it.includes("RH")) return "Sub-bloco 5.1.2";
    if (it.includes("FINANÇAS") || it.includes("FINANCAS")) return "Sub-bloco 5.1.3";
    if (it.includes("PATRIMÓNIO") || it.includes("PATRIMONIO")) return "Sub-bloco 5.1.4";
    if (it.includes("SECRETARIA GERAL") || it.includes("SECRETARIA") || it === "SECRETARIA GERAL") return "Sub-bloco 5.1.5";
    if (it.includes("TIC") || it.includes("TECNOLOGIAS")) return "Sub-bloco 5.1.6";
    if (it.includes("LAR DE ESTUDANTES") || it.includes("ALOJAMENTO") || it.includes("LAR")) return "Sub-bloco 5.1.7";
    if (it.includes("PRODUÇÃO ALIMENTAR") || it.includes("PRODUCAO ALIMENTAR") || it.includes("ALIMENTAR")) return "Sub-bloco 5.1.8";
  }

  // Bloco 5.2: DICOSSER
  if (pt.includes("DICOSSER")) {
    if (it.includes("DIRETOR DA DICOSSER") || it.includes("DIRECTOR DA DICOSSER")) return "Sub-bloco 5.2.1";
    if (it.includes("REGISTO ACADÉMICO") || it.includes("REGISTO ACADEMICO") || it.includes("DRA")) return "Sub-bloco 5.2.2";
    if (it.includes("ASSUNTOS ESTUDANTIS") || it.includes("ESTUDANTIS")) return "Sub-bloco 5.2.3";
    if (it.includes("BIBLIOTECA") || it.includes("LIVROS")) return "Sub-bloco 5.2.4";
  }

  return "";
};

export default function SubMenu({
  title,
  items,
  onBack,
  onNavigate,
  onShowAlert,
  onLibrarySubmit,
  onBookSubmit,
  onLogout,
  bookRegistrations = [],
  events = [],
  onAddEvent = async () => {},
  onUpdateEvent = async () => {},
  onDeleteEvent = async () => {},
  onAgendar = () => {},
  onNota = () => {},
  onPlanoSetorial,
  onRelatorioAnual,
  onTetoOrcamental,
  notes = [],
  matrixActivities = [],
  user,
}: {
  title: string;
  items: {
    title: string;
    subItems?: { title: string; accessible?: boolean }[];
    accessible?: boolean;
  }[];
  onBack: () => void;
  onNavigate?: (
    title: string,
    items: { title: string; accessible?: boolean }[],
  ) => void;
  onShowAlert: (msg: string) => void;
  onLibrarySubmit?: (reg: LibraryRegistration) => void;
  onBookSubmit?: (book: BookRegistration) => void;
  onLogout: () => void;
  bookRegistrations?: BookRegistration[];
  events?: any[];
  onAddEvent?: (e: any) => Promise<any>;
  onUpdateEvent?: (id: string, data: any) => Promise<any>;
  onDeleteEvent?: (id: string) => Promise<any>;
  onAgendar?: () => void;
  onNota?: () => void;
  onPlanoSetorial?: () => void;
  onRelatorioAnual?: () => void;
  onTetoOrcamental?: () => void;
  notes?: any[];
  matrixActivities?: any[];
  user?: any;
}) {
  const [showLibraryVisitForm, setShowLibraryVisitForm] = useState(false);
  const [showBookRegistrationForm, setShowBookRegistrationForm] =
    useState(false);
  const [showArchiveView, setShowArchiveView] = useState(false);

  const totalActivitiesCount = matrixActivities.length;

  const isActivityInOrgan = (act: any, organTitle: string): boolean => {
    if (!organTitle) return false;
    const normalizeStr = (s: string) => {
      if (!s) return "";
      return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    };
    const normOrgan = normalizeStr(organTitle);
    const actDir = normalizeStr(act.direcao || act.direccao || act.unidadeOrganica || "");
    const actDep = normalizeStr(act.departamento || "");
    const actRep = normalizeStr(act.reparticao || "");
    const actSet = normalizeStr(act.setor || "");

    if (normOrgan === "UNIDADE ORGANICA") {
      const matchDir = ["DIVISAO DE ENGENHARIA", "CENTRO DE INCUBACAO DE EMPRESAS", "CENTROS", "UNIDADE ORGANICA", "CIE"];
      return matchDir.some(d => actDir.includes(d) || actDep.includes(d) || actRep.includes(d) || actSet.includes(d));
    }
    if (normOrgan === "SERVICOS CENTRAIS") {
      const matchDir = [
        "DICOSAFA", "DICOSSER", "SERVICOS CENTRAIS", "FINANCAS", "RECURSOS HUMANOS", 
        "REGISTO ACADEMICO", "BIBLIOTECA", "ASSUNTOS ESTUDANTIS", "PATRIMONIO", 
        "SECRETARIA GERAL", "TIC", "LAR DE ESTUDANTES", "PRODUCAO ALIMENTAR"
      ];
      return matchDir.some(d => actDir.includes(d) || actDep.includes(d) || actRep.includes(d) || actSet.includes(d));
    }
    if (normOrgan === "ORGAO DE DIRECAO E GESTAO" || normOrgan === "ORGAO DE DIRECCAO E GESTAO") {
      const matchDir = [
        "GABINETE DO DIRETOR", "GABINETE DO DIRETOR-GERAL", "PLANIFICACAO", "ESTUDOS", 
        "DPEP", "UGEA", "AQUISICOES", "COOPERACAO", "JURIDICO", "CONTROLO TECNICO", 
        "CONSELHO", "ORGAO DE DIRECAO E GESTAO", "ORGAO DE DIRECCAO E GESTAO"
      ];
      return matchDir.some(d => actDir.includes(d) || actDep.includes(d) || actRep.includes(d) || actSet.includes(d));
    }
    if (actDir.includes(normOrgan) || actDep.includes(normOrgan) || actRep.includes(normOrgan) || actSet.includes(normOrgan)) {
      return true;
    }

    // Caso especial: Verificar se o departamento da atividade pertence à Direção (OrganTitle)
    if (actDep) {
      for (const [dirName, deps] of Object.entries(DEPARTAMENTOS)) {
        const normDir = normalizeStr(dirName);
        if (normDir.includes(normOrgan) || normOrgan.includes(normDir)) {
          if (deps.some(d => normalizeStr(d).includes(actDep) || actDep.includes(normalizeStr(d)))) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const totalBudgetAmount = matrixActivities.reduce((sum, act) => {
    let actVal = 0;
    let hasRub = false;
    if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
      const rSum = act.rubricas.reduce(
        (acc: number, r: any) => acc + Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0),
        0
      );
      if (rSum > 0) {
        actVal += rSum;
        hasRub = true;
      }
    }
    if (!hasRub) {
      actVal += Number(act.valorTotal || act.valor || act.orcamentoTotal || act.valorTotal || 0);
    }
    return sum + actVal;
  }, 0);

  const organActivities = matrixActivities.filter(act => isActivityInOrgan(act, title));
  const organActivitiesCount = organActivities.length;
  const organBudgetAmount = organActivities.reduce((sum, act) => {
    let actVal = 0;
    let hasRub = false;
    if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
      const rSum = act.rubricas.reduce(
        (acc: number, r: any) => acc + Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0),
        0
      );
      if (rSum > 0) {
        actVal += rSum;
        hasRub = true;
      }
    }
    if (!hasRub) {
      actVal += Number(act.valorTotal || act.valor || act.orcamentoTotal || act.valorTotal || 0);
    }
    return sum + actVal;
  }, 0);

  const formattedBudget =
    totalBudgetAmount.toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " MZN";

  const formattedOrganBudget =
    organBudgetAmount.toLocaleString("pt-MZ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " MZN";

  if (showLibraryVisitForm) {
    const initialType =
      user?.role === "Estudante"
        ? "Estudante"
        : user?.role === "Docente"
          ? "Docente"
          : user?.role === "CTA"
            ? "CTA"
            : "Externo";

    return (
      <LibraryVisitForm
        onBack={() => setShowLibraryVisitForm(false)}
        onSubmit={onLibrarySubmit}
        bookRegistrations={bookRegistrations}
        initialTipoVisitante={initialType}
        user={user}
      />
    );
  }

  if (showBookRegistrationForm) {
    return (
      <BookRegistrationForm
        onBack={() => setShowBookRegistrationForm(false)}
        onSubmit={onBookSubmit}
      />
    );
  }

  if (showArchiveView) {
    return (
      <ArchiveView
        user={user}
        onBack={() => setShowArchiveView(false)}
        onShowAlert={onShowAlert}
      />
    );
  }

  const titleUpper = title.toUpperCase();
  const isServicosCentrais = titleUpper.includes("UNIDADE ORGÂNICA") || titleUpper.includes("UNIDADE ORGANICA");
  const isGabineteDG =
    titleUpper.includes("GABINETE DO DIRETOR") ||
    titleUpper.includes("GABINETE DO DIRECTOR") ||
    titleUpper.includes("DIRETOR-GERAL") ||
    titleUpper.includes("DIRECTOR-GERAL");
  const isDICOSAFA =
    titleUpper.includes("DICOSAFA") || titleUpper.includes("DICOSSAFA");
  const isDICOSSER = titleUpper.includes("DICOSSER");
  const isRH =
    titleUpper.includes("RECURSOS HUMANOS") ||
    titleUpper === "Departamento De Recursos Humanos";
  const isFinancas =
    titleUpper.includes("FINANÇAS") ||
    titleUpper.includes("FINANCAS") ||
    titleUpper === "Departamento De Finanças";
  const isPatrimonio =
    titleUpper.includes("PATRIMÓNIO") ||
    titleUpper.includes("PATRIMONIO") ||
    titleUpper === "Departamento De Património";
  const isSecretariaGeral =
    titleUpper.includes("SECRETARIA GERAL") ||
    titleUpper === "Secretaria Geral";
  const isTIC =
    titleUpper.includes("TIC") || titleUpper === "Departamento Tic";
  const isLarEstudantes =
    titleUpper.includes("LAR DE ESTUDANTES") ||
    titleUpper === "Departamento Lar De Estudantes";
  const isProducaoAlimentar =
    titleUpper.includes("PRODUÇÃO ALIMENTAR") ||
    titleUpper.includes("PRODUCAO ALIMENTAR") ||
    titleUpper === "Departamento De Produção Alimentar";
  const isBiblioteca =
    titleUpper.includes("BIBLIOTECA") ||
    titleUpper === "Departamento De Biblioteca" ||
    titleUpper === "Atendimento Da Biblioteca" ||
    titleUpper === "Gestão De Biblioteca";
  const isRegistoAcademico =
    titleUpper.includes("REGISTO ACADÉMICO") ||
    titleUpper.includes("REGISTO ACADEMICO") ||
    titleUpper === "Departamento De Registo Académico" ||
    titleUpper === "Atendimento Estudantil" ||
    titleUpper === "Gestão Estudantil";
  const isAssuntosEstudantis =
    titleUpper.includes("ASSUNTOS ESTUDANTIS") ||
    titleUpper === "Departamento De Assuntos Estudantis";
  const isEngenharia =
    titleUpper.includes("DIVISÃO DE ENGENHARIA") ||
    titleUpper.includes("DIVISAO DE ENGENHARIA") ||
    titleUpper.includes("ENGENHARIA") ||
    titleUpper === "Divisão De Engenharia";
  const isCursos =
    titleUpper.includes("ELETROTÉCNICA") ||
    titleUpper.includes("ELETROTECNICA") ||
    titleUpper.includes("CONSTRUÇÃO CIVIL") ||
    titleUpper.includes("CONSTRUCAO CIVIL") ||
    titleUpper.includes("MECÂNICA") ||
    titleUpper.includes("MECANICA") ||
    titleUpper === "Departamento De Engenharia Eletrotécnica" ||
    titleUpper === "Departamento De Engenharia De Construção Civil" ||
    titleUpper === "Departamento De Engenharia De Construção Mecânica";
  const isUnidadesOrganicas =
    titleUpper.includes("UNIDADE ORGÂNICA") ||
    titleUpper.includes("UNIDADE ORGANICA") ||
    titleUpper.includes("Unidade orgânica");
  const isCIE =
    titleUpper.includes("INCUBAÇÃO DE EMPRESAS") ||
    titleUpper.includes("INCUBACAO DE EMPRESAS") ||
    titleUpper.includes("CENTRO DE INCUBAÇÃO") ||
    titleUpper.includes("CENTRO DE INCUBACAO") ||
    titleUpper === "Centro De Incubação De Empresas";

  const isDepartmentalLayout =
    isGabineteDG ||
    isDICOSAFA ||
    isDICOSSER ||
    isRH ||
    isFinancas ||
    isPatrimonio ||
    isSecretariaGeral ||
    isTIC ||
    isLarEstudantes ||
    isProducaoAlimentar ||
    isBiblioteca ||
    isRegistoAcademico ||
    isAssuntosEstudantis ||
    isEngenharia ||
    isCursos ||
    isCIE ||
    isUnidadesOrganicas;

  const isOrangeTheme =
    isDICOSAFA ||
    isDICOSSER ||
    isRH ||
    isFinancas ||
    isPatrimonio ||
    isSecretariaGeral ||
    isTIC ||
    isLarEstudantes ||
    isProducaoAlimentar ||
    isBiblioteca ||
    isRegistoAcademico ||
    isAssuntosEstudantis;
  const isGreenTheme = isUnidadesOrganicas || isEngenharia || isCursos || isCIE;
  const hasTopRightButton =
    isRH ||
    isFinancas ||
    isPatrimonio ||
    isSecretariaGeral ||
    isTIC ||
    isLarEstudantes ||
    isProducaoAlimentar ||
    isBiblioteca ||
    isRegistoAcademico ||
    isAssuntosEstudantis;
  const hasTopCenterButtons =
    isDICOSAFA || isDICOSSER || isEngenharia || isCIE || isBiblioteca;

  const displayItems = items.filter(
    (item) => item && item.title && item.title.trim() !== "",
  );

  const getGridClassesAndMaxWidth = () => {
    const len = displayItems.length;
    if (len === 5) {
      return {
        grid: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
        maxWidth: "max-w-full"
      };
    }
    if (len === 6) {
      return {
        grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        maxWidth: "max-w-4xl"
      };
    }
    if (len === 8) {
      return {
        grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        maxWidth: "max-w-5xl"
      };
    }
    if (len === 3) {
      return {
        grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        maxWidth: "max-w-4xl"
      };
    }
    if (len === 2) {
      return {
        grid: "grid-cols-1 sm:grid-cols-2",
        maxWidth: "max-w-2xl"
      };
    }
    if (len === 1) {
      return {
        grid: "grid-cols-1",
        maxWidth: "max-w-sm"
      };
    }
    return {
      grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      maxWidth: "max-w-5xl"
    };
  };

  const { grid: gridClass, maxWidth: maxWidthClass } = getGridClassesAndMaxWidth();

  const defaultColors = [
    "bg-[#5842ff]",
    "bg-[#5865ff]",
    "bg-[#7e8aff]",
    "bg-[#7e65ff]",
    "bg-[#8a8aff]",
  ];

  const orangeColors = [
    "bg-[#d35400]", // Darker Orange
    "bg-[#e67e22]", // Orange
    "bg-[#f39c12]", // Light Orange
    "bg-[#f1c40f]", // Yellow
    "bg-[#e08e36]", // Muted Orange
    "bg-[#f5b041]", // Soft Orange
  ];

  const greenColors = [
    "bg-[#059669]", // Emerald 600
    "bg-[#10b981]", // Emerald 500
    "bg-[#059669]", // Emerald 600
  ];

  const colors = isOrangeTheme
    ? orangeColors
    : isGreenTheme
      ? greenColors
      : defaultColors;

  const isAllowed = (item: any) => {
    if (!user) return true;
    const itemTitle = String(item?.title || "").toLowerCase();
    const isTechDPEP = isDPEPUser(user) && !isChefeDPEPUser(user);
    if (isTechDPEP) {
      if (itemTitle.includes("relatorio") || itemTitle.includes("relatório") || itemTitle.includes("chefe do departamento")) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="flex-1 min-h-0 w-full bg-[#f8f9fa] flex flex-col p-1 sm:p-2 overflow-y-auto">
      <main className="w-full max-w-full mx-auto flex flex-col items-center py-2">
        {/* Top Header / Back Button */}
        <div className="w-full mb-3 sm:mb-5 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center w-full gap-4 text-center">
            <div className="text-center">
              <h2 className="text-xl sm:text-3xl font-black text-amber-500 mb-1 sm:mb-2 tracking-tight font-serif bg-slate-950/90 border border-slate-800 px-4 sm:px-8 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-xl inline-block">
                {isCursos ? "Cursos Disponíveis" : "Selecione a Área"}
              </h2>
              <p className="text-xs sm:text-base text-slate-600 font-medium font-serif italic">
                {isCursos
                  ? "Selecione um curso para ver mais detalhes."
                  : "Navegue pelas repartições e setores disponíveis."}
              </p>
            </div>
          </div>

          {/* Action Buttons matching the requested layout */}
          <div className="flex flex-col items-center gap-3 mt-4 w-full max-w-xl mx-auto px-4">
            {/* Teto do Órgão (Soma de todos os orçamentos por departamento) */}
            <button
              onClick={() => {
                if (onTetoOrcamental) {
                  onTetoOrcamental();
                } else {
                  onShowAlert(`Teto Orçamental do Órgão ${title}: ${formattedOrganBudget}`);
                }
              }}
              className="w-full flex items-center justify-center gap-3 bg-[#b91c1c] text-white px-6 py-3 rounded-2xl font-black tracking-wider hover:bg-red-800 active:scale-95 touch-manipulation transition-all shadow-md border border-red-600/30 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <DollarSign size={18} className="text-white" />
              </div>
              <div className="text-left leading-tight">
                <span className="text-[9px] uppercase tracking-widest block font-bold text-white/80">
                  TETO DO ÓRGÃO ({title.toUpperCase()})
                </span>
                <span className="text-base sm:text-lg font-black text-white">
                  {formattedOrganBudget}
                </span>
              </div>
            </button>

            {/* Bottom Row: Relatório Anual & Plano Setorial */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() =>
                  onRelatorioAnual
                    ? onRelatorioAnual()
                    : onShowAlert("Relatório Anual")
                }
                className="flex-1 flex items-center justify-center gap-2 bg-[#1e3a8a] text-white px-4 py-3 rounded-2xl font-black text-xs tracking-wider hover:bg-blue-900 active:scale-95 touch-manipulation transition-all shadow-md cursor-pointer"
              >
                <FileText size={18} />
                <span>Relatório Anual</span>
              </button>

              <button
                onClick={() =>
                  onPlanoSetorial
                    ? onPlanoSetorial()
                    : onShowAlert("Plano Setorial")
                }
                className="flex-1 flex items-center justify-center gap-2 bg-purple-700 text-white px-4 py-3 rounded-2xl font-black text-xs tracking-wider hover:bg-purple-800 active:scale-95 touch-manipulation transition-all shadow-md cursor-pointer"
              >
                <LayoutGrid size={18} />
                <span>Plano Setorial ({organActivitiesCount} Atividades)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Grid Items - Adaptable layout centering items properly based on count */}
        <div className={`grid gap-4 sm:gap-6 w-full mx-auto ${gridClass} ${maxWidthClass}`}>
          {displayItems.map((item, index) => {
            const label = getSubBlockLabel(title, item.title);
            return (
              <button
                key={index}
                onClick={async () => {
                  if (!isAllowed(item)) {
                    onShowAlert("Área não acessível ao seu perfil.");
                    try {
                      const { firestoreService } =
                        await import("../../lib/firestoreService");
                      await firestoreService.accessAlerts.add({
                        userName: user?.name || user?.email || "Desconhecido",
                        userEmail: user?.email || "",
                        userRole: user?.role || "",
                        userNuit: user?.nuit || "",
                        targetSector: item.title,
                        timestamp: new Date().toISOString(),
                      });
                    } catch (e) {}
                    return;
                  }
                  if (item.title === "Registos de Visitantes") {
                    setShowLibraryVisitForm(true);
                  } else if (item.title === "Registo de Obras e Livros") {
                    setShowBookRegistrationForm(true);
                  } else if (item.title === "Repartição de Arquivo") {
                    setShowArchiveView(true);
                  } else if (item.subItems && item.subItems.length > 0) {
                    onNavigate?.(item.title, item.subItems);
                  } else {
                    onNavigate?.(item.title, []);
                  }
                }}
                className={`${isServicosCentrais ? 'bg-[#5842ff] min-h-[220px] p-8 rounded-3xl flex flex-col items-center justify-between text-center shadow-xl hover:scale-[1.02] transition-all cursor-pointer text-white relative' : `${colors[index % colors.length]} w-full text-white p-5 rounded-2xl flex flex-col items-center justify-between gap-4 min-h-[160px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] touch-manipulation transition-all duration-200 cursor-pointer text-center relative ${!isAllowed(item) ? "opacity-50 grayscale cursor-not-allowed" : ""}`}`}
              >
                <div className="flex-1 flex flex-col items-center justify-center w-full mt-5">
                  <span
                    className={`font-black font-serif tracking-tight leading-snug uppercase ${isServicosCentrais ? 'text-white text-sm sm:text-base' : 'text-xs sm:text-sm lg:text-base'}`}
                  >
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center justify-center opacity-90 shrink-0 mt-2">
                  {isServicosCentrais ? (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black">
                      <ChevronRight size={22} />
                    </div>
                  ) : item.subItems && item.subItems.length > 0 ? (
                    <ChevronRight
                      size={18}
                      className="sm:w-5 sm:h-5 lg:w-6 lg:h-6"
                    />
                  ) : (
                    <span
                      className="font-bold bg-white/20 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider"
                    >
                      Aceder
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
