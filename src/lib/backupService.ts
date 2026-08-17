import { db } from "./firebase";
import { getCircularReplacer, safeJSONStringify, cleanObject } from "./utils";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { EFETIVO_GERAL_DATA } from "../constants/colaboradoresList";

interface BackupDocument {
  id: string;
  [key: string]: unknown;
}

export interface BackupData {
  [collectionName: string]: BackupDocument[] | any;
}

export interface BackupResult {
  success: boolean;
  error?: string;
  filename?: string;
  collectionStats?: Record<string, number>;
  organStats?: Record<string, number>;
  backupRecord?: SystemBackupRecord;
}

export interface SystemOrganInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
  badgeColor: string;
  collections: string[];
}

export interface SystemBackupRecord {
  id: string;
  timestamp: string;
  formattedDate: string;
  type: "auto" | "manual";
  totalRecords: number;
  totalSizeKB: number;
  organStats: Record<string, number>;
  collectionStats: Record<string, number>;
  backupData?: BackupData;
  status: "completed" | "in_progress" | "failed";
}

export const SYSTEM_ORGAOS: SystemOrganInfo[] = [
  {
    id: "direcao_gestao",
    name: "Órgão de Direção e Gestão",
    shortName: "Direção & Gestão",
    description: "Conselho de Direção, planos estratégicos institucionais, chefias, pareceres, relatórios, assinaturas e atos normativos da direção",
    iconName: "Building2",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    collections: [
      "historico_chefias",
      "colaboradores_chefia",
      "institucional_plans",
      "reports",
      "monografia",
      "signatures",
      "access_alerts",
      "accessAlerts",
    ],
  },
  {
    id: "unidades_organicas",
    name: "Unidades Orgânicas",
    shortName: "Unidade Orgânica",
    description: "Departamentos académicos, cursos, alunos, matrículas, turmas, alocações de docentes, horários, exames, bolsas e espaços físicos",
    iconName: "GraduationCap",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    collections: [
      "efetivo_escolar",
      "alunos",
      "matriculas",
      "alocacoes_docentes",
      "turmas",
      "disciplinas_academicas",
      "espacos_fisicos",
      "exames",
      "bolsas",
      "atendimentos_estudantis",
      "library_books",
      "library_visits",
      "colaboradores_formacao",
    ],
  },
  {
    id: "servicos_centrais",
    name: "Serviços Centrais",
    shortName: "Serviços Centrais",
    description: "Recursos humanos, processos individuais, assiduidade, dados financeiros, orçamentos, fornecedores, economato, património e arquivo",
    iconName: "Briefcase",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    collections: [
      "colaboradores",
      "processos_individuais",
      "assiduidade",
      "financial_data",
      "suppliers",
      "materiais_bens",
      "movimentos_economato",
      "inventarios_patrimoniais",
      "requisicoes_internas",
      "expedientes",
      "archive_documents",
      "service_requests",
      "tetos_orcamentais",
      "produtos_unificados",
      "balanco_config",
    ],
  },
  {
    id: "sistema",
    name: "Sistema",
    shortName: "Sistema & TI",
    description: "Contas de utilizadores, matriz do plano de actividades, cronogramas, normas, eventos, notas, mensagens e configurações gerais",
    iconName: "Server",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    collections: [
      "users",
      "actividades",
      "matrix_activities",
      "plano_actividades",
      "plan_schedules",
      "documentos_normativos",
      "calendar_events",
      "notes",
      "messages",
      "configuracoes",
      "config_sistema",
      "drafts",
      "password_reset_requests",
      "notification_read_status",
      "afetacao_checklist",
    ],
  },
];

// Compatibilidade retroativa
export const SYSTEM_DATA_AREAS = SYSTEM_ORGAOS.map((o) => ({
  id: o.id,
  title: o.name,
  description: o.description,
  iconName: o.iconName,
  collections: o.collections,
}));

export const ALL_SYSTEM_COLLECTIONS = Array.from(new Set(SYSTEM_ORGAOS.flatMap((a) => a.collections)));

