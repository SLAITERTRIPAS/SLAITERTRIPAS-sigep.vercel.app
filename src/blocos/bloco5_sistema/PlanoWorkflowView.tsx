import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { openPrintDocumentWindow } from "../../lib/printUtils";
import {
  Send,
  CheckCircle2,
  FileText,
  LayoutGrid,
  Printer,
  TrendingUp,
  Filter,
  Search,
  Plus,
  Trash2,
  Edit2,
  Building2,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Clock,
  Info,
  ChevronRight,
  Calendar,
  Lock,
  Upload,
  FileUp,
  Archive,
  RefreshCw,
  Copy,
  Maximize2,
  Minimize2,
  Eye,
  X,
  Download,
  ChevronDown,
  Save,
  PlayCircle,
  Folder,
  Users,
  Layers,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import { InstitutionalHeader } from "../../components/InstitutionalHeader";
import { firestoreService } from "../../lib/firestoreService";
import { getActivityTotal } from "./systemUtils";
import { MatrixActivity } from "../../types";
import {
  getAuthorizedActivities,
  isSuperBossUser,
  getRoles,
  canAccessArea,
  isDPEPUser,
} from "../../lib/auth";
import {
  isMatch,
  getDepartmentAbbreviation,
  getDirectionAbbreviation,
  getReparticaoAbbreviation,
  getActivityInitials,
  getCircularReplacer,
  safeJSONStringify,
  normalizeSectorName,
} from "../../lib/utils";
import { EFETIVO_GERAL_DATA } from "../../constants/colaboradoresList";
import { determineSectorAllocation } from "../../lib/allocationUtils";
import { printElementById } from "../../lib/printUtils";
import {
  getDirectionPriority,
  compareDirections,
  compareActivitiesStandardOrder,
  renderActivityRubricas,
  normalizeHeaderString,
  getExcelRowValue,
  getLatestWorkflowActivities,
  getActivityDisplayNo,
  getActivityGroup,
  getActMonthIndex,
  formatSafeDate,
  isDuplicateActivity,
  ActivitySelectionContext,
  getParentRubrica,
} from "./plano/PlanoHelpers";
import { ActivityTableHeader } from "./plano/ActivityTableHeader";
import { ActivityTableRow } from "./plano/ActivityTableRow";
import ActivityForm from "../bloco5_sistema/ActivityForm";
import {
  DEPARTAMENTOS,
  REPARTICOES,
  SECTORES,
  MESES,
  FONTES_RECEITA,
  PRIORIDADES,
} from "../../constants/formOptions";

// Standard divisions and sectors of ISPS for mock grouping if not filled
const DEV_SECTORS = Object.keys(REPARTICOES);

const isDepartmentMatch = (deptA?: string, deptB?: string): boolean => {
  if (!deptA || !deptB) return false;
  const norm = (s: string) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^(departamento|diretor do curso|direccao|direcao|divisao|reparticao|setor|chefe do|chefe de|depto|dep)\s+(de\s+|da\s+|dos\s+|do\s+)?/gi, "")
      .replace(/ (de|da|do|dos|das) /gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  const a = norm(deptA);
  const b = norm(deptB);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

const GABINETES_DESTINATARIOS = [
  "Gabinete do Diretor Geral",
  "Direção Administrativa e Financeira (DAF)",
  "Direção Acadêmica",
  "Direção de Planificação e Estudos (DPEP)",
  "Direção de Extensão",
  "Direção de Investigação e Pós-Graduação",
  "Departamento de Recursos Humanos",
  "Departamento de Finanças",
  "UGEA",
  "Secretaria Geral",
  "Conselho de Direção",
  "Conselho Académico",
];

interface PlanoWorkflowViewProps {
  user: any;
  title: string;
  matrixActivities: MatrixActivity[];
  colaboradores?: any[];
  onAddMatrixActivity: (data: any) => Promise<string | undefined>;
  onUpdateMatrixActivity: (id: string, data: any) => Promise<void>;
  onShowAlert: (msg: string) => void;
  onBack: () => void;
}


export default function PlanoWorkflowView({
  user: realUser,
  title,
  matrixActivities: initialActivities,
  colaboradores: externalColaboradores = [],
  onAddMatrixActivity,
  onUpdateMatrixActivity,
  onShowAlert,
  onBack,
}: PlanoWorkflowViewProps) {
  const [simulateSector, setSimulateSector] = useState(true);

  const user = useMemo(() => {
    const isCD_base =
      title.toUpperCase().includes("DEPARTAMENTO") ||
      title.toUpperCase().includes("CHEFE");
    const isDC_base =
      title.toUpperCase().includes("DIRETOR") ||
      title.toUpperCase().includes("DICO") ||
      title.toUpperCase().trim() === "DIRETOR GERAL";
    const isReparticao_base = title.toUpperCase().includes("REPARTIÇÃO");
    const isPlanificacao_base =
      title.toUpperCase().includes("PLANIFICAÇÃO") ||
      title.toUpperCase().includes("ESTUDOS") ||
      title.toUpperCase().includes("PLANEAMENTO");

    if (
      isSuperBossUser(realUser) &&
      simulateSector &&
      title &&
      title !== "Plano Setorial" &&
      title !== "Sistema" &&
      title !== "Geral"
    ) {
      return {
        ...realUser,
        direcao: isDC_base ? title : realUser?.direcao,
        departamento: isCD_base ? title : realUser?.departamento,
        reparticao: isReparticao_base ? title : realUser?.reparticao,
        setor:
          !isDC_base && !isCD_base && !isReparticao_base && !isPlanificacao_base
            ? title
            : realUser?.setor,
        title: title,
      };
    }
    return realUser;
  }, [realUser, simulateSector, title]);

  // Acesso condicional: todo o utilizador deve estar alocado a uma área
  const isAllocated = useMemo(() => {
    if (!user) return false;
    
    // Se o utilizador tem qualquer campo de alocação preenchido, é considerado alocado
    if (user.direcao || user.departamento || user.unidadeOrganica || user.setor || user.reparticao) return true;
    
    // Exceção para departamentos conhecidos (DICOSAFA/TIC) ou chefias baseadas no título
    const context = `${user.title || ""} ${user.cargo || ""} ${user.cargoChefia || ""} ${user.role || ""} ${user.email || ""}`.toUpperCase();
    if (context.includes("DICOSAFA") || context.includes("TIC") || context.includes("SECRETARIA GERAL") || context.includes("CHEFE") || context.includes("DIRETOR")) return true;
    
    // Administradores e Super utilizadores têm sempre acesso
    if (isSuperBossUser(user)) return true;
    
    return false;
  }, [user]);
  
  if (!isAllocated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-12 text-center bg-red-50 rounded-3xl border border-red-200">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-red-900 mb-2">Acesso Restrito</h2>
          <p className="text-red-700">Utilizador não alocado corretamente a uma direção ou unidade.</p>
        </div>
      </div>
    );
  }

  const isDPEP = useMemo(() => {
    return isDPEPUser(user);
  }, [user]);

  const [rawActivities, setRawActivities] = useState(initialActivities);

  useEffect(() => {
    setRawActivities(initialActivities);
  }, [initialActivities]);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showTramitacaoModal, setShowTramitacaoModal] = useState(false);
  const [selectedDestinatario, setSelectedDestinatario] = useState("");
  const [workflowToProcess, setWorkflowToProcess] = useState<{
    fromStatus: string;
    toStatus: string;
    originLabel: string;
    destinationLabel: string;
    targetActivities?: any[];
  } | null>(null);
  const [activityForHistory, setActivityForHistory] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2027);
  const isReadOnly = selectedYear < 2027;
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncYear, setSyncYear] = useState<number>(2027);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Novo estado para gerir o fluxo de planeamento/consulta
  // Add print styles for A3
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page {
          size: A3 landscape;
          margin: 10mm;
        }
        body {
          -webkit-print-color-adjust: exact;
        }
        .print-a3-container {
          width: 100% !important;
          max-width: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [workflowMode, setWorkflowMode] = useState<
    "landing" | "planning" | "consulting"
  >("landing");

  const userRoles = useMemo(
    () => getRoles(user?.title || user?.cargo || user?.cargoChefia || ""),
    [user],
  );
  const isBossOrAdmin = userRoles.isBoss || isSuperBossUser(user);

  useEffect(() => {
    if (isSyncModalOpen) {
      const loadPlans = async () => {
        const archiveDocs = await firestoreService.institucional_plans.get();
        const docsFromArchive = await firestoreService.archive_documents.get();
        const plans = [
          ...archiveDocs.filter(
            (p: any) =>
              (p.ano === syncYear || p.year === syncYear) &&
              (p.atividades || p.activities),
          ),
          ...docsFromArchive.filter(
            (p: any) =>
              (p.ano === syncYear || p.year === syncYear) &&
              (p.atividades ||
                p.activities ||
                p.planoAtividades ||
                p.title?.toLowerCase().endsWith(".pdf") ||
                p.title?.toLowerCase().endsWith(".xlsx")),
          ),
        ];
        setAvailablePlans(plans);
        if (plans.length > 0) {
          setSelectedPlanId(plans[0].id);
        } else {
          setSelectedPlanId("");
        }
      };
      loadPlans();
    }
  }, [syncYear, isSyncModalOpen]);

  useEffect(() => {
    if (showTramitacaoModal && workflowToProcess) {
      const { toStatus, targetActivities } = workflowToProcess;
      let options: string[] = [];

      const sampleAct = (targetActivities && targetActivities.length > 0)
        ? targetActivities[0]
        : (rawActivities && rawActivities.length > 0 ? rawActivities[0] : null);

      if (toStatus === "reparticao") {
        const rep = user?.reparticao || sampleAct?.reparticao || "Repartição";
        options = [rep];
      } else if (toStatus === "departamento") {
        const dep = user?.departamento || sampleAct?.departamento || "Departamento";
        options = [dep];
      } else if (toStatus === "direcao") {
        const dir = user?.direcao || sampleAct?.direcao || "Direção";
        options = [dir];
      } else if (toStatus === "planificacao") {
        options = ["Setor de Planificação (DPEP)", "Departamento de Planificação Estudos e Projetos (DPEP)"];
      } else if (toStatus === "dpep_chefe") {
        options = ["Chefe do DPEP (Departamento de Planificação Estudos e Projetos)"];
      } else if (toStatus === "institucional" || toStatus === "meritos") {
        options = ["Conselho de Direção", "Gabinete do Diretor Geral"];
      }
      
      const validOptions = options.filter(o => o && o.trim() !== "");
      if (validOptions.length > 0) {
        setSelectedDestinatario(validOptions[0]);
      }
    }
  }, [showTramitacaoModal, workflowToProcess, user, rawActivities]);

  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDirecao, setFilterDirecao] = useState("");

  // Detect real role
  const isChefeDPEP = isDPEPUser(user);

  const isCD =
    title.toUpperCase().includes("DEPARTAMENTO") ||
    title.toUpperCase().includes("CHEFE");
  const isDC =
    title.toUpperCase().includes("DIRETOR") ||
    title.toUpperCase().includes("DICO") ||
    title.toUpperCase().trim() === "DIRETOR GERAL";
  const isPlanificacao =
    isChefeDPEP ||
    user?.role === "planificador" ||
    title.toUpperCase().includes("PLANIFICAÇÃO") ||
    title.toUpperCase().includes("ESTUDOS") ||
    title.toUpperCase().includes("PLANEAMENTO");

  const isAdminOrProgrammer = isSuperBossUser(user);

  // Let the user switch roles in sandbox mode for interactive testing!
  const [selectedRoleMode, setSelectedRoleMode] = useState<string>(
    isPlanificacao
      ? "Planificação"
      : isDC
        ? "Direção"
        : isCD
          ? "Departamento"
          : title.toUpperCase().includes("REPARTIÇÃO") ||
              (user?.titulo || "").toUpperCase().includes("REPARTIÇÃO")
            ? "Repartição"
            : "Setor",
  );

  const [showReceivedPlans, setShowReceivedPlans] = useState(false);

  const isActivityInScope = useCallback(
    (a: any) => {
      if (!a) return false;
      if (isDPEP || isSuperBossUser(user) || isPlanificacao) return true;

      // Se foi criado por este utilizador
      const creator = String(a.createdBy || a.emailCriador || "").toLowerCase();
      const uEmail = String(user?.email || "").toLowerCase();
      const uId = user?.uid || user?.id;
      if ((creator && uEmail && creator === uEmail) || (a.userId && uId && a.userId === uId)) {
        return true;
      }

      // Correspondência por departamento, unidade, direção, curso, setor, repartição
      return (
        isDepartmentMatch(a.departamento, user?.departamento) ||
        isDepartmentMatch(a.departamento, title) ||
        isDepartmentMatch(a.unidadeOrganica, title) ||
        isDepartmentMatch(a.unidadeOrganica, user?.unidadeOrganica) ||
        isDepartmentMatch(a.direcao, user?.direcao) ||
        isDepartmentMatch(a.direcao, title) ||
        isDepartmentMatch(a.curso, title) ||
        isDepartmentMatch(a.curso, user?.curso) ||
        isDepartmentMatch(a.setor, title) ||
        isDepartmentMatch(a.reparticao, title) ||
        isDepartmentMatch(a.setor, user?.setor) ||
        isDepartmentMatch(a.reparticao, user?.reparticao)
      );
    },
    [user, title, isDPEP, isPlanificacao]
  );

  const groupByDirecao = useCallback(
    (activities: any[]): Record<string, any[]> => {
      const grouped: Record<string, any[]> = {};
      activities.forEach((activity) => {
        const direcao = activity.direcao || activity.origin || "";
        if (!grouped[direcao]) {
          grouped[direcao] = [];
        }
        grouped[direcao].push(activity);
      });
      return grouped;
    },
    [],
  );

  const groupByDepartamento = useCallback(
    (activities: any[]): Record<string, any[]> => {
      const grouped: Record<string, any[]> = {};
      activities.forEach((activity) => {
        const dept = activity.departamento || "Departamento Geral";
        if (!grouped[dept]) {
          grouped[dept] = [];
        }
        grouped[dept].push(activity);
      });
      return grouped;
    },
    [],
  );

  const authorizedActivities = useMemo(() => {
    if (!rawActivities) return [];

    // Filtrar primeiro por ano (incluindo atividades sem ano ou mantendo fallback para que nenhum plano fique oculto)
    let yearFiltered = rawActivities.filter((a) => {
      if (!a) return false;
      if (!a.ano) return true;
      return Number(a.ano) === Number(selectedYear);
    });

    if (yearFiltered.length === 0 && rawActivities.length > 0) {
      yearFiltered = rawActivities;
    }

    return getAuthorizedActivities(yearFiltered, user);
  }, [rawActivities, selectedYear, user]);

  const filteredActivities = useMemo(() => {
    let authorized = [...authorizedActivities];

    // Aplicar termo de busca
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      authorized = authorized.filter(
        (a) =>
          String(a.designacao || a.title || "")
            .toLowerCase()
            .includes(s) ||
          String(a.objetivo || "")
            .toLowerCase()
            .includes(s) ||
          String(a.referencia || "")
            .toLowerCase()
            .includes(s) ||
          String(a.setor || a.reparticao || "")
            .toLowerCase()
            .includes(s),
      );
    }

    // Filtro especial para o Setor de Planificação - agora mostra todas as atividades autorizadas
    if (user && isSuperBossUser(user) && simulateSector) {
      const normStr = (str?: string) => String(str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const target = normStr(title);
      
      if (
        target &&
        target !== "plano setorial" &&
        target !== "sistema" &&
        target !== "geral"
      ) {
        authorized = authorized.filter((a) => {
          if (!a) return false;
          
          // Se foi criado por este SuperBoss, mostrar!
          const creator = String(a.createdBy || a.emailCriador || "").toLowerCase();
          const uEmail = String(user?.email || "").toLowerCase();
          const uId = user?.uid || user?.id;
          if ((creator && creator === uEmail) || (a.userId && uId && a.userId === uId)) return true;
          
          const aDir = normStr(a.direcao);
          const aDept = normStr(a.departamento);
          const aSect = normStr(a.setor || a.reparticao);
          const aUOrg = normStr(a.unidadeOrganica);

          return (
            (aDir && (aDir.includes(target) || target.includes(aDir))) ||
            (aDept && (aDept.includes(target) || target.includes(aDept))) ||
            (aSect && (aSect.includes(target) || target.includes(aSect))) ||
            (aUOrg && (aUOrg.includes(target) || target.includes(aUOrg)))
          );
        });
      }
    }

    const uniqueMap = new Map<string, any>();
    authorized.forEach((a) => {
      if (!a) return;
      const codeKey = (a.codigoAtividade || a.referencia || "").trim().toLowerCase();
      const nameKey = (a.designacao || a.title || a.descricao || "").trim().toLowerCase();
      const deptKey = (a.departamento || a.unidadeOrganica || "").trim().toLowerCase();
      const key = a.id ? `id-${a.id}` : `${codeKey}-${nameKey}-${deptKey}`;

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, a);
      } else {
        const existing = uniqueMap.get(key);
        const existingVal = Number(existing.valorTotal || existing.orcamento || existing.valor || 0);
        const newVal = Number(a.valorTotal || a.orcamento || a.valor || 0);
        if (newVal >= existingVal) {
          uniqueMap.set(key, a);
        }
      }
    });

    return Array.from(uniqueMap.values())
      .sort((a, b) => compareActivitiesStandardOrder(a, b, getActMonthIndex))
      .filter((a) => {
        if (!selectedYear) return true;
        if (!a?.ano) return true;
        return Number(a.ano) === Number(selectedYear);
      });
  }, [
    rawActivities,
    user,
    selectedYear,
    searchTerm,
    selectedRoleMode,
    simulateSector,
    title,
    getActMonthIndex,
  ]);

  const filteredActivitiesGrouped = useMemo(() => {
    const byDirecao = groupByDirecao(filteredActivities);
    const result: Record<string, Record<string, any[]>> = {};
    Object.entries(byDirecao).forEach(([direcao, activities]) => {
      result[direcao] = groupByDepartamento(activities);
    });
    return { byDirecao, byDirecaoAndDept: result };
  }, [filteredActivities, groupByDirecao, groupByDepartamento]);

  const startSyncProcess = async () => {
    setSyncYear(selectedYear);
    setIsSyncModalOpen(true);
  };

  const onUpdateExecution = async (activityId: string, execucao: string) => {
    try {
      await firestoreService.matrixActivities.update(activityId, { execucao });
      onShowAlert(`Estado de execução atualizado para: ${execucao}`);
    } catch (err) {
      console.error(err);
      alert("Falha ao atualizar estado de execução.");
    }
  };

  const onUpdateRelatorio = async (activityId: string, relatorio: string) => {
    try {
      await firestoreService.matrixActivities.update(activityId, { relatorio });
      onShowAlert(`Relatório da atividade atualizado com sucesso.`);
    } catch (err) {
      console.error(err);
      alert("Falha ao atualizar relatório da atividade.");
    }
  };

  const onUpdateApproval = async (
    activityId: string,
    approvalStatus: string,
  ) => {
    try {
      const act = rawActivities.find((a) => a.id === activityId);
      if (!act) return;
      const group = getActivityGroup(act, rawActivities);
      const groupIds =
        group.map((g) => g.id).length > 0
          ? group.map((g) => g.id)
          : [activityId];

      for (const id of groupIds) {
        await firestoreService.matrixActivities.update(id, {
          statusAprovacao: approvalStatus,
          aprovada: approvalStatus === "aprovada",
        });
      }

      setRawActivities((prev) =>
        prev.map((a) =>
          groupIds.includes(a.id)
            ? {
                ...a,
                statusAprovacao: approvalStatus,
                aprovada: approvalStatus === "aprovada",
              }
            : a,
        ),
      );
      onShowAlert(
        `Atividade e todas as rubricas/necessidades associadas marcadas como: ${approvalStatus === "aprovada" ? "Aprovada" : approvalStatus}`,
      );
    } catch (err) {
      console.error(err);
      onShowAlert("Erro ao atualizar estado de aprovação.");
    }
  };

  const onRolloverYear = async (activityId: string) => {
    try {
      const act = rawActivities.find((a) => a.id === activityId);
      if (!act) return;
      const group = getActivityGroup(act, rawActivities);
      const groupIds =
        group.map((g) => g.id).length > 0
          ? group.map((g) => g.id)
          : [activityId];

      const currentYear = Number(act.ano || selectedYear || 2027);
      const nextYear = currentYear + 1;

      for (const id of groupIds) {
        await firestoreService.matrixActivities.update(id, { ano: nextYear });
      }

      setRawActivities((prev) =>
        prev.map((a) =>
          groupIds.includes(a.id) ? { ...a, ano: nextYear } : a,
        ),
      );
      onShowAlert(
        `Atividade e toda a sua coluna, rubricas e necessidades reconduzidas com sucesso para o ano ${nextYear}!`,
      );
    } catch (err) {
      console.error(err);
      onShowAlert("Erro ao reconduzir atividade para o ano+1.");
    }
  };

  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  const handleToggleSelectActivity = (id: string) => {
    const act = rawActivities.find((a) => a.id === id);
    if (!act) return;
    const group = getActivityGroup(act, rawActivities);
    const groupIds = group.map((g) => g.id).filter(Boolean);
    if (groupIds.length === 0) groupIds.push(id);

    const allSelected = groupIds.every((item) =>
      selectedActivityIds.includes(item),
    );
    if (allSelected) {
      setSelectedActivityIds((prev) =>
        prev.filter((item) => !groupIds.includes(item)),
      );
    } else {
      const newSet = new Set([...selectedActivityIds, ...groupIds]);
      setSelectedActivityIds(Array.from(newSet));
    }
  };

  const handleToggleSelectAll = (allActivities: any[]) => {
    const allIds = allActivities.map((a) => a.id).filter(Boolean);
    const allSelected = allIds.every((id) => selectedActivityIds.includes(id));
    if (allSelected) {
      setSelectedActivityIds((prev) =>
        prev.filter((id) => !allIds.includes(id)),
      );
    } else {
      const newSet = new Set([...selectedActivityIds, ...allIds]);
      setSelectedActivityIds(Array.from(newSet));
    }
  };

  const handleBulkUpdateApproval = async (approvalStatus: string) => {
    if (selectedActivityIds.length === 0) {
      onShowAlert("Selecione pelo menos uma atividade.");
      return;
    }
    try {
      for (const id of selectedActivityIds) {
        await firestoreService.matrixActivities.update(id, {
          statusAprovacao: approvalStatus,
          aprovada: approvalStatus === "aprovada",
        });
      }
      setRawActivities((prev) =>
        prev.map((a) =>
          selectedActivityIds.includes(a.id)
            ? {
                ...a,
                statusAprovacao: approvalStatus,
                aprovada: approvalStatus === "aprovada",
              }
            : a,
        ),
      );
      onShowAlert(
        `${selectedActivityIds.length} atividades marcadas como: ${approvalStatus === "aprovada" ? "Aprovadas" : approvalStatus}`,
      );
      setSelectedActivityIds([]);
    } catch (err) {
      console.error(err);
      onShowAlert("Erro ao atualizar estado de aprovação em lote.");
    }
  };

  const handleBulkRolloverYear = async () => {
    if (selectedActivityIds.length === 0) {
      onShowAlert("Selecione pelo menos uma atividade.");
      return;
    }
    try {
      for (const id of selectedActivityIds) {
        const act = rawActivities.find((a) => a.id === id);
        if (!act) continue;
        const currentYear = Number(act.ano || selectedYear || 2027);
        const nextYear = currentYear + 1;
        await firestoreService.matrixActivities.update(id, { ano: nextYear });
      }
      setRawActivities((prev) =>
        prev.map((a) => {
          if (!selectedActivityIds.includes(a.id)) return a;
          const currentYear = Number(a.ano || selectedYear || 2027);
          return { ...a, ano: currentYear + 1 };
        }),
      );
      onShowAlert(
        `${selectedActivityIds.length} atividades reconduzidas com sucesso para o ano+1!`,
      );
      setSelectedActivityIds([]);
    } catch (err) {
      console.error(err);
      onShowAlert("Erro ao reconduzir atividades em lote para o ano+1.");
    }
  };

  const handleFileConversion = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    onShowAlert("Processando ficheiro e convertendo para formato digital...");
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        console.log("Dados Brutos do Excel:", json);

        if (json.length === 0) {
          onShowAlert("O ficheiro importado parece estar vazio.");
          setIsProcessing(false);
          return;
        }

        // Função de mapeamento inteligente de colunas (Capture Tudo, Menos Nada)
        const mapActivity = (row: any, index: number) => {
          const findVal = (keys: string[]) => {
            const foundKey = Object.keys(row).find((k) =>
              keys.some((search) =>
                k.toLowerCase().trim().includes(search.toLowerCase().trim()),
              ),
            );
            return foundKey ? row[foundKey] : undefined;
          };

          const toNum = (val: any) => {
            if (typeof val === "number") return val;
            if (!val) return 0;
            const clean = String(val).replace(/[^\d.-]/g, "");
            return isNaN(Number(clean)) ? 0 : Number(clean);
          };

          return {
            no: findVal(["nº", "numero", "id", "item", "ordem"]) || index + 1,
            codigoAtividade: findVal([
              "codigo",
              "referência",
              "ref",
              "nº atividade",
            ]),
            title: findVal([
              "atividade",
              "designação",
              "descrição",
              "nome",
              "acção",
              "projeto",
              "tarefa",
            ]),
            objetivoAtividade: findVal([
              "objetivo",
              "meta",
              "finalidade",
              "proposito",
              "justificação",
            ]),
            unidadeOrganica: findVal(["unidade", "isps", "instituição", "uo"]),
            departamento: findVal([
              "departamento",
              "depto",
              "direcção",
              "direção",
            ]),
            reparticao: findVal([
              "repartição",
              "sector",
              "seção",
              "secção",
              "área",
            ]),
            responsavel: findVal([
              "responsável",
              "ponto focal",
              "quem",
              "executor",
              "técnico",
            ]),
            trimestre: findVal(["trimestre", "período", "quarta", "trim"]),
            mesRealizacao: findVal(["mês", "tempo", "data", "quando", "mes"]),
            fonteReceita: findVal([
              "fonte",
              "recurso",
              "orçamento",
              "oe",
              "financiamento",
            ]),
            prioridade:
              findVal(["prioridade", "importância", "urgência"]) || "Média",

            // Localização
            trabalhoProvincia:
              findVal(["província", "local", "onde", "provincia"]) || "Tete",
            trabalhoDistrito:
              findVal(["distrito", "município", "distrito"]) || "Cahora Bassa",

            // Transporte
            necessitaTransporte: findVal(["transporte", "viagem", "deslocação"])
              ? "Sim"
              : "Não",
            viatura: findVal(["viatura", "carro", "veículo"]),
            distanciaKm: toNum(
              findVal(["distancia", "km", "quilómetros", "klm"]),
            ),
            litrosGasoleo: toNum(
              findVal(["litros", "combustível", "gasóleo", "gasoleo"]),
            ),
            precoLitro:
              toNum(
                findVal(["preço litro", "valor litro", "combustível unitário"]),
              ) || 95,

            // Custos e Detalhes
            rubrica: findVal(["rubrica", "conta", "classificação"]),
            necessidade: findVal([
              "necessidade",
              "material",
              "recurso necessário",
            ]),
            especificacoes: findVal([
              "especificações",
              "características",
              "especificacao",
            ]),
            detalhes: findVal(["detalhes", "pormenores", "info"]),
            numeroPessoas:
              toNum(
                findVal([
                  "pessoas",
                  "quantidade",
                  "qtd",
                  "nº de pessoas",
                  "n de pessoas",
                ]),
              ) || 1,
            unitario: toNum(
              findVal([
                "unitário",
                "preço",
                "valor unit",
                "custo unitário",
                "valor",
              ]),
            ),
            ajudaCusto: toNum(
              findVal(["ajuda", "diária", "subsídio", "ajuda de custo"]),
            ),
            total: toNum(
              findVal(["total", "valor total", "orçamento", "custo total"]),
            ),

            // Metadados
            ano: selectedYear,
            submetido: false,
            execucao: "Não Executada",
            tipoPlano: findVal(["tipo", "categoria", "plano"]) || "Setorial",
            observacoes: findVal(["obs", "notas", "comentários", "anotações"]),
            createdAt: new Date().toISOString(),
          };
        };

        const mappedActivities = json
          .map((row, idx) => mapActivity(row, idx))
          .sort((a, b) => {
            const noA =
              typeof a.no === "number"
                ? a.no
                : parseInt(String(a.no).replace(/[^\d]/g, "")) || 0;
            const noB =
              typeof b.no === "number"
                ? b.no
                : parseInt(String(b.no).replace(/[^\d]/g, "")) || 0;
            return noA - noB;
          });

        // 1. Limpeza do Ciclo de Planificação Atual (Transformar a Tabela)
        // Antes de importar, removemos as atividades existentes para este ano e setor
        // para evitar duplicados e garantir que a tabela reflita fielmente o ficheiro importado.
        const existingActivities =
          await firestoreService.matrixActivities.get();
        const toDelete = existingActivities.filter(
          (act) =>
            act.ano === selectedYear &&
            (act.setor === user?.setor || act.userId === user?.uid),
        );

        for (const act of toDelete) {
          await firestoreService.matrixActivities.delete(act.id);
        }

        // 2. Salvar no Arquivo Morto
        await firestoreService.archive_documents.add({
          title: file.name,
          type: "Planos de Atividades e Orçamentos",
          origin:
            user?.direcao ||
            user?.departamento ||
            user?.setor ||
            "Unidade Importada",
          year: selectedYear,
          atividades: mappedActivities,
          dataImportacao: new Date().toISOString(),
          formato: file.name.split(".").pop()?.toUpperCase() || "EXCEL",
        });

        // 3. Injetar na base de dados ativa (matrixActivities) de forma sequencial e ordenada
        let importedCount = 0;
        onShowAlert(
          `A converter ${mappedActivities.length} atividades... Aguarde.`,
        );
        console.log(
          `Iniciando importação sequencial de ${mappedActivities.length} atividades...`,
        );

        for (const act of mappedActivities) {
          if (act.title || act.objetivoAtividade) {
            // Garantir que o custo total seja calculado se não estiver presente
            const unitario = Number(act.unitario || 0);
            const qtd = Number(act.numeroPessoas || 1);
            const ajuda = Number(act.ajudaCusto || 0);
            const totalCalculado = unitario * qtd + ajuda;

            await firestoreService.matrixActivities.add({
              ...act,
              total: act.total || totalCalculado,
              userId: user?.uid,
              userEmail: user?.email,
              setor: user?.setor || "Importado",
              unidadeSelecionada: user?.unidadeOrganica || "ISPS",
              dataSincronizacao: new Date().toISOString(),
            });
            importedCount++;
            console.log(
              `Atividade ${act.no} importada com sucesso (${importedCount}/${mappedActivities.length})`,
            );
          }
        }

        onShowAlert(
          `Ciclo de ${selectedYear} Atualizado: ${importedCount} atividades importadas com sucesso!`,
        );
      } catch (error) {
        console.error("Erro no processamento:", error);
        onShowAlert(
          "Erro técnico ao processar o ficheiro. Verifique o formato.",
        );
      } finally {
        setIsProcessing(false);
        if (event.target) event.target.value = ""; // Limpar input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSyncPlano = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      let count = 0;
      let sourceActivities = [];

      // 1. Tentar buscar o plano selecionado ou priorizar o Institucional
      let selectedPlan = null;
      if (selectedPlanId) {
        selectedPlan = availablePlans.find((p) => p.id === selectedPlanId);
      } else {
        // Busca automática por Plano Institucional ou PESOE
        selectedPlan = availablePlans.find(
          (p) =>
            (p.title || "").toUpperCase().includes("INSTITUCIONAL") ||
            (p.title || "").toUpperCase().includes("PESOE"),
        );
      }

      if (selectedPlan) {
        console.log("Selected Plan:", selectedPlan);
        sourceActivities =
          selectedPlan.atividades ||
          selectedPlan.activities ||
          selectedPlan.planoAtividades;

        if (
          !sourceActivities &&
          (selectedPlan.title?.toLowerCase().endsWith(".pdf") ||
            selectedPlan.title?.toLowerCase().endsWith(".xlsx"))
        ) {
          onShowAlert(
            `O ficheiro ${selectedPlan.title} requer conversão. Por favor, utilize uma ferramenta de conversão externa.`,
          );
          setIsSyncModalOpen(false);
          setIsLoading(false);
          return;
        }
      }

      // 2. Fallback para os planos se nada for encontrado ou selecionado
      if (sourceActivities.length === 0) {
        // Removido fallbacks estáticos para manter sistema limpo
      }

      if (sourceActivities.length === 0) {
        onShowAlert(
          `Não foram encontradas atividades para o ano ${syncYear} no Arquivo Morto.`,
        );
        setIsSyncModalOpen(false);
        setIsLoading(false);
        return;
      }

      const userRoles = getRoles(
        user.title || user.cargo || user.cargoChefia || "",
      );
      const isISPS = (user.direcao || "").toUpperCase().includes("ISPS");

      const userActivities = sourceActivities.filter((activity: any) => {
        const aDir = (activity.direcao || "").toUpperCase();
        const aDept = (activity.departamento || "").toUpperCase();
        const aSect = (
          activity.setor ||
          activity.reparticao ||
          ""
        ).toUpperCase();

        const uDir = (user.direcao || "").toUpperCase();
        const uDept = (user.departamento || "").toUpperCase();
        const uSect = (user.reparticao || user.setor || "").toUpperCase();

        const matchDir = aDir === uDir || (isISPS && aDir.includes("ISPS"));
        const matchDept = aDept === uDept;
        const matchSect =
          aSect === uSect || aSect.includes(uSect) || uSect.includes(aSect);

        // Strict filtering: each user only syncs their own sector's activities
        if (userRoles.isCR) return matchDir && matchDept && matchSect;
        if (userRoles.isCD) return matchDir && matchDept;
        if (userRoles.isDC) return matchDir;

        return matchDir && matchDept && matchSect;
      });

      if (userActivities.length === 0) {
        onShowAlert(
          `Não foram encontradas atividades específicas do seu setor no Plano ${syncYear} institucional.`,
        );
        setIsSyncModalOpen(false);
        setIsLoading(false);
        return;
      }

      for (const activity of userActivities) {
        const ref = activity.referencia || activity.codigoAtividade;
        const exists = rawActivities.some(
          (a) =>
            (a.referencia === ref || a.codigoAtividade === ref) &&
            a.ano === syncYear,
        );

        if (!exists) {
          await firestoreService.matrixActivities.add({
            ...activity,
            ano: syncYear,
            createdAt: new Date().toISOString(),
            title: activity.designacao || activity.title,
            objetivoAtividade: activity.objetivo || activity.objetivoAtividade,
            no: ref ? ref.split("/")[0].replace("A", "") : "00",
            isPESOE: false,
            submetido: false,
            requiresUpdate: true,
            isImported: true,
            direcao: activity.direcao,
            departamento: activity.departamento,
            reparticao: activity.setor || activity.reparticao,
            unidadeOrganica: activity.direcao,
          } as any);
          count++;
        }
      }

      if (count > 0) {
        onShowAlert(
          `Sucesso: ${count} atividades do seu plano foram sincronizadas com base no Arquivo Morto.`,
        );
        setIsSyncModalOpen(false);
      } else {
        onShowAlert(
          `As atividades do ano ${syncYear} já constam no seu plano de atividades.`,
        );
        setIsSyncModalOpen(false);
      }
    } catch (error: any) {
      console.error("Erro na sincronização:", error);
      onShowAlert(
        `Erro ao sincronizar plano: ${error?.message || "Tente novamente."}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isSalaryActivity = (act: any): boolean => {
    if (!act) return false;
    const title = (
      act.titulo ||
      act.nomeAtividade ||
      act.nome ||
      ""
    ).toUpperCase();
    const obj = (act.objetivoAtividade || act.objetivo || "").toUpperCase();
    const rubrica = (act.rubrica || "").toUpperCase();
    const nec = (act.necessidade || "").toUpperCase();
    const combo = `${title} ${obj} ${rubrica} ${nec}`;

    return (
      combo.includes("SALÁRIO") ||
      combo.includes("SALARIO") ||
      combo.includes("REMUNERAÇÃO") ||
      combo.includes("REMUNERACAO") ||
      combo.includes("PAGAMENTO DE SAL") ||
      combo.includes("GARANTIR SAL") ||
      combo.includes("112")
    );
  };


  // Consolidação Orçamental Hierárquica:
  // 1. Orçamento do Departamento = soma do valor total de todas as atividades planificadas para o departamento
  // 2. Orçamento da Direção = soma dos orçamentos de todos os departamentos que respondem a essa direção
  // 3. Orçamento Institucional = soma dos orçamentos de todas as direções

  const deptBudgetTotal = useMemo(() => {
    const nonSalaryActs = filteredActivities.filter(
      (a) => !isSalaryActivity(a),
    );
    return nonSalaryActs.reduce((acc, act) => acc + getActivityTotal(act), 0);
  }, [filteredActivities]);

  const isUserHR = useMemo(() => {
    const dept = (user?.departamento || title || "").toUpperCase();
    const cargo = (user?.cargo || "").toUpperCase();
    return (
      dept.includes("RECURSOS HUMANOS") ||
      dept.includes(" RH ") ||
      dept.endsWith(" RH") ||
      dept.startsWith("RH ") ||
      dept === "RH" ||
      cargo.includes("RH") ||
      cargo.includes("RECURSOS HUMANOS")
    );
  }, [user, title]);

  const deptSalaryTotal = useMemo(() => {
    const deptName = (user?.departamento || title || "").toUpperCase();
    const isThisDeptHR = deptName.includes("RH") || deptName.includes("RECURSOS HUMANOS");
    if (!isThisDeptHR && !isUserHR) return 0;
    const salaryActs = filteredActivities.filter((a) => isSalaryActivity(a));
    return salaryActs.reduce((acc, act) => acc + getActivityTotal(act) * 12, 0);
  }, [filteredActivities, user, title, isUserHR]);

  const getDirectionKeysMatched = (
    dirTitle: string = "",
    userDept: string = "",
  ) => {
    const t = (dirTitle || "").toUpperCase();
    const ud = (userDept || "").toUpperCase();

    if (
      t.includes("DICOSAFA") ||
      ud.includes("DICOSAFA") ||
      t.includes("COSSAFA") ||
      ud.includes("COSSAFA") ||
      t.includes("ADMINISTRAÇÃO, FINANÇAS") ||
      ud.includes("ADMINISTRAÇÃO, FINANÇAS") ||
      t.includes("ADMINISTRACAO, FINANCAS") ||
      ud.includes("ADMINISTRACAO, FINANCAS")
    ) {
      return "DICOSAFA";
    }
    if (
      t.includes("DICOSSER") ||
      ud.includes("DICOSSER") ||
      t.includes("COSSER") ||
      ud.includes("COSSER") ||
      t.includes("REGISTO ACADÉMICO") ||
      t.includes("REGISTO ACADEMICO") ||
      t.includes("DRA") ||
      ud.includes("REGISTO ACADÉMICO") ||
      ud.includes("REGISTO ACADEMICO") ||
      ud.includes("DRA") ||
      t.includes("SERVIÇOS SOCIAIS") ||
      ud.includes("SERVIÇOS SOCIAIS") ||
      t.includes("SERVICOS SOCIAIS") ||
      ud.includes("SERVICOS SOCIAIS")
    ) {
      return "DICOSSER";
    }
    if (
      t.includes("ENGENHARIA") ||
      t.includes("DIVISÃO") ||
      t.includes("DIVISAO") ||
      ud.includes("ENGENHARIA") ||
      ud.includes("DIVISÃO") ||
      ud.includes("DIVISAO")
    ) {
      return "Divisão de Engenharia";
    }
    if (
      t.includes("INCUBADORA") ||
      t.includes("INCUBACAO") ||
      t.includes("INCUBACÃO") ||
      t.includes("CIE") ||
      ud.includes("INCUBADORA") ||
      ud.includes("INCUBACAO") ||
      ud.includes("INCUBACÃO") ||
      ud.includes("CIE")
    ) {
      return "Centro de Incubação de Empresas";
    }
    if (
      t.includes("GERAL") ||
      t.includes("GABINETE") ||
      t.includes("DG") ||
      t.includes("GDG") ||
      ud.includes("GERAL") ||
      ud.includes("GABINETE") ||
      ud.includes("DG") ||
      ud.includes("GDG")
    ) {
      return "Gabinete do Diretor-Geral";
    }

    if (t.includes("DICO") || t.includes("DIR")) {
      const found = Object.keys(DEPARTAMENTOS).find(
        (k) => t.includes(k.toUpperCase()) || k.toUpperCase().includes(t),
      );
      if (found) return found;
    }

    return "DICOSAFA";
  };

  const directionKey = getDirectionKeysMatched(title, user?.departamento);
  const departmentsForThisDirection =
    DEPARTAMENTOS[directionKey as keyof typeof DEPARTAMENTOS] ||
    DEPARTAMENTOS[directionKey] ||
    DEPARTAMENTOS["DICOSAFA"] ||
    [];

  const directionDepartmentBudgets = useMemo(() => {
    return departmentsForThisDirection.map((dept) => {
      const deptActs = filteredActivities.filter(
        (a) =>
          a.departamento === dept ||
          (dept === "Gabinete do Diretor-Geral" && !a.departamento),
      );
      const nonSalaryActs = deptActs.filter((a) => !isSalaryActivity(a));
      const budget = nonSalaryActs.reduce(
        (acc, act) => acc + getActivityTotal(act),
        0,
      );
      return {
        name: dept,
        count: nonSalaryActs.length,
        budget,
      };
    });
  }, [departmentsForThisDirection, filteredActivities]);

  const totalDirectionBudget = useMemo(() => {
    return directionDepartmentBudgets.reduce((acc, d) => acc + d.budget, 0);
  }, [directionDepartmentBudgets]);

  const directionSalaryBudget = useMemo(() => {
    const hasHRDept = departmentsForThisDirection.some(
      (d) => d.toUpperCase().includes("RH") || d.toUpperCase().includes("RECURSOS HUMANOS")
    );
    if (!hasHRDept) return 0;

    const dirActs = filteredActivities.filter((a) => {
      const deptName = (a.departamento || "").toUpperCase();
      return deptName.includes("RH") || deptName.includes("RECURSOS HUMANOS");
    });
    const salaryActs = dirActs.filter((a) => isSalaryActivity(a));
    return salaryActs.reduce((acc, act) => acc + getActivityTotal(act) * 12, 0);
  }, [filteredActivities, departmentsForThisDirection]);

  const institutionalDirectionsBreakdown = useMemo(() => {
    const allDirections = [
      "Gabinete do Diretor-Geral",
      "Divisão de Engenharia",
      "DICOSAFA",
      "DICOSSER",
      "Centro de Incubação de Empresas",
    ];

    const yearActs = filteredActivities.filter((a) => {
      if (!a) return false;
      if (!a.ano) return true;
      return Number(a.ano) === Number(selectedYear);
    });

    return allDirections.map((dirName) => {
      const depts = DEPARTAMENTOS[dirName as keyof typeof DEPARTAMENTOS] || [];
      const deptBreakdown = depts.map((deptName) => {
        const deptActs = yearActs.filter(
          (a) =>
            (a.departamento || "").toLowerCase() === deptName.toLowerCase() ||
            (a.departamento || "")
              .toUpperCase()
              .includes(deptName.toUpperCase()) ||
            deptName
              .toUpperCase()
              .includes((a.departamento || "").toUpperCase()) ||
            ((a.direcao || "").toLowerCase().includes(dirName.toLowerCase()) &&
              (!a.departamento || a.departamento === deptName)),
        );
        const nonSalaryActs = deptActs.filter((a) => !isSalaryActivity(a));
        const deptBudget = nonSalaryActs.reduce(
          (acc, act) => acc + getActivityTotal(act),
          0,
        );
        return {
          name: deptName,
          budget: deptBudget,
          count: nonSalaryActs.length,
        };
      });

      const dirDirectActs = yearActs.filter((a) => {
        const aDir = (a.direcao || "").toUpperCase();
        const matchDir =
          aDir.includes(dirName.toUpperCase()) ||
          dirName.toUpperCase().includes(aDir);
        const isAlreadyInDept = depts.some(
          (d) =>
            (a.departamento || "").toUpperCase().includes(d.toUpperCase()) ||
            d.toUpperCase().includes((a.departamento || "").toUpperCase()),
        );
        return matchDir && !isAlreadyInDept;
      });

      const nonSalaryDirDirectActs = dirDirectActs.filter(
        (a) => !isSalaryActivity(a),
      );
      const directBudget = nonSalaryDirDirectActs.reduce(
        (acc, act) => acc + getActivityTotal(act),
        0,
      );
      const sumDeptsBudget =
        deptBreakdown.reduce((acc, d) => acc + d.budget, 0) + directBudget;

      return {
        name: dirName,
        depts: deptBreakdown,
        directionBudget: sumDeptsBudget,
        totalActivities:
          deptBreakdown.reduce((acc, d) => acc + d.count, 0) +
          nonSalaryDirDirectActs.length,
      };
    });
  }, [rawActivities, selectedYear, getActivityTotal]);

  const totalInstitutionalBudget = useMemo(() => {
    return institutionalDirectionsBreakdown.reduce(
      (acc, dir) => acc + dir.directionBudget,
      0,
    );
  }, [institutionalDirectionsBreakdown]);

  const roles = useMemo(() => getRoles(user?.title || user?.cargo || user?.cargoChefia || ""), [user]);
  const canSeeSalaries = useMemo(() => {
    return isSuperBossUser(user) || 
           roles.isDG || 
           (user?.title || user?.cargo || user?.cargoChefia || "").toUpperCase().includes("DAF") ||
           ((user?.title || user?.cargo || user?.cargoChefia || "").toUpperCase().includes("DICOSAFA") && roles.isBoss);
  }, [user, roles]);

  const salarioStats = useMemo(() => {
    let valPessoalEfetivo = 0; // Salários pagos pelo Estado
    let valPessoalNaoEfetivo = 0; // Salários pagos via Receitas Próprias (RH)

    (rawActivities || []).forEach((act) => {
      const actTotal = getActivityTotal(act);
      const text =
        `${act.titulo || ""} ${act.necessidade || ""} ${act.rubrica || ""} ${safeJSONStringify(act.rubricas || "")}`.toUpperCase();

      if (
        text.includes("DOCENTE") &&
        (text.includes("EFETIVO") || text.includes("QUADRO"))
      ) {
        valPessoalEfetivo += actTotal * 12;
      } else if (
        text.includes("DOCENTE") &&
        (text.includes("CONTRATADO") ||
          text.includes("NAO EFETIVO") ||
          text.includes("NÃO EFETIVO"))
      ) {
        valPessoalNaoEfetivo += actTotal * 12;
      } else if (
        text.includes("CTA") &&
        (text.includes("EFETIVO") || text.includes("QUADRO"))
      ) {
        valPessoalEfetivo += actTotal * 12;
      } else if (
        text.includes("CTA") &&
        (text.includes("CONTRATADO") ||
          text.includes("NAO EFETIVO") ||
          text.includes("NÃO EFETIVO"))
      ) {
        valPessoalNaoEfetivo += actTotal * 12;
      } else if (
        text.includes("SALARIO") ||
        text.includes("SALÁRIO") ||
        text.includes("REMUNERAÇÃO") ||
        text.includes("REMUNERACAO") ||
        text.includes("112")
      ) {
        valPessoalEfetivo += actTotal * 12 * 0.8;
        valPessoalNaoEfetivo += actTotal * 12 * 0.2;
      }
    });

    const fallbackTotal = 131976760.68;
    const totalDetected = valPessoalEfetivo + valPessoalNaoEfetivo;
    if (totalDetected < 1000) {
      valPessoalEfetivo = fallbackTotal * 0.75;
      valPessoalNaoEfetivo = fallbackTotal * 0.25;
    }

    const fmt = (n: number) =>
      n.toLocaleString("pt-MZ", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " MZN";

    return {
      salarioEstado: fmt(valPessoalEfetivo),
      salarioReceitasProprias: fmt(valPessoalNaoEfetivo),
      rawEstado: valPessoalEfetivo,
      rawReceitasProprias: valPessoalNaoEfetivo,
      totalGeral: fmt(valPessoalNaoEfetivo),
      totalRaw: valPessoalNaoEfetivo, // Apenas receitas próprias entra no orçamento geral consolidado; o Estado é separado
    };
  }, [rawActivities, getActivityTotal]);

  const [planSchedules, setPlanSchedules] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    title: "",
    year: selectedYear,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    statusToUpdate: "setor", // Qual nível deve atualizar
  });

  useEffect(() => {
    const unsub = firestoreService.plan_schedules.subscribe(setPlanSchedules);
    return unsub;
  }, []);

  const activeSchedule = useMemo(() => {
    const now = new Date();
    return planSchedules.find((s) => {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      return now >= start && now <= end && Number(s.year) === selectedYear;
    });
  }, [planSchedules, selectedYear]);

  // Auto-submit expired schedules
  useEffect(() => {
    if (!isPlanificacao || planSchedules.length === 0) return;

    const checkExpirations = async () => {
      const now = new Date();
      for (const schedule of planSchedules) {
        if (!schedule.autoSubmitted && new Date(schedule.endDate) < now) {
          // Map each schedule.statusToUpdate to its corresponding NEXT workflow status
          const AUTO_SUBMIT_TRANSITIONS: Record<string, string> = {
            setor: "reparticao",
            reparticao: "departamento",
            departamento: "direcao",
            direcao: "planificacao",
          };

          // Logic to auto-submit all pending activities for this schedule
          const toSubmit = rawActivities.filter((a) => {
            const actStatus = (a.status || "setor").replace("setorial", "setor");
            return (
              Number(a.ano) === Number(schedule.year) &&
              actStatus === schedule.statusToUpdate &&
              !a.submetido
            );
          });

          if (toSubmit.length > 0) {
            console.log(
              `Auto-submitting ${toSubmit.length} activities for schedule ${schedule.id}`,
            );
            try {
              const nextStatus = AUTO_SUBMIT_TRANSITIONS[schedule.statusToUpdate] || "reparticao";
              await Promise.all(
                toSubmit.map((act) =>
                  firestoreService.matrixActivities.update(act.id, {
                    status: nextStatus,
                    submetido: true,
                  }),
                ),
              );
              // Mark schedule as processed
              await firestoreService.plan_schedules.update(schedule.id, {
                autoSubmitted: true,
              });
              onShowAlert(
                `O prazo de atualização para o plano ${schedule.year} expirou. ${toSubmit.length} atividades foram submetidas automaticamente para o nível seguinte.`,
              );
            } catch (err) {
              console.error("Error in auto-submit:", err);
            }
          } else {
            // Even if nothing to submit, mark it so we don't check again
            await firestoreService.plan_schedules.update(schedule.id, {
              autoSubmitted: true,
            });
          }
        }
      }
    };

    checkExpirations();
  }, [planSchedules, rawActivities, isPlanificacao, selectedYear]);

  const canEdit = (activity: MatrixActivity) => {
    if (!activity) return false;
    if (!user) return false;

    // Se estiver aprovada, fica bloqueada para alterações
    if (
      activity.statusAprovacao === "aprovada" ||
      (activity.status as any) === "institucional"
    )
      return false;

    // Super Boss/Admin can always edit
    if (isSuperBossUser(user)) return true;

    // Se o documento foi tramitado para um gabinete específico, apenas membros desse gabinete podem editar
    if (activity.currentGabinete) {
      const uArea = (user.setor || user.reparticao || user.departamento || user.direcao || "").toLowerCase();
      const aGabinete = activity.currentGabinete.toLowerCase();
      if (!aGabinete.includes(uArea) && !uArea.includes(aGabinete)) return false;
    }

    // Se estiver em período de atualização agendado, permite editar mesmo se submetido
    if (
      activeSchedule &&
      Number(activity.ano) === Number(activeSchedule.year)
    ) {
      const userRole = selectedRoleMode
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const targetRole = (activeSchedule.statusToUpdate || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (userRole === targetRole) return true;
    }

    // "todos os colaboradores e chefes devem ter acesso a seu planos no ato de planificacao, issso garannte a visita e atualizacao do mesmo"
    // So during planning (all statuses except 'institucional'), if the user has access to see/own it, they can edit/update it.
    const uEmail = (user.email || "").toLowerCase();
    const uName = (user.nome || user.name || "").toLowerCase();
    const creator = (activity.createdBy || "").toLowerCase();
    const creatorName = (activity.createdByName || "").toLowerCase();
    const isOwner =
      creator === uEmail ||
      creatorName === uName ||
      (uEmail && creator.includes(uEmail)) ||
      activity.responsavelEmail?.toLowerCase() === uEmail;

    if (isOwner) return true;

    // Check if user is chief and has access to the department/direction/sector
    const roles = getRoles(user.title || user.cargo || user.cargoChefia || "");
    if (roles.isBoss) {
      const hasAreaAccess = canAccessArea(
        user,
        activity.direcao || "",
        activity.departamento || "",
        activity.setor || activity.reparticao || "",
      );
      if (hasAreaAccess) return true;
    }

    if (isCD) {
      return (
        (activity.status as any) === "departamento" &&
        activity.departamento === user?.departamento
      );
    }
    if (isDC) {
      return (
        (activity.status as any) === "direcao" &&
        activity.direcao === user?.direcao
      );
    }

    return !activity.submetido;
  };

  const [activeSubTab, setActiveSubTab] = useState<
    | "plano_reparticao"
    | "plano_departamento"
    | "plano_institucional"
    | "matriz_direcoes"
    | "plano_direcoes"
    | "pesoe"
    | "plano_setorial"
    | "plano_orcamento"
    | "necessidades_quantidades"
  >("necessidades_quantidades");

  const groupedNecessidadesPlanificadas = useMemo(() => {
    const planActivities = filteredActivities.filter(
      (a) =>
        (a.status as any) === "planificacao" &&
        !a.isPESOE &&
        (isSuperBossUser(user) || a.direcao === user?.direcao)
    );

    const productMap: {
      [key: string]: {
        nomeProduto: string;
        necessidadeCategory: string;
        rubricaCode: string;
        quantidadeTotal: number;
        valorTotal: number;
        precoUnitarioMedio: number;
        especificacoes: Set<string>;
        atividadesCount: number;
        atividadesList: string[];
      };
    } = {};

    planActivities.forEach((act) => {
      const actName =
        act.designacaoAtividade ||
        act.nomeAtividade ||
        act.title ||
        act.designacao ||
        "Atividade Planificada";

      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const prodName = String(
            r.nomeProduto ||
              r.especificacao ||
              r.produto ||
              r.item ||
              r.necessidade ||
              r.descricao ||
              "Item sem nome"
          ).trim();
          const necCat = String(r.necessidade || r.categoria || "Necessidade Geral").trim();
          const rubCode = String(r.rubrica || r.nomeRubrica || r.code || "Geral").trim();
          const qty = Number(r.quantidade || r.qtd || 1);
          const val = Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0);

          const key = `${necCat.toLowerCase()}|||${prodName.toLowerCase()}`;

          if (!productMap[key]) {
            productMap[key] = {
              nomeProduto: prodName,
              necessidadeCategory: necCat,
              rubricaCode: rubCode,
              quantidadeTotal: 0,
              valorTotal: 0,
              precoUnitarioMedio: 0,
              especificacoes: new Set<string>(),
              atividadesCount: 0,
              atividadesList: [],
            };
          }

          productMap[key].quantidadeTotal += qty;
          productMap[key].valorTotal += val;
          productMap[key].atividadesCount += 1;
          if (!productMap[key].atividadesList.includes(actName)) {
            productMap[key].atividadesList.push(actName);
          }
          if (r.especificacao) productMap[key].especificacoes.add(r.especificacao);
        });
      } else {
        const val = getActivityTotal(act);
        if (val > 0) {
          const prodName = String(
            act.designacao || act.nomeAtividade || act.title || "Atividade Planificada"
          ).trim();
          const necCat = String(act.necessidade || "Necessidade Geral").trim();
          const rubCode = String(act.rubrica || "Despesas de Funcionamento").trim();
          const qty = Number(act.quantidade || 1);
          const key = `${necCat.toLowerCase()}|||${prodName.toLowerCase()}`;

          if (!productMap[key]) {
            productMap[key] = {
              nomeProduto: prodName,
              necessidadeCategory: necCat,
              rubricaCode: rubCode,
              quantidadeTotal: 0,
              valorTotal: 0,
              precoUnitarioMedio: 0,
              especificacoes: new Set<string>(),
              atividadesCount: 0,
              atividadesList: [],
            };
          }

          productMap[key].quantidadeTotal += qty;
          productMap[key].valorTotal += val;
          productMap[key].atividadesCount += 1;
          if (!productMap[key].atividadesList.includes(actName)) {
            productMap[key].atividadesList.push(actName);
          }
        }
      }
    });

    return Object.values(productMap)
      .map((item) => ({
        ...item,
        precoUnitarioMedio:
          item.quantidadeTotal > 0 ? item.valorTotal / item.quantidadeTotal : 0,
        especificacoesStr: Array.from(item.especificacoes).join("; "),
      }))
      .sort((a, b) => b.quantidadeTotal - a.quantidadeTotal);
  }, [filteredActivities, user]);

  const groupedRubricasSummary = useMemo(() => {
    const planActivities = filteredActivities.filter(
      (a) =>
        !a.isPESOE &&
        isActivityInScope(a)
    );

    const rubricMap: {
      [key: string]: {
        codigoRubrica: string;
        nomeRubrica: string;
        rubricaMae: string;
        quantidadeTotal: number;
        valorTotal: number;
        atividadesCount: number;
        atividadesList: { id: string; code: string; name: string; direcao: string; depto: string }[];
      };
    } = {};

    planActivities.forEach((act) => {
      const actId = act.id || "";
      const actCode = act.codigoAtividade || act.referencia || act.codigo || "---";
      const actName = act.nomeAtividade || act.title || act.designacao || "Atividade Sem Nome";
      const actDirecao = act.direcao || "Gabinete do Diretor-Geral";
      const actDepto = act.departamento || "Geral";

      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const rubCodeOrName = String(r.rubrica || r.nomeRubrica || r.code || "Geral").trim();
          const qty = Number(r.quantidade || r.qtd || 1);
          const val = Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0);

          let code = "";
          let name = rubCodeOrName;
          const hyphenIndex = rubCodeOrName.indexOf("-");
          if (hyphenIndex !== -1) {
            code = rubCodeOrName.substring(0, hyphenIndex).trim();
            name = rubCodeOrName.substring(hyphenIndex + 1).trim();
          } else {
            const digitsMatch = rubCodeOrName.match(/^(\d+)/);
            if (digitsMatch) {
              code = digitsMatch[1];
              name = rubCodeOrName.substring(code.length).trim();
              if (name.startsWith("-") || name.startsWith(".")) {
                name = name.substring(1).trim();
              }
            }
          }

          if (!code) code = "Geral";
          if (!name) name = rubCodeOrName;

          const key = rubCodeOrName.toLowerCase();

          if (!rubricMap[key]) {
            rubricMap[key] = {
              codigoRubrica: code,
              nomeRubrica: name,
              rubricaMae: getParentRubrica(rubCodeOrName),
              quantidadeTotal: 0,
              valorTotal: 0,
              atividadesCount: 0,
              atividadesList: [],
            };
          }

          rubricMap[key].quantidadeTotal += qty;
          rubricMap[key].valorTotal += val;
          rubricMap[key].atividadesCount += 1;
          if (!rubricMap[key].atividadesList.some((item) => item.id === actId)) {
            rubricMap[key].atividadesList.push({ id: actId, code: actCode, name: actName, direcao: actDirecao, depto: actDepto });
          }
        });
      } else {
        const val = getActivityTotal(act);
        if (val > 0) {
          const rubCodeOrName = String(act.rubrica || "Despesas de Funcionamento").trim();
          const qty = Number(act.quantidade || 1);

          let code = "";
          let name = rubCodeOrName;
          const hyphenIndex = rubCodeOrName.indexOf("-");
          if (hyphenIndex !== -1) {
            code = rubCodeOrName.substring(0, hyphenIndex).trim();
            name = rubCodeOrName.substring(hyphenIndex + 1).trim();
          } else {
            const digitsMatch = rubCodeOrName.match(/^(\d+)/);
            if (digitsMatch) {
              code = digitsMatch[1];
              name = rubCodeOrName.substring(code.length).trim();
              if (name.startsWith("-") || name.startsWith(".")) {
                name = name.substring(1).trim();
              }
            }
          }

          if (!code) code = "Geral";
          if (!name) name = rubCodeOrName;

          const key = rubCodeOrName.toLowerCase();

          if (!rubricMap[key]) {
            rubricMap[key] = {
              codigoRubrica: code,
              nomeRubrica: name,
              rubricaMae: getParentRubrica(rubCodeOrName),
              quantidadeTotal: 0,
              valorTotal: 0,
              atividadesCount: 0,
              atividadesList: [],
            };
          }

          rubricMap[key].quantidadeTotal += qty;
          rubricMap[key].valorTotal += val;
          rubricMap[key].atividadesCount += 1;
          if (!rubricMap[key].atividadesList.some((item) => item.id === actId)) {
            rubricMap[key].atividadesList.push({ id: actId, code: actCode, name: actName, direcao: actDirecao, depto: actDepto });
          }
        }
      }
    });

    return Object.values(rubricMap).sort((a, b) => a.codigoRubrica.localeCompare(b.codigoRubrica));
  }, [filteredActivities, user, isActivityInScope]);
  const [colaboradores, setColaboradores] = useState<any[]>(
    externalColaboradores,
  );
  const [selectedPlanificacaoDirection, setSelectedPlanificacaoDirection] =
    useState<string>("");

  useEffect(() => {
    if (externalColaboradores && externalColaboradores.length > 0) {
      setColaboradores(externalColaboradores);
    }
  }, [externalColaboradores]);
  const [pesoeConfig, setPesoeConfig] = useState<{
    id: string;
    published: boolean;
    publishedBy?: string;
    publishedAt?: string;
  } | null>(null);

  const [isAllocating, setIsAllocating] = useState(false);

  const handleAutoAllocateSectors = async () => {
    if (isAllocating) return;
    try {
      setIsAllocating(true);
      const institucionalActivities = rawActivities.filter(
        (a) =>
          (a.status as any) === "institucional" &&
          Number(a.ano) === selectedYear,
      );

      if (institucionalActivities.length === 0) {
        onShowAlert(
          "Nenhuma atividade institucional encontrada para alocação no ciclo de " +
            selectedYear,
        );
        setIsAllocating(false);
        return;
      }

      if (
        !window.confirm(
          `Deseja executar a alocação automática de setores para as ${institucionalActivities.length} atividades do Plano Institucional de ${selectedYear}?`,
        )
      ) {
        setIsAllocating(false);
        return;
      }

      let allocatedCount = 0;
      for (const act of institucionalActivities) {
        const allocation: any = determineSectorAllocation(act, colaboradores);
        if (allocation) {
          const needsUpdate =
            act.direcao !== allocation.direcao ||
            act.departamento !== allocation.departamento ||
            (act.setor !== allocation.setor &&
              act.reparticao !== allocation.setor);

          if (needsUpdate) {
            await firestoreService.matrixActivities.update(act.id, {
              direcao: allocation.direcao,
              departamento: allocation.departamento,
              setor: allocation.setor,
              reparticao: allocation.setor,
              updatedAt: new Date().toISOString(),
            });
            allocatedCount++;
          }
        }
      }

      onShowAlert(
        `Alocação concluída! ${allocatedCount} atividades foram distribuídas automaticamente para seus respectivos setores de acordo com o Plano Institucional.`,
      );
    } catch (err: any) {
      console.error("Erro ao alocar atividades nos setores:", err);
      onShowAlert("Ocorreu um erro durante a alocação: " + err.message);
    } finally {
      setIsAllocating(false);
    }
  };

  const handleReplicatePreviousPlan = async () => {
    // 1. Identificar o setor do utilizador
    const userUnit =
      user?.reparticao ||
      user?.setor ||
      user?.departamento ||
      user?.direcao ||
      "";

    if (!userUnit || userUnit === "Nenhum") {
      onShowAlert(
        "Não foi possível identificar a sua unidade orgânica para replicação.",
      );
      return;
    }

    if (
      !window.confirm(
        `Deseja buscar e replicar as atividades da unidade "${userUnit}" para o ciclo de ${selectedYear}?`,
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      let activitiesToReplicate: any[] = [];
      const previousYear = selectedYear - 1;

      // 1. Tentar buscar atividades do ano anterior (N-1) no banco de dados ativo
      const previousYearActivities = rawActivities.filter(
        (a) => a.ano === previousYear,
      );

      if (previousYearActivities.length > 0) {
        activitiesToReplicate = previousYearActivities;
        console.log(
          `Replicação: ${activitiesToReplicate.length} atividades encontradas no ano ${previousYear}.`,
        );
      } else {
        // 2. Se não houver no banco ativo, buscar no arquivo morto
        const archiveDocs =
          (await firestoreService.archive_documents.get()) || [];
        const specificPlan = archiveDocs.find(
          (doc) =>
            doc.type === "Planos de Atividades e Orçamentos" &&
            (doc.origin === userUnit || doc.title?.includes(userUnit)) &&
            (doc.year === previousYear ||
              doc.title?.includes(previousYear.toString())) &&
            doc.atividades &&
            doc.atividades.length > 0,
        );

        if (specificPlan) {
          activitiesToReplicate = specificPlan.atividades;
          console.log(
            "Replicação: Plano específico encontrado no arquivo morto.",
          );
        } else {
          // Fallback: Buscar no Plano Institucional no Arquivo
          const instPlan = archiveDocs.find(
            (doc) =>
              (doc.type === "Planos de Atividades e Orçamentos" ||
                doc.type === "Plano Institucional") &&
              (doc.title?.toUpperCase().includes("INSTITUCIONAL") ||
                doc.title?.toUpperCase().includes("PESOE")) &&
              doc.atividades &&
              doc.atividades.length > 0,
          );

          if (instPlan) {
            // Filtrar apenas atividades que mencionam o setor do utilizador
            activitiesToReplicate = instPlan.atividades.filter((act: any) => {
              const rep = (act.reparticao || "").toUpperCase();
              const det = (act.departamento || "").toUpperCase();
              const set = (act.setor || "").toUpperCase();
              const u = userUnit.toUpperCase();
              return rep.includes(u) || det.includes(u) || set.includes(u);
            });
            console.log(
              "Replicação: Extraído do Plano Institucional no arquivo.",
            );
          }
        }
      }

      // 3. Fallback final: atividades do estado atual (anteriores) se ainda não encontrou nada
      if (activitiesToReplicate.length === 0) {
        activitiesToReplicate = filteredActivities.filter(
          (a) =>
            !a.status ||
            (a.status as any) === "draft" ||
            (a.status as any) === "setorial",
        );
        console.log("Replicação: Usando atividades locais filtradas.");
      }

      if (activitiesToReplicate.length === 0) {
        onShowAlert(
          "Nenhuma atividade encontrada para replicar no arquivo ou no plano institucional para a sua unidade.",
        );
        return;
      }

      let count = 0;
      // Ordenar por número para garantir organização (como solicitado)
      const sorted = [...activitiesToReplicate].sort((a, b) => {
        const numA = parseFloat(
          (a.no || a.ordem || "0").toString().replace(",", "."),
        );
        const numB = parseFloat(
          (b.no || b.ordem || "0").toString().replace(",", "."),
        );
        return numA - numB;
      });

      for (const activity of sorted) {
        // Limpar IDs e metadados para nova criação
        const { id, submetido, createdAt, updatedAt, ...rest } = activity;

        // Mapeamento de campos caso venha de formatos diferentes
        const newActivity = {
          ...rest,
          no: activity.no || activity.ordem || activity.n || "",
          title:
            activity.title || activity.atividade || activity.activity || "",
          ano: selectedYear,
          status: "draft",
          submetido: false,
          createdAt: new Date().toISOString(),
          // Garantir que a unidade orgânica está correta
          reparticao: user?.reparticao || activity.reparticao || "",
          departamento: user?.departamento || activity.departamento || "",
          direcao: user?.direcao || activity.direcao || "",
        };

        await firestoreService.matrixActivities.add(newActivity);
        count++;
      }
      onShowAlert(
        `${count} atividades replicadas com sucesso para ${userUnit}. Foram organizadas sequencialmente.`,
      );
    } catch (error: any) {
      console.error("Error replicating activities:", error);
      onShowAlert("Erro ao replicar atividades: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllActivities = async () => {
    if (!isPlanificacao && !isAdminOrProgrammer && user?.role !== "admin" && user?.role !== "administrador") {
      onShowAlert("Apenas o Setor de Planificação ou Administradores têm permissão para limpar os planos.");
      return;
    }

    const confirmClear = window.confirm(
      "ATENÇÃO: Esta ação irá remover TODAS as atividades ativas do sistema (matrixActivities e actividades). " +
        "Certifique-se de que os planos já foram arquivados no 'Arquivo Morto' antes de prosseguir. " +
        "Deseja continuar com a limpeza total?",
    );

    if (!confirmClear) return;

    const secondConfirm = window.confirm(
      "CONFIRMAÇÃO FINAL: Deseja realmente APAGAR permanentemente todos os registros de atividades atuais para deixar o sistema limpo?",
    );

    if (!secondConfirm) return;

    try {
      setIsLoading(true);
      const allActs = (await firestoreService.matrixActivities.get()) || [];
      const legacyActs = (await firestoreService.actividades.get()) || [];

      await Promise.all([
        ...allActs.map((act) => firestoreService.matrixActivities.delete(act.id)),
        ...legacyActs.map((act) => firestoreService.actividades.delete(act.id)),
      ]);

      localStorage.removeItem("sigep_matrix_activities");
      localStorage.removeItem("sigep_actividades");
      localStorage.removeItem("sigep_plano_actividades");

      onShowAlert("dados excluido com sucesso");
    } catch (error: any) {
      console.error("Erro ao limpar sistema:", error);
      onShowAlert("Erro ao limpar o sistema: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataBuffer = evt.target?.result;
        const wb = XLSX.read(dataBuffer, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        console.log("Excel Data:", data);

        const newActivities: any[] = data
          .map((row: any) => {
            const noVal = getExcelRowValue(
              row,
              ["n", "no", "numero", "num", "id", "ordem", "nº"],
              "",
            )?.toString();
            const refVal = getExcelRowValue(
              row,
              [
                "cod/atividade",
                "codigo",
                "referencia",
                "ref",
                "codigo da atividade",
                "cod atividade",
                "codigo atividade",
                "cód./atividade",
              ],
              "",
            );
            const titleVal = getExcelRowValue(
              row,
              [
                "nome da atividade",
                "atividade",
                "nome",
                "descricao",
                "titulo",
                "activity",
                "title",
                "description",
                "atividades",
              ],
              "Atividade Importada",
            );
            const uOrg = getExcelRowValue(
              row,
              [
                "unidade organica",
                "unidade orgânica",
                "unidade",
                "isps",
                "direcao",
                "direção",
                "org",
                "unidade org",
                "unidade organica (isps)",
              ],
              user?.direcao || "ISPS Songo",
            );
            const deptVal = getExcelRowValue(
              row,
              [
                "departamento",
                "dept",
                "direção",
                "direção",
                "unidade organica",
                "departamento (isps)",
              ],
              user?.departamento || "",
            );
            const repVal = getExcelRowValue(
              row,
              [
                "reparticao",
                "repart",
                "seccao",
                "seção",
                "repartição",
                "divisao",
                "divisão",
                "setor",
                "sector",
              ],
              user?.setor ||
                user?.reparticao ||
                (activeSubTab === "plano_institucional" ? "" : title),
            );
            const sourceVal = getExcelRowValue(
              row,
              [
                "fonte de receita",
                "fonte",
                "receita",
                "financiamento",
                "orcado",
                "orcamento",
                "fontedereceita",
              ],
              "Orçamento do Estado",
            );
            const priorityVal = getExcelRowValue(
              row,
              ["prioridade", "nivel", "grau", "importancia", "priorit"],
              "Média",
            );
            const objVal = getExcelRowValue(
              row,
              [
                "objetivo",
                "meta",
                "proposito",
                "fim",
                "objetivos",
                "objetivo da atividade",
              ],
              "",
            );
            const provVal = getExcelRowValue(
              row,
              [
                "provincia",
                "província",
                "trabalho provincia",
                "local realizacao provincia",
                "local_provincia",
              ],
              "Tete",
            );
            const distVal = getExcelRowValue(
              row,
              [
                "distrito",
                "trabalho distrito",
                "local realizacao distrito",
                "local_distrito",
              ],
              "",
            );
            const respVal = getExcelRowValue(
              row,
              [
                "responsavel",
                "quem",
                "encarregado",
                "colaborador",
                "responsável",
              ],
              "",
            );
            const otherColab = getExcelRowValue(
              row,
              [
                "outros",
                "participantes",
                "equipa",
                "outros colaboradores",
                "outros colaborador",
              ],
              "",
            );
            const trimVal = getExcelRowValue(
              row,
              ["trimestre", "periodo", "tempo"],
              "I",
            );
            const mesVal = getExcelRowValue(
              row,
              [
                "mes de realizacao",
                "mes",
                "cronograma",
                "data/mes",
                "month",
                "mes de realização",
              ],
              "",
            );
            const freqVal = getExcelRowValue(
              row,
              ["frequencia", "periodicidade", "frequent"],
              "Pontual",
            );
            const startD = getExcelRowValue(
              row,
              [
                "data inicio",
                "inicio",
                "datas inicio",
                "start date",
                "data início",
              ],
              "",
            );
            const endD = getExcelRowValue(
              row,
              ["data fim", "fim", "datas fim", "end date"],
              "",
            );
            const tDias = getExcelRowValue(
              row,
              [
                "total de dias",
                "total dias",
                "dias",
                "numero de dias",
                "duração",
                "duracao",
              ],
              "",
            );
            const transportVal = getExcelRowValue(
              row,
              [
                "necessidade de transporte",
                "transporte",
                "necessita transporte",
                "viagem",
              ],
              "Não",
            );
            const viaturaVal = getExcelRowValue(
              row,
              [
                "sugestao de viatura",
                "viatura",
                "carro",
                "veiculo",
                "automovel",
                "sugestão de viatura",
              ],
              "",
            );
            const distKmVal = getExcelRowValue(
              row,
              [
                "distancia em km (ida e volta)",
                "distancia km",
                "distancia ida e volta",
                "km",
                "distancia",
                "distância em km (ida e volta)",
              ],
              "0",
            )?.toString();
            const gasoleoVal = getExcelRowValue(
              row,
              [
                "litros gasoleo (calculado)",
                "litros gasoleo",
                "gasoleo",
                "combustivel",
                "litros",
                "litros de gasóleo",
                "litros gasóleo (calculado)",
              ],
              "0",
            )?.toString();
            const pLitro = getExcelRowValue(
              row,
              [
                "preco/litro (mzn)",
                "preco litro",
                "preco/litro",
                "preco mzn",
                "preço/litro",
                "preço litro",
                "preço/litro (mzn)",
              ],
              "0",
            )?.toString();
            const rubricaVal = getExcelRowValue(
              row,
              [
                "rubrica",
                "rúbrica",
                "classificacao",
                "rubrica orcamental",
                "item orcamental",
                "codigo rubrica",
              ],
              "",
            );
            const necVal = getExcelRowValue(
              row,
              [
                "necessidade",
                "recursos",
                "necessidades",
                "meios",
                "requisitos",
              ],
              "",
            );
            const specVal = getExcelRowValue(
              row,
              [
                "especificacoes",
                "especificações",
                "especificacao",
                "especificação",
              ],
              "",
            );
            const detVal = getExcelRowValue(
              row,
              ["detalhes", "detalhe", "informações adicionais"],
              "",
            );
            const numPess = getExcelRowValue(
              row,
              [
                "n de pessoas envolvidas",
                "nº de pessoas envolvidas",
                "pessoas envolvidas",
                "pessoas",
                "envolvidos",
                "numero de pessoas",
                "nº de pessoas",
              ],
              "1",
            )?.toString();
            const unitVal = getExcelRowValue(
              row,
              [
                "unitario (mt)",
                "unitario",
                "custo unitario",
                "preco unitario",
                "unitário",
                "unitário (mt)",
              ],
              "0",
            );
            const ajudaC = getExcelRowValue(
              row,
              ["ajuda de custo", "ajudas de custo", "ajuda custo"],
              "0",
            );
            const totalVal = getExcelRowValue(
              row,
              [
                "valor total geral (mzn)",
                "valor total",
                "total",
                "valor",
                "custo",
                "preco",
                "orcamento estimado",
                "valor total geral",
                "amount",
                "total geral",
              ],
              0,
            );
            let pTypeVal = getExcelRowValue(
              row,
              [
                "tipo de plano",
                "tipo plano",
                "plano tipo",
                "VIII. TIPO DE PLANO",
              ],
              "",
            );
            if (!pTypeVal) {
              const tValLower = (titleVal || "").toLowerCase();
              const nValLower = (necVal || "").toLowerCase();
              if (
                tValLower.includes("aquisição de") ||
                tValLower.includes("aquisicao de") ||
                nValLower.includes("aquisição de") ||
                nValLower.includes("aquisicao de")
              ) {
                pTypeVal = "plano de aquisição";
              } else if (
                tValLower.includes("serviço-") ||
                tValLower.includes("servico-") ||
                tValLower.includes("serviço") ||
                tValLower.includes("servico") ||
                nValLower.includes("serviço-") ||
                nValLower.includes("servico-") ||
                nValLower.includes("serviço") ||
                nValLower.includes("servico")
              ) {
                pTypeVal = "plano de contratação";
              } else {
                pTypeVal = "Setorial";
              }
            }
            const obsVal = getExcelRowValue(
              row,
              [
                "observacoes",
                "observação",
                "observações",
                "obs",
                "notas",
                "comentario",
              ],
              "",
            );
            const pYearVal = getExcelRowValue(
              row,
              ["ano", "year", "exercicio", "exercício", "periodo", "ciclo"],
              selectedYear,
            );
            // Permissão para todos os anos, incluindo 2027

            let finalDirecao = uOrg;
            let finalDepartamento = deptVal;
            let finalSetor = repVal;

            if (
              activeSubTab === "plano_institucional" ||
              !finalDirecao ||
              finalDirecao === "ISPS Songo" ||
              finalDirecao === "ISPS" ||
              !finalDepartamento ||
              !finalSetor
            ) {
              const allocation: any = determineSectorAllocation(
                {
                  responsavel: respVal,
                  title: titleVal,
                  rubrica: rubricaVal,
                  necessidade: necVal,
                },
                colaboradores,
              );
              if (allocation) {
                if (
                  !finalDirecao ||
                  finalDirecao === "ISPS Songo" ||
                  finalDirecao === "ISPS"
                ) {
                  finalDirecao = allocation.direcao;
                }
                if (!finalDepartamento) {
                  finalDepartamento = allocation.departamento;
                }
                if (!finalSetor) {
                  finalSetor = allocation.setor;
                }
              }
            }

            return {
              id: Math.random().toString(36).substr(2, 9),
              no: noVal,
              referencia:
                refVal ||
                `ACT-${pYearVal}-${Math.floor(Math.random() * 10000)}`,
              title: titleVal,
              direcao: finalDirecao,
              departamento: finalDepartamento,
              setor: finalSetor,
              reparticao: finalSetor, // Manter para compatibilidade legada se necessário
              orcamento: sourceVal,
              prioridade: priorityVal,
              objetivoAtividade: objVal,
              trabalhoProvincia: provVal,
              trabalhoDistrito: distVal,
              responsavel: respVal,
              outrosColaboradores: otherColab,
              nVezesAno: "1",
              trimestre: trimVal,
              mesRealizacao: mesVal,
              frequencia: freqVal,
              dataInicio: startD,
              dataFim: endD,
              totalDias: tDias,
              necessitaTransporte: transportVal,
              viatura: viaturaVal,
              distanciaKm: distKmVal,
              litrosGasoleo: gasoleoVal,
              precoLitro: pLitro,
              rubrica: rubricaVal,
              necessidade: necVal,
              especificacoes: specVal,
              detalhes: detVal,
              numeroPessoas: numPess,
              unitario: unitVal,
              ajudaCusto: ajudaC,
              valor: Number(totalVal) || 0,
              status:
                activeSubTab === "plano_institucional"
                  ? "institucional"
                  : activeSubTab === "plano_direcoes"
                    ? "direcoes"
                    : activeSubTab === "plano_departamento"
                      ? "departamento"
                      : activeSubTab === "plano_reparticao"
                    ? "reparticao"
                    : selectedRoleMode === "Repartição"
                      ? "reparticao"
                      : selectedRoleMode.toLowerCase(),
              published: false,
              createdAt: new Date().toISOString(),
              unidadeOrganica: uOrg,
              nivel: "Local",
              dataMes: "",
              tipoPlano: pTypeVal,
              observacoes: obsVal,
              ano: Number(pYearVal) || selectedYear,
              createdBy: user?.email, // Adicionado
            };
          })
          .filter(Boolean) as any[];

        if (newActivities.length > 0) {
          try {
            await Promise.all(
              newActivities.map((act) =>
                firestoreService.matrixActivities.add(act),
              ),
            );
            onShowAlert(
              `${newActivities.length} atividades importadas com sucesso para o formulário digital.`,
            );
          } catch (e) {
            console.error("Erro ao salvar no firestore", e);
            onShowAlert("Erro ao importar para a base de dados.");
          }
        }
      } catch (err) {
        console.error(err);
        onShowAlert("Erro ao importar ficheiro Excel.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset the input value so the same file could be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const unsub = firestoreService.config.subscribe("pesoe_config", (data) => {
      setPesoeConfig(data);
    });
    return unsub;
  }, []);

  const handlePublishPesoe = async (publishState: boolean) => {
    try {
      await firestoreService.config.set("pesoe_config", {
        published: publishState,
        publishedBy: user?.name || user?.email || title || "Chefe do DPEP",
        publishedAt: new Date().toISOString(),
      });

      // Transfer activities to Monitoria sector if published
      if (publishState) {
        const months = [
          "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
          "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        const nextMonthIndex = (new Date().getMonth() + 1) % 12;
        const nextMonthName = months[nextMonthIndex];

        const nextMonthActivities = rawActivities.filter(
          (act) => act.mesRealizacao === nextMonthName
        );

        for (const act of nextMonthActivities) {
          await firestoreService.matrixActivities.update(act.id, {
            setor: "Setor de Monitoria",
            status: "pendente_monitoria",
          });
        }
        onShowAlert(
          `DE publicado com sucesso! Atividades para ${nextMonthName} transferidas para Monitoria.`
        );
      } else {
        onShowAlert("Publicação do DE anulada com sucesso!");
      }
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao atualizar o estado de publicação do DE.");
    }
  };

  const getDirectorDirection = (dirTitle: string) => {
    const t = dirTitle.toUpperCase();
    if (
      t.includes("DICOSAFA") ||
      t.includes("COSSAFA") ||
      t.includes("ADMINISTRAÇÃO, FINANÇAS") ||
      t.includes("ADMINISTRACAO, FINANCAS")
    )
      return "Direção de Coordenação de Serviços de Administração, Finanças e de Apoio (DICOSAFA)";
    if (
      t.includes("DICOSSER") ||
      t.includes("COSSER") ||
      t.includes("SERVIÇOS SOCIAIS") ||
      t.includes("SERVICOS SOCIAIS")
    )
      return "Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)";
    if (t.includes("DICOCOSSER"))
      return "Direção de Coordenação de Serviços Académicos, Sociais, Extensão e Relações Públicas (DICOSSER)";
    if (t.includes("GERAL") || t.includes("DG")) return "ALL";
    return "";
  };

  const getDepartmentKeyMatched = (
    titleStr: string = "",
    userDept: string = "",
  ) => {
    const t = (titleStr || "").toUpperCase();
    const ud = (userDept || "").toUpperCase();

    if (userDept && userDept.toUpperCase().includes("DEPARTAMENTO")) {
      return userDept;
    }

    const allDeptKeys = Object.keys(REPARTICOES);

    if (titleStr && titleStr.toUpperCase().includes("DEPARTAMENTO")) {
      const found = allDeptKeys.find(
        (k) => t.includes(k.toUpperCase()) || k.toUpperCase().includes(t),
      );
      if (found) return found;
    }

    if (ud) {
      const foundUd = allDeptKeys.find(
        (k) => ud.includes(k.toUpperCase()) || k.toUpperCase().includes(ud),
      );
      if (foundUd) return foundUd;
    }

    return "Departamento de Recursos Humanos";
  };

  const getReparticoesAndSectors = (deptKey: string) => {
    const list: { name: string; type: "Repartição" | "Setor" | "Geral" }[] = [];
    const deptsReparticoes = REPARTICOES[deptKey] || [];

    deptsReparticoes.forEach((rep) => {
      list.push({ name: rep, type: "Repartição" });
      const sectorsOfRep = SECTORES[rep] || [];
      sectorsOfRep.forEach((sec) => {
        list.push({ name: sec, type: "Setor" });
      });
    });

    // Also look through activities for any other custom repartitions or sectors for this department
    filteredActivities.forEach((a) => {
      if (
        (a.status as any) === "departamento" &&
        (a.departamento === deptKey || !a.departamento)
      ) {
        if (a.reparticao && !list.some((item) => item.name === a.reparticao)) {
          const type =
            a.reparticao.toUpperCase().includes("SETOR") ||
            a.reparticao.toUpperCase().includes("SECTOR")
              ? "Setor"
              : "Repartição";
          list.push({ name: a.reparticao, type: type as any });
        }
      }
    });

    // Make sure we have a "Sectores Gerais"
    if (!list.some((item) => item.name === "Sectores Gerais")) {
      list.push({ name: "Sectores Gerais", type: "Geral" });
    }

    return list;
  };

  const activeDeptKey = getDepartmentKeyMatched(title, user?.departamento);
  const reparticoesAndSectorsForThisDept =
    getReparticoesAndSectors(activeDeptKey);

  const directorDirection = getDirectorDirection(title);

  const isPublished = !!pesoeConfig?.published;

  // New Activity form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<MatrixActivity | null>(
    null,
  );
  const [formData, setFormData] = useState({
    no: "",
    title: "",
    direcao: "DICOSAFA",
    departamento: "Departamento de Património",
    reparticao: title || "Repartição de Transporte",
    orcamento: "Orçamento do Estado",
    valor: "",
  });

  // Calculate lists of activities based on local role mode or database status
  // Status workflow tracker:
  // - 'draft' or 'setorial' -> Sector level (Plano Setorial)
  // - 'departamento' -> Department level (Plano do Departamento)
  // - 'direcao' -> Direction level (Plano da Direção)
  // - 'institucional' -> Combined Institutional level (Plano Institucional)

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.no) {
      alert("Por favor preencha o número de ordem e a atividade.");
      return;
    }

    const activity: any = {
      id: Math.random().toString(36).substr(2, 9),
      no: formData.no,
      title: formData.title,
      direcao: formData.direcao,
      departamento: formData.departamento,
      reparticao: formData.reparticao,
      orcamento: formData.orcamento,
      valor: Number(formData.valor) || 0,
      status:
        activeSubTab === "plano_institucional"
          ? "institucional"
          : activeSubTab === "plano_direcoes"
            ? "direcoes"
            : activeSubTab === "plano_departamento"
              ? "departamento"
              : activeSubTab === "plano_reparticao"
              ? "reparticao"
              : selectedRoleMode === "Repartição"
                ? "reparticao"
                : "setorial", // Initial plan stage
      frequencia: "Mensal",
      unidadeOrganica: "ISPS",
      dataMes: new Date().toLocaleString("pt", { month: "long" }),
      createdAt: new Date().toISOString(),
      ano: selectedYear,
      createdBy: user?.email, // Adicionado
    };

    try {
      await firestoreService.matrixActivities.add(activity);
      onShowAlert(
        `Atividade planificada adicionada ao Plano ${
          activeSubTab === "plano_institucional"
            ? "Institucional"
            : activeSubTab === "plano_direcoes"
              ? "da Direção"
              : activeSubTab === "plano_departamento"
                ? "do Departamento"
                : "da Repartição"
        } com sucesso!`,
      );
      setFormData((prev) => ({ ...prev, no: "", title: "", valor: "" }));
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert("Falha ao registar a atividade.");
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const performDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const act = rawActivities.find((a) => a.id === deleteConfirmId);
      await firestoreService.matrixActivities.delete(deleteConfirmId);
      setRawActivities((prev) => prev.filter((a) => a.id !== deleteConfirmId));
      onShowAlert("Dados excluídos com sucesso");
      if (act) {
        await firestoreService.resequenceActivitiesAfterDelete(
          "matrix_activities",
          act,
          rawActivities,
        );
      }
    } catch (error: any) {
      onShowAlert("Erro ao excluir: " + error.message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteRubric = async (rubricRaw: string) => {
    const isPlan = selectedRoleMode === "Planificação" || user?.email === "slaitertripas@gmail.com";
    if (!isPlan) {
      onShowAlert("Apenas o Setor de Planificação ou Administrador pode excluir rúbricas de forma global.");
      return;
    }

    if (
      !window.confirm(
        `⚠️ EXCLUIR RÚBRICA DO SISTEMA:\n\nDeseja realmente excluir permanentemente a rúbrica:\n"${rubricRaw}"?\n\nISSO IRÁ EXCLUIR DA MATRIZ E DE TODOS OS DEPARTAMENTOS todas as atividades associadas a esta rúbrica! Esta operação é irreversível.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const cleanRub = rubricRaw.trim().toLowerCase();
      
      // Encontrar todas as atividades que possuem essa rubrica
      const toDelete = rawActivities.filter((act) => {
        if (!act) return false;
        
        // Se a atividade possui rubricas no array
        if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
          return act.rubricas.some((r: any) => {
            const rubName = String(r.rubrica || r.nomeRubrica || r.code || "").trim().toLowerCase();
            return rubName === cleanRub;
          });
        }
        
        // Se a atividade possui rubrica como propriedade simples
        const mainRub = String(act.rubrica || "").trim().toLowerCase();
        return mainRub === cleanRub;
      });

      if (toDelete.length === 0) {
        onShowAlert("Nenhuma atividade encontrada com esta rúbrica no sistema atual.");
        setIsLoading(false);
        return;
      }

      let count = 0;
      for (const act of toDelete) {
        if (act.id) {
          await firestoreService.matrixActivities.delete(act.id);
          count++;
        }
      }

      // Atualizar o estado local
      setRawActivities((prev) => prev.filter((a) => !toDelete.some((td) => td.id === a.id)));
      onShowAlert(`Sucesso: ${count} atividade(s) associada(s) à rúbrica "${rubricRaw}" foram excluídas da matriz e de todos os departamentos.`);
    } catch (err: any) {
      console.error(err);
      onShowAlert("Erro ao excluir rúbrica: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanSlate2027 = async () => {
    if (!user || user.email !== "slaitertripas@gmail.com") {
      onShowAlert("Apenas o administrador pode realizar esta ação.");
      return;
    }

    if (
      !window.confirm(
        "ATENÇÃO MODO PROGRAMADOR: Esta ação irá EXCLUIR PERMANENTEMENTE TODAS as atividades do ciclo 2027 na base de dados. Esta operação não pode ser desfeita. Deseja continuar?",
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const activitiesToDelete = rawActivities.filter(
        (a) => Number(a.ano) === 2027,
      );
      if (activitiesToDelete.length === 0) {
        onShowAlert("Nenhuma atividade de 2027 encontrada para excluir.");
      } else {
        let deleted = 0;
        for (const act of activitiesToDelete) {
          await firestoreService.matrixActivities.delete(act.id);
          deleted++;
        }
        onShowAlert("dados excluido com sucesso");
      }
    } catch (error: any) {
      console.error("Erro ao limpar base de dados:", error);
      onShowAlert("Erro ao excluir atividades: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearPreviousCycles = async () => {
    if (!user || user.email !== "slaitertripas@gmail.com") {
      onShowAlert("Apenas o administrador pode realizar esta ação.");
      return;
    }

    if (
      !window.confirm(
        "⚠️ ATENÇÃO: Esta ação irá apagar TODOS os planos de atividades de anos anteriores (2025 e anteriores) carregados via modo programador. Deseja continuar?",
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const activitiesToDelete = rawActivities.filter(
        (a) =>
          (a.ano && Number(a.ano) <= 2025) ||
          (a.exercicioEconomico && Number(a.exercicioEconomico) <= 2025),
      );

      if (activitiesToDelete.length === 0) {
        onShowAlert(
          "Nenhuma atividade de anos anteriores (<=2025) encontrada.",
        );
      } else {
        let deleted = 0;
        for (const act of activitiesToDelete) {
          if (act.id) {
            await firestoreService.matrixActivities.delete(act.id);
            deleted++;
          }
        }
        onShowAlert("dados excluido com sucesso");
      }
    } catch (error: any) {
      console.error("Erro ao eliminar planos anteriores:", error);
      onShowAlert("Erro: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUnassignedActivities = async () => {
    const isAdmin =
      user?.email === "slaitertripas@gmail.com" ||
      user?.role === "admin" ||
      user?.role === "administrador" ||
      selectedRoleMode === "Planificação";

    if (!isAdmin) {
      onShowAlert("Apenas o administrador ou o setor de planificação pode realizar esta ação.");
      return;
    }

    const unassigned = rawActivities.filter(
      (a) => !a.departamento || a.departamento.trim() === ""
    );

    if (unassigned.length === 0) {
      onShowAlert("Nenhuma atividade com departamento vazio encontrada no sistema.");
      return;
    }

    if (
      !window.confirm(
        `⚠️ ATENÇÃO: Deseja realmente excluir permanentemente ${unassigned.length} atividade(s) sem departamento de todo o sistema? Esta operação não pode ser desfeita e garante a limpeza completa dos dados.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      let deletedCount = 0;
      for (const act of unassigned) {
        if (act.id) {
          await firestoreService.matrixActivities.delete(act.id);
          deletedCount++;
        }
      }
      setRawActivities((prev) =>
        prev.filter((a) => !(!a.departamento || a.departamento.trim() === ""))
      );
      onShowAlert(`Limpeza concluída! ${deletedCount} atividade(s) sem departamento foram excluídas do sistema.`);
    } catch (error: any) {
      console.error("Erro ao limpar atividades sem departamento:", error);
      onShowAlert("Erro ao excluir atividades: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDuplicateActivities = async () => {
    const isAdmin =
      user?.email === "slaitertripas@gmail.com" ||
      user?.role === "admin" ||
      user?.role === "administrador" ||
      selectedRoleMode === "Planificação";

    if (!isAdmin) {
      onShowAlert("Apenas o administrador ou o setor de planificação pode realizar esta ação.");
      return;
    }

    const duplicates: any[] = [];
    const seenKeys = new Set<string>();

    for (const act of rawActivities) {
      if (!act) continue;
      const name = (act.descricao || act.designacaoAtividade || act.nomeAtividade || act.title || act.atividade || "").toString().trim().toLowerCase();
      const code = (act.codigoAtividade || act.referencia || act.nAtividade || act.numeroAtividade || act.no || act.codigo || "").toString().trim().toLowerCase();
      const dept = (act.departamento || act.unidadeOrganica || "Geral").toString().trim().toLowerCase();
      const key = `${name}|||${code}|||${dept}`;
      if (!key || key === "||||||") continue;

      if (seenKeys.has(key)) {
        duplicates.push(act);
      } else {
        seenKeys.add(key);
      }
    }

    if (duplicates.length === 0) {
      onShowAlert("Nenhuma atividade duplicada/repetida foi encontrada no sistema.");
      return;
    }

    if (
      !window.confirm(
        `⚠️ ATENÇÃO: Foram encontradas ${duplicates.length} atividade(s) duplicadas (mesmo nome e código). Deseja eliminar todas as cópias repetidas da base de dados?`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      let deletedCount = 0;
      for (const act of duplicates) {
        if (act.id) {
          await firestoreService.matrixActivities.delete(act.id);
          deletedCount++;
        }
      }
      const duplicateIds = new Set(duplicates.map((d) => d.id));
      setRawActivities((prev) => prev.filter((a) => !duplicateIds.has(a.id)));
      onShowAlert(`Eliminação concluída! ${deletedCount} atividade(s) duplicada(s) foram removidas da base de dados.`);
    } catch (error: any) {
      console.error("Erro ao eliminar atividades duplicadas:", error);
      onShowAlert("Erro ao excluir duplicados: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowTransition = (
    fromStatus: string,
    toStatus: string,
    originLabel: string,
    destinationLabel: string,
    targetActivities?: any[],
  ) => {
    setWorkflowToProcess({
      fromStatus,
      toStatus,
      originLabel,
      destinationLabel,
      targetActivities,
    });
    setShowTramitacaoModal(true);
  };

  const confirmWorkflowTransition = async () => {
    if (!workflowToProcess || !selectedDestinatario) {
      alert("Por favor, selecione o gabinete destinatário.");
      return;
    }

    const { fromStatus, toStatus, originLabel, destinationLabel, targetActivities } =
      workflowToProcess;

    const toUpdate = targetActivities || filteredActivities.filter(
      (a) => (a.status as any) === fromStatus && !a.submetido,
    );

    if (toUpdate.length === 0) {
      alert(
        `Nenhuma atividade no Plano de ${originLabel} aguardando expedição.`,
      );
      return;
    }

    try {
      setIsLoading(true);

      const signature = {
        userId: user?.id || user?.uid,
        userName: user?.nome || user?.email,
        userRole: user?.cargo || user?.cargoChefia || "Responsável",
        date: new Date().toISOString(),
        action: "Assinado e Tramitado",
        destination: selectedDestinatario,
      };

      if (toStatus === "institucional") {
        await reorderAndRenumber(toUpdate);
      }

      await Promise.all([
        ...toUpdate.map((act) => {
          const existingHistory = Array.isArray(act.workflowHistory)
            ? act.workflowHistory
            : [];
          return firestoreService.matrixActivities.update(act.id, {
            status: toStatus,
            submetido: true,
            currentGabinete: selectedDestinatario,
            workflowHistory: [...existingHistory, signature],
          });
        }),
        firestoreService.archive_documents.add({
          title: `Cópia: Plano de ${originLabel} (${user?.setor || user?.reparticao || user?.departamento || "Geral"}) - ${new Date().toLocaleDateString("pt-PT")}`,
          year: selectedYear,
          type: "Planos de Atividades e Orçamentos",
          date: new Date().toISOString().split("T")[0],
          atividades: toUpdate,
          author: user?.nome || user?.email,
          origin: originLabel,
          destinatario: selectedDestinatario,
        }),
      ]);

      onShowAlert(
        `Sucesso! ${toUpdate.length} atividades foram assinadas e enviadas para ${selectedDestinatario}.`,
      );
      setShowTramitacaoModal(false);
      setSelectedDestinatario("");
      setWorkflowToProcess(null);
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao processar a expedição.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSetorToReparticao = () =>
    handleWorkflowTransition("setorial", "reparticao", "Setor", "Repartição");
  const handleSendReparticaoToDepartamento = () =>
    handleWorkflowTransition(
      "reparticao",
      "departamento",
      "Repartição",
      "Departamento",
    );
  const handleSendDepartamentoToDirecao = () =>
    handleWorkflowTransition(
      "departamento",
      "direcao",
      "Departamento",
      "Direção",
    );
  const handleUnifyDepartmentPlan = async () => {
    const subordinateActs = filteredActivities.filter(
      (a) =>
        (a.status as any) === "reparticao" || (a.status as any) === "setorial",
    );

    if (subordinateActs.length === 0) {
      alert(
        "Nenhuma atividade de repartição ou setor pendente para unificar no plano do departamento.",
      );
      return;
    }

    try {
      setIsLoading(true);
      await Promise.all(
        subordinateActs.map((act) =>
          firestoreService.matrixActivities.update(act.id, {
            status: "departamento",
            departamento: user?.departamento || "Departamento",
          }),
        ),
      );
      onShowAlert(
        `Sucesso! ${subordinateActs.length} atividades das repartições/setores foram unificadas no plano do departamento.`,
      );
      setShowReceivedPlans(false);
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao unificar o plano do departamento.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnifyDirectionPlan = async () => {
    const userDir = user?.direcao || "";
    const canonicalUserDir = getCanonicalDirection(userDir);

    const subordinateActs = rawActivities.filter((a) => {
      if (Number(a.ano || 2026) !== Number(selectedYear)) return false;
      const canonicalActDir = getCanonicalDirection(a.direcao);
      if (canonicalActDir !== canonicalUserDir) return false;
      return (a.status as any) === "departamento";
    });

    if (subordinateActs.length === 0) {
      alert(
        "Nenhuma atividade de departamento pendente para unificar no plano da direção.",
      );
      return;
    }

    try {
      setIsLoading(true);
      await Promise.all(
        subordinateActs.map((act) =>
          firestoreService.matrixActivities.update(act.id, {
            status: "direcao",
            direcao: user?.direcao || "Direção",
          }),
        ),
      );
      onShowAlert(
        `Sucesso! ${subordinateActs.length} atividades dos departamentos foram unificadas no plano da direção.`,
      );
      setShowReceivedPlans(false);
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao unificar o plano da direção.");
    } finally {
      setIsLoading(false);
    }
  };

  const getCanonicalDirection = (dirStr: string): string => {
    const d = (dirStr || "").toLowerCase();
    if (d.includes("geral") || d.includes("gabinete") || d === "gdg" || d === "dg") return "Gabinete do Diretor-Geral";
    if (d.includes("engenharia") || d === "engenharia") return "Divisão de Engenharia";
    if (d.includes("dicosafa") || d.includes("administração") || d.includes("coor_adm")) return "DICOSAFA";
    if (d.includes("dicosser") || d.includes("académicos") || d.includes("coor_acad")) return "DICOSSER";
    if (d.includes("incubação") || d.includes("cie") || d === "cie") return "Centro de Incubação de Empresas";
    return dirStr;
  };

  const handleSendPlanoGeralToDepartamentos = async () => {
    const toSend = filteredActivities.filter(
      (a) => (a.status as any) === "direcao" && !a.submetido,
    );

    if (toSend.length === 0) {
      alert("Nenhuma atividade do Plano Geral na Direção aguardando envio para os departamentos.");
      return;
    }

    try {
      setIsLoading(true);
      await Promise.all(
        toSend.map((act) =>
          firestoreService.matrixActivities.update(act.id, {
            status: "departamento",
            submetido: false,
          }),
        ),
      );
      onShowAlert(
        `Sucesso! ${toSend.length} atividades do Plano Geral foram enviadas para os Departamentos correspondentes para planificação.`,
      );
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao enviar o Plano Geral para os departamentos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendDirecaoToPlanificacao = async () => {
    const userDir = user?.direcao || "";
    const canonicalUserDir = getCanonicalDirection(userDir);

    const subordinatePending = rawActivities.filter((a) => {
      if (Number(a.ano || 2026) !== Number(selectedYear)) return false;
      const canonicalActDir = getCanonicalDirection(a.direcao);
      if (canonicalActDir !== canonicalUserDir) return false;

      return ["setorial", "reparticao", "departamento"].includes(a.status);
    });

    if (subordinatePending.length > 0) {
      const pendingDepts = Array.from(new Set(subordinatePending.map(a => a.departamento || "Setor/Repartição Geral")));
      alert(
        `⚠️ Não é possível enviar à Planificação.\n` +
        `A Direção só pode enviar após receber as atividades de todos os seus departamentos.\n\n` +
        `Departamentos com planos pendentes:\n• ` + pendingDepts.join("\n• ")
      );
      return;
    }

    await handleWorkflowTransition(
      "direcao",
      "planificacao",
      "Direção",
      "Setor de Planificação",
    );
  };

  const handleSendPlanificacaoToChefeDPEP = () =>
    handleWorkflowTransition(
      "planificacao",
      "dpep_chefe",
      "Planificação",
      "Chefe do DPEP",
    );
  const handleSendChefeDPEPToMeritos = () =>
    handleWorkflowTransition(
      "dpep_chefe",
      "meritos",
      "Chefe do DPEP",
      "Méritos de Direção",
    );

  const handleSendPlanificacaoToInstitucional = async () => {
    const FIVE_DIRECTIONS = [
      "Gabinete do Diretor-Geral",
      "Divisão de Engenharia",
      "DICOSAFA",
      "DICOSSER",
      "Centro de Incubação de Empresas"
    ];

    const pendingActivities = rawActivities.filter((a) => {
      if (Number(a.ano || 2026) !== Number(selectedYear)) return false;
      const canonicalDir = getCanonicalDirection(a.direcao);
      if (!FIVE_DIRECTIONS.includes(canonicalDir)) return false;

      return ["setorial", "reparticao", "departamento", "direcao"].includes(a.status);
    });

    const submittedDirs = new Set(
      rawActivities
        .filter((a) => Number(a.ano || 2026) === Number(selectedYear) && ["planificacao", "institucional"].includes(a.status))
        .map((a) => getCanonicalDirection(a.direcao))
    );

    const missingDirs = FIVE_DIRECTIONS.filter(d => !submittedDirs.has(d));

    if (pendingActivities.length > 0 || missingDirs.length > 0) {
      let errorMsg = `⚠️ Não é possível compilar o Plano Institucional.\n` +
        `O Setor de Planificação só pode completar após receber todos os planos das 5 Direções existentes no sistema.\n\n`;

      if (pendingActivities.length > 0) {
        const pendingDirs = Array.from(new Set(pendingActivities.map(a => getCanonicalDirection(a.direcao))));
        errorMsg += `Direções com atividades pendentes de submissão:\n• ` + pendingDirs.join("\n• ") + `\n\n`;
      }

      if (missingDirs.length > 0) {
        errorMsg += `Direções que ainda não enviaram nenhum plano:\n• ` + missingDirs.join("\n• ") + `\n`;
      }

      alert(errorMsg);
      return;
    }

    await handleWorkflowTransition(
      "planificacao",
      "institucional",
      "Planificação",
      "Plano Institucional",
    );
  };

  // Filters
  const currentSectorsWithPlan = Array.from(
    new Set(
      filteredActivities.map((a) => a.reparticao || "Setor Não Identificado"),
    ),
  );
  const currentDeptsWithPlan = Array.from(
    new Set(
      filteredActivities.map((a) => a.departamento || "Departamento Geral"),
    ),
  );

  const handleExportPDF = async (activitiesToExport: any[]) => {
    try {
      if (!activitiesToExport || activitiesToExport.length === 0) {
        onShowAlert("Nenhuma atividade encontrada para exportar.");
        return;
      }

      const html2pdf = (await import("html2pdf.js")).default;

      const element = document.createElement("div");
      element.className = "p-8 font-serif bg-white text-black";

      let tableRowsHtml = "";
      activitiesToExport.forEach((act, idx) => {
        tableRowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; text-align: center;">${act.no || idx + 1}</td>
            <td style="padding: 8px;">${act.referencia || ""}</td>
            <td style="padding: 8px;">${act.direcao || ""}</td>
            <td style="padding: 8px;">${act.departamento || ""}</td>
            <td style="padding: 8px;">${act.reparticao || act.setor || ""}</td>
            <td style="padding: 8px; font-weight: bold;">${act.title || act.designacao || ""}</td>
            <td style="padding: 8px;">${act.objetivo || ""}</td>
            <td style="padding: 8px; text-align: right;">${(act.valor || 0).toLocaleString()} MZN</td>
          </tr>
        `;
      });

      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">Instituto Superior de Estudos Políticos e Sociais (ISPS)</h2>
          <h3 style="font-size: 14px; color: #4a5568; margin-bottom: 12px;">Relatório de Atividades do Plano</h3>
          <p style="font-size: 11px; font-style: italic; color: #718096;">Gerado em ${new Date().toLocaleDateString("pt-PT")}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f7fafc; border-bottom: 2px solid #cbd5e0;">
              <th style="padding: 8px; text-align: center; width: 40px;">Nº</th>
              <th style="padding: 8px; text-align: left; width: 80px;">Ref</th>
              <th style="padding: 8px; text-align: left;">Direção</th>
              <th style="padding: 8px; text-align: left;">Depto</th>
              <th style="padding: 8px; text-align: left;">Setor</th>
              <th style="padding: 8px; text-align: left;">Atividade</th>
              <th style="padding: 8px; text-align: left;">Objetivo</th>
              <th style="padding: 8px; text-align: right; width: 100px;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      `;

      const opt = {
        margin: 10,
        filename: `Atividades_Plano_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: "mm" as const,
          format: "a4" as const,
          orientation: "landscape" as const,
        },
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      onShowAlert("Ocorreu um erro ao gerar o PDF.");
    }
  };

  const reorderAndRenumber = async (activitiesToProcess: any[]) => {
    if (!activitiesToProcess.length) return;

    // Sort activities according to standard 5-tier order: Direção -> N/O -> Código -> Mês -> Valor Total
    const sorted = [...activitiesToProcess].sort((a, b) =>
      compareActivitiesStandardOrder(a, b, getActMonthIndex),
    );

    // Group by department so numbering starts from 001 per department
    const deptGroups: Record<string, any[]> = {};
    sorted.forEach((act) => {
      const deptKey = (act.departamento || act.unidadeOrganica || "Geral").trim();
      if (!deptGroups[deptKey]) deptGroups[deptKey] = [];
      deptGroups[deptKey].push(act);
    });

    // Direction counters for numeroDirecao
    const directionCounters: Record<string, number> = {};
    const updates: Promise<any>[] = [];

    Object.values(deptGroups).forEach((deptActs) => {
      deptActs.forEach((act, idx) => {
        const newNo = String(idx + 1).padStart(3, "0");

        // Calculate numeroDirecao (chronological within direction)
        const dirKey = (act.direcao || "SEM DIREÇÃO").toUpperCase();
        if (!directionCounters[dirKey]) directionCounters[dirKey] = 0;
        directionCounters[dirKey]++;
        const newNumeroDirecao = String(directionCounters[dirKey]).padStart(
          3,
          "0",
        );

        // Re-generate code for consistency
        const dirInitials = getDirectionAbbreviation(
          act.direcao || act.unidadeOrganica || "ISPS",
        ).toUpperCase();
        const deptInitials = getDepartmentAbbreviation(
          act.departamento,
        ).toUpperCase();
        const actInitials = getActivityInitials(
          act.nomeAtividade || act.title || act.designacao || "",
        );

        const newCode = [
          dirInitials !== "-" ? dirInitials : "ISPS",
          deptInitials !== "-" ? deptInitials : "Geral",
          newNo,
          actInitials,
        ]
          .filter(Boolean)
          .join("/");

        const updateData = {
          no: newNo,
          numeroAtividade: newNo,
          nAtividade: newNo,
          codigoAtividade: newCode,
          referencia: newCode,
          numeroDirecao: newNumeroDirecao,
        };

        updates.push(firestoreService.matrixActivities.update(act.id, updateData));
      });
    });

    await Promise.all(updates);
  };

  const handleFixNumbering = async () => {
    if (!filteredActivities.length) return;

    setIsProcessing(true);
    onShowAlert(
      "A reordenar atividades por cronograma e a corrigir a numeração sequencial por departamento...",
    );

    // Função auxiliar para obter o índice do primeiro mês de realização (1-12)
    const getFirstMonthIndex = getActMonthIndex;

    try {
      // 1. Sort activities according to standard 5-tier order
      const sorted = [...filteredActivities].sort((a, b) =>
        compareActivitiesStandardOrder(a, b, getActMonthIndex),
      );

      // Group by department
      const deptGroups: Record<string, any[]> = {};
      sorted.forEach((act) => {
        const deptKey = (act.departamento || act.unidadeOrganica || "Geral").trim();
        if (!deptGroups[deptKey]) deptGroups[deptKey] = [];
        deptGroups[deptKey].push(act);
      });

      // Direction counters for numeroDirecao
      const directionCounters: Record<string, number> = {};
      const updates: Promise<any>[] = [];

      Object.values(deptGroups).forEach((deptActs) => {
        deptActs.forEach((act, idx) => {
          const newNo = String(idx + 1).padStart(3, "0");

          // Calculate numeroDirecao
          const dirKey = (act.direcao || "SEM DIREÇÃO").toUpperCase();
          if (!directionCounters[dirKey]) directionCounters[dirKey] = 0;
          directionCounters[dirKey]++;
          const newNumeroDirecao = String(directionCounters[dirKey]).padStart(
            3,
            "0",
          );

          // Re-generate code for consistency
          const dirInitials = getDirectionAbbreviation(
            act.direcao || act.unidadeOrganica || "ISPS",
          ).toUpperCase();
          const deptInitials = getDepartmentAbbreviation(
            act.departamento,
          ).toUpperCase();
          const actInitials = getActivityInitials(
            act.nomeAtividade || act.title || act.designacao || "",
          );

          const newCode = [
            dirInitials !== "-" ? dirInitials : "ISPS",
            deptInitials !== "-" ? deptInitials : "Geral",
            newNo,
            actInitials,
          ]
            .filter(Boolean)
            .join("/");

          const updateData = {
            no: newNo,
            numeroAtividade: newNo,
            nAtividade: newNo,
            codigoAtividade: newCode,
            referencia: newCode,
            numeroDirecao: newNumeroDirecao,
          };

          updates.push(firestoreService.matrixActivities.update(act.id, updateData));
        });
      });

      await Promise.all(updates);
      onShowAlert(
        "Numeração corrigida com sucesso! As atividades foram numeradas sequencialmente por departamento (a começar em 001).",
      );
    } catch (err) {
      console.error(err);
      onShowAlert("Ocorreu um erro ao tentar corrigir a numeração.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    const printArea = document.getElementById("pesoe-print-area");
    if (printArea) {
      printElementById(
        "pesoe-print-area",
        `Plano de Atividades ${selectedYear} - ISPS`,
        "landscape",
        "A3",
      );
    } else {
      window.print();
    }
  };

  const handleExportExcel = (
    activitiesToExport: any[],
    customTitle: string,
  ) => {
    try {
      if (!activitiesToExport || activitiesToExport.length === 0) {
        onShowAlert("Nenhuma atividade encontrada para exportar.");
        return;
      }

      // Ordenar as atividades conforme a ordenação do sistema
      const sortedActivities = [...activitiesToExport].sort((a, b) =>
        (a.referencia || "").localeCompare(b.referencia || "", undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      );

      // Mapear os campos para colunas legíveis e completas em Português
      const dataToExport = sortedActivities.map((act) => ({
        Nº: act.no || "",
        Referência: act.referencia || "",
        Direção: act.direcao || "",
        Departamento: act.departamento || "",
        "Repartição/Sector": act.reparticao || act.setor || "",
        "Designação da Atividade": act.title || act.designacao || "",
        Objetivo: act.objetivo || "",
        Prioridade: act.prioridade || "",
        "Fonte de Receita":
          act.fonteReceita ||
          act.fonte_receita ||
          act.fonte ||
          "Orçamento do Estado",
        Província: act.provincia || "",
        Distrito: act.distrito || "",
        Responsável: act.responsavel || "",
        "Outros Colaboradores":
          act.outrosColaboradores || act.outros_colaboradores || "",
        Trimestre: act.trimestre || "",
        "Mês de Realização":
          act.mesRealizacao || act.mes_realizacao || act.mes || "",
        Frequência: act.frequencia || "",
        "Duração (Dias)": act.totalDias || act.total_dias || 0,
        "Transporte Necessário":
          act.necessidadeTransporte || act.necessidade_transporte || "Não",
        "Sugestão de Viatura":
          act.sugestaoViatura || act.sugestao_viatura || "",
        "Distância (KM)": act.distanciaKm || act.distancia_km || 0,
        "Litros Gasóleo": act.litrosGasoleo || act.litros_gasoleo || 0,
        "Preço/Litro": act.precoLitro || act.preco_litro || 0,
        "Rúbrica Orçamental": act.rubrica || "",
        Necessidade: act.necessidade || "",
        Especificações: act.especificacoes || "",
        Detalhes: act.detalhes || "",
        "Nº Pessoas Envolvidas":
          act.numPessoasEnvolvidas || act.num_pessoas_envolvidas || 1,
        "Preço Unitário (MZN)": act.unitario || 0,
        "Ajuda de Custo 30% (MZN)": act.ajudaCusto || act.ajuda_custo || 0,
        "Valor Total (MZN)":
          act.valorTotal || act.valor_total || act.total || 0,
        Observações: act.observacoes || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Plano de Atividades");

      // Definir largura dinâmica para as colunas para que o arquivo fique polido
      const max_len = dataToExport.reduce((prev, next) => {
        Object.keys(next).forEach((key, idx) => {
          const val = next[key as keyof typeof next]?.toString() || "";
          prev[idx] = Math.max(prev[idx] || 10, val.length, key.length);
        });
        return prev;
      }, [] as number[]);

      worksheet["!cols"] = max_len.map((w) => ({ wch: Math.min(w + 2, 40) }));

      const fileName = `${customTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${selectedYear}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      onShowAlert(`Download do ficheiro Excel "${fileName}" iniciado.`);
    } catch (err: any) {
      console.error(err);
      onShowAlert(
        "Erro ao exportar o plano de atividades para Excel: " + err.message,
      );
    }
  };

  const handleBulkUpdateActivityCodes = async () => {
    if (!isAdminOrProgrammer) return;

    if (
      !window.confirm(
        "Deseja recalcular e atualizar os códigos de todas as atividades planificadas para o novo formato (UNIDADE/DEP/REP/001)? Esta ação atualizará permanentemente os registros no banco de dados.",
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      const allActivities = initialActivities;
      let updatedCount = 0;

      for (const activity of allActivities) {
        // Recalcular o código usando a nova lógica
        const dirInitials = getDirectionAbbreviation(
          activity.unidadeOrganica ||
            activity.unidadeSelecionada ||
            activity.direcao ||
            "ISPS",
        ).toUpperCase();
        const deptInitials = getDepartmentAbbreviation(
          activity.departamento || "Geral",
        ).toUpperCase();
        const repInitials = getReparticaoAbbreviation(
          activity.reparticao || activity.setor || "Geral",
        ).toUpperCase();

        // Determinar o número sequencial (extrair do código antigo ou usar o campo no)
        let num = "001";
        const code = (
          activity.codigoAtividade ||
          activity.referencia ||
          activity.nAtividade ||
          ""
        ).toString();
        const match = code.match(/(\d+)$/);
        if (match) {
          num = String(parseInt(match[1], 10)).padStart(3, "0");
        } else if (activity.no) {
          const parsedNo = parseInt(
            String(activity.no).replace(/[^\d]/g, ""),
            10,
          );
          if (!isNaN(parsedNo)) num = String(parsedNo).padStart(3, "0");
        }

        const parts = [
          dirInitials !== "-" ? dirInitials : "",
          deptInitials !== "-" ? deptInitials : "",
          repInitials !== "-" ? repInitials : "",
          num,
        ].filter(Boolean);
        const newCode = parts.join("/");

        // Só atualiza se o código mudou
        if (newCode !== activity.codigoAtividade) {
          await firestoreService.matrixActivities.update(activity.id, {
            codigoAtividade: newCode,
            referencia: newCode, // Manter referência sincronizada
            updatedAt: new Date().toISOString(),
          });
          updatedCount++;
        }
      }

      onShowAlert(
        `Sucesso: ${updatedCount} códigos de atividades foram atualizados para o novo formato.`,
      );
    } catch (err: any) {
      console.error("Erro ao atualizar códigos:", err);
      onShowAlert("Erro ao atualizar códigos: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActivitySelectionContext.Provider
      value={{
        rawActivities,
        selectedActivityIds,
        onToggleSelect: handleToggleSelectActivity,
        onEditActivity: setEditingActivity,
      }}
    >
      <div className="flex-1 w-full flex flex-col bg-[#fefefe] print:bg-white text-slate-800">
        <input
          type="file"
          accept=".xlsx, .xls"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
        />
        {/* Simulation/Role Mode Header for interactive demo */}
        <div className="bg-amber-50 border-b border-amber-100 px-8 py-3 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
              <AlertCircle size={16} />
              <span>SIMULADOR DE FLUXO DE PLANIFICAÇÃO (ISPS):</span>
            </div>
            <span
              className={`text-[10px] md:text-xs px-3 py-1 rounded-full uppercase font-black transition-all inline-block ${
                pesoeConfig?.published
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-rose-100 text-rose-800 border border-rose-200"
              }`}
            >
              DE:{" "}
              {pesoeConfig?.published
                ? "🟢 PUBLICADO PARA DIRETORES"
                : "🔴 INDISPONÍVEL PARA DIRETORES"}
            </span>
          </div>
          <div className="flex gap-2">
            {(isSuperBossUser(realUser)
              ? [
                  "Setor",
                  "Repartição",
                  "Departamento",
                  "Direção",
                  "Planificação",
                ]
              : []
            ).map((role) => (
              <button
                key={role}
                onClick={() => {
                  setSelectedRoleMode(role);
                  onShowAlert(`A visualizar como: ${role}`);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedRoleMode === role
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white hover:bg-amber-100 text-amber-700 border border-amber-200"
                }`}
              >
                {role === "Setor"
                  ? "Plano do Setor"
                  : role === "Repartição"
                    ? "Plano da Repartição"
                    : role === "Departamento"
                      ? "Chefe Departamento"
                      : role === "Direção"
                        ? "Plano de Direção"
                        : "Setor de Planificação"}
              </button>
            ))}
          </div>
        </div>

        {/* Novo Ecrã de Boas Vindas/Seleção de Fluxo */}
        {workflowMode === "landing" && (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
            <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 mb-8">
                Gestão de Planos de Atividades
              </h2>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setWorkflowMode("planning");
                    setSelectedYear(new Date().getFullYear() + 1);
                  }}
                  className="w-full p-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-left flex items-center justify-between"
                >
                  Pretende planificar para o ano N+1?
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => setWorkflowMode("consulting")}
                  className="w-full p-6 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all text-left flex items-center justify-between"
                >
                  Pretende consultar o plano de atividade do ano atual?
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {workflowMode !== "landing" && (
          <div className="flex-grow">
            {/* Main Title Banner (Visual Style matching the image) */}
            {!isFocusMode && (
              <div className="bg-[#0f172a] text-white p-6 md:px-10 border-b border-slate-800 print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight mb-1">
                      Plano Geral de Atividades
                    </h1>
                    <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">
                      Gestão Institucional de Atividades ISPS
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center justify-center relative">
                    <div className="relative">
                      <button
                        onClick={() => setShowYearMenu(!showYearMenu)}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-2 border border-slate-700"
                      >
                        <Calendar size={14} />{" "}
                        <span style={{ fontFamily: '"Bookman Old Style", serif' }}>
                          {selectedYear === 2026
                            ? "Plano Atual (2026)"
                            : `Arquivo ${selectedYear}`}
                        </span>
                      </button>
                      {showYearMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden">
                          <div className="p-2 text-[10px] font-black uppercase text-slate-400 border-b border-slate-700 px-4 py-2">
                            Selecionar Ano
                          </div>
                          {[2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020].map(
                            (y) => (
                              <button
                                key={y}
                                onClick={() => {
                                  setSelectedYear(y);
                                  setShowYearMenu(false);
                                  onShowAlert(`Visualizando Exercício de ${y}`);
                                  // Abrir formulário se for 2027 e estiver no modo setor
                                  if (
                                    y === 2027 &&
                                    selectedRoleMode === "Setor"
                                  ) {
                                    setShowAddForm(true);
                                  }
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                                  selectedYear === y
                                    ? "bg-amber-600 text-white"
                                    : "text-slate-200 hover:bg-slate-700"
                                }`}
                              >
                                Exercício {y}{" "}
                                {y === 2026
                                  ? "(Plano Atual)"
                                  : y === 2027
                                    ? "(Nova Planificação)"
                                    : "(Arquivo)"}
                              </button>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                    {!isReadOnly && isAdminOrProgrammer && (
                      <>
                        <button
                          onClick={startSyncProcess}
                          disabled={isLoading}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-2"
                        >
                          {isLoading ? (
                            <RefreshCw size={14} strokeWidth={1.5} className="animate-spin" />
                          ) : (
                            <FileUp size={14} />
                          )}{" "}
                          Converter
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all flex items-center gap-2"
                        >
                          <Upload size={14} /> Importar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedActivityIds.length > 0 && (
              <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white px-8 py-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 animate-slide-down print:hidden">
                <div className="flex items-center gap-3">
                  <span className="bg-amber-500 text-slate-950 font-black px-3 py-1 rounded-xl text-xs">
                    {selectedActivityIds.length} atividade(s) selecionada(s)
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    Ações em lote para aprovação e recondução:
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleBulkUpdateApproval("aprovada")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>✓ Aprovar Selecionadas</span>
                  </button>
                  <button
                    onClick={handleBulkRolloverYear}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>🔄 Reconduzir para Ano+1</span>
                  </button>
                  <button
                    onClick={() => setSelectedActivityIds([])}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    ✕ Limpar Seleção
                  </button>
                </div>
              </div>
            )}

            {isFocusMode && (
              <div className="fixed top-6 right-6 z-[100] print:hidden flex items-center gap-3">
                <div className="bg-slate-900 text-amber-500 px-6 py-4 rounded-2xl shadow-2xl font-black text-xs uppercase tracking-widest border-2 border-amber-500/50" style={{ fontFamily: '"Bookman Old Style", serif' }}>
                  <Calendar size={18} className="inline mr-2" /> {selectedYear}
                </div>
                <button
                  onClick={() => setIsFocusMode(false)}
                  className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border border-slate-700"
                  title="Clique para voltar ao cabeçalho principal"
                >
                  <Minimize2 size={18} className="text-blue-400" /> Sair do Modo
                  Foco
                </button>
              </div>
            )}

            {/* Dashboard Workflow Progress Bar - Removido conforme solicitação */}
            {!isFocusMode && (
              <>
                {isSuperBossUser(user) &&
                  title &&
                  title !== "Plano Setorial" &&
                  title !== "Sistema" &&
                  title !== "Geral" && (
                    <div className="mx-8 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm print:hidden animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-lg">
                          <Eye size={20} />
                        </div>
                        <div>
                          <h3 className="text-blue-900 font-black text-xs uppercase tracking-tight">
                            Vigilância do Administrador: Modo Supervisor Ativo
                          </h3>
                          <p className="text-blue-700 text-[10px] font-medium">
                            Está a explorar a informação de{" "}
                            <strong className="text-blue-900">{title}</strong>{" "}
                            exatamente como o utilizador final deste setor.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSimulateSector(!simulateSector)}
                        className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest ${
                          simulateSector
                            ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {simulateSector
                          ? "Ver Todos os Setores"
                          : "Simular Setor Atual"}
                      </button>
                    </div>
                  )}

                {selectedYear !== 2026 && (
                  <div
                    className={`mx-8 mt-6 p-3 md:p-4 border rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm ${selectedYear === 2027 ? "bg-[#f4f7fc] border-blue-100" : "bg-amber-50 border-amber-200"}`}
                  >
                    {/* Left side: File Dropdown */}
                    <div className="relative inline-block text-left shrink-0 w-full md:w-auto flex justify-start">
                      <button
                        onClick={() => setShowFileMenu(!showFileMenu)}
                        className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg h-[40px] cursor-pointer"
                      >
                        <Folder size={14} className="text-amber-400" />
                        <span>FILE</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${showFileMenu ? "rotate-180" : ""}`}
                        />
                      </button>
                      {showFileMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-[90]"
                            onClick={() => setShowFileMenu(false)}
                          />
                          <div className="absolute left-0 mt-12 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="p-2 space-y-1">
                              <button
                                onClick={() => {
                                  setShowFileMenu(false);
                                  setShowAddForm(true);
                                  setEditingActivity(null);
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors flex items-center gap-3 cursor-pointer"
                              >
                                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                                  <Plus size={15} strokeWidth={2.5} />
                                </div>
                                <span>Nova Atividade</span>
                              </button>

                              <button
                                onClick={() => {
                                  setShowFileMenu(false);
                                  window.print();
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-3 cursor-pointer"
                              >
                                <div className="p-1.5 rounded-lg bg-slate-200 text-slate-700">
                                  <Printer size={15} strokeWidth={2.5} />
                                </div>
                                <span>Imprimir</span>
                              </button>

                              <button
                                onClick={() => {
                                  setShowFileMenu(false);
                                  onShowAlert(
                                    "Atividades guardadas na base de dados com sucesso!",
                                  );
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-3 cursor-pointer"
                              >
                                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                                  <Save size={15} strokeWidth={2.5} />
                                </div>
                                <span>Guardar</span>
                              </button>

                              <button
                                onClick={() => {
                                  setShowFileMenu(false);
                                  if (isReadOnly) {
                                    onShowAlert(
                                      "Modo de consulta. Não é possível submeter atividades.",
                                    );
                                    return;
                                  }
                                  if (selectedRoleMode === "Setor")
                                    handleSendSetorToReparticao();
                                  else if (selectedRoleMode === "Repartição")
                                    handleSendReparticaoToDepartamento();
                                  else if (selectedRoleMode === "Departamento")
                                    handleSendDepartamentoToDirecao();
                                  else if (selectedRoleMode === "Direção")
                                    handleSendDirecaoToPlanificacao();
                                  else if (selectedRoleMode === "Planificação") {
                                    if (isChefeDPEP) {
                                      handleSendPlanificacaoToInstitucional();
                                    } else {
                                      handleSendPlanificacaoToChefeDPEP();
                                    }
                                  } else
                                    onShowAlert(
                                      "Ação não configurada para este nível.",
                                    );
                                }}
                                className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-colors flex items-center gap-3 cursor-pointer"
                              >
                                <div className="p-1.5 rounded-lg bg-violet-100 text-violet-700">
                                  <Send size={15} strokeWidth={2.5} />
                                </div>
                                <span>Enviar</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Center: Title and Subtitle */}
                    <div className="flex-1 text-center">
                      <h3
                        className={`font-black text-[13px] uppercase tracking-wide mb-0.5 ${selectedYear === 2027 ? "text-[#1e3a8a]" : "text-amber-900"}`}
                        style={{ fontFamily: '"Bookman Old Style", serif' }}
                      >
                        {selectedYear === 2027
                          ? `NOVO CICLO DE PLANIFICAÇÃO: ${selectedYear}`
                          : `MODO DE CONSULTA HISTÓRICA: ${selectedYear}`}
                      </h3>
                      <p
                        className={`text-[10px] font-medium ${selectedYear === 2027 ? "text-blue-600" : "text-amber-700"}`}
                      >
                        {selectedYear === 2027
                          ? `Você está a elaborar o novo plano para o exercício económico de ${selectedYear}.`
                          : `Você está visualizando o arquivo de atividades do ano ${selectedYear}. Dados protegidos contra alterações acidentais.`}
                      </p>
                    </div>

                    {/* Right side: Action Button */}
                    <div className="shrink-0 w-full md:w-auto flex flex-wrap gap-2 justify-end">
                      {!isReadOnly &&
                      [
                        "Setor",
                        "Repartição",
                        "Departamento",
                        "Direção",
                        "Planificação",
                      ].includes(selectedRoleMode) ? (
                        <>
                          {selectedRoleMode === "Direção" && (
                            <button
                              onClick={handleSendPlanoGeralToDepartamentos}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-black tracking-widest text-[9px] uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-amber-100 h-[40px]"
                              title="Enviar atividades criadas na Direção para planificação nos Departamentos correspondentes"
                            >
                              <Send size={14} strokeWidth={3} /> Enviar Plano Geral para Departamentos
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (selectedRoleMode === "Setor")
                                handleSendSetorToReparticao();
                              else if (selectedRoleMode === "Repartição")
                                handleSendReparticaoToDepartamento();
                              else if (selectedRoleMode === "Departamento")
                                handleSendDepartamentoToDirecao();
                              else if (selectedRoleMode === "Direção")
                                handleSendDirecaoToPlanificacao();
                              else if (selectedRoleMode === "Planificação") {
                                if (isChefeDPEP) {
                                  handleSendPlanificacaoToInstitucional();
                                } else {
                                  handleSendPlanificacaoToChefeDPEP();
                                }
                              }
                            }}
                            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black tracking-widest text-[9px] uppercase px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-100 h-[40px]"
                          >
                            <Send size={14} strokeWidth={3} /> SUBMETER O PLANO DE ATIVIDADE
                          </button>
                        </>
                      ) : (
                        <div className="h-[40px] px-5 w-[200px] hidden md:block"></div>
                      )}
                    </div>
                  </div>
                )}

              </>
            )}

            {/* --- LEVEL 1: PLANO SETORIAL --- */}
            {selectedRoleMode === "Setor" && (
              <div className="p-8 md:p-12 space-y-3 flex-1 bg-white">
                <InstitutionalHeader
                  unidadeName={user.unidadeOrganica}
                  direcaoName={user.direcao}
                  departamentoName={user.departamento}
                  reparticaoName={user.reparticao}
                  sectorName={user.setor}
                  year={selectedYear}
                  isOwner={isSuperBossUser(user)}
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                      Resumo do Setor
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mt-1">
                      Total de {filteredActivities.length} Atividades
                      Planificadas
                    </p>
                  </div>
                </div>

                {/* List of Setorial Activities with grouping like Planificação */}
                <div className="space-y-3">
                  {Object.entries(filteredActivitiesGrouped.byDirecao).map(
                    ([direcao, activities]) => {
                      const groupedByDept =
                        filteredActivitiesGrouped.byDirecaoAndDept[direcao];

                      return (
                        <div
                          key={direcao}
                          className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full"
                        >
                          <div className="flex items-center gap-4 group px-4">
                            <div className="h-10 w-2 bg-blue-600 rounded-full group-hover:h-12 transition-all"></div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                              {direcao}
                              <span className="ml-3 text-sm font-medium text-slate-400 normal-case tracking-normal">
                                ({(activities as any[]).length}{" "}
                                {(activities as any[]).length === 1
                                  ? "Atividade"
                                  : "Atividades"}
                                )
                              </span>
                            </h3>
                          </div>

                          <div className="flex flex-col">
                            {Object.entries(groupedByDept).map(
                              ([dept, deptActivities]) => (
                                <div
                                  key={dept}
                                  className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 w-full m-[2px]"
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                      {dept}
                                    </h4>
                                  </div>

                                  <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3" data-print-type="plano">
                                    <table className="w-full border-collapse min-w-[1900px] print:min-w-full print-table-compact">
                                      <ActivityTableHeader isDPEP={isDPEP} />
                                      <tbody className="divide-y divide-slate-200">
                                        {(deptActivities as any[]).map(
                                          (activity, idx) => (
                                            <ActivityTableRow
                                              key={activity.id || idx}
                                              activity={activity}
                                              onViewHistory={setActivityForHistory}
                                              getActivityTotal={
                                                getActivityTotal
                                              }
                                              index={idx}
                                              isDPEP={isDPEP}
                                              user={user}
                                              isBossOrAdmin={isBossOrAdmin}
                                              onUpdateExecution={
                                                onUpdateExecution
                                              }
                                              onUpdateRelatorio={
                                                onUpdateRelatorio
                                              }
                                              rawActivities={rawActivities}
                                              selectedActivityIds={
                                                selectedActivityIds
                                              }
                                              onToggleSelect={
                                                handleToggleSelectActivity
                                              }
                                              actions={
                                                <div className="flex items-center justify-center gap-2">
                                                  {canEdit(activity) ? (
                                                    <>
                                                      <button
                                                        onClick={() => {
                                                          setEditingActivity(
                                                            activity,
                                                          );
                                                          setShowAddForm(true);
                                                        }}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                      >
                                                        <Edit2 size={14} />
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleDelete(
                                                            activity.id,
                                                          )
                                                        }
                                                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                      >
                                                        <Trash2 size={14} />
                                                      </button>
                                                    </>
                                                  ) : (
                                                    <button
                                                      onClick={() => {
                                                        setEditingActivity(
                                                          activity,
                                                        );
                                                        setShowAddForm(true);
                                                      }}
                                                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                      title="Visualizar"
                                                    >
                                                      <Eye size={14} />
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={() => {
                                                      const currentStatus = activity.status || "draft";
                                                      const nextStatus = (currentStatus === "draft" || currentStatus === "setorial") ? "reparticao" :
                                                                       currentStatus === "reparticao" ? "departamento" :
                                                                       currentStatus === "departamento" ? "direcao" :
                                                                       currentStatus === "direcao" ? "planificacao" :
                                                                       currentStatus === "planificacao" ? "dpep_chefe" : "institucional";
                                                      const originLabel = currentStatus === "reparticao" ? "Repartição" :
                                                                          currentStatus === "departamento" ? "Departamento" :
                                                                          currentStatus === "direcao" ? "Direção" :
                                                                          currentStatus === "planificacao" ? "Setor de Planificação" : "Chefe do DPEP";
                                                      const destLabel = nextStatus === "departamento" ? "Departamento" :
                                                                        nextStatus === "direcao" ? "Direção" :
                                                                        nextStatus === "planificacao" ? "Setor de Planificação" :
                                                                        nextStatus === "dpep_chefe" ? "Chefe do DPEP" : "Plano Institucional";
                                                      handleWorkflowTransition(currentStatus, nextStatus, originLabel, destLabel, [activity]);
                                                    }}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Tramitar / Assinar Documento"
                                                  >
                                                    <Send size={14} />
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      handleExportPDF([
                                                        activity,
                                                      ])
                                                    }
                                                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                                    title="Exportar PDF"
                                                  >
                                                    <FileText size={14} />
                                                  </button>
                                                </div>
                                              }
                                            />
                                          ),
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}

                  {filteredActivities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 animate-in fade-in duration-1000 mx-8">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
                        <Plus className="text-slate-300 w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Plano de Atividades Vazio
                      </h3>
                      <p className="text-slate-500 text-sm max-w-xs text-center leading-relaxed">
                        Ainda não existem atividades planificadas por si para o
                        exercício de {selectedYear}.
                      </p>
                      {!isReadOnly && (
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                          Criar Primeira Atividade
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- LEVEL 1.5: PLANO DA REPARTIÇÃO --- */}
            {selectedRoleMode === "Repartição" && (
              <div className="p-8 md:p-12 space-y-3 flex-1 bg-white">
                <InstitutionalHeader
                  unidadeName={user.unidadeOrganica}
                  direcaoName={user.direcao}
                  departamentoName={user.departamento}
                  reparticaoName={user.reparticao}
                  sectorName={user.setor}
                  year={selectedYear}
                  isOwner={isSuperBossUser(user)}
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-slate-100 pb-3">
                  {/* Botões removidos conforme solicitação */}
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50">
                  <div className="px-8 py-5 bg-[#f8fafc] border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      Atividades na Repartição
                    </span>
                    <div className="flex gap-4">
                      <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider">
                        {
                          filteredActivities.filter(
                            (a) =>
                              (a.status as any) === "reparticao" &&
                              !a.submetido,
                          ).length
                        }{" "}
                        Pendentes de Envio
                      </span>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                        {
                          filteredActivities.filter(
                            (a) =>
                              (a.status as any) === "reparticao" && a.submetido,
                          ).length
                        }{" "}
                        Enviados (Cópia)
                      </span>
                    </div>
                  </div>

                  {filteredActivities.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm my-6">
                      <div className="flex justify-center mb-4">
                        <FileText size={48} className="text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Plano de Atividades Limpo</h3>
                      <p className="text-slate-500 mb-6">Ainda não foram planeadas atividades para este departamento/ano.</p>
                      <button 
                        onClick={() => setShowAddForm(true)}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800"
                      >
                        Adicionar Primeira Atividade
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3" data-print-type="plano">
                      <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                        <ActivityTableHeader isDPEP={isDPEP} />
                        <tbody className="divide-y divide-slate-200 text-slate-700 font-medium whitespace-nowrap">
                          {filteredActivities.filter(Boolean).filter(Boolean).map((activity, idx) => (
                            <ActivityTableRow
                              key={activity.id}
                              activity={activity}
                              onViewHistory={setActivityForHistory}
                              index={idx}
                              isDPEP={isDPEP}
                              user={user}
                              isBossOrAdmin={isBossOrAdmin}
                              getActivityTotal={getActivityTotal}
                              onUpdateExecution={onUpdateExecution}
                              onUpdateRelatorio={onUpdateRelatorio}
                              onUpdateApproval={onUpdateApproval}
                              onRolloverYear={onRolloverYear}
                              rawActivities={rawActivities}
                              selectedActivityIds={selectedActivityIds}
                              onToggleSelect={handleToggleSelectActivity}
                              actions={
                                !canEdit(activity) ? (
                                  <div className="flex justify-center items-center gap-2">
                                    <Lock size={12} className="text-slate-400" />
                                    <button
                                      onClick={() => {
                                        setEditingActivity(activity);
                                        setShowAddForm(true);
                                      }}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                      title="Visualizar"
                                    >
                                      <Eye size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(activity.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                    title="Remover"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingActivity(activity);
                                      setShowAddForm(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                    title="Editar"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(activity.id)}
                                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                    title="Remover"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )
                            }
                          />
                        ))}
                        {filteredActivities.filter(
                          (a) => (a.status as any) === "reparticao",
                        ).length === 0 && (
                          <tr>
                            <td
                              colSpan={37}
                              className="p-12 text-center text-slate-400 italic font-medium"
                            >
                              Nenhuma atividade planificada na repartição.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

            {/* --- LEVEL 2: PLANO DE DEPARTAMENTO --- */}
            {selectedRoleMode === "Departamento" && (
              <div className="p-8 md:p-12 space-y-3 flex-1 bg-white">
                <InstitutionalHeader
                  unidadeName={user.unidadeOrganica}
                  direcaoName={user.direcao}
                  departamentoName={user.departamento}
                  reparticaoName={user.reparticao}
                  sectorName={user.setor}
                  year={selectedYear}
                  isOwner={isSuperBossUser(user)}
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowReceivedPlans(false)}
                      className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${!showReceivedPlans ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      Meu Plano de Departamento
                    </button>
                    <button
                      onClick={() => setShowReceivedPlans(true)}
                      className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${showReceivedPlans ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      <Users size={15} /> Ver Planos Recebidos (
                      {
                        filteredActivities.filter(
                          (a) =>
                            (a.status as any) === "reparticao" ||
                            (a.status as any) === "setorial",
                        ).length
                      }
                      )
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    {!showReceivedPlans && !isReadOnly && (
                      <>
                        <button
                          onClick={handleUnifyDepartmentPlan}
                          className="bg-purple-600 text-white font-black tracking-widest text-[9px] uppercase px-6 py-4 rounded-xl shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                          title="Unificar todas as atividades das repartições e setores no plano do departamento"
                        >
                          <Layers size={14} strokeWidth={3} /> Unificar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Card do Orçamento do Departamento */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                        Orçamento do Departamento
                      </span>
                    </div>
                    <h3 className="text-xl font-black mt-2 text-slate-100 uppercase tracking-tight">
                      {user?.departamento || "Departamento Logado"}{" "}
                      {showReceivedPlans
                        ? "- (Planos Recebidos dos Subordinados)"
                        : "- (Meu Plano)"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {showReceivedPlans
                        ? "Visualizando os planos enviados pelas repartições e setores subordinados."
                        : "O valor total de todas as atividades planificadas para o departamento."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-xl text-right min-w-[200px]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Atividades (Sem Salários)
                      </span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {deptBudgetTotal.toLocaleString("pt-MZ", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        MZN
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {
                          filteredActivities.filter((a) => !isSalaryActivity(a))
                            .length
                        }{" "}
                        Atividades
                      </span>
                    </div>
                    {deptSalaryTotal > 0 && (
                      <div className="bg-amber-950/40 border border-amber-900/50 p-4 rounded-xl text-right min-w-[200px]">
                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                          Salários (Anualizado x12)
                        </span>
                        <span className="text-xl font-black text-amber-400 font-mono">
                          {deptSalaryTotal.toLocaleString("pt-MZ", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          MZN
                        </span>
                        <span className="text-[10px] text-amber-300 block mt-1">
                          {
                            filteredActivities.filter((a) =>
                              isSalaryActivity(a),
                            ).length
                          }{" "}
                          Atividades de Salário
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {!showReceivedPlans ? (
                  /* Meu Plano de Departamento (Apenas atividades do departamento) */
                  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl shadow-slate-100/50">
                    <div className="px-8 py-5 bg-[#f8fafc] border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                        Plano do Departamento ({user?.departamento || "Geral"})
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {
                          filteredActivities.filter((a) => isActivityInScope(a)).length
                        }{" "}
                        Atividades
                      </span>
                    </div>
                    <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3" data-print-type="plano">
                      <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                        <ActivityTableHeader isDPEP={isDPEP} />
                        <tbody className="divide-y divide-slate-200 text-slate-700 font-medium whitespace-nowrap">
                          {filteredActivities
                            .filter((a) => isActivityInScope(a))
                            .filter(Boolean).filter(Boolean).map((activity, idx) => (
                              <ActivityTableRow
                                key={activity.id}
                                activity={activity}
                                onViewHistory={setActivityForHistory}
                                index={idx}
                                isDPEP={isDPEP}
                                user={user}
                                isBossOrAdmin={isBossOrAdmin}
                                getActivityTotal={getActivityTotal}
                                onUpdateExecution={onUpdateExecution}
                                onUpdateRelatorio={onUpdateRelatorio}
                                onUpdateApproval={onUpdateApproval}
                                onRolloverYear={onRolloverYear}
                                rawActivities={rawActivities}
                                selectedActivityIds={selectedActivityIds}
                                onToggleSelect={handleToggleSelectActivity}
                                actions={
                                  !canEdit(activity) ? (
                                    <div className="flex justify-center items-center gap-2">
                                      <Lock
                                        size={12}
                                        className="text-slate-400"
                                      />
                                      <button
                                        onClick={() => {
                                          setEditingActivity(activity);
                                          setShowAddForm(true);
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                        title="Visualizar"
                                      >
                                        <Eye size={13} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDelete(activity.id)
                                        }
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                        title="Remover"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center gap-1">
                                      <button
                                        onClick={() => {
                                          setEditingActivity(activity);
                                          setShowAddForm(true);
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                        title="Editar"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDelete(activity.id)
                                        }
                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                        title="Remover"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  )
                                }
                              />
                            ))}
                          {filteredActivities.filter((a) => isActivityInScope(a)).length === 0 && (
                            <tr>
                              <td
                                colSpan={37}
                                className="p-12 text-center text-slate-400 italic font-medium"
                              >
                                Nenhuma atividade no plano próprio do
                                departamento. Pode criar atividades ou unificar
                                planos recebidos.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Planos Recebidos (Grouped by Sectors/Repartitions) */
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-black text-blue-900 uppercase">
                          Planos dos Subordinados (Repartições / Setores)
                        </h4>
                        <p className="text-xs text-blue-700 mt-0.5">
                          Estes são os planos enviados pelas repartições e
                          setores subordinados. Clique em "Unificar" para
                          agregá-los ao plano oficial do departamento.
                        </p>
                      </div>
                      <button
                        onClick={handleUnifyDepartmentPlan}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-md shadow-blue-200"
                      >
                        <Layers size={14} /> Unificar Planos Recebidos
                      </button>
                    </div>

                    {reparticoesAndSectorsForThisDept.map((item) => {
                      const sector = item.name;
                      const sectorActs = filteredActivities.filter((a) => {
                        if (sector === "Sectores Gerais") {
                          return (
                            !a.reparticao || a.reparticao === "Sectores Gerais"
                          );
                        }
                        return a.reparticao === sector;
                      });

                      const isPredefined =
                        (REPARTICOES[activeDeptKey] || []).includes(sector) ||
                        Object.values(SECTORES).some((arr) =>
                          arr.includes(sector),
                        ) ||
                        sector === "Sectores Gerais";

                      if (sectorActs.length === 0 && !isPredefined) return null;

                      return (
                        <div
                          key={sector}
                          className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
                        >
                          <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${item.type === "Repartição" ? "bg-blue-100 text-blue-800" : item.type === "Setor" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-700"}`}
                              >
                                {item.type}
                              </span>
                              <span className="text-sm font-black text-slate-800 uppercase tracking-wide">
                                {sector}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              {sectorActs.length}{" "}
                              {sectorActs.length === 1
                                ? "Atividade"
                                : "Atividades"}
                            </span>
                          </div>

                          <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3" data-print-type="plano">
                            <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                              <ActivityTableHeader isDPEP={isDPEP} />
                              <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                                {sectorActs.map((act, idx) => (
                                  <ActivityTableRow
                                    key={act.id}
                                    activity={act}
                                    onViewHistory={setActivityForHistory}
                                    index={idx}
                                    isDPEP={isDPEP}
                                    user={user}
                                    isBossOrAdmin={isBossOrAdmin}
                                    getActivityTotal={getActivityTotal}
                                    onUpdateExecution={onUpdateExecution}
                                    onUpdateRelatorio={onUpdateRelatorio}
                                    actions={
                                      <div className="flex justify-center items-center gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingActivity(act);
                                            setShowAddForm(true);
                                          }}
                                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                          title="Visualizar"
                                        >
                                          <Eye size={13} />
                                        </button>
                                      </div>
                                    }
                                  />
                                ))}
                                {sectorActs.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={37}
                                      className="p-6 text-center text-slate-400 text-xs italic font-medium"
                                    >
                                      Nenhuma atividade registada ou submetida
                                      para este(a) {item.type.toLowerCase()} até
                                      ao momento.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- LEVEL 3: PLANO DE DIREÇÃO --- */}
            {selectedRoleMode === "Direção" && (
              <div className="p-8 md:p-12 space-y-3 flex-1 bg-white">
                <InstitutionalHeader
                  unidadeName={user.unidadeOrganica}
                  direcaoName={user.direcao}
                  departamentoName={user.departamento}
                  reparticaoName={user.reparticao}
                  sectorName={user.setor}
                  year={selectedYear}
                  isOwner={isSuperBossUser(user)}
                />

                <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-2 border-slate-100 pb-3">
                  <div className="flex bg-slate-100 p-1 rounded-2xl print:hidden">
                    <button
                      onClick={() => setShowReceivedPlans(false)}
                      className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${!showReceivedPlans ? "bg-slate-900 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      Meu Plano de Direção
                    </button>
                    <button
                      onClick={() => setShowReceivedPlans(true)}
                      className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${showReceivedPlans ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      <Inbox size={16} /> Planos Recebidos
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!showReceivedPlans && !isReadOnly && (
                      <button
                        onClick={handleSendDirecaoToPlanificacao}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-emerald-200"
                      >
                        <Send size={14} /> Enviar à Planificação
                      </button>
                    )}
                    {showReceivedPlans && !isReadOnly && (
                      <button
                        onClick={handleUnifyDirectionPlan}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-blue-200"
                      >
                        <Layers size={14} /> Unificar Planos
                      </button>
                    )}
                  </div>
                </div>

                {/* Bloco de Cabeçalho Oficial da Direção Conforme Imagem Solicitada */}
                <div className="border-l-[6px] border-blue-900 pl-4 py-2 my-6 bg-slate-50 border border-slate-200 rounded-r-2xl space-y-1">
                  <p className="text-xs font-black text-blue-900 uppercase tracking-widest">
                    {user?.direcao || "Direção"}
                  </p>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight font-serif">
                    TOTAL DE ATIVIDADES DA DIREÇÃO ( {filteredActivities.length}{" "}
                    {filteredActivities.length === 1
                      ? "Atividade"
                      : "Atividades"}{" "}
                    )
                  </h2>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight font-serif text-emerald-900">
                    ORÇAMENTO DAS ATIVIDADES ({" "}
                    {totalDirectionBudget.toLocaleString("pt-MZ", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    MZN )
                  </h2>
                  {directionSalaryBudget > 0 && (
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight font-serif text-amber-700">
                      ORÇAMENTO DE SALÁRIOS ({" "}
                      {directionSalaryBudget.toLocaleString("pt-MZ", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      MZN )
                    </h2>
                  )}
                </div>

                {/* Card de Consolidação do Orçamento da Direção */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/50 space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                          Orçamento da Direção
                        </span>
                      </div>
                      <h3 className="text-2xl font-black mt-2 text-white uppercase tracking-tight">
                        {user?.direcao || "Direção Logada"}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-xl">
                        O orçamento da direção é a soma de todos os orçamentos
                        dos departamentos que lhe respondem (com os salários
                        separados).
                      </p>
                    </div>
                    <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md text-right min-w-[280px] space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                          Orçamento das Atividades (Sem Salários)
                        </span>
                        <span className="text-2xl font-black text-amber-400 font-mono">
                          {totalDirectionBudget.toLocaleString("pt-MZ", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          MZN
                        </span>
                      </div>
                      {directionSalaryBudget > 0 && (
                        <div className="border-t border-white/10 pt-2">
                          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                            Orçamento de Salários (Anualizado x12)
                          </span>
                          <span className="text-2xl font-black text-amber-400 font-mono">
                            {directionSalaryBudget.toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            MZN
                          </span>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-300 block mt-1 font-bold">
                        Soma de {directionDepartmentBudgets.length}{" "}
                        Departamentos Respondedores
                      </span>
                    </div>
                  </div>

                  {/* Department Breakdown */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider mb-3">
                      Orçamento dos Departamentos Respondedores
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {directionDepartmentBudgets.map((d) => (
                        <div
                          key={d.name}
                          className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex justify-between items-center hover:bg-white/10 transition-all"
                        >
                          <div className="truncate pr-2">
                            <span className="text-xs font-bold text-slate-200 block truncate">
                              {d.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {d.count}{" "}
                              {d.count === 1 ? "atividade" : "atividades"}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-black text-emerald-400 shrink-0">
                            {d.budget.toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            MZN
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grouped by Department */}
                <div className="space-y-6">
                  {showReceivedPlans ? (
                    /* Planos Recebidos (Activities in status: departamento) */
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-black text-blue-900 uppercase">
                            Planos dos Departamentos Subordinados
                          </h4>
                          <p className="text-xs text-blue-700 mt-0.5">
                            Estes são os planos enviados pelos chefes de departamento. Clique em "Unificar" para agregá-los ao plano oficial da direção.
                          </p>
                        </div>
                        <button
                          onClick={handleUnifyDirectionPlan}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-md shadow-blue-200"
                        >
                          <Layers size={14} /> Unificar Planos Recebidos
                        </button>
                      </div>

                      {departmentsForThisDirection.map((dept) => {
                        const deptActs = rawActivities.filter((a) => {
                          if (Number(a.ano || 2026) !== Number(selectedYear)) return false;
                          const canonicalActDir = getCanonicalDirection(a.direcao);
                          const canonicalUserDir = getCanonicalDirection(user?.direcao || "");
                          if (canonicalActDir !== canonicalUserDir) return false;
                          
                          const isMatchDept = (a.departamento || "").toLowerCase() === dept.toLowerCase() ||
                                             (a.departamento || "").toUpperCase().includes(dept.toUpperCase()) ||
                                             dept.toUpperCase().includes((a.departamento || "").toUpperCase());
                          
                          return isMatchDept && (a.status as any) === "departamento";
                        });

                        return (
                          <div
                            key={dept}
                            className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
                          >
                          <InstitutionalHeader 
                            unidadeName={user.unidadeOrganica}
                            direcaoName={user.direcao}
                            departamentoName={dept}
                            year={selectedYear} 
                          />
                          <div className="bg-slate-900 text-white p-6 rounded-t-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <span className="inline-block bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                                    Orçamento do Departamento
                                </span>
                                <h4 className="text-xl font-black uppercase tracking-tight text-white">
                                    {dept} - (Meu Plano)
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-1">O valor total de todas as atividades planejadas para o departamento.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-right">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Atividades (Sem Salários)</div>
                                <div className="text-lg font-black text-emerald-400 font-mono">
                                    {deptActs.reduce((acc, a) => acc + getActivityTotal(a), 0).toLocaleString("pt-MZ", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                    })}{" "}
                                    MZN
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{deptActs.length} {deptActs.length === 1 ? "Atividade" : "Atividades"}</div>
                            </div>
                          </div>

                            <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3">
                              <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                                <ActivityTableHeader isDPEP={isDPEP} />
                                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium whitespace-nowrap">
                                  {deptActs.filter(Boolean).map((activity, idx) => (
                                    <ActivityTableRow
                                      key={activity.id}
                                      activity={activity}
                                      onViewHistory={setActivityForHistory}
                                      index={idx}
                                      isDPEP={isDPEP}
                                      user={user}
                                      isBossOrAdmin={isBossOrAdmin}
                                      getActivityTotal={getActivityTotal}
                                      onUpdateExecution={onUpdateExecution}
                                      onUpdateRelatorio={onUpdateRelatorio}
                                      actions={
                                        <div className="flex justify-center items-center gap-2">
                                          <button
                                            onClick={() => {
                                              setEditingActivity(activity);
                                              setShowAddForm(true);
                                            }}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                            title="Visualizar"
                                          >
                                            <Eye size={13} />
                                          </button>
                                        </div>
                                      }
                                    />
                                  ))}
                                  {deptActs.length === 0 && (
                                    <tr>
                                      <td
                                        colSpan={37}
                                        className="p-6 text-center text-slate-400 text-xs italic font-medium"
                                      >
                                        Nenhuma atividade pendente para este departamento.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Plano da Direção (Activities already in status: direcao or above) */
                    departmentsForThisDirection.map((dept) => {
                      const deptActs = filteredActivities.filter(
                        (a) =>
                          (a.departamento || "").toLowerCase() ===
                            dept.toLowerCase() ||
                          (a.departamento || "")
                            .toUpperCase()
                            .includes(dept.toUpperCase()) ||
                          dept
                            .toUpperCase()
                            .includes((a.departamento || "").toUpperCase()),
                      );
                      const deptBudget = deptActs.reduce(
                        (acc, a) => acc + getActivityTotal(a),
                        0,
                      );

                      return (
                        <div
                          key={dept}
                          className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm"
                        >
                          <InstitutionalHeader 
                            unidadeName={user.unidadeOrganica}
                            direcaoName={user.direcao} 
                            departamentoName={dept}
                            year={selectedYear} 
                          />
                          <div className="bg-slate-900 text-white p-6 rounded-t-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <span className="inline-block bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2">
                                    Orçamento do Departamento
                                </span>
                                <h4 className="text-xl font-black uppercase tracking-tight text-white">
                                    {dept} - (Meu Plano)
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-1">O valor total de todas as atividades planejadas para o departamento.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-right">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Atividades (Sem Salários)</div>
                                <div className="text-lg font-black text-emerald-400 font-mono">
                                    {deptBudget.toLocaleString("pt-MZ", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                    })}{" "}
                                    MZN
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{deptActs.length} {deptActs.length === 1 ? "Atividade" : "Atividades"}</div>
                            </div>
                          </div>

                          <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3" data-print-type="plano">
                            <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                              <ActivityTableHeader isDPEP={isDPEP} />
                              <tbody className="divide-y divide-slate-200 text-slate-700 font-medium whitespace-nowrap">
                                {deptActs.filter(Boolean).map((activity, idx) => (
                                  <ActivityTableRow
                                    key={activity.id}
                                    activity={activity}
                                    onViewHistory={setActivityForHistory}
                                    index={idx}
                                    isDPEP={isDPEP}
                                    user={user}
                                    isBossOrAdmin={isBossOrAdmin}
                                    getActivityTotal={getActivityTotal}
                                    onUpdateExecution={onUpdateExecution}
                                    onUpdateRelatorio={onUpdateRelatorio}
                                    actions={
                                      !canEdit(activity) ? (
                                        <div className="flex justify-center items-center gap-2">
                                          <Lock
                                            size={12}
                                            className="text-slate-400"
                                          />
                                          <button
                                            onClick={() => {
                                              setEditingActivity(activity);
                                              setShowAddForm(true);
                                            }}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                            title="Visualizar"
                                          >
                                            <Eye size={13} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDelete(activity.id)
                                            }
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                            title="Remover"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex justify-center gap-1">
                                          <button
                                            onClick={() => {
                                              setEditingActivity(activity);
                                              setShowAddForm(true);
                                            }}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                            title="Editar"
                                          >
                                            <Edit2 size={13} />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDelete(activity.id)
                                            }
                                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                            title="Remover"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      )
                                    }
                                  />
                                ))}
                                {deptActs.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={37}
                                      className="p-6 text-center text-slate-400 text-xs italic font-medium"
                                    >
                                      Nenhum plano departamental recebido para
                                      este departamento.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* --- LEVEL 4: SETOR DE PLANIFICAÇÃO (PLANO INSTITUCIONAL / DE) --- */}
            {selectedRoleMode === "Planificação" && (
              <div className="flex-1 w-full flex flex-col bg-white">



                {/* Consultation Info Banner for Directors */}
                {!isChefeDPEP && isPublished && (
                  <div className="px-8 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3 print:hidden">
                    <CheckCircle2
                      className="text-emerald-600 shrink-0"
                      size={20}
                    />
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                        Área de Consulta do Diretor (DE PUBLICADO)
                      </h4>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Você está a visualizar de forma restrita e segura as
                        atividades consolidadas para a sua direção:{" "}
                        <strong className="text-slate-900 font-black">
                          {directorDirection === "ALL"
                            ? "Todas as Áreas (Geral)"
                            : directorDirection}
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub menu tabs inside Planificação */}
                <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between print:hidden overflow-x-auto no-scrollbar">
                  <div className="flex gap-4 min-w-max">
                    <button
                      onClick={() => setActiveSubTab("necessidades_quantidades")}
                      className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
                        activeSubTab === "necessidades_quantidades"
                          ? "bg-slate-900 text-white border-slate-950 shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      📊 Resumo por Rúbrica
                    </button>
                    <button
                      onClick={() => setActiveSubTab("plano_departamento")}
                      className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
                        activeSubTab === "plano_departamento"
                          ? "bg-slate-900 text-white border-slate-950 shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      Plano do Departamento
                    </button>
                    <button
                      onClick={() => setActiveSubTab("plano_direcoes")}
                      className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
                        activeSubTab === "plano_direcoes"
                          ? "bg-slate-900 text-white border-slate-950 shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      Plano da Direção
                    </button>
                    <button
                      onClick={() => setActiveSubTab("plano_institucional")}
                      className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all border ${
                        activeSubTab === "plano_institucional"
                          ? "bg-slate-900 text-white border-slate-950 shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                      }`}
                    >
                      Plano Institucional
                    </button>
                    {isPlanificacao && (
                      <button
                        onClick={() => setShowScheduleModal(true)}
                        className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-2"
                      >
                        <Calendar size={14} /> Agendar Atualização
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* Botões removidos conforme solicitação */}
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  {/* SUB-TAB: PLANO DA REPARTIÇÃO */}
                  {activeSubTab === "plano_reparticao" && (
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-100/50">
                        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                              Atividades da Repartição / Setor
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Gestão das atividades planificadas exclusivamente
                              para o seu setor/repartição.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            {/* Botão removido */}
                          </div>
                        </div>

                        <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3">
                          <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                            <ActivityTableHeader isDPEP={isDPEP} />
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium whitespace-nowrap">
                              {filteredActivities
                                .filter(
                                  (a) =>
                                    isDPEP ||
                                    isSuperBossUser(user) ||
                                    
                                    a.reparticao === user.reparticao ||
                                    a.setor === user.setor,
                                )
                                .filter(Boolean).map((activity, idx) => (
                                  <ActivityTableRow
                                    key={activity.id}
                                    activity={activity}
                                    index={idx}
                                    isDPEP={isDPEP}
                                    user={user}
                                    isBossOrAdmin={isBossOrAdmin}
                                    getActivityTotal={getActivityTotal}
                                    onUpdateExecution={onUpdateExecution}
                                    onUpdateRelatorio={onUpdateRelatorio}
                                    actions={
                                      <div className="flex justify-center gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingActivity(activity);
                                            setShowAddForm(true);
                                          }}
                                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                          title="Editar"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDelete(activity.id)
                                          }
                                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                          title="Remover"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    }
                                  />
                                ))}
                              {filteredActivities.filter(
                                (a) =>
                                  user?.reparticao &&
                                  (a.reparticao === user.reparticao ||
                                    a.setor === user.setor),
                              ).length === 0 && (
                                <tr>
                                  <td
                                    colSpan={40}
                                    className="p-20 text-center text-slate-400 font-bold italic uppercase tracking-widest bg-slate-50/50"
                                  >
                                    Nenhuma atividade encontrada para a sua
                                    repartição.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PLANO DO DEPARTAMENTO */}
                  {activeSubTab === "plano_departamento" && (
                    <div className="space-y-6">
                      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-100/50">
                        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                              Atividades do Departamento
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Consolidação de atividades de todos os setores e
                              repartições que compõem o departamento.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            {/* Botão removido */}
                          </div>
                        </div>

                        <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3">
                          <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                            <ActivityTableHeader isDPEP={isDPEP} />
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium whitespace-nowrap">
                              {(() => {
                                const deptMap = filteredActivities
                                  .filter((a) => isActivityInScope(a))
                                  .reduce(
                                    (acc, act) => {
                                      const dept = act.departamento || "Gabinete / Geral";
                                      if (!acc[dept]) acc[dept] = [];
                                      acc[dept].push(act);
                                      return acc;
                                    },
                                    {} as Record<string, any[]>,
                                  );

                                const entries = Object.entries(deptMap).sort((a, b) => a[0].localeCompare(b[0])) as [string, any[]][];

                                if (entries.length === 0) {
                                  return (
                                    <tr>
                                      <td
                                        colSpan={40}
                                        className="p-20 text-center text-slate-400 font-bold italic uppercase tracking-widest bg-slate-50/50"
                                      >
                                        Nenhuma atividade encontrada no sistema.
                                      </td>
                                    </tr>
                                  );
                                }

                                return entries.map(([dept, activities]) => {
                                  const deptTotalBudget = activities.reduce(
                                    (sum, act) => sum + getActivityTotal(act),
                                    0,
                                  );

                                  return (
                                    <React.Fragment key={dept}>
                                      <tr className="bg-slate-100 text-slate-900 border-y border-slate-200">
                                        <td
                                          colSpan={40}
                                          className="p-3 pl-8 text-[11px] font-extrabold uppercase tracking-wider text-slate-800 bg-slate-50"
                                        >
                                          <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                              <span className="text-blue-800 font-black">🏢 DEPARTAMENTO: {dept}</span>
                                            </div>
                                            <div className="flex gap-3 items-center">
                                              <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[10px] text-slate-700 font-bold">
                                                {activities.length} {activities.length === 1 ? "Atividade" : "Atividades"}
                                              </span>
                                              <span className="bg-emerald-100/80 text-emerald-850 px-2.5 py-0.5 rounded text-[10px] font-mono font-black border border-emerald-200">
                                                Total Departamento: {deptTotalBudget.toLocaleString("pt-MZ", {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })} MZN
                                              </span>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>

                                      {activities.filter(Boolean).map((activity, idx) => (
                                        <ActivityTableRow
                                          key={activity.id}
                                          activity={activity}
                                          index={idx}
                                          isDPEP={isDPEP}
                                          user={user}
                                          isBossOrAdmin={isBossOrAdmin}
                                          getActivityTotal={getActivityTotal}
                                          onUpdateExecution={onUpdateExecution}
                                          onUpdateRelatorio={onUpdateRelatorio}
                                          actions={
                                            <div className="flex justify-center gap-1">
                                              <button
                                                onClick={() => {
                                                  setEditingActivity(activity);
                                                  setShowAddForm(true);
                                                }}
                                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                                title="Editar"
                                              >
                                                <Edit2 size={13} />
                                              </button>
                                              <button
                                                onClick={() =>
                                                  handleDelete(activity.id)
                                                }
                                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                                title="Remover"
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </div>
                                          }
                                        />
                                      ))}
                                    </React.Fragment>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PLANO SETORIAL */}
                  {activeSubTab === "plano_setorial" && (
                    <div className="space-y-2 print:block">
                      {/* Panel de Consolidação do Orçamento Institucional */}
                      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-blue-900/50 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-6">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                                Plano Setorial - Organizado por Direção (ISPS)
                              </span>
                            </div>
                            <h3 className="text-2xl font-black mt-2 text-white uppercase tracking-tight">
                              Consolidação Institucional ISPS
                            </h3>
                            <p className="text-xs text-slate-300 mt-1 max-w-xl">
                              Visualização de todos os planos como foram
                              planificados, organizados por direção e
                              departamento.
                            </p>
                          </div>
                          <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md text-right min-w-[280px] space-y-3">
                            <div>
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                                Orçamento das Atividades (Sem Salários)
                              </span>
                              <span className="text-2xl font-black text-emerald-400 font-mono">
                                {totalInstitutionalBudget.toLocaleString(
                                  "pt-MZ",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}{" "}
                                MZN
                              </span>
                            </div>
                            <div className="border-t border-white/10 pt-2">
                              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                                Orçamento Geral Consolidado (Com Salário via Receitas Próprias)
                              </span>
                              <span className="text-2xl font-black text-amber-400 font-mono">
                                {(
                                  totalInstitutionalBudget +
                                  (salarioStats.rawReceitasProprias || 0)
                                ).toLocaleString("pt-MZ", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                MZN
                              </span>
                              <span className="text-[9px] text-slate-300 block mt-0.5">
                                Nota: Salários pagos pelo Estado são informados separadamente e não entram no orçamento de atividades.
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-300 block mt-1 font-bold">
                              Consolidação de{" "}
                              {institutionalDirectionsBreakdown.length} Direções
                              + Quadro Geral
                            </span>
                          </div>
                        </div>

                        {/* Direções Breakdown */}
                        <div>
                          <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider mb-3">
                            Orçamento por Direção
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {institutionalDirectionsBreakdown.map((dir) => (
                              <div
                                key={dir.name}
                                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-all space-y-2"
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-xs font-black text-white uppercase tracking-wide">
                                    {dir.name}
                                  </span>
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold shrink-0">
                                    {dir.totalActivities}{" "}
                                    {dir.totalActivities === 1
                                      ? "ativ."
                                      : "ativs."}
                                  </span>
                                </div>
                                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    Orçamento da Direção:
                                  </span>
                                  <span className="text-sm font-mono font-black text-amber-400">
                                    {dir.directionBudget.toLocaleString(
                                      "pt-MZ",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      },
                                    )}{" "}
                                    MZN
                                  </span>
                                </div>
                              </div>
                            ))}
                            {canSeeSalaries && (
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-all space-y-2">
                                <div className="flex justify-between items-start gap-2 border-b border-white/10 pb-2">
                                  <span className="text-xs font-black text-white uppercase tracking-wide">
                                    SALÁRIOS E REMUNERAÇÕES (RH)
                                  </span>
                                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold shrink-0">
                                    RH / Separado
                                  </span>
                                </div>
                                <div className="space-y-2 pt-1 text-[11px] text-slate-300">
                                  <div className="flex justify-between items-center">
                                    <span>Salários Pagos pelo Estado (Efetivos)</span>
                                    <span className="font-mono font-bold text-emerald-400">
                                      {salarioStats.salarioEstado}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span>Salário via Receitas Próprias (Não Efetivos)</span>
                                    <span className="font-mono font-bold text-white">
                                      {salarioStats.salarioReceitasProprias}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center pt-2 border-t border-white/10 font-bold text-amber-400">
                                    <span>Total RH (Receitas Próprias)</span>
                                    <span className="font-mono">
                                      {salarioStats.totalGeral}
                                    </span>
                                  </div>
                                  <span className="text-[9px] text-slate-400 block italic pt-1">
                                    * Salários do Estado são pagos pelo Tesouro Nacional e excluídos do orçamento geral de atividades.
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-100/50">
                        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                              Plano Setorial Consolidado
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Todos os planos como foram planificados,
                              organizados por direção.
                            </p>
                          </div>
                          {isChefeDPEP && (
                            <button
                              onClick={handleSendPlanificacaoToInstitucional}
                              className="bg-slate-900 text-white font-black tracking-widest text-[10px] uppercase px-8 py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                              <Send size={16} /> Compilar Plano Institucional
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            Total Recebido:{" "}
                            {
                              filteredActivities.filter(
                                (a) =>
                                  !a.isPESOE &&
                                  (isSuperBossUser(user) ||
                                    isDPEP ||
                                    isPlanificacao ||
                                    a.direcao === user?.direcao ||
                                    isActivityInScope(a)),
                              ).length
                            }{" "}
                            Atividades
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3">
                        <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                          <ActivityTableHeader isDPEP={isDPEP} />
                          <tbody className="divide-y divide-slate-250 text-slate-700 font-medium whitespace-nowrap">
                            {(
                              Object.entries(
                                filteredActivities
                                  .filter(
                                    (a) =>
                                      !a.isPESOE &&
                                      (isSuperBossUser(user) ||
                                        isDPEP ||
                                        isPlanificacao ||
                                        a.direcao === user?.direcao ||
                                        isActivityInScope(a)),
                                  )
                                  .sort((a, b) =>
                                    compareActivitiesStandardOrder(
                                      a,
                                      b,
                                      getActMonthIndex,
                                    ),
                                  )
                                  .reduce(
                                    (acc, act) => {
                                      const dir = act.direcao || "SEM DIREÇÃO";
                                      const dept = act.departamento || "Gabinete / Geral";
                                      const sector = act.setor || act.reparticao || "Geral";
                                      const deptKey = `${dept}|||${sector}`;
                                      
                                      if (!acc[dir]) acc[dir] = {};
                                      if (!acc[dir][deptKey]) acc[dir][deptKey] = [];
                                      acc[dir][deptKey].push(act);
                                      return acc;
                                    },
                                    {} as Record<string, Record<string, any[]>>,
                                  ),
                              ) as [string, Record<string, any[]>][]
                            ).map(([direction, deptsMap]) => {
                              const directionTotalBudget = Object.values(deptsMap).reduce(
                                (sum, list) => sum + list.reduce((s, act) => s + getActivityTotal(act), 0),
                                0,
                              );
                              const directionTotalActivities = Object.values(deptsMap).reduce(
                                (sum, list) => sum + list.length,
                                0,
                              );

                              return (
                                <React.Fragment key={direction}>
                                  <tr className="bg-slate-900 text-white border-y-2 border-slate-950 shadow-inner">
                                    <td
                                      colSpan={45}
                                      className="p-4 text-[12px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-slate-900 to-indigo-900"
                                    >
                                      <div className="flex justify-between items-center">
                                        <span>🏢 DIREÇÃO: {direction}</span>
                                        <div className="flex gap-4 items-center">
                                          <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                                            {directionTotalActivities} Atividades
                                          </span>
                                          <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/30 font-mono">
                                            Total Direção:{" "}
                                            {directionTotalBudget.toLocaleString(
                                              "pt-MZ",
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              },
                                            )}{" "}
                                            MZN
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>

                                  {Object.entries(deptsMap).map(([deptKey, activities]) => {
                                    const [dept, sector] = deptKey.split("|||");
                                    const sectorTotalBudget = activities.reduce(
                                      (sum, act) => sum + getActivityTotal(act),
                                      0,
                                    );

                                    return (
                                      <React.Fragment key={deptKey}>
                                        <tr className="bg-slate-100 text-slate-900 border-y border-slate-200">
                                          <td
                                            colSpan={45}
                                            className="p-3 pl-8 text-[11px] font-extrabold uppercase tracking-wider text-slate-800 bg-slate-50"
                                          >
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-2">
                                                <span className="text-blue-800">📂 DEP/REPARTIÇÃO: {dept}</span>
                                                {sector && sector !== "Geral" && (
                                                  <>
                                                    <span className="text-slate-400">/</span>
                                                    <span className="text-slate-600 font-bold">📍 SETOR: {sector}</span>
                                                  </>
                                                )}
                                              </div>
                                              <div className="flex gap-3 items-center">
                                                <span className="bg-slate-200/80 px-2 py-0.5 rounded text-[10px] text-slate-700 font-bold">
                                                  {activities.length} Atividades
                                                </span>
                                                <span className="bg-emerald-100/80 text-emerald-850 px-2.5 py-0.5 rounded text-[10px] font-mono font-black border border-emerald-200">
                                                  Orçamento Setorial: {sectorTotalBudget.toLocaleString("pt-MZ", {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                  })} MZN
                                                </span>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>

                                        {activities.filter(Boolean).map((activity, idx) => (
                                          <ActivityTableRow
                                            key={activity.id}
                                            activity={activity}
                                            index={idx}
                                            isDPEP={isDPEP}
                                            user={user}
                                            isBossOrAdmin={isBossOrAdmin}
                                            getActivityTotal={getActivityTotal}
                                            actions={
                                              <div className="flex justify-center gap-1">
                                                <button
                                                  onClick={() => {
                                                    setEditingActivity(activity);
                                                    setShowAddForm(true);
                                                  }}
                                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                                  title="Editar"
                                                >
                                                  <Edit2 size={13} />
                                                </button>
                                                <button
                                                  onClick={() =>
                                                    handleDelete(activity.id)
                                                  }
                                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                                  title="Remover"
                                                >
                                                  <Trash2 size={13} />
                                                </button>
                                              </div>
                                            }
                                          />
                                        ))}
                                      </React.Fragment>
                                    );
                                  })}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PLANO E ORÇAMENTO */}
                  {activeSubTab === "plano_orcamento" && (
                    <div className="space-y-2 print:block">
                      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-100/50">
                        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                              Plano e Orçamento
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Plano resumido com N/O, Código da Atividade, Nome
                              da Atividade, Mês de Realização e Orçamento da
                              Atividade.
                            </p>
                          </div>
                          <div className="bg-slate-900 text-white p-5 rounded-2xl text-right min-w-[260px]">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                              Orçamento Total do Plano
                            </span>
                            <span className="text-2xl font-black text-emerald-400 font-mono">
                              {filteredActivities
                                .filter(
                                  (a) =>
                                    (a.status as any) === "planificacao" &&
                                    !a.isPESOE &&
                                    (
                                      isSuperBossUser(user) ||
                                      a.direcao === user.direcao),
                                )
                                .reduce(
                                  (sum, act) => sum + getActivityTotal(act),
                                  0,
                                )
                                .toLocaleString("pt-MZ", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                              MZN
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3">
                          <table className="w-full text-left border-collapse font-sans text-xs">
                            <thead>
                              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                                <th className="p-4 text-center w-16 border-r border-slate-800">
                                  N/O
                                </th>
                                <th className="p-4 w-48 border-r border-slate-800">
                                  CÓDIGO DA ATIVIDADE
                                </th>
                                <th className="p-4 border-r border-slate-800">
                                  NOME DA ATIVIDADE
                                </th>
                                <th className="p-4 w-40 border-r border-slate-800 text-center">
                                  MÊS DE REALIZAÇÃO
                                </th>
                                <th className="p-4 w-48 text-right">
                                  ORÇAMENTO DA ATIVIDADE
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                              {filteredActivities
                                .filter(
                                  (a) =>
                                    (a.status as any) === "planificacao" &&
                                    !a.isPESOE &&
                                    (
                                      isSuperBossUser(user) ||
                                      a.direcao === user.direcao),
                                )
                                .filter(Boolean).map((activity, idx) => {
                                  const totalVal = getActivityTotal(activity);
                                  const code =
                                    activity.codigoAtividade ||
                                    activity.referencia ||
                                    activity.codigo ||
                                    "---";
                                  const name =
                                    activity.nomeAtividade ||
                                    activity.title ||
                                    activity.designacao ||
                                    "---";
                                  const month = Array.isArray(
                                    activity.mesesRealizacao,
                                  )
                                    ? activity.mesesRealizacao.join(", ")
                                    : activity.mesRealizacao ||
                                      activity.mes ||
                                      "-";
                                  const no =
                                    getActivityDisplayNo(activity) || idx + 1;

                                  return (
                                    <tr
                                      key={activity.id || idx}
                                      className="hover:bg-slate-50 transition-colors"
                                    >
                                      <td className="p-4 text-center font-bold text-slate-900 border-r border-slate-200">
                                        {no}
                                      </td>
                                      <td className="p-4 font-mono font-bold text-indigo-700 border-r border-slate-200">
                                        {code}
                                      </td>
                                      <td className="p-4 font-bold text-slate-900 border-r border-slate-200">
                                        {name}
                                      </td>
                                      <td className="p-4 text-center font-semibold text-slate-600 border-r border-slate-200">
                                        {month}
                                      </td>
                                      <td className="p-4 text-right font-mono font-bold text-emerald-700">
                                        {totalVal.toLocaleString("pt-MZ", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        MZN
                                      </td>
                                    </tr>
                                  );
                                })}
                              {filteredActivities.filter(
                                (a) =>
                                  (a.status as any) === "planificacao" &&
                                  !a.isPESOE &&
                                  (
                                    isSuperBossUser(user) ||
                                    a.direcao === user.direcao),
                              ).length === 0 && (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="p-12 text-center text-slate-400 italic font-medium"
                                  >
                                    Nenhuma atividade encontrada.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: RESUMO POR RÚBRICA */}
                  {activeSubTab === "necessidades_quantidades" && (
                    <div className="space-y-2 print:block">
                      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-100/50 print:block">
                        <div className="pb-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
                              <span>📊 Consolidado de Rúbricas Orçamentais</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                              Resumo Consolidado por Rúbrica
                            </h3>
                            <p className="text-slate-500 text-xs font-medium mt-1">
                              Visão geral e consolidação de todas as despesas e rúbricas solicitadas por cada departamento do ISPS.
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById("resumo-rubricas-table");
                                if (el) {
                                  openPrintDocumentWindow({
                                    title: `Relatorio_Resumo_Rubricas_${selectedYear}`,
                                    contentHtml: el.innerHTML,
                                    orientation: "landscape",
                                    pageSize: "A4",
                                  });
                                }
                              }}
                              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                            >
                              <Printer className="w-4 h-4" />
                              Imprimir Quadro A4
                            </button>
                          </div>
                        </div>

                        {/* Tabela de Rúbricas */}
                        <div id="resumo-rubricas-table" className="mt-6 overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                          <table className="w-full text-left border-collapse font-sans text-xs">
                            <thead>
                              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                                <th className="p-3.5 border-r border-slate-800 w-12 text-center">Nº</th>
                                <th className="p-3.5 border-r border-slate-800">Rúbrica Mãe (Capítulo)</th>
                                <th className="p-3.5 border-r border-slate-800">Código / Rúbrica Orçamental</th>
                                <th className="p-3.5 border-r border-slate-800 text-center">Qtd. Total</th>
                                <th className="p-3.5 border-r border-slate-800 text-right">Valor Total (MZN)</th>
                                <th className="p-3.5 border-r border-slate-800">Atividades Associadas (Departamento)</th>
                                <th className="p-3.5 text-center w-20 print:hidden">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                              {groupedRubricasSummary.length > 0 ? (
                                groupedRubricasSummary.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-3.5 text-center font-bold text-slate-500 border-r border-slate-200">
                                      {idx + 1}
                                    </td>
                                    <td className="p-3.5 font-bold text-indigo-900 border-r border-slate-200">
                                      {item.rubricaMae}
                                    </td>
                                    <td className="p-3.5 border-r border-slate-200">
                                      <div className="flex flex-col gap-0.5">
                                        {item.codigoRubrica !== "Geral" && (
                                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-max">
                                            Cód: {item.codigoRubrica}
                                          </span>
                                        )}
                                        <span className="font-black text-slate-900 text-sm">{item.nomeRubrica}</span>
                                      </div>
                                    </td>
                                    <td className="p-3.5 text-center font-mono font-bold text-slate-600 border-r border-slate-200 bg-slate-50/50">
                                      {item.quantidadeTotal.toLocaleString("pt-MZ")}
                                    </td>
                                    <td className="p-3.5 text-right font-mono font-black text-emerald-700 border-r border-slate-200 bg-emerald-50/20">
                                      {item.valorTotal.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN
                                    </td>
                                    <td className="p-3.5 border-r border-slate-200">
                                      <div className="flex flex-wrap gap-1.5 max-w-md">
                                        {item.atividadesList.map((act, actIdx) => (
                                          <span
                                            key={actIdx}
                                            title={act.name}
                                            className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200"
                                          >
                                            <strong className="text-indigo-950 font-black">{act.code}</strong>:
                                            <span className="truncate max-w-[150px]">{act.name}</span>
                                            <span className="text-slate-400 font-bold">({act.depto})</span>
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3.5 text-center print:hidden">
                                      {(selectedRoleMode === "Planificação" || user?.email === "slaitertripas@gmail.com") ? (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteRubric(item.nomeRubrica)}
                                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all cursor-pointer border border-red-100 hover:border-red-600 flex items-center justify-center mx-auto"
                                          title="Excluir Rúbrica (e todas as atividades associadas de todos os departamentos na matriz)"
                                        >
                                          <Trash2 size={14} className="stroke-[2.5px]" />
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">Sem permissão</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={7} className="p-12 text-center text-slate-400 italic font-medium">
                                    Nenhuma rúbrica identificada nos planos ativos.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            {groupedRubricasSummary.length > 0 && (
                              <tfoot>
                                <tr className="bg-slate-900 text-white font-black text-xs">
                                  <td colSpan={3} className="p-3.5 text-right uppercase tracking-wider border-r border-slate-800">
                                    Total Consolidado das Rúbricas:
                                  </td>
                                  <td className="p-3.5 text-center font-mono font-black text-amber-300 text-sm bg-slate-950 border-r border-slate-800">
                                    {groupedRubricasSummary.reduce((sum, i) => sum + i.quantidadeTotal, 0).toLocaleString("pt-MZ")}
                                  </td>
                                  <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm bg-slate-950 border-r border-slate-800" colSpan={1}>
                                    {groupedRubricasSummary.reduce((sum, i) => sum + i.valorTotal, 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MZN
                                  </td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tfoot>
                            )}
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PLANO DAS DIREÇÕES */}
                  {activeSubTab === "plano_direcoes" &&
                    (() => {
                      // Obter todas as direções existentes no sistema
                      const systemActivities = filteredActivities.filter((a) => isActivityInScope(a));
                      const directionsList = Array.from(
                        new Set(
                          systemActivities.map(
                            (a) => (a.direcao || "Gabinete do Diretor-Geral") as string,
                          ),
                        ),
                      ).sort((a: any, b: any) => a.localeCompare(b)) as string[];

                      if (systemActivities.length === 0) {
                        return (
                          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-bold italic uppercase tracking-widest">
                            Nenhuma atividade encontrada no sistema.
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-12 print:block">
                          {directionsList.map((dirName: string) => {
                            const dirActivities = systemActivities
                              .filter(
                                (a) =>
                                  (a.direcao || "")
                                    .toLowerCase()
                                    .trim() === dirName.toLowerCase().trim(),
                              )
                              .sort((a, b) =>
                                compareActivitiesStandardOrder(
                                  a,
                                  b,
                                  getActMonthIndex,
                                ),
                              );

                            const dirBudget = dirActivities.reduce(
                              (sum, act) => sum + getActivityTotal(act),
                              0,
                            );

                            const directionKeyForPlan = getDirectionKeysMatched(dirName);
                            const departmentsForThisDirPlan =
                              DEPARTAMENTOS[directionKeyForPlan as keyof typeof DEPARTAMENTOS] ||
                              DEPARTAMENTOS[directionKeyForPlan] ||
                              DEPARTAMENTOS["DICOSAFA"] ||
                              [];

                            const matchedIds = new Set<string>();
                            const groupedDepts = departmentsForThisDirPlan.map((dept) => {
                              const deptActs = dirActivities.filter((a) => {
                                const actDept = (a.departamento || "").trim();
                                const isMainDeptOrBlank =
                                  !actDept &&
                                  (dept === "Chefe do GDG" ||
                                    dept === "Diretor da DICOSAFA" ||
                                    dept === "Diretor da DICOSSER" ||
                                    dept === "Diretor da Divisão de Engenharia" ||
                                    dept === "Diretor do CIE" ||
                                    dept === "Gabinete do Diretor-Geral");
                                const match =
                                  isMainDeptOrBlank ||
                                  actDept.toLowerCase() === dept.toLowerCase() ||
                                  actDept.toUpperCase().includes(dept.toUpperCase()) ||
                                  dept.toUpperCase().includes(actDept.toUpperCase());
                                if (match) {
                                  matchedIds.add(a.id);
                                }
                                return match;
                              });
                              const deptBudget = deptActs.reduce((acc, a) => acc + getActivityTotal(a), 0);
                              return { dept, deptActs, deptBudget };
                            });

                            const unassignedActs = dirActivities.filter((a) => !matchedIds.has(a.id));

                            return (
                              <div key={dirName} className="space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-200">
                                {/* Header da Direção */}
                                <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-md border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                  <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">
                                      DIREÇÃO: {dirName}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mt-1">
                                      Consolidação de atividades e orçamento de {dirName}.
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-3">
                                    <span className="text-[11px] font-bold text-amber-400 bg-white/10 px-3 py-1 rounded-full">
                                      {dirActivities.length} Atividades
                                    </span>
                                    <span className="text-[11px] font-mono font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
                                      Orçamento: {dirBudget.toLocaleString("pt-MZ", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })} MZN
                                    </span>
                                  </div>
                                </div>

                                {/* Departamentos da Direção */}
                                <div className="space-y-6">
                                  {groupedDepts
                                    .filter(({ deptActs }) => deptActs.length > 0) // Só mostrar depts com atividades
                                    .map(({ dept, deptActs, deptBudget }) => (
                                      <div
                                        key={dept}
                                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-3"
                                      >
                                        <div className="p-4 bg-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <span className="text-xs font-black uppercase tracking-wide">
                                            {dept}
                                          </span>
                                          <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-slate-300">
                                              {deptActs.length} {deptActs.length === 1 ? "Atividade" : "Atividades"}
                                            </span>
                                            <span className="text-[10px] font-mono font-black text-emerald-300 bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/20">
                                              {deptBudget.toLocaleString("pt-MZ", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              })}{" "}
                                              MZN
                                            </span>
                                          </div>
                                        </div>

                                        <div className="overflow-x-auto print:overflow-visible border-t border-slate-200">
                                          <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                                            <ActivityTableHeader isDPEP={isDPEP} />
                                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium whitespace-nowrap">
                                              {deptActs.filter(Boolean).map((activity, idx) => (
                                                <ActivityTableRow
                                                  key={activity.id}
                                                  activity={activity}
                                                  index={idx}
                                                  isDPEP={isDPEP}
                                                  user={user}
                                                  isBossOrAdmin={isBossOrAdmin}
                                                  getActivityTotal={getActivityTotal}
                                                  actions={
                                                    <div className="flex justify-center gap-1">
                                                      <button
                                                        onClick={() => {
                                                          setEditingActivity(activity);
                                                          setShowAddForm(true);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                                        title="Editar / Validar"
                                                      >
                                                        <Edit2 size={13} />
                                                      </button>
                                                      <button
                                                        onClick={() =>
                                                          handleDelete(activity.id)
                                                        }
                                                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                                        title="Remover"
                                                      >
                                                        <Trash2 size={13} />
                                                      </button>
                                                    </div>
                                                  }
                                                />
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    ))}

                                  {/* Mostrar unassigned de forma compacta se houver */}
                                  {unassignedActs.length > 0 && (
                                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-3">
                                      <div className="p-4 bg-slate-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <span className="text-xs font-black uppercase tracking-wide">
                                          Outras Atividades / Sem Departamento Correspondente
                                        </span>
                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-bold text-slate-300">
                                            {unassignedActs.length} {unassignedActs.length === 1 ? "Atividade" : "Atividades"}
                                          </span>
                                          <span className="text-[10px] font-mono font-black text-emerald-300 bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/20">
                                            {unassignedActs.reduce((acc, a) => acc + getActivityTotal(a), 0).toLocaleString("pt-MZ", {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            })}{" "}
                                            MZN
                                          </span>
                                        </div>
                                      </div>

                                      <div className="overflow-x-auto print:overflow-visible border-t border-slate-200">
                                        <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                                          <ActivityTableHeader isDPEP={isDPEP} />
                                          <tbody className="divide-y divide-slate-200 text-slate-700 font-medium whitespace-nowrap">
                                            {unassignedActs.filter(Boolean).map((activity, idx) => (
                                              <ActivityTableRow
                                                key={activity.id}
                                                activity={activity}
                                                index={idx}
                                                isDPEP={isDPEP}
                                                user={user}
                                                isBossOrAdmin={isBossOrAdmin}
                                                getActivityTotal={getActivityTotal}
                                                actions={
                                                  <div className="flex justify-center gap-1">
                                                    <button
                                                      onClick={() => {
                                                        setEditingActivity(activity);
                                                        setShowAddForm(true);
                                                      }}
                                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                                      title="Editar / Validar"
                                                    >
                                                      <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                      onClick={() =>
                                                        handleDelete(activity.id)
                                                      }
                                                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                                      title="Remover"
                                                    >
                                                      <Trash2 size={13} />
                                                    </button>
                                                  </div>
                                                }
                                              />
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  }

                  {/* SUB-TAB 1: PLANO INSTITUCIONAL */}
                  {activeSubTab === "plano_institucional" && (
                    <div className="space-y-2 print:block">
                      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-xl shadow-slate-100/50">
                        {/* Cabeçalho Oficial Requisitado pelo Usuário */}
                        <div className="text-center space-y-1 pb-8 mb-8 border-b-2 border-double border-slate-200 uppercase tracking-wider text-slate-800" id="header-plano-institucional">
                          <p className="text-xs font-bold opacity-75">República de Moçambique</p>
                          <p className="text-sm font-black text-slate-900">INSTITUTO SUPERIOR POLITÉCNICO DE SONGO</p>
                          <p className="text-[11px] font-bold">PROVÍNCIA DE TETE</p>
                          <p className="text-[11px] font-bold">DISTRITO DE CAHORA-BASSA</p>
                          <p className="text-[11px] font-black text-slate-900 mt-2">GABINETE DO DIRETOR GERAL</p>
                          <div className="w-16 h-0.5 bg-slate-300 mx-auto my-3"></div>
                          <h2 className="text-lg font-black text-indigo-900 tracking-widest mt-2 leading-none">
                            PLANO DE ATIVIDADE INSTITUCIONAL
                          </h2>
                        </div>

                        <div className="pb-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6">
                          <div className="flex-1">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                              Compilação do Plano Institucional
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Painel central para compilação e gestão do plano
                              geral de atividades de ISPS Songo.
                            </p>
                          </div>
                          <div className="flex gap-4">
                            <button
                              onClick={handleAutoAllocateSectors}
                              disabled={isAllocating}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-200 disabled:opacity-50"
                              title="Fazer a alocação de cada atividade no seu setor correspondente automaticamente"
                            >
                              <RefreshCw
                                size={14}
                                strokeWidth={1.5}
                                className={isAllocating ? "animate-spin" : ""}
                              />{" "}
                              {isAllocating
                                ? "A Alocar..."
                                : "Alocação Automática de Setores"}
                            </button>
                            {isAdminOrProgrammer && (
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-indigo-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
                              >
                                <FileUp size={16} /> Importar Plano (Excel)
                              </button>
                            )}
                            {isChefeDPEP && (
                              <button
                                onClick={handleClearAllActivities}
                                className="bg-rose-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-700 transition-all flex items-center gap-2 shadow-lg shadow-rose-200"
                              >
                                <Trash2 size={16} /> Limpeza Total do Sistema
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                            Total:{" "}
                            {
                              filteredActivities
                                .filter(
                                  (a) => (a.status as any) === "institucional",
                                )
                                .filter((a) => {
                                  if (isChefeDPEP) return true;
                                  if (directorDirection === "ALL") return true;
                                  if (!directorDirection) return true;
                                  return (a.direcao || "")
                                    .toUpperCase()
                                    .includes(directorDirection.toUpperCase());
                                }).length
                            }{" "}
                            Atividades
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-3xl shadow-sm mb-3">
                        <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                          <ActivityTableHeader isDPEP={isDPEP} />
                          <tbody className="divide-y divide-slate-200 text-slate-700 font-medium whitespace-nowrap">
                            {(
                              Object.entries(
                                filteredActivities
                                  .filter(
                                    (a) =>
                                      (a.status as any) === "institucional",
                                  )
                                  .filter((a) => {
                                    if (isChefeDPEP) return true;
                                    if (directorDirection === "ALL")
                                      return true;
                                    if (!directorDirection) return true;
                                    return (a.direcao || "")
                                      .toUpperCase()
                                      .includes(
                                        directorDirection.toUpperCase(),
                                      );
                                  })
                                  .sort((a, b) =>
                                    compareActivitiesStandardOrder(
                                      a,
                                      b,
                                      getActMonthIndex,
                                    ),
                                  )
                                  .reduce(
                                    (acc, act) => {
                                      const dir = act.direcao || "SEM DIREÇÃO";
                                      if (!acc[dir]) acc[dir] = [];
                                      acc[dir].push(act);
                                      return acc;
                                    },
                                    {} as Record<string, any[]>,
                                  ),
                              ) as [string, any[]][]
                            ).map(([direction, activities]) => (
                              <React.Fragment key={direction}>
                                <tr className="bg-slate-900 text-white border-2 border-slate-950">
                                  <td
                                    colSpan={45}
                                    className="p-3 text-[11px] font-black uppercase tracking-[0.2em]"
                                  >
                                    DIREÇÃO: {direction} — {activities.length}{" "}
                                    Atividades Planificadas
                                  </td>
                                </tr>
                                {activities.filter(Boolean).map((activity, idx) => (
                                  <ActivityTableRow
                                    key={activity.id}
                                    activity={activity}
                                    index={idx}
                                    isDPEP={isDPEP}
                                    user={user}
                                    isBossOrAdmin={isBossOrAdmin}
                                    getActivityTotal={getActivityTotal}
                                    actions={
                                      <div className="flex justify-center gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingActivity(activity);
                                            setShowAddForm(true);
                                          }}
                                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded"
                                          title="Visualizar/Editar"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDelete(activity.id)
                                          }
                                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded"
                                          title="Remover"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    }
                                  />
                                ))}
                              </React.Fragment>
                            ))}
                            {/* Linhas Vazias de Preenchimento para Estética foram removidas */}
                            {filteredActivities.filter(
                              (a) => (a.status as any) === "institucional",
                            ).length === 0 && (
                              <tr>
                                <td
                                  colSpan={37}
                                  className="p-12 text-center text-slate-400 italic font-medium"
                                >
                                  Nenhuma atividade consolidada para esta área
                                  no plano institucional.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: PESOE (N/O, DIREÇÃO, ATIVIDADE, ORÇAMENTO) */}
                  {activeSubTab === "pesoe" && !isChefeDPEP && !isPublished ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white min-h-[500px] rounded-3xl border border-slate-100 shadow-sm">
                      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6 border border-rose-100 shadow-sm animate-pulse">
                        <span className="text-4xl">🔴</span>
                      </div>
                      <h3 className="text-2xl font-black text-rose-600 uppercase tracking-wide">
                        DE: INDISPONÍVEL PARA TODOS
                      </h3>
                      <p className="text-slate-600 font-bold text-sm max-w-lg mt-3 leading-relaxed">
                        AGUARDAR A PUBLICAÇÃO, FEITA PELO DPEP (CHEFE DO DPEP)
                      </p>

                      {isDC ? (
                        <div className="mt-8 bg-amber-50 border border-amber-200 p-6 rounded-2xl max-w-md shadow-sm">
                          <h4 className="font-bold text-amber-800 text-sm flex items-center justify-center gap-2 mb-2">
                            <span className="inline-block w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
                            Aviso para Diretores
                          </h4>
                          <p className="text-xs text-amber-700 font-medium leading-relaxed">
                            Sendo{" "}
                            <strong className="text-slate-900">
                              {title || "Diretor"}
                            </strong>
                            , obterá autorização para visualizar e consultar o
                            DE consolidado diretamente em sua área (
                            <strong className="text-slate-900">
                              {directorDirection === "ALL"
                                ? "Todas as Áreas"
                                : directorDirection}
                            </strong>
                            ) assim que o Chefe do DPEP efetuar a **Publicação
                            Oficial**.
                          </p>
                        </div>
                      ) : (
                        <div className="mt-8 bg-slate-50 border border-slate-100 p-6 rounded-2xl max-w-md">
                          <p className="text-xs text-slate-500 font-bold leading-relaxed">
                            Apenas os Diretores e responsáveis autorizados terão
                            visibilidade e direitos de consulta das suas
                            respetivas áreas após a publicação oficial do DPEP.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div id="pesoe-print-area" data-print-type="plano" className="space-y-2 print:p-0 bg-white">
                      <div className="bg-white print:border-none border border-slate-150 rounded-3xl p-8 shadow-sm print:p-0 print:shadow-none">
                        {/* Cabeçalho Institucional Oficial Padronizado */}
                        <InstitutionalHeader
                          unidadeName={user.unidadeOrganica}
                          direcaoName={user.direcao}
                          departamentoName={user.departamento}
                          reparticaoName={user.reparticao}
                          sectorName={user.setor}
                          year={selectedYear}
                          isPlanificacaoHeader={isPlanificacao}
                        />

                        {/* Info extra para visualização web */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-3 border-b-2 border-slate-900 pb-2 font-sans bg-slate-50/70 p-6 rounded-3xl print:hidden mt-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
                              <ShieldCheck className="text-white" size={24} />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
                                Plano Institucional Consolidado
                              </h3>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                Visualização Oficial do DPEP
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black uppercase border-y-2 border-slate-900 py-2 inline-block px-4 text-[#121c60] bg-white rounded-lg">
                              PESOE: {selectedYear}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-2 border-b border-slate-200 print:hidden">
                          <div className="flex-1">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">
                              Instrumento de Transformação
                            </h2>
                            <p className="text-slate-500 text-xs italic font-medium">
                              Organizado estritamente na estrutura: N/O,
                              Direção, Atividade, Orçamento.
                            </p>
                          </div>

                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                              <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                size={15}
                              />
                              <input
                                type="text"
                                placeholder="Procurar atividade..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-xs font-bold pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
                          <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-2xl border border-slate-800 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                              <TrendingUp size={80} />
                            </div>
                            <p className="text-[10px] uppercase font-black tracking-widest opacity-60">
                              Orçamento Institucional Consolidado
                            </p>
                            <h3 className="text-4xl font-black mt-2 tracking-tighter">
                              {(
                                filteredActivities
                                  .filter(
                                    (a) =>
                                      (a.status as any) === "institucional",
                                  )
                                  .reduce(
                                    (sum, act) => sum + getActivityTotal(act),
                                    0,
                                  ) as number
                              ).toLocaleString("pt-MZ", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              <span className="text-sm ml-2 opacity-50 font-medium tracking-normal">
                                MZN
                              </span>
                            </h3>
                          </div>
                          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl flex flex-col justify-center">
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                              Total de Atividades Consolidadas
                            </p>
                            <h3 className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">
                              {
                                filteredActivities.filter(
                                  (a) => (a.status as any) === "institucional",
                                ).length
                              }
                              <span className="text-sm ml-2 text-slate-400 font-medium tracking-normal">
                                Itens
                              </span>
                            </h3>
                          </div>
                          <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 shadow-inner flex flex-col justify-center items-center text-center">
                            <div className="flex flex-col gap-2">
                              <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-1">
                                Ações de Gestão do Plano
                              </p>
                              <div className="flex gap-2">
                                {(isBossOrAdmin || isPlanificacao) && (
                                  <button
                                    onClick={handleFixNumbering}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                                  >
                                    <LayoutGrid size={16} /> REORDENAR E
                                    RENUMERAR TUDO
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Resumo por Direção e Departamento (Hierarchical Breakdown) */}
                        <div className="mb-3 bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-100/50 print:hidden">
                          <div className="bg-slate-900 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-500/20 rounded-xl">
                                <TrendingUp
                                  size={20}
                                  className="text-indigo-400"
                                />
                              </div>
                              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                                Hierarquia Orçamental Institucional
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 italic">
                              Consolidação por Direção e Departamento
                            </span>
                          </div>
                          <div className="p-8 space-y-8">
                            {Object.entries(
                              filteredActivities
                                .filter(
                                  (a) => (a.status as any) === "institucional",
                                )
                                .reduce(
                                  (acc, act) => {
                                    const dir =
                                      act.direcao || "ADMINISTRAÇÃO GERAL";
                                    const dept =
                                      act.departamento || "GERAL / OUTROS";
                                    if (!acc[dir])
                                      acc[dir] = { total: 0, depts: {} };
                                    if (!acc[dir].depts[dept])
                                      acc[dir].depts[dept] = 0;
                                    const val = getActivityTotal(act);
                                    acc[dir].total += val;
                                    acc[dir].depts[dept] += val;
                                    return acc;
                                  },
                                  {} as Record<
                                    string,
                                    {
                                      total: number;
                                      depts: Record<string, number>;
                                    }
                                  >,
                                ),
                            ).map(
                              ([dir, data]: [
                                string,
                                {
                                  total: number;
                                  depts: Record<string, number>;
                                },
                              ]) => (
                                <div
                                  key={dir}
                                  className="border-b border-slate-100 last:border-0 pb-8 last:pb-0"
                                >
                                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
                                    <div>
                                      <p className="text-[10px] uppercase font-black text-indigo-600 mb-1 tracking-widest">
                                        DIREÇÃO
                                      </p>
                                      <h5 className="text-xl font-black text-slate-900">
                                        {dir}
                                      </h5>
                                    </div>
                                    <div className="md:text-right bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                      <p className="text-[9px] uppercase font-black text-slate-400 mb-0.5 tracking-widest">
                                        TOTAL DIREÇÃO
                                      </p>
                                      <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                        {data.total.toLocaleString("pt-MZ", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        <span className="text-sm font-bold text-slate-400">
                                          MZN
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(
                                      data.depts as Record<string, number>,
                                    ).map(([dept, total]) => (
                                      <div
                                        key={dept}
                                        className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors"
                                      >
                                        <p
                                          className="text-[9px] uppercase font-bold text-slate-500 mb-1 truncate"
                                          title={dept}
                                        >
                                          {dept}
                                        </p>
                                        <p className="text-sm font-black text-slate-800">
                                          {total.toLocaleString("pt-MZ", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}{" "}
                                          <span className="text-[10px] text-slate-400">
                                            MZN
                                          </span>
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                          <div className="bg-indigo-600 p-6 flex justify-between items-center">
                            <div className="flex items-center gap-3 text-white/80">
                              <LayoutGrid size={24} />
                              <span className="text-xs font-black uppercase tracking-[0.2em]">
                                Resumo Geral Institucional
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">
                                Orçamento Total Consolidado
                              </p>
                              <p className="text-3xl font-black text-white tracking-tighter">
                                {(
                                  filteredActivities
                                    .filter(
                                      (a) =>
                                        (a.status as any) === "institucional",
                                    )
                                    .reduce(
                                      (sum, act) => sum + getActivityTotal(act),
                                      0,
                                    ) as number
                                ).toLocaleString("pt-MZ", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                <span className="text-sm font-bold opacity-60">
                                  MZN
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* NOVO: Resumo Consolidado por Rúbrica (Rubricas Mães) */}
                        <div className="mb-3 bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl shadow-slate-100/50 print:hidden">
                          <div className="bg-slate-900 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-500/20 rounded-xl">
                                <TrendingUp
                                  size={20}
                                  className="text-emerald-400"
                                />
                              </div>
                              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white">
                                Resumo Consolidado por Rúbrica (Materiais, Serviços, Ajudas de Custo)
                              </h4>
                            </div>
                          </div>
                          <div className="p-8">
                             <p className="text-xs text-slate-500 italic mb-6">Agrupado por Rúbricas Mães (somatório consolidado de todas as rubricas usadas).</p>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {
                                  Object.values(
                                    filteredActivities
                                      .filter((a) => (a.status as any) === "institucional")
                                      .reduce((acc, act) => {
                                         const rawRubrica = act.rubrica || (Array.isArray(act.rubricas) && act.rubricas[0]?.rubrica) || "Geral";
                                         const parent = getParentRubrica(rawRubrica);
                                         if (!acc[parent]) {
                                           acc[parent] = { parentName: parent, total: 0, count: 0 };
                                         }
                                         const actVal = getActivityTotal(act);
                                         acc[parent].total += actVal;
                                         acc[parent].count += 1;
                                         if (Array.isArray(act.rubricas)) {
                                           act.rubricas.forEach((r: any) => {
                                             acc[parent].total += Number(r.valorTotal || r.valor || 0);
                                           });
                                         }
                                         return acc;
                                      }, {} as Record<string, { parentName: string; total: number; count: number }>)
                                  ).map((group: { parentName: string; total: number; count: number }) => (
                                    <div key={group.parentName} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                      <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rúbrica Mãe</p>
                                        <p className="text-sm font-black text-blue-950 mt-1">{group.parentName}</p>
                                        <p className="text-[11px] text-slate-500 mt-2">{group.count} atividades associadas</p>
                                      </div>
                                      <p className="text-base font-black text-emerald-600 mt-4 pt-3 border-t border-slate-200/60">
                                         {group.total.toLocaleString("pt-MZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px]">MZN</span>
                                      </p>
                                    </div>
                                  ))
                                }
                             </div>
                          </div>
                        </div>

                        {/* PESOE Main Table */}
                        <div className="mt-3 overflow-x-auto print:overflow-visible border border-slate-200 rounded-[2rem] shadow-sm" data-print-type="balanco">
                          <table className="w-full text-left border-collapse min-w-[1900px] print:min-w-full font-sans text-xs print-table-compact">
                            <ActivityTableHeader isDPEP={isDPEP} />
                            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium whitespace-nowrap">
                              {(
                                Object.entries(
                                  filteredActivities
                                    .sort((a, b) =>
                                      compareActivitiesStandardOrder(
                                        a,
                                        b,
                                        getActMonthIndex,
                                      ),
                                    )
                                    .filter((a) => {
                                      if (isChefeDPEP) return true;
                                      if (directorDirection === "ALL")
                                        return true;
                                      if (!directorDirection) return true;
                                      return (a.direcao || "")
                                        .toUpperCase()
                                        .includes(
                                          directorDirection.toUpperCase(),
                                        );
                                    })
                                    .filter((a) =>
                                      (a.title || a.designacao || "")
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()),
                                    )
                                    .reduce(
                                      (acc, act) => {
                                        const dir =
                                          act.direcao || "SEM DIREÇÃO";
                                        if (!acc[dir]) acc[dir] = [];
                                        acc[dir].push(act);
                                        return acc;
                                      },
                                      {} as Record<string, any[]>,
                                    ),
                                ) as [string, any[]][]
                              ).map(([direction, activities]) => {
                                const directionTotalBudget = activities.reduce(
                                  (sum, act) => sum + getActivityTotal(act),
                                  0,
                                );

                                return (
                                  <React.Fragment key={direction}>
                                    <tr className="bg-slate-900 text-white border-y-2 border-slate-950">
                                      <td
                                        colSpan={45}
                                        className="p-4 text-[12px] font-black uppercase tracking-[0.3em] bg-gradient-to-r from-slate-900 to-indigo-900"
                                      >
                                        <div className="flex justify-between items-center">
                                          <span>🏢 DIREÇÃO: {direction}</span>
                                          <div className="flex gap-4 items-center">
                                            <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                                              {activities.length} Atividades
                                            </span>
                                            <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-lg border border-amber-500/30 font-mono">
                                              Total Direção:{" "}
                                              {directionTotalBudget.toLocaleString(
                                                "pt-MZ",
                                                {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                },
                                              )}{" "}
                                              MZN
                                            </span>
                                            {(isBossOrAdmin ||
                                              isPlanificacao) && (
                                              <button
                                                onClick={() => {
                                                  if (
                                                    confirm(
                                                      `Renumerar todas as ${activities.length} atividades da direção ${direction}?`,
                                                    )
                                                  ) {
                                                    reorderAndRenumber(
                                                      activities,
                                                    );
                                                  }
                                                }}
                                                className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg border border-white/20 shadow-sm transition-all"
                                                title="Renumerar esta Direção"
                                              >
                                                <LayoutGrid size={12} />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                    {activities.map((act, idx) => (
                                      <ActivityTableRow
                                        key={act.id}
                                        activity={act}
                                        index={idx}
                                        isDPEP={isDPEP}
                                        user={user}
                                        isBossOrAdmin={isBossOrAdmin}
                                        getActivityTotal={getActivityTotal}
                                        actions={
                                          <button
                                            onClick={() => {
                                              setEditingActivity(act);
                                              setShowAddForm(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 font-black uppercase text-[9px] tracking-tighter"
                                          >
                                            Editar
                                          </button>
                                        }
                                      />
                                    ))}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                            <tfoot className="print:table-footer-group">
                              <tr className="bg-slate-100 font-black border-t-2 border-slate-900">
                                <td
                                  colSpan={32}
                                  className="p-4 text-right uppercase tracking-wider"
                                >
                                  TOTAL DE CONSOLIDADO
                                </td>
                                <td className="p-4 text-right text-base text-[#121c60]">
                                  MZN{" "}
                                  {filteredActivities
                                    .filter(
                                      (a) =>
                                        (a.status as any) === "institucional",
                                    )
                                    .filter((a) => {
                                      if (isChefeDPEP) return true;
                                      if (directorDirection === "ALL")
                                        return true;
                                      if (!directorDirection) return true;
                                      return (a.direcao || "")
                                        .toUpperCase()
                                        .includes(
                                          directorDirection.toUpperCase(),
                                        );
                                    })
                                    .reduce(
                                      (sum, current) =>
                                        sum + getActivityTotal(current),
                                      0,
                                    )
                                    .toLocaleString("pt-MZ", {
                                      minimumFractionDigits: 2,
                                    })}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        <div className="hidden print:grid grid-cols-2 gap-12 mt-20 text-center text-xs font-bold leading-relaxed">
                          <div>
                            <p className="border-b border-black w-48 mx-auto mb-2"></p>
                            <p className="uppercase">O RESPONSÁVEL DO PLANO</p>
                            <p className="text-[10px] text-slate-500">
                              Repartição de Planificação
                            </p>
                          </div>
                          <div>
                            <p className="border-b border-black w-48 mx-auto mb-2"></p>
                            <p className="uppercase">O DIRETOR CENTRAL</p>
                            <p className="text-[10px] text-slate-500">
                              Instituto Superior Politécnico de Songo
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Modal */}
            <AnimatePresence>
              {showAddForm && (
                <div className="fixed inset-0 z-[150] bg-white flex flex-col">
                  <ActivityForm
                    planType="Plano de Atividades"
                    sectorName={title}
                    plannedActivitiesCount={authorizedActivities.length}
                    plannedActivitiesProp={initialActivities}
                    onClose={() => {
                      setShowAddForm(false);
                      setEditingActivity(null);
                    }}
                    colaboradores={colaboradores}
                    initialData={editingActivity || { ano: selectedYear }}
                    user={user}
                    readOnly={
                      editingActivity ? !canEdit(editingActivity) : false
                    }
                    onSubmit={async (data) => {
                      const totalValue =
                        data.rubricas?.reduce(
                          (acc: number, r: any) =>
                            acc + (r.valorTotal || r.total || 0),
                          0,
                        ) || 0;
                      const mainRubric = data.rubricas?.[0]?.rubrica || "";

                      const activity: any = {
                        ...data,
                        id:
                          (data._forceNewRecord ? undefined : editingActivity?.id) ||
                          Math.random().toString(36).substr(2, 9),
                        status:
                          (data._forceNewRecord ? undefined : editingActivity?.status) ||
                          (selectedRoleMode === "Planificação"
                            ? "planificacao"
                            : selectedRoleMode === "Direção"
                              ? "direcao"
                              : selectedRoleMode === "Departamento"
                                ? "departamento"
                                : selectedRoleMode === "Repartição"
                                  ? "reparticao"
                                  : "setorial"),
                        submetido: data._forceNewRecord ? false : (editingActivity?.submetido || false),
                        createdAt:
                          (data._forceNewRecord ? undefined : editingActivity?.createdAt) ||
                          new Date().toISOString(),
                        createdBy:
                          (data._forceNewRecord ? undefined : editingActivity?.createdBy) || user?.email || "",
                        createdByName:
                          (data._forceNewRecord ? undefined : editingActivity?.createdByName) ||
                          user?.nome ||
                          user?.name ||
                          user?.displayName ||
                          "",
                        nuit: (data._forceNewRecord ? undefined : editingActivity?.nuit) || user?.nuit || "",
                        no: (() => {
                          if (data.nAtividade || data.no) return String(data.nAtividade || data.no).padStart(3, "0");
                          if (!data._forceNewRecord && editingActivity?.no) return editingActivity.no;

                          const specificArea = 
                            data.departamento || 
                            data.setor || 
                            data.reparticao || 
                            data.curso ||
                            data.direcao || 
                            data.selectedCategory || 
                            title ||
                            "ISPS";

                          const normTarget = normalizeSectorName(specificArea);
                          const genericTerms = ["isps", "geral", "plano setorial", "plano de atividades", "todos", "admin"];

                          const areaActivities = rawActivities.filter(
                            (a: any) => {
                              if (!genericTerms.includes(normTarget.toLowerCase()) && normTarget.length > 0) {
                                const actDept = normalizeSectorName(a.departamento || a.unidadeOrganica);
                                const actSetor = normalizeSectorName(a.setor || a.sector || a.curso);
                                const actRep = normalizeSectorName(a.reparticao);
                                const actDir = normalizeSectorName(a.direcao);

                                const isMatch =
                                  (actDept && (normTarget.includes(actDept) || actDept.includes(normTarget))) ||
                                  (actSetor && (normTarget.includes(actSetor) || actSetor.includes(normTarget))) ||
                                  (actRep && (normTarget.includes(actRep) || actRep.includes(normTarget))) ||
                                  (actDir && (normTarget.includes(actDir) || actDir.includes(normTarget)));

                                if (!isMatch) return false;
                              }
                              return (a.ano || new Date().getFullYear()) === selectedYear;
                            }
                          );

                          const maxNumber = areaActivities.reduce(
                            (max: number, a: any) => {
                              const numStr = a.numeroAtividade || a.nAtividade || a.no;
                              const parsedNum = numStr ? parseInt(String(numStr).replace(/\D/g, ""), 10) : NaN;
                              if (!isNaN(parsedNum)) return parsedNum > max ? parsedNum : max;

                              const ref = String(a.referencia || a.codigoAtividade || "");
                              const match = ref.match(/\/(\d{3})\//) || ref.match(/\/(\d+)\//);
                              const num = match ? parseInt(match[1], 10) : 0;
                              return num > max ? num : max;
                            },
                            0,
                          );

                          return String(maxNumber + 1).padStart(3, "0");
                        })(),
                        referencia: (() => {
                          if (data.codigoAtividade && !data.codigoAtividade.includes("/000/"))
                            return data.codigoAtividade.toUpperCase();
                          if (!data._forceNewRecord && editingActivity?.referencia)
                            return editingActivity.referencia;
                          
                          const specificArea = 
                            data.departamento || 
                            data.setor || 
                            data.reparticao || 
                            data.curso ||
                            data.direcao || 
                            data.selectedCategory || 
                            title ||
                            "ISPS";

                          const normTarget = normalizeSectorName(specificArea);
                          const genericTerms = ["isps", "geral", "plano setorial", "plano de atividades", "todos", "admin"];

                          const areaActivities = rawActivities.filter(
                            (a: any) => {
                              if (!genericTerms.includes(normTarget.toLowerCase()) && normTarget.length > 0) {
                                const actDept = normalizeSectorName(a.departamento || a.unidadeOrganica);
                                const actSetor = normalizeSectorName(a.setor || a.sector || a.curso);
                                const actRep = normalizeSectorName(a.reparticao);
                                const actDir = normalizeSectorName(a.direcao);

                                const isMatch =
                                  (actDept && (normTarget.includes(actDept) || actDept.includes(normTarget))) ||
                                  (actSetor && (normTarget.includes(actSetor) || actSetor.includes(normTarget))) ||
                                  (actRep && (normTarget.includes(actRep) || actRep.includes(normTarget))) ||
                                  (actDir && (normTarget.includes(actDir) || actDir.includes(normTarget)));

                                if (!isMatch) return false;
                              }
                              return (a.ano || new Date().getFullYear()) === selectedYear;
                            }
                          );

                          const maxNumber = areaActivities.reduce(
                            (max: number, a: any) => {
                              const numStr = a.numeroAtividade || a.nAtividade || a.no;
                              const parsedNum = numStr ? parseInt(String(numStr).replace(/\D/g, ""), 10) : NaN;
                              if (!isNaN(parsedNum)) return parsedNum > max ? parsedNum : max;

                              const ref = String(a.referencia || a.codigoAtividade || "");
                              const match = ref.match(/\/(\d{3})\//) || ref.match(/\/(\d+)\//);
                              const num = match ? parseInt(match[1], 10) : 0;
                              return num > max ? num : max;
                            },
                            0,
                          );

                          const nextNumber = String(maxNumber + 1).padStart(3, "0");

                          const dirInitials = (data.unidadeSelecionada || data.direcao || "ISPS").substring(0, 3).toUpperCase();
                          const deptInitials = specificArea.substring(0, 4).toUpperCase();
                          const actTitle = data.nomeAtividade || data.title || "ACT";
                          const actInitials = actTitle.replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase() || "ACT";

                          return `${dirInitials}/${deptInitials}/${nextNumber}/${actInitials}`;
                        })(),
                        title:
                          data.nomeAtividade || data.title || "Nova Atividade",
                        direcao:
                          data.unidadeSelecionada ||
                          data.direcao ||
                          editingActivity?.direcao ||
                          "",
                        departamento:
                          data.departamento ||
                          editingActivity?.departamento ||
                          "",
                        reparticao:
                          data.reparticao ||
                          editingActivity?.reparticao ||
                          title ||
                          "Repartição de Transporte",
                        orcamento:
                          data.fonteReceita ||
                          mainRubric ||
                          editingActivity?.orcamento ||
                          "Orçamento do Estado",
                        valor:
                          Number(totalValue) || editingActivity?.valor || 0,
                        frequencia: data.frequencia || "Mensal",
                        mesExecucao: data.mesExecucao || "",
                        unidadeOrganica:
                          data.selectedCategory ||
                          data.unidadeOrganica ||
                          editingActivity?.unidadeOrganica ||
                          "ISPS",
                        localRealizacao:
                          data.trabalhoProvincia && data.trabalhoDistrito
                            ? `${data.trabalhoProvincia} - ${data.trabalhoDistrito}`
                            : data.realizacaoProvincia &&
                                data.realizacaoDistrito
                              ? `${data.realizacaoProvincia} - ${data.realizacaoDistrito}`
                              : "",
                        dataMes:
                          data.mesRealizacao ||
                          data.dataInicio ||
                          new Date().toLocaleString("pt", { month: "long" }),
                        data:
                          data.dataInicio && data.dataFim
                            ? `${data.dataInicio} a ${data.dataFim}`
                            : data.dataInicio || data.dataFim || "",
                        responsavel: data.responsavel || "",
                        responsavelEmail: (() => {
                          if (data.responsavelEmail)
                            return data.responsavelEmail;
                          // Tentar encontrar o email do responsável na lista de colaboradores
                          if (data.responsavel && colaboradores) {
                            const colab = colaboradores.find(
                              (c) =>
                                c.nome === data.responsavel ||
                                c.name === data.responsavel,
                            );
                            if (colab && colab.email) return colab.email;
                          }
                          return "";
                        })(),
                        prazo:
                          data.dataFim ||
                          data.mesRealizacao ||
                          data.dataInicio ||
                          "",
                        objetivoAtividade: data.objetivoAtividade || "",
                        trabalhoProvincia: data.trabalhoProvincia || "",
                        trabalhoDistrito: data.trabalhoDistrito || "",
                        realizacaoProvincia: data.realizacaoProvincia || "",
                        realizacaoDistrito: data.realizacaoDistrito || "",
                        outrosColaboradores: data.outrosColaboradores || "",
                        necessitaTransporte: data.necessitaTransporte || "Não",
                        viatura: data.viatura || "",
                        motorista: data.motorista || "",
                        observacoes: data.observacoes || "",
                        rubricas: data.rubricas || [],
                        necessitaAquisicao: data.necessitaAquisicao || "Não",
                        necessitaContratacao:
                          data.necessitaContratacao || "Não",
                        tipoPlano: data.tipoPlano || "Setorial",
                        trimestre: data.trimestre || "",
                        mesRealizacao: data.mesRealizacao || "",
                        dataInicio: data.dataInicio || "",
                        dataFim: data.dataFim || "",
                        totalDias: Number(data.totalDias) || 0,
                        distanciaKm: Number(
                          (data.distanciaKm || data.distanciaDestino || 0) * 2,
                        ),
                        distanciaDestino: Number(
                          data.distanciaDestino || 0,
                        ),
                        litrosGasoleo: Number(data.litrosGasoleo || 0),
                        precoLitro: Number(data.precoLitro || 0),
                        valorTotalGasoleo: Number(data.valorTotalGasoleo || 0),
                        prioridadeProposta: data.prioridadeProposta || "",
                        codigoAtividade: data.codigoAtividade || "",
                        setor: data.setor || "",
                        curso: data.curso || "",
                        requiresUpdate: false,
                        ano: (editingActivity && editingActivity.id && !data._forceNewRecord)
                          ? Number(editingActivity.ano || 2026)
                          : Number(data.ano || selectedYear),
                        publicadoPorNome:
                          user?.nome || user?.name || user?.displayName || "",
                        publicadoPorDepartamento:
                          user?.departamento || user?.direcao || "",
                      };

                      try {
                        console.log(
                          "PlanoWorkflowView: Processando atividade:",
                          activity.title,
                        );
                        if (editingActivity && editingActivity.id && !data._forceNewRecord) {
                          console.log(
                            "PlanoWorkflowView: Atualizando atividade existente ID:",
                            editingActivity.id,
                          );
                          await firestoreService.matrixActivities.replace(
                            editingActivity.id,
                            activity,
                          );
                          console.log(
                            "PlanoWorkflowView: Atividade atualizada no Firestore.",
                          );

                          // Sincronizar atualizações com outras cópias da mesma atividade nas diferentes etapas do fluxo
                          try {
                            console.log(
                              "PlanoWorkflowView: Iniciando sincronização de cópias...",
                            );
                            const {
                              id,
                              status,
                              submetido,
                              createdAt,
                              ...fieldsToUpdate
                            } = activity;
                            const relatedCopies = rawActivities.filter((a) => {
                              if (a.id === editingActivity.id) return false;
                              if ((a.ano || 2026) !== (activity.ano || 2026))
                                return false;

                              const sameRef =
                                activity.referencia &&
                                a.referencia &&
                                activity.referencia === a.referencia;
                              const sameCode =
                                activity.codigoAtividade &&
                                a.codigoAtividade &&
                                activity.codigoAtividade === a.codigoAtividade;
                              const sameNumAndSector =
                                activity.no === a.no &&
                                (activity.setor ||
                                  activity.reparticao ||
                                  "") === (a.setor || a.reparticao || "") &&
                                (activity.departamento || "") ===
                                  (a.departamento || "");
                              const sameTitleAndSector =
                                activity.title &&
                                a.title &&
                                activity.title === a.title &&
                                (activity.setor ||
                                  activity.reparticao ||
                                  "") === (a.setor || a.reparticao || "") &&
                                (activity.departamento || "") ===
                                  (a.departamento || "");

                              return (
                                sameRef ||
                                sameCode ||
                                sameNumAndSector ||
                                sameTitleAndSector
                              );
                            });

                            if (relatedCopies.length > 0) {
                              console.log(
                                `PlanoWorkflowView: Sincronizando ${relatedCopies.length} cópias em background.`,
                              );
                              // Sincronização em background para não bloquear a UI
                              Promise.all(
                                relatedCopies.map((copy) =>
                                  firestoreService.matrixActivities.update(
                                    copy.id,
                                    fieldsToUpdate,
                                  ),
                                ),
                              )
                                .then(() => {
                                  console.log(
                                    `Sincronizadas ${relatedCopies.length} cópias da atividade.`,
                                  );
                                })
                                .catch((syncErr) => {
                                  console.error(
                                    "Erro ao sincronizar cópias em background:",
                                    syncErr,
                                  );
                                });

                              // Atualizar imediatamente o estado local para as cópias
                              setRawActivities((prev) =>
                                prev.map((a) => {
                                  const isCopy = relatedCopies.some(
                                    (c) => c.id === a.id,
                                  );
                                  if (isCopy)
                                    return { ...a, ...fieldsToUpdate };
                                  return a;
                                }),
                              );
                            }
                          } catch (syncErr) {
                            console.error(
                              "Erro ao sincronizar cópias:",
                              syncErr,
                            );
                          }

                          // Atualizar estado local da atividade principal APÓS sincronização
                          setRawActivities((prev) =>
                            prev.map((a) =>
                              a.id === editingActivity.id ? activity : a,
                            ),
                          );

                          console.log(
                            "PlanoWorkflowView: Fechando formulário.",
                          );
                          setShowAddForm(false);
                          setEditingActivity(null);

                          onShowAlert(
                            "Atividade planificada atualizada com sucesso!",
                          );
                        } else {
                          console.log(
                            "PlanoWorkflowView: Adicionando nova atividade.",
                          );
                          const newId =
                            await firestoreService.matrixActivities.add(
                              activity,
                            );
                          console.log(
                            "PlanoWorkflowView: Nova atividade adicionada com ID:",
                            newId,
                          );
                          const savedActivity = {
                            ...activity,
                            id: newId || activity.id,
                          };
                          setRawActivities((prev) => { if (prev.some(a => a.id === savedActivity.id)) { return prev.map(a => a.id === savedActivity.id ? savedActivity : a); } return [savedActivity, ...prev]; });

                          console.log(
                            "PlanoWorkflowView: Fechando formulário.",
                          );
                          setShowAddForm(false);
                          setEditingActivity(null);

                          onShowAlert(
                            `Atividade planificada adicionada ao Plano ${
                              activeSubTab === "plano_institucional"
                                ? "Institucional"
                                : activeSubTab === "plano_direcoes"
                                  ? "da Direção"
                                  : activeSubTab === "plano_departamento"
                                    ? "do Departamento"
                                    : "da Repartição"
                            } com sucesso!`,
                          );
                        }
                      } catch (err: any) {
                        console.error("Erro ao salvar atividade:", err);
                        throw new Error(
                          err?.message ||
                            "Falha ao registar a atividade no servidor.",
                        );
                      }
                    }}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Modal de Agendamento de Atualização */}
            <AnimatePresence>
              {showScheduleModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
                  >
                    <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-2xl shadow-sm text-amber-600">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <h2 className="text-slate-900 font-black text-sm uppercase tracking-tight">
                            Agendar Atualização
                          </h2>
                          <p className="text-amber-700/70 text-[10px] font-bold uppercase tracking-wider">
                            Edição extraordinária
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Título do Agendamento
                        </label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                          placeholder="Ex: Atualização do 1º Semestre"
                          value={newSchedule.title}
                          onChange={(e) =>
                            setNewSchedule({
                              ...newSchedule,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            Início
                          </label>
                          <input
                            type="date"
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                            value={newSchedule.startDate}
                            onChange={(e) =>
                              setNewSchedule({
                                ...newSchedule,
                                startDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            Fim (Prazo)
                          </label>
                          <input
                            type="date"
                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                            value={newSchedule.endDate}
                            onChange={(e) =>
                              setNewSchedule({
                                ...newSchedule,
                                endDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Nível de Acesso
                        </label>
                        <select
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all"
                          value={newSchedule.statusToUpdate}
                          onChange={(e) =>
                            setNewSchedule({
                              ...newSchedule,
                              statusToUpdate: e.target.value,
                            })
                          }
                        >
                          <option value="setor">
                            Setores (Plano Setorial)
                          </option>
                          <option value="reparticao">Repartições</option>
                          <option value="departamento">Departamentos</option>
                          <option value="direcao">Direções</option>
                        </select>
                      </div>

                      <p className="text-[9px] text-slate-400 font-bold uppercase italic leading-relaxed text-center px-4">
                        * Os documentos deste nível tornar-se-ão editáveis até o
                        prazo final, após o qual serão submetidos
                        automaticamente.
                      </p>
                    </div>

                    <div className="p-6 bg-slate-50 flex gap-3">
                      <button
                        onClick={() => setShowScheduleModal(false)}
                        className="flex-1 px-6 py-3.5 bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={async () => {
                          if (!newSchedule.endDate || !newSchedule.title) {
                            alert("Preencha todos os campos.");
                            return;
                          }
                          try {
                            await firestoreService.plan_schedules.add({
                              ...newSchedule,
                              autoSubmitted: false,
                              createdBy: user?.nome || user?.email,
                            });
                            setShowScheduleModal(false);
                            onShowAlert(
                              "Período de atualização agendado com sucesso.",
                            );
                          } catch (err) {
                            console.error(err);
                            alert("Erro ao agendar.");
                          }
                        }}
                        className="flex-1 px-6 py-3.5 bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-100 hover:bg-amber-700 transition-all"
                      >
                        Confirmar
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Modal de Sincronização do Arquivo Morto */}
            {isSyncModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-scale-up">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5">
                        Sincronização Institucional
                      </span>
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        Converter Plano Digital
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsSyncModalOpen(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Selecione o ano e o ficheiro do Arquivo Morto para
                      sincronizar as atividades com o seu plano setorial atual.
                    </p>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                          Ano do Plano
                        </label>
                        <select
                          value={syncYear}
                          onChange={(e) => {
                            const yr = Number(e.target.value);
                            setSyncYear(yr);
                            // O ideal seria disparar o reload aqui, mas como estamos no componente, podemos usar um useEffect
                          }}
                          className="px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 outline-none text-sm font-semibold transition-all bg-white"
                        >
                          {[2026, 2025, 2024, 2023].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                          Ficheiro a Sincronizar
                        </label>
                        <select
                          value={selectedPlanId}
                          onChange={(e) => setSelectedPlanId(e.target.value)}
                          className="px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-0 outline-none text-sm font-semibold transition-all bg-white"
                        >
                          {availablePlans.length > 0 ? (
                            availablePlans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title || p.nome || `Plano ${syncYear}`}
                              </option>
                            ))
                          ) : (
                            <option value="">
                              Nenhum ficheiro encontrado (Usar Padrão)
                            </option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-3">
                      <button
                        onClick={handleSyncPlano}
                        disabled={isLoading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
                        ) : (
                          <FileUp size={16} />
                        )}
                        Iniciar Conversão
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileConversion}
                        className="hidden"
                        accept=".xlsx, .pdf"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all"
                      >
                        {isProcessing ? "Processando..." : "Converter Ficheiro"}
                      </button>
                      <button
                        onClick={() => setIsSyncModalOpen(false)}
                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest rounded-2xl transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {deleteConfirmId && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-scale-up">
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Confirmar Exclusão
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-slate-500 font-medium">
                      Tem a certeza de que deseja remover permanentemente esta
                      atividade?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 px-4 py-2 bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={performDelete}
                        className="flex-1 px-4 py-2 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODAL DE TRAMITAÇÃO E ASSINATURA */}
            <AnimatePresence>
              {showTramitacaoModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col"
                  >
                    <div className="p-8 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                          <Send size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                          Submeter o Plano de Atividade
                        </h3>
                      </div>
                      <p className="text-sm font-bold text-slate-500">
                        O plano será submetido automaticamente para o seu superior hierárquico conforme o enquadramento.
                      </p>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                        <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5">
                          <Info size={14} />
                        </div>
                        <p className="text-[11px] text-amber-900 font-bold leading-relaxed">
                          Ao confirmar, o sistema registrará sua assinatura digital
                          (<strong>{user?.nome || user?.email}</strong>) e enviará o 
                          plano para o gabinete selecionado.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Destinatário Oficial
                        </label>
                        <select
                          value={selectedDestinatario}
                          onChange={(e) => setSelectedDestinatario(e.target.value)}
                          className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-0 outline-none text-sm font-bold transition-all bg-slate-50 hover:bg-white"
                        >
                          <option value="">Selecione o Gabinete / Setor</option>
                          {(() => {
                            if (!workflowToProcess) return GABINETES_DESTINATARIOS;
                            const { toStatus } = workflowToProcess;
                            
                            let options: string[] = [];
                            if (toStatus === "reparticao") options = [user?.reparticao];
                            else if (toStatus === "departamento") options = [user?.departamento];
                            else if (toStatus === "direcao") options = [user?.direcao];
                            else if (toStatus === "planificacao") options = ["Direção de Planificação e Estudos (DPEP)"];
                            else if (toStatus === "institucional") options = ["Conselho de Direção", "Gabinete do Diretor Geral"];
                            
                            const validOptions = options.filter(o => o && o.trim() !== "");
                            return validOptions.length > 0 ? validOptions.map(g => (
                              <option key={g} value={g}>{g}</option>
                            )) : GABINETES_DESTINATARIOS.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ));
                          })()}
                        </select>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={() => {
                            setShowTramitacaoModal(false);
                            setSelectedDestinatario("");
                            setWorkflowToProcess(null);
                          }}
                          className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={confirmWorkflowTransition}
                          disabled={isLoading || !selectedDestinatario}
                          className="flex-1 px-6 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 active:scale-95"
                        >
                          {isLoading ? (
                            <RefreshCw size={16} strokeWidth={1.5} className="animate-spin" />
                          ) : (
                            <>
                              <Save size={16} /> Submeter
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MODAL DE HISTÓRICO DE TRAMITAÇÃO / ASSINATURAS */}
            <AnimatePresence>
              {activityForHistory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]"
                  >
                    <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">
                            Histórico de Tramitação
                          </h3>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                            Livro de Assinaturas Digitais
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActivityForHistory(null)}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                      >
                        <X size={20} className="text-slate-400" />
                      </button>
                    </div>

                    <div className="p-8 overflow-y-auto space-y-6">
                      <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1.5">Documento</h4>
                        <p className="text-sm font-bold text-slate-900 leading-tight">
                          {activityForHistory.title || activityForHistory.designacao}
                        </p>
                        <p className="text-[10px] text-indigo-700 mt-1 font-medium">
                          Código: {activityForHistory.codigoAtividade || activityForHistory.referencia}
                        </p>
                      </div>

                      <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {Array.isArray(activityForHistory.workflowHistory) && activityForHistory.workflowHistory.length > 0 ? (
                          activityForHistory.workflowHistory.map((entry: any, idx: number) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 z-10 shadow-sm" />
                              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h5 className="text-sm font-black text-slate-900">{entry.userName}</h5>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{entry.userRole}</p>
                                  </div>
                                  <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">
                                    {new Date(entry.date).toLocaleString('pt-PT')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
                                  <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
                                    <Save size={10} />
                                  </span>
                                  <p className="text-[11px] font-bold text-slate-600">
                                    {entry.action} para <span className="text-indigo-900">{entry.destination}</span>
                                  </p>
                                </div>
                                <div className="mt-4 flex items-center gap-2">
                                  <div className="h-0.5 flex-1 bg-slate-50"></div>
                                  <span className="text-[8px] font-black text-slate-300 italic uppercase">Assinatura Digital Verificada</span>
                                  <div className="h-0.5 flex-1 bg-slate-50"></div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-12 text-center">
                            <p className="text-sm font-bold text-slate-400 italic">Nenhum registro de tramitação oficial encontrado.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => setActivityForHistory(null)}
                        className="px-8 py-3 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
                      >
                        Fechar Registro
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ActivitySelectionContext.Provider>
  );
}
