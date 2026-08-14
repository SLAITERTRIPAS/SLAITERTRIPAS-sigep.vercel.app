import { db } from "./firebase";
import { getCircularReplacer, safeJSONStringify } from "./utils";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
} from "firebase/firestore";

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
    name: "Unidade Orgânica",
    shortName: "Unidade Orgânica",
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

export const ALL_SYSTEM_COLLECTIONS = SYSTEM_ORGAOS.flatMap((a) => a.collections);

export const COLLECTION_ALIASES: Record<string, string> = {
  "Colaboradores": "colaboradores",
  "Colaboradores_Chefia": "colaboradores_chefia",
  "Historico_Chefias": "historico_chefias",
  "Utilizadores": "users",
  "Plano_Actividades": "matrix_activities",
  "Actividades": "actividades",
  "Plano_Actividades_Det": "plano_actividades",
  "Eventos": "calendar_events",
  "Notas": "notes",
  "Expediente": "expedientes",
  "Documentos_Normativos": "documentos_normativos",
  "Arquivo_Documentos": "archive_documents",
  "Biblioteca_Visitas": "library_visits",
  "Biblioteca_Livros": "library_books",
  "Fornecedores": "suppliers",
  "Orcamento_Financas": "financial_data",
  "Inventario_Bens": "materiais_bens",
  "Processos_Recursos_Humanos": "processos_individuais",
  "processos": "processos_individuais",
  "eventos": "calendar_events",
  "notas": "notes",
  "Efetivo_Escolar": "efetivo_escolar",
  "Pedidos_Servico": "service_requests",
  "Bolsas_Estudo": "bolsas",
  "Atendimentos_Estudantis": "atendimentos_estudantis",
  "Movimentos_Economato": "movimentos_economato",
  "Inventarios_Patrimoniais": "inventarios_patrimoniais",
  "Requisicoes_Internas": "requisicoes_internas",
  "Assiduidade": "assiduidade",
  "Alocacoes_Docentes": "alocacoes_docentes",
  "Espacos_Fisicos": "espacos_fisicos",
  "Turmas": "turmas",
  "Alunos": "alunos",
  "Matriculas": "matriculas",
  "Mensagens_Sistema": "messages",
};

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

  localStorage.removeItem("sigep_quota_exceeded");

  // Proteger chaves de sessão do utilizador
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

  // Limpar localStorage para garantir consistência total com o backup (dados do sistema)
  localStorage.clear();

  SESSION_KEYS_TO_PROTECT.forEach((k) => {
    if (protectedSessionState[k] !== null) {
      localStorage.setItem(k, protectedSessionState[k]!);
    }
  });

  // Restauração passo a passo pelos 4 Órgãos
  let organRestoredIndex = 0;
  const totalOrgans = SYSTEM_ORGAOS.length;

  for (const organ of SYSTEM_ORGAOS) {
    organRestoredIndex++;
    organStats[organ.id] = 0;

    const msg = `[Órgão ${organRestoredIndex}/${totalOrgans}] ${organ.name}: A restaurar dados...`;
    if (onProgress) onProgress(msg);
    dispatchBackupAlert({
      status: "in_progress",
      message: msg,
      organName: organ.name,
      progressPercent: Math.round((organRestoredIndex / totalOrgans) * 90),
    });

    for (const collName of organ.collections) {
      let docs: BackupDocument[] | null = null;
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith("_localStorage_") || key.startsWith("_metadata_")) continue;
        const normalized = COLLECTION_ALIASES[key] || key;
        if (normalized === collName && Array.isArray(value)) {
          docs = value;
          break;
        }
      }

      if (!docs || docs.length === 0) continue;

      let collCount = 0;

      for (let i = 0; i < docs.length; i += 500) {
        const chunk = docs.slice(i, i + 500);

        if (db) {
          try {
            const batch = writeBatch(db);
            let batchCount = 0;

            chunk.forEach((docData) => {
              if (!docData || typeof docData !== "object") return;
              const { id, ...rest } = docData as any;
              const targetId = id || "restored_" + Math.random().toString(36).substring(2, 9);
              const docRef = doc(db, collName, targetId);
              batch.set(docRef, { ...rest, id: targetId }, { merge: true });
              batchCount++;
            });

            await batch.commit();
            collCount += batchCount;
            totalRestored += batchCount;
          } catch (batchErr) {
            console.warn(`Erro ao commitar batch no Firestore para ${collName}:`, batchErr);
          }
        }
      }

      restoredStats[collName] = (restoredStats[collName] || 0) + collCount;
      organStats[organ.id] += collCount;
    }
  }

  dispatchBackupAlert({
    status: "completed",
    message: `Restauração concluída com sucesso! ${totalRestored} registos salvos nos 4 Órgãos.`,
    progressPercent: 100,
  });

  if (onProgress) onProgress("Restauração e gravação de dados na base de dados concluída com sucesso!");
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