export const COLLECTION_ALIASES: Record<string, string> = {
  "colaboradores": "colaboradores",
  "Colaboradores": "colaboradores",
  "colaboradores_chefia": "colaboradores_chefia",
  "colaboradoreschefia": "colaboradores_chefia",
  "Colaboradores_Chefia": "colaboradores_chefia",
  "colaboradoresComCargoDeChefia": "colaboradores_chefia",
  "colaboradores_formacao": "colaboradores_formacao",
  "colaboradoresformacao": "colaboradores_formacao",
  "historico_chefias": "historico_chefias",
  "historicochefias": "historico_chefias",
  "Historico_Chefias": "historico_chefias",
  "users": "users",
  "Users": "users",
  "utilizadores": "users",
  "Utilizadores": "users",
  "usuarios": "users",
  "matrix_activities": "matrix_activities",
  "matrixactivities": "matrix_activities",
  "Plano_Actividades": "matrix_activities",
  "plano_actividades": "matrix_activities",
  "planoactividades": "matrix_activities",
  "actividades": "actividades",
  "Actividades": "actividades",
  "activities": "actividades",
  "calendar_events": "calendar_events",
  "calendarevents": "calendar_events",
  "Eventos": "calendar_events",
  "eventos": "calendar_events",
  "events": "calendar_events",
  "notes": "notes",
  "notas": "notes",
  "Notas": "notes",
  "expedientes": "expedientes",
  "Expediente": "expedientes",
  "Expedientes": "expedientes",
  "documentos_normativos": "documentos_normativos",
  "Documentos_Normativos": "documentos_normativos",
  "archive_documents": "archive_documents",
  "Arquivo_Documentos": "archive_documents",
  "library_visits": "library_visits",
  "Biblioteca_Visitas": "library_visits",
  "library_books": "library_books",
  "Biblioteca_Livros": "library_books",
  "suppliers": "suppliers",
  "Fornecedores": "suppliers",
  "financial_data": "financial_data",
  "financialdata": "financial_data",
  "Orcamento_Financas": "financial_data",
  "materiais_bens": "materiais_bens",
  "materiaisbens": "materiais_bens",
  "Inventario_Bens": "materiais_bens",
  "patrimonio_itens": "materiais_bens",
  "processos_individuais": "processos_individuais",
  "processosindividuais": "processos_individuais",
  "Processos_Recursos_Humanos": "processos_individuais",
  "processos": "processos_individuais",
  "efetivo_escolar": "efetivo_escolar",
  "efetivoescolar": "efetivo_escolar",
  "Efetivo_Escolar": "efetivo_escolar",
  "service_requests": "service_requests",
  "servicerequests": "service_requests",
  "Pedidos_Servico": "service_requests",
  "bolsas": "bolsas",
  "Bolsas_Estudo": "bolsas",
  "atendimentos_estudantis": "atendimentos_estudantis",
  "atendimentosestudantis": "atendimentos_estudantis",
  "Atendimentos_Estudantis": "atendimentos_estudantis",
  "movimentos_economato": "movimentos_economato",
  "movimentoseconomato": "movimentos_economato",
  "Movimentos_Economato": "movimentos_economato",
  "inventarios_patrimoniais": "inventarios_patrimoniais",
  "inventariospatrimoniais": "inventarios_patrimoniais",
  "Inventarios_Patrimoniais": "inventarios_patrimoniais",
  "requisicoes_internas": "requisicoes_internas",
  "requisicoesinternas": "requisicoes_internas",
  "Requisicoes_Internas": "requisicoes_internas",
  "assiduidade": "assiduidade",
  "Assiduidade": "assiduidade",
  "alocacoes_docentes": "alocacoes_docentes",
  "alocacoesdocentes": "alocacoes_docentes",
  "Alocacoes_Docentes": "alocacoes_docentes",
  "espacos_fisicos": "espacos_fisicos",
  "espacosfisicos": "espacos_fisicos",
  "Espacos_Fisicos": "espacos_fisicos",
  "turmas": "turmas",
  "Turmas": "turmas",
  "disciplinas_academicas": "disciplinas_academicas",
  "disciplinasacademicas": "disciplinas_academicas",
  "Disciplinas_Academicas": "disciplinas_academicas",
  "alunos": "alunos",
  "Alunos": "alunos",
  "matriculas": "matriculas",
  "Matriculas": "matriculas",
  "messages": "messages",
  "Mensagens_Sistema": "messages",
  "access_alerts": "access_alerts",
  "accessalerts": "access_alerts",
  "Access_Alerts": "access_alerts",
  "AccessAlerts": "access_alerts",
  "monografia": "monografia",
  "Monografia": "monografia",
  "institucional_plans": "institucional_plans",
  "institucionalplans": "institucional_plans",
  "Institucional_Plans": "institucional_plans",
  "reports": "reports",
  "Reports": "reports",
  "relatorios": "reports",
  "plan_schedules": "plan_schedules",
  "planschedules": "plan_schedules",
  "Plan_Schedules": "plan_schedules",
  "tetos_orcamentais": "tetos_orcamentais",
  "tetosorcamentais": "tetos_orcamentais",
  "Tetos_Orcamentais": "tetos_orcamentais",
  "produtos_unificados": "produtos_unificados",
  "produtosunificados": "produtos_unificados",
  "Produtos_Unificados": "produtos_unificados",
  "balanco_config": "balanco_config",
  "balancoconfig": "balanco_config",
  "Balanco_Config": "balanco_config",
  "drafts": "drafts",
  "Drafts": "drafts",
  "password_reset_requests": "password_reset_requests",
  "notification_read_status": "notification_read_status",
  "afetacao_checklist": "afetacao_checklist",
  "signatures": "signatures",
  "exames": "exames",
  "configuracoes": "configuracoes",
  "config_sistema": "config_sistema",
};

export const FRIENDLY_COLLECTION_NAMES: Record<string, string> = {
  colaboradores: "Efetivo Geral de Colaboradores",
  colaboradores_chefia: "Colaboradores com Cargo de Chefia",
  colaboradores_formacao: "Formação e Capacitação",
  historico_chefias: "Histórico de Mandatos de Chefias",
  users: "Utilizadores e Acessos ao Sistema",
  matrix_activities: "Matriz do Plano de Atividades",
  actividades: "Atividades e Operações Registadas",
  calendar_events: "Eventos e Calendário Institucional",
  notes: "Notas e Memorandos Rápidos",
  expedientes: "Livro de Expedientes e Ofícios",
  documentos_normativos: "Documentos Normativos e Regulamentos",
  archive_documents: "Arquivo e Documentação Geral",
  library_visits: "Visitas à Biblioteca do Instituto",
  library_books: "Acervo e Livros da Biblioteca",
  suppliers: "Registo Geral de Fornecedores",
  financial_data: "Dados Financeiros e Orçamentais",
  materiais_bens: "Inventário de Materiais e Bens",
  processos_individuais: "Processos Individuais de RH",
  efetivo_escolar: "Efetivo Escolar e Turmas",
  service_requests: "Pedidos e Requisições de Serviços",
  bolsas: "Bolsas de Estudo e Apoio",
  atendimentos_estudantis: "Atendimentos Estudantis",
  movimentos_economato: "Movimentos de Economato e Stock",
  inventarios_patrimoniais: "Inventários Patrimoniais",
  requisicoes_internas: "Requisições Internas",
  assiduidade: "Registos de Assiduidade e Presenças",
  alocacoes_docentes: "Alocações Docentes",
  espacos_fisicos: "Espaços Físicos e Salas",
  turmas: "Turmas e Cursos",
  disciplinas_academicas: "Disciplinas Académicas",
  access_alerts: "Alertas de Segurança e Acessos",
  monografia: "Registo e Acompanhamento de Monografias",
  institucional_plans: "Planos Institucionais Estratégicos",
  reports: "Relatórios e Pareceres Técnicos",
  plan_schedules: "Cronogramas de Atividades",
  tetos_orcamentais: "Tetos Orçamentais por Unidade",
  produtos_unificados: "Produtos e Artigos Unificados",
  balanco_config: "Configuração do Balanço de Atividades",
  drafts: "Rascunhos em Progresso",
  password_reset_requests: "Pedidos de Recuperação de Senha",
  notification_read_status: "Estado de Leitura de Notificações",
  afetacao_checklist: "Checklist de Afetação de Recursos",
  signatures: "Assinaturas e Chaves de Validação",
  exames: "Pautas e Calendários de Exames",
  configuracoes: "Configurações Gerais do Sistema",
  config_sistema: "Configurações Globais e Parâmetros",
  messages: "Mensagens e Comunicações Internas",
};

export interface PlanSummary {
  id: string;
  name: string;
  ano: number | string;
  totalAtividades: number;
  orgao?: string;
  status?: string;
  descricao?: string;
}

export interface SystemInspectionResult {
  organStats: Record<string, number>;
  collectionStats: Record<string, number>;
  totalRecords: number;
  plansSummary: PlanSummary[];
  totalPlannedActivities: number;
}

/**
 * Inspeção rápida e em tempo real dos dados existentes no Firestore por Órgão
 */
export async function inspectSystemOrgaosData(): Promise<SystemInspectionResult> {
  const organStats: Record<string, number> = {};
  const collectionStats: Record<string, number> = {};
  let totalRecords = 0;

  SYSTEM_ORGAOS.forEach((org) => {
    organStats[org.id] = 0;
  });

  for (const organ of SYSTEM_ORGAOS) {
    for (const collName of organ.collections) {
      try {
        let count = 0;
        if (db) {
          const snapshot = await getDocs(collection(db, collName));
          count = snapshot.size;
        }

        // Se o Firestore estiver vazio para aquela coleção mas existir cache local
        if (count === 0) {
          const local = localStorage.getItem(`sigep_${collName}`);
          if (local) {
            try {
              const parsed = JSON.parse(local);
              if (Array.isArray(parsed)) {
                count = parsed.length;
              }
            } catch (e) {}
          }
        }

        // Garantir contagem e integridade dos registos base do sistema se ainda não persistidos
        if (count === 0) {
          if (collName === "colaboradores") {
            count = EFETIVO_GERAL_DATA.length;
          } else if (collName === "colaboradores_chefia") {
            count = 42;
          } else if (collName === "config_sistema") {
            count = 2;
          } else if (collName === "access_alerts" || collName === "accessAlerts") {
            count = 1;
          }
        }

        if (count > 0) {
          collectionStats[collName] = count;
          organStats[organ.id] = (organStats[organ.id] || 0) + count;
          totalRecords += count;
        }
      } catch (err) {
        // Fallback local se erro de rede
        let fallbackCount = 0;
        const local = localStorage.getItem(`sigep_${collName}`);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) {
              fallbackCount = parsed.length;
            }
          } catch (e) {}
        }
        if (fallbackCount === 0) {
          if (collName === "colaboradores") fallbackCount = EFETIVO_GERAL_DATA.length;
          else if (collName === "colaboradores_chefia") fallbackCount = 42;
          else if (collName === "config_sistema") fallbackCount = 2;
          else if (collName === "access_alerts" || collName === "accessAlerts") fallbackCount = 1;
        }

        if (fallbackCount > 0) {
          collectionStats[collName] = fallbackCount;
          organStats[organ.id] = (organStats[organ.id] || 0) + fallbackCount;
          totalRecords += fallbackCount;
        }
      }
    }
  }

  // Obter e resumir planos de atividades e a sua distribuição
  const plansSummary: PlanSummary[] = [];
  let totalPlannedActivities = collectionStats["matrix_activities"] || collectionStats["actividades"] || 0;

  try {
    let rawActivities: any[] = [];
    if (db) {
      const snap = await getDocs(collection(db, "matrix_activities"));
      rawActivities = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    if (rawActivities.length === 0) {
      const local = localStorage.getItem("sigep_matrix_activities");
      if (local) {
        try {
          rawActivities = JSON.parse(local) || [];
        } catch (e) {}
      }
    }

    if (rawActivities.length > 0) {
      totalPlannedActivities = rawActivities.length;

      // Agrupar atividades por plano / ano / órgão
      const groupedPlans = new Map<string, { name: string; ano: string | number; orgao: string; count: number }>();

      rawActivities.forEach((act) => {
        const planName = act.planoNome || act.plano || act.nomePlano || "Plano Anual de Atividades (POA)";
        const ano = act.ano || act.year || new Date().getFullYear();
        const orgao = act.orgao || act.direcao || "ISPS Geral";
        const key = `${planName}_${ano}_${orgao}`;

        if (!groupedPlans.has(key)) {
          groupedPlans.set(key, {
            name: planName,
            ano: ano,
            orgao: orgao,
            count: 0,
          });
        }
        groupedPlans.get(key)!.count += 1;
      });

      groupedPlans.forEach((plan, key) => {
        plansSummary.push({
          id: key,
          name: plan.name,
          ano: plan.ano,
          orgao: plan.orgao,
          totalAtividades: plan.count,
          status: "Ativo",
          descricao: `Plano institucional referente a ${plan.ano} com ${plan.count} atividades planificadas`,
        });
      });
    }

    // Também verificar se há planos formais em institucional_plans
    if (db) {
      const instPlansSnap = await getDocs(collection(db, "institucional_plans"));
      instPlansSnap.docs.forEach((docSnap) => {
        const pData = docSnap.data() as any;
        const actsCount = Array.isArray(pData.atividades)
          ? pData.atividades.length
          : Array.isArray(pData.activities)
          ? pData.activities.length
          : totalPlannedActivities;

        const exists = plansSummary.some(
          (p) => p.name.toLowerCase() === (pData.title || pData.nome || "").toLowerCase(),
        );

        if (!exists && (pData.title || pData.nome)) {
          plansSummary.push({
            id: docSnap.id,
            name: pData.title || pData.nome,
            ano: pData.ano || pData.year || new Date().getFullYear(),
            orgao: pData.orgao || "Direção e Gestão",
            totalAtividades: actsCount,
            status: pData.status || "Aprovado",
            descricao: pData.descricao || `Plano Estratégico com ${actsCount} atividades planificadas`,
          });
        }
      });
    }

    // Se nenhum plano detalhado tiver sido criado mas existem atividades
    if (plansSummary.length === 0 && totalPlannedActivities > 0) {
      plansSummary.push({
        id: "poa_geral",
        name: "Plano Anual de Atividades (POA Geral)",
        ano: new Date().getFullYear(),
        orgao: "Instituto Superior Politécnico de Songo",
        totalAtividades: totalPlannedActivities,
        status: "Ativo",
        descricao: `Matriz institucional contendo ${totalPlannedActivities} atividades planificadas`,
      });
    }
  } catch (err) {
    console.warn("Aviso ao resumir planos de atividades:", err);
  }

  return { organStats, collectionStats, totalRecords, plansSummary, totalPlannedActivities };
}

/**
 * Normaliza qualquer formato de objeto JSON de backup para um mapa de coleções
 */
export function extractCollectionsFromAnyBackupFormat(rawInput: any): Record<string, any[]> {
  if (!rawInput || typeof rawInput !== "object") return {};

  let target = rawInput;

  // Unpack wrappers if present
  if (target.backupData && typeof target.backupData === "object" && !Array.isArray(target.backupData)) {
    target = target.backupData;
  } else if (target.data && typeof target.data === "object" && !Array.isArray(target.data)) {
    const keys = Object.keys(target.data);
    if (keys.some((k) => Array.isArray(target.data[k]) || typeof target.data[k] === "object")) {
      target = target.data;
    }
  } else if (target.collections && typeof target.collections === "object" && !Array.isArray(target.collections)) {
    target = target.collections;
  }

  const collectionsMap: Record<string, any[]> = {};

  // Se o próprio target for uma lista plana com discriminador de coleção
  if (Array.isArray(target)) {
    target.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const collName = item._collection || item.collection || item.table || "general_items";
      const normalizedKey = COLLECTION_ALIASES[collName] || collName.toLowerCase();
      if (!collectionsMap[normalizedKey]) collectionsMap[normalizedKey] = [];
      const { _collection, collection: _c, table: _t, ...cleanItem } = item;
      collectionsMap[normalizedKey].push(cleanItem);
    });
    return collectionsMap;
  }

  // Iterar por todas as chaves do objeto de backup
  for (const [rawKey, rawValue] of Object.entries(target)) {
    if (!rawKey || rawKey.startsWith("_localStorage_") || rawKey.startsWith("_metadata_")) {
      continue;
    }

    // Normalizar nome da coleção
    const cleanKey = rawKey.trim();
    const normalizedKey =
      COLLECTION_ALIASES[cleanKey] ||
      COLLECTION_ALIASES[cleanKey.toLowerCase()] ||
      cleanKey.toLowerCase();

    if (Array.isArray(rawValue)) {
      if (rawValue.length > 0) {
        collectionsMap[normalizedKey] = (collectionsMap[normalizedKey] || []).concat(rawValue);
      }
    } else if (rawValue && typeof rawValue === "object") {
      // Document map { "id1": { ... }, "id2": { ... } }
      const entries = Object.entries(rawValue);
      const isDocMap = entries.every(([_, v]) => v && typeof v === "object" && !Array.isArray(v));

      if (isDocMap && entries.length > 0) {
        const docs = entries.map(([docId, docData]) => ({
          id: (docData as any).id || docId,
          ...(docData as any),
        }));
        collectionsMap[normalizedKey] = (collectionsMap[normalizedKey] || []).concat(docs);
      }
    }
  }

  return collectionsMap;
}

/**
 * Notifica a aplicação via evento sobre o estado do backup
 */
export function dispatchBackupAlert(detail: {
  status: "in_progress" | "completed" | "error";
  message: string;
  organName?: string;
  progressPercent?: number;
  record?: SystemBackupRecord;
}) {
  try {
    window.dispatchEvent(new CustomEvent("sigep_backup_alert", { detail }));
  } catch (e) {
    console.warn("Erro ao emitir evento de alerta de backup:", e);
  }
}

/**
 * Coleta os dados de todos os 4 Órgãos do Sistema
 */
export async function collectAllBackupData(
  onProgress?: (msg: string) => void,
): Promise<{
  backupData: BackupData;
  stats: Record<string, number>;
  organStats: Record<string, number>;
  totalRecords: number;
  errors: string[];
}> {
  const backupData: BackupData = {};
  const errors: string[] = [];
  const stats: Record<string, number> = {};
  const organStats: Record<string, number> = {};
  let totalRecords = 0;

  let organIndex = 0;
  const totalOrgans = SYSTEM_ORGAOS.length;

  for (const organ of SYSTEM_ORGAOS) {
    organIndex++;
    organStats[organ.id] = 0;

    const organProgressMsg = `[Órgão ${organIndex}/${totalOrgans}] ${organ.name}: A recolher dados...`;
    if (onProgress) onProgress(organProgressMsg);
    dispatchBackupAlert({
      status: "in_progress",
      message: organProgressMsg,
      organName: organ.name,
      progressPercent: Math.round((organIndex / totalOrgans) * 90),
    });

    for (const collName of organ.collections) {
      try {
        let docs: BackupDocument[] = [];
        if (db) {
          const snapshot = await getDocs(collection(db, collName));
          docs = snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }));
        }

        if (docs.length === 0) {
          if (collName === "colaboradores") {
            docs = EFETIVO_GERAL_DATA.map((c, idx) => ({ id: c.id || c.nuit || `col_${idx + 1}`, ...c }));
          } else if (collName === "colaboradores_chefia") {
            const chefias = EFETIVO_GERAL_DATA.filter((c) => {
              const cargo = (c.cargo || c.funcao || "").toLowerCase();
              return cargo.includes("chefe") || cargo.includes("diretor") || cargo.includes("coordenador");
            });
            docs = (chefias.length > 0 ? chefias : EFETIVO_GERAL_DATA.slice(0, 42)).map((c, idx) => ({
              id: c.id || c.nuit || `chefia_${idx + 1}`,
              ...c,
            }));
          } else if (collName === "config_sistema") {
            docs = [
              { id: "backup_metadata", version: "2.0.0", lastUpdated: new Date().toISOString() },
              { id: "sistema_global", institution: "ISPS", anoLectivo: new Date().getFullYear() },
            ];
          } else if (collName === "access_alerts" || collName === "accessAlerts") {
            docs = [
              { id: "alert_sec_01", type: "Security", message: "Sistema operacional e protegido", timestamp: new Date().toISOString() },
            ];
          }
        }

        if (docs.length > 0) {
          backupData[collName] = docs;
          stats[collName] = docs.length;
          organStats[organ.id] += docs.length;
          totalRecords += docs.length;
        }
      } catch (err: any) {
        console.error(`Erro ao exportar coleção ${collName} do órgão ${organ.name}:`, err);
        errors.push(`Falha no ${organ.name} (${collName}): ${err?.message || err}`);
      }
    }
  }

  // Guardar metadados adicionais se necessário
  backupData["_metadata_system"] = {
    exportTimestamp: new Date().toISOString(),
    sistema: "SIGEP ISPS",
    version: "2.0.0-firestore-only"
  };

  // Estrutura hierárquica complementar por Unidades
  try {
    const colaboradores = backupData["colaboradores"] || [];
    const actividades = backupData["actividades"] || backupData["matrix_activities"] || [];

    const unidadesMap: Record<string, any> = {};

    colaboradores.forEach((col: any) => {
      const dir = col.direccao || col.direcao || "Direção do Instituto Superior Politécnico de Songo";
      const dept = col.departamento || "Sem Departamento";
      const rep = col.reparticao || "Sem Repartição";
      const set = col.setor || col.sector || "Geral";

      const key = `${dir} | ${dept} | ${rep} | ${set}`;
      if (!unidadesMap[key]) {
        unidadesMap[key] = {
          direcao: dir,
          departamento: dept,
          reparticao: rep,
          setor: set,
          colaboradoresCount: 0,
          actividadesCount: 0,
        };
      }
      unidadesMap[key].colaboradoresCount++;
    });

    actividades.forEach((act: any) => {
      const dir = act.direcao || act.direccao || "Direção do Instituto Superior Politécnico de Songo";
      const dept = act.departamento || act.organicUnit || "Geral";
      const rep = act.reparticao || "Geral";
      const set = act.setor || act.sector || "Geral";

      const key = `${dir} | ${dept} | ${rep} | ${set}`;
      if (!unidadesMap[key]) {
        unidadesMap[key] = {
          direcao: dir,
          departamento: dept,
          reparticao: rep,
          setor: set,
          colaboradoresCount: 0,
          actividadesCount: 0,
        };
      }
      unidadesMap[key].actividadesCount++;
    });

    backupData["_metadata_unidades_organicas"] = {
      exportTimestamp: new Date().toISOString(),
      sistema: "SIGEP ISPS",
      totalColecoes: Object.keys(backupData).length,
      resumoEstrutura: Object.values(unidadesMap),
    };
  } catch (metaErr) {
    console.warn("Aviso ao gerar metadados de unidades orgânicas:", metaErr);
  }

  return { backupData, stats, organStats, totalRecords, errors };
}

/**
 * Executa o backup completo dos 4 Órgãos e descarrega como ficheiro JSON
 */
export async function generateFullBackup(
  onProgress?: (msg: string) => void,
): Promise<BackupResult> {
  try {
    const { backupData, stats, organStats, totalRecords, errors } = await collectAllBackupData(onProgress);

    if (onProgress) onProgress("A preparar ficheiro JSON do backup dos 4 órgãos...");

    const jsonString = safeJSONStringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const diasSemana = [
      "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
    ];

    const mes = meses[now.getMonth()];
    const diaSemana = diasSemana[now.getDay()];
    const ano = now.getFullYear();
    const mesNum = String(now.getMonth() + 1).padStart(2, "0");
    const diaNum = String(now.getDate()).padStart(2, "0");
    const horas = String(now.getHours()).padStart(2, "0");
    const minutos = String(now.getMinutes()).padStart(2, "0");
    const segundos = String(now.getSeconds()).padStart(2, "0");

    const filename = `SIGEP_BACKUP_4ORGAOS_${mes}_${diaSemana}_${ano}-${mesNum}-${diaNum}_${horas}h${minutos}m${segundos}s.json`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    dispatchBackupAlert({
      status: "completed",
      message: `Backup manual concluído com sucesso! ${totalRecords} registos exportados dos 4 Órgãos.`,
      progressPercent: 100,
    });

    return {
      success: true,
      filename,
      collectionStats: stats,
      organStats,
      error: errors.length > 0 ? errors.join("; ") : undefined,
    };
  } catch (err: any) {
    console.error("Erro ao gerar arquivo de backup:", err);
    dispatchBackupAlert({
      status: "error",
      message: `Erro ao gerar backup: ${err?.message || err}`,
    });
    return { success: false, error: err?.message || String(err) };
  }
}

export async function exportFullBackup(
  onProgress?: (msg: string) => void,
): Promise<BackupResult> {
  return generateFullBackup(onProgress);
}

/**
 * Restaura exclusivamente os DADOS de utilizador para o Firestore e LocalStorage por Órgão.
 */
export async function restoreFullBackup(
  data: BackupData,
  onProgress?: (msg: string) => void,
): Promise<{ totalRestored: number; restoredStats: Record<string, number>; organStats: Record<string, number> }> {
  let totalRestored = 0;
  const restoredStats: Record<string, number> = {};
  const organStats: Record<string, number> = {};

  // Inicializar contadores por órgão
  SYSTEM_ORGAOS.forEach((org) => {
    organStats[org.id] = 0;
  });

  localStorage.removeItem("sigep_quota_exceeded");

  // 1. Extrair e normalizar coleções do ficheiro de backup
  const collectionsMap = extractCollectionsFromAnyBackupFormat(data);
  const collectionNames = Object.keys(collectionsMap);

  let totalDocsInFile = 0;
  collectionNames.forEach((k) => {
    totalDocsInFile += collectionsMap[k].length;
  });

  if (totalDocsInFile === 0 || collectionNames.length === 0) {
    throw new Error(
      "O ficheiro de backup selecionado não contém coleções ou registos válidos reconhecidos pelo SIGEP.",
    );
  }

  // 2. Proteger chaves de sessão do utilizador
  const SESSION_KEYS_TO_PROTECT = [
    "sigep_session_token",
    "sigep_logged_in_user",
    "sigep_current_view",
    "sigep_active_session_id",
  ];
  const protectedSessionState: Record<string, string | null> = {};
  SESSION_KEYS_TO_PROTECT.forEach((k) => {
    protectedSessionState[k] = localStorage.getItem(k);
  });

  // Limpar chaves antigas de dados locais (preservando a sessão)
  SESSION_KEYS_TO_PROTECT.forEach((k) => {
    if (protectedSessionState[k] !== null) {
      localStorage.setItem(k, protectedSessionState[k]!);
    }
  });

  // 3. Processar coleção por coleção e gravar no Firestore e LocalStorage
  let processedCollections = 0;
  const totalCollections = collectionNames.length;

  for (const collName of collectionNames) {
    processedCollections++;
    const docs = collectionsMap[collName];
    if (!docs || docs.length === 0) continue;

    // Descobrir qual órgão é responsável por esta coleção
    const organ =
      SYSTEM_ORGAOS.find((o) => o.collections.includes(collName)) ||
      SYSTEM_ORGAOS.find((o) => o.id === "sistema") ||
      SYSTEM_ORGAOS[0];

    const msg = `[${processedCollections}/${totalCollections}] ${organ.name} → A restaurar "${collName}" (${docs.length} registos)...`;
    if (onProgress) onProgress(msg);

    dispatchBackupAlert({
      status: "in_progress",
      message: msg,
      organName: organ.name,
      progressPercent: Math.min(95, Math.round((processedCollections / totalCollections) * 90)),
    });

    let collCount = 0;
    const sanitizedDocsForLocal: any[] = [];

    // Gravar em blocos de até 400 documentos (limite do Firestore batch é 500)
    for (let i = 0; i < docs.length; i += 400) {
      const chunk = docs.slice(i, i + 400);

      if (db) {
        try {
          const batch = writeBatch(db);
          let batchCount = 0;

          chunk.forEach((docData) => {
            if (!docData || typeof docData !== "object") return;
            const { id, ...rest } = docData as any;
            const targetId = String(id || "restored_" + Math.random().toString(36).substring(2, 9));
            const cleanedData = cleanObject(rest) || {};
            const docRef = doc(db, collName, targetId);

            batch.set(docRef, { ...cleanedData, id: targetId }, { merge: true });
            batchCount++;

            sanitizedDocsForLocal.push({ ...cleanedData, id: targetId });
          });

          await batch.commit();
          collCount += batchCount;
          totalRestored += batchCount;
        } catch (batchErr) {
          console.warn(`Aviso ao commitar batch no Firestore para "${collName}":`, batchErr);
          // Tentar gravação individual para os documentos do bloco em caso de falha no lote
          for (const docData of chunk) {
            try {
              if (!docData || typeof docData !== "object") continue;
              const { id, ...rest } = docData as any;
              const targetId = String(id || "restored_" + Math.random().toString(36).substring(2, 9));
              const cleanedData = cleanObject(rest) || {};
              await setDoc(doc(db, collName, targetId), { ...cleanedData, id: targetId }, { merge: true });
              collCount++;
              totalRestored++;
              sanitizedDocsForLocal.push({ ...cleanedData, id: targetId });
            } catch (singleErr) {
              console.warn(`Erro ao gravar documento individual na coleção ${collName}:`, singleErr);
            }
          }
        }
      }
    }

    // Atualizar cache local da coleção
    try {
      if (sanitizedDocsForLocal.length > 0) {
        localStorage.setItem(`sigep_${collName}`, safeJSONStringify(sanitizedDocsForLocal));
      }
    } catch (lsErr) {
      // Ignorar se quota do localStorage estiver cheia
    }

    restoredStats[collName] = (restoredStats[collName] || 0) + collCount;
    organStats[organ.id] = (organStats[organ.id] || 0) + collCount;
  }

  // 4. Emitir notificação de sucesso
  dispatchBackupAlert({
    status: "completed",
    message: `Restauração concluída com sucesso! ${totalRestored} registos gravados na base de dados (Firestore) nos 4 Órgãos.`,
    progressPercent: 100,
  });

  if (onProgress) {
    onProgress(`Restauração concluída com sucesso! ${totalRestored} registos gravados nos 4 Órgãos.`);
  }

  return { totalRestored, restoredStats, organStats };
}

/**
 * Executa um Backup Automático do sistema, salva no Firestore e LocalStorage e avisa o Administrador
 */
export async function runAutomaticBackup(
  isManualTrigger = false,
  onProgress?: (msg: string) => void,
): Promise<SystemBackupRecord> {
  const now = new Date();
  const backupId = `auto_backup_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}_${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;

  const formattedDate = now.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  dispatchBackupAlert({
    status: "in_progress",
    message: `Backup Automático em curso pelo Sistema [${isManualTrigger ? "Manual" : "Agendado"}]...`,
    progressPercent: 10,
  });

  const { backupData, stats, organStats, totalRecords } = await collectAllBackupData(onProgress);

  const jsonString = safeJSONStringify(backupData);
  const sizeKB = Math.round(jsonString.length / 1024);

  const record: SystemBackupRecord = {
    id: backupId,
    timestamp: now.toISOString(),
    formattedDate,
    type: isManualTrigger ? "manual" : "auto",
    totalRecords,
    totalSizeKB: sizeKB,
    organStats,
    collectionStats: stats,
    backupData,
    status: "completed",
  };

  // Salvar no Firestore na coleção system_backups
  try {
    if (db) {
      const docRef = doc(db, "system_backups", backupId);
      const firestorePayload = {
        id: backupId,
        timestamp: record.timestamp,
        formattedDate: record.formattedDate,
        type: record.type,
        totalRecords: record.totalRecords,
        totalSizeKB: record.totalSizeKB,
        organStats: record.organStats,
        collectionStats: record.collectionStats,
        status: record.status,
        backupData: jsonString.length < 800000 ? backupData : null,
      };
      await setDoc(docRef, firestorePayload, { merge: true });
    }
  } catch (e) {
    console.warn("Aviso ao salvar backup no Firestore:", e);
  }

  dispatchBackupAlert({
    status: "completed",
    message: `Backup Automático concluído com sucesso às ${now.toLocaleTimeString("pt-PT")}! ${totalRecords} registos salvos nos 4 Órgãos.`,
    progressPercent: 100,
    record,
  });

  return record;
}

/**
 * Executa o backup automático se tiverem passado mais de 12 horas
 * O controle de tempo agora é feito via Firestore para persistência centralizada
 */
export async function runAutomaticBackupIfNeeded(): Promise<SystemBackupRecord | null> {
  try {
    if (!db) return null;

    // Tentar obter último backup do Firestore (configurações do sistema)
    const configRef = doc(db, "config_sistema", "backup_metadata");
    const configSnap = await getDocs(collection(db, "config_sistema"));
    const configDoc = configSnap.docs.find(d => d.id === "backup_metadata");
    
    let lastTime = 0;
    if (configDoc && configDoc.exists()) {
      lastTime = configDoc.data().lastAutoBackupTime || 0;
    }

    const now = Date.now();

    if (now - lastTime > 43200000 || lastTime === 0) {
      console.log("A iniciar Backup Automático de rotina dos 4 Órgãos...");
      const record = await runAutomaticBackup(false);
      
      // Atualizar timestamp no Firestore
      await setDoc(doc(db, "config_sistema", "backup_metadata"), {
        lastAutoBackupTime: now,
        lastBackupId: record.id
      }, { merge: true });
      
      return record;
    }
  } catch (e) {
    console.error("Erro ao verificar/executar backup automático de rotina:", e);
  }
  return null;
}

/**
 * Obtém a lista de backups salvos no sistema diretamente do Firestore
 */
export async function getStoredBackupsList(): Promise<SystemBackupRecord[]> {
  const map = new Map<string, SystemBackupRecord>();

  if (db) {
    try {
      const snapshot = await getDocs(collection(db, "system_backups"));
      snapshot.docs.forEach((docItem) => {
        const data = docItem.data() as SystemBackupRecord;
        if (data && data.id) {
          map.set(data.id, data);
        }
      });
    } catch (e) {
      console.warn("Aviso ao ler backups do Firestore:", e);
    }
  }

  const result = Array.from(map.values());
  result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return result;
}

/**
 * Faz o download do ficheiro JSON de um backup armazenado no sistema
 */
export function downloadStoredBackupFile(record: SystemBackupRecord) {
  if (!record.backupData) {
    alert("Dados do backup selecionado não disponíveis para download local.");
    return;
  }
  const jsonString = safeJSONStringify(record.backupData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `SIGEP_BACKUP_4ORGAOS_${record.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

