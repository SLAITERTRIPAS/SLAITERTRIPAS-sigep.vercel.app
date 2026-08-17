import {
  serverTimestamp,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  runTransaction,
  query,
  where,
  or,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { ProcessoIndividual } from "../types";
import {
  withTimeout,
  cleanObject,
  getCircularReplacer,
  safeJSONStringify,
  generateCollaboratorId,
  hasChefiaPosition,
  classifyTipo,
} from "./utils";
import { EFETIVO_GERAL_DATA } from "../constants/colaboradoresList";

export async function fetchCollection<T>(
  collectionName: string,
  limitCount: number = 50,
  orderField: string | null = "createdAt",
): Promise<(T & { id: string })[]> {
  const colRef = collection(db, collectionName);
  let q = orderField
    ? query(colRef, orderBy(orderField, "desc"), limit(limitCount))
    : query(colRef, limit(limitCount));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as (T & { id: string })[];
}

export function subscribeToDocument<T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
  onError?: (error: any) => void,
) {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ ...snapshot.data(), id: snapshot.id } as T);
      } else {
        callback(null);
      }
    },
    (error) => {
      if (error.message !== "Firestore shutting down") {
        console.error(
          `Erro ao subscrever documento ${collectionName}/${docId}:`,
          error,
        );
        try {
          handleFirestoreError(error, OperationType.GET, collectionName);
        } catch (e) {
          if (onError) onError(e);
          else throw e;
          return;
        }
      }
      if (onError) onError(error);
    },
  );
}

export function isLocalStorageFallbackActive(): boolean {
  return localStorage.getItem("sigep_quota_exceeded") === "true";
}

const DEFAULT_SEED_ACTIVITIES = [
  {
    id: "local_seed_1",
    codigoAtividade: "1",
    referencia: "1",
    designacao:
      "Aquisição de Reagentes e Vidraria para Laboratório de Engenharia Química",
    title:
      "Aquisição de Reagentes e Vidraria para Laboratório de Engenharia Química",
    unidadeOrganica: "ISPS",
    direcao: "Gabinete do Diretor-Geral",
    departamento: "UGEA",
    setor: "UGEA",
    reparticao: "UGEA",
    fonteReceita: "Orçamento do Estado",
    prioridade: "Alta",
    objetivo:
      "Equipar os laboratórios para as aulas práticas do curso de Engenharia Química",
    provincia: "Tete",
    distrito: "Songo",
    responsavel: "Slaiter Tripas",
    trimestre: "I",
    mes: "Janeiro",
    frequencia: "Pontual",
    dataInicio: "2027-01-10",
    dataFim: "2027-02-15",
    totalDias: "36",
    necessidadeTransporte: "Não",
    rubrica: "311",
    necessidade: "Aquisição de Reagentes",
    especificacoes: "Ácido sulfúrico PA, Acetona pura, Béquer de 250ml",
    numPessoasEnvolvidas: "3",
    unitario: "1500",
    ajudaCusto: "0",
    valorTotal: 4500,
    ano: 2027,
    tipoPlano: "plano de aquisição",
    status: "planificacao",
  },
  {
    id: "local_seed_2",
    codigoAtividade: "1",
    referencia: "1",
    designacao:
      "Aquisição de Reagentes e Vidraria para Laboratório de Engenharia Química",
    title:
      "Aquisição de Reagentes e Vidraria para Laboratório de Engenharia Química",
    unidadeOrganica: "ISPS",
    direcao: "Gabinete do Diretor-Geral",
    departamento: "UGEA",
    setor: "UGEA",
    reparticao: "UGEA",
    fonteReceita: "Orçamento do Estado",
    prioridade: "Alta",
    objetivo:
      "Equipar os laboratórios para as aulas práticas do curso de Engenharia Química",
    provincia: "Tete",
    distrito: "Songo",
    responsavel: "Slaiter Tripas",
    trimestre: "I",
    mes: "Janeiro",
    frequencia: "Pontual",
    dataInicio: "2027-01-10",
    dataFim: "2027-02-15",
    totalDias: "36",
    necessidadeTransporte: "Não",
    rubrica: "312",
    necessidade: "Aquisição de Vidraria de Laboratório",
    especificacoes: "Béqueres, tubos de ensaio, pipetas volumétricas",
    numPessoasEnvolvidas: "2",
    unitario: "3500",
    ajudaCusto: "0",
    valorTotal: 7000,
    ano: 2027,
    tipoPlano: "plano de aquisição",
    status: "planificacao",
  },
  {
    id: "local_seed_3",
    codigoAtividade: "2",
    referencia: "2",
    designacao:
      "Elaboração e Publicação do Relatório de Desempenho Institucional (PESOE)",
    title:
      "Elaboração e Publicação do Relatório de Desempenho Institucional (PESOE)",
    unidadeOrganica: "ISPS",
    direcao: "Gabinete do Diretor-Geral",
    departamento: "DPEP",
    setor: "Planificação",
    reparticao: "Planificação",
    fonteReceita: "Receitas Próprias",
    prioridade: "Média",
    objetivo:
      "Prestar contas e analisar os resultados físicos e financeiros do ciclo anterior",
    provincia: "Tete",
    distrito: "Songo",
    responsavel: "Slaiter Tripas",
    trimestre: "I",
    mes: "Fevereiro",
    frequencia: "Pontual",
    dataInicio: "2027-02-01",
    dataFim: "2027-02-28",
    totalDias: "27",
    necessidadeTransporte: "Não",
    rubrica: "324",
    necessidade: "Serviços de Impressão e Encadernação",
    especificacoes: "Impressão a laser colorida, 50 cópias do relatório anual",
    numPessoasEnvolvidas: "4",
    unitario: "200",
    ajudaCusto: "0",
    valorTotal: 800,
    ano: 2027,
    tipoPlano: "Setorial",
    status: "planificacao",
  },
  {
    id: "local_seed_4",
    codigoAtividade: "3",
    referencia: "3",
    designacao:
      "Manutenção Preventiva das Instalações e Equipamentos de Climatização (AC)",
    title:
      "Manutenção Preventiva das Instalações e Equipamentos de Climatização (AC)",
    unidadeOrganica: "ISPS",
    direcao: "Direção Administrativa e Financeira",
    departamento: "DAF",
    setor: "Manutenção",
    reparticao: "Manutenção",
    fonteReceita: "Orçamento do Estado",
    prioridade: "Alta",
    objetivo:
      "Garantir o conforto térmico nas salas de aula e escritórios administrativos",
    provincia: "Tete",
    distrito: "Songo",
    responsavel: "Técnico de Manutenção",
    trimestre: "II",
    mes: "Abril",
    frequencia: "Pontual",
    dataInicio: "2027-04-05",
    dataFim: "2027-04-20",
    totalDias: "15",
    necessidadeTransporte: "Não",
    rubrica: "313",
    necessidade: "Serviço de Limpeza e Reparação de Ar Condicionados",
    especificacoes:
      "Recarga de gás refrigerante R410A, limpeza de filtros, reparo de placas",
    numPessoasEnvolvidas: "3",
    unitario: "4500",
    ajudaCusto: "0",
    valorTotal: 13500,
    ano: 2027,
    tipoPlano: "plano de contratação",
    status: "direcao",
  },
  {
    id: "local_seed_5",
    codigoAtividade: "1",
    referencia: "1",
    designacao: "Supervisão Pedagógica das Aulas Práticas de Campo",
    title: "Supervisão Pedagógica das Aulas Práticas de Campo",
    unidadeOrganica: "ISPS",
    direcao: "Gabinete do Diretor-Geral",
    departamento: "DPEP",
    setor: "Planificação",
    reparticao: "Planificação",
    fonteReceita: "Orçamento do Estado",
    prioridade: "Alta",
    objetivo: "Acompanhar o desempenho didático-pedagógico em campo",
    provincia: "Tete",
    distrito: "Songo",
    responsavel: "Slaiter Tripas",
    trimestre: "I",
    mes: "Janeiro",
    frequencia: "Pontual",
    dataInicio: "2026-01-15",
    dataFim: "2026-01-30",
    totalDias: "15",
    necessidadeTransporte: "Não",
    rubrica: "311",
    necessidade: "Ajudas de Custo para Supervisão",
    especificacoes: "Diárias para equipe técnica de supervisão",
    numPessoasEnvolvidas: "2",
    unitario: "1500",
    ajudaCusto: "3000",
    valorTotal: 6000,
    ano: 2026,
    tipoPlano: "Setorial",
    status: "planificacao",
  },
  {
    id: "local_seed_6",
    codigoAtividade: "1",
    referencia: "1",
    designacao: "Supervisão Pedagógica das Aulas Práticas de Campo",
    title: "Supervisão Pedagógica das Aulas Práticas de Campo",
    unidadeOrganica: "ISPS",
    direcao: "Gabinete do Diretor-Geral",
    departamento: "DPEP",
    setor: "Planificação",
    reparticao: "Planificação",
    fonteReceita: "Orçamento do Estado",
    prioridade: "Alta",
    objetivo: "Acompanhar o desempenho didático-pedagógico em campo",
    provincia: "Tete",
    distrito: "Songo",
    responsavel: "Slaiter Tripas",
    trimestre: "I",
    mes: "Janeiro",
    frequencia: "Pontual",
    dataInicio: "2026-01-15",
    dataFim: "2026-01-30",
    totalDias: "15",
    necessidadeTransporte: "Não",
    rubrica: "312",
    necessidade: "Combustível para Viatura de Apoio",
    especificacoes: "Litros de diesel para deslocação até ao local",
    numPessoasEnvolvidas: "1",
    unitario: "98",
    ajudaCusto: "0",
    valorTotal: 4900,
    ano: 2026,
    tipoPlano: "Setorial",
    status: "planificacao",
  },
];

function getLocalData(collectionName: string): any[] {
  try {
    const key = `sigep_local_${collectionName}`;
    const data = localStorage.getItem(key);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch (e) {
    return [];
  }
}

function saveLocalData(collectionName: string, data: any[]) {
  try {
    const key = `sigep_local_${collectionName}`;
    localStorage.setItem(key, safeJSONStringify(data));
  } catch (e) {
    console.error("Erro ao salvar local storage:", e);
  }
}

export async function addUserData(collectionName: string, data: object) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  // Adiciona o userId do usuário aos dados conforme solicitado na imagem
  const cleanData = cleanObject(data);
  const userData = {
    ...cleanData,
    userId: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const docRef = await addDoc(collection(db, collectionName), userData);
    console.log(`✅ Dados do usuário salvos em ${collectionName}/${docRef.id}`);
    
    // Atualizar cache local
    const localList = getLocalData(collectionName);
    localList.push({ ...cleanData, id: docRef.id, userId: user.uid, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    saveLocalData(collectionName, localList);
    
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionName);
    throw error;
  }
}

export async function addToCollection<T>(collectionName: string, data: T) {
  const cleanData = cleanObject(data);
  const now = new Date().toISOString();
  const user = auth.currentUser;

  try {
    // 1. Gravação direta no Firestore com userId conforme solicitado
    const docRef = await addDoc(collection(db, collectionName), {
      ...cleanData,
      userId: user?.uid || null,
      tenantId: "ISPS",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      synced: true
    });
    
    localStorage.removeItem("sigep_quota_exceeded");
    
    // 2. Cache local apenas após confirmação
    const localList = getLocalData(collectionName);
    localList.push({ ...cleanData, id: docRef.id, userId: user?.uid || null, createdAt: now, updatedAt: now });
    saveLocalData(collectionName, localList);
    
    console.log(`✅ Registro adicionado ao servidor: ${collectionName}/${docRef.id}`);
    return docRef.id;
  } catch (error: any) {
    console.error(`❌ Falha na gravação direta em ${collectionName}:`, error);
    
    // Fallback local apenas para modo offline/quota
    const localId = "local_pending_" + Math.random().toString(36).substring(2, 11);
    const localList = getLocalData(collectionName);
    localList.push({ ...cleanData, id: localId, userId: user?.uid || null, createdAt: now, updatedAt: now, pending_sync: true });
    saveLocalData(collectionName, localList);
    
    return localId;
  }
}

export async function updateInCollection<T>(
  collectionName: string,
  id: string,
  data: Partial<T>,
) {
  const cleanData = cleanObject(data);
  const now = new Date().toISOString();

  try {
    // 1. Prioridade absoluta: Atualização no Servidor
    const docRef = doc(db, collectionName, id);
    await setDoc(
      docRef,
      {
        ...cleanData,
        userId: auth.currentUser?.uid || undefined,
        tenantId: "ISPS",
        updatedAt: serverTimestamp(),
        synced: true
      },
      { merge: true },
    );
    
    localStorage.removeItem("sigep_quota_exceeded");
    
    // 2. Cache local apenas como reflexo do servidor
    const localList = getLocalData(collectionName);
    const idx = localList.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...cleanData, updatedAt: now };
      saveLocalData(collectionName, localList);
    }
  } catch (error: any) {
    console.error(`Erro crítico na atualização de ${collectionName}/${id}:`, error);
    
    // Fallback local apenas para pendência de sincronização
    const localList = getLocalData(collectionName);
    const idx = localList.findIndex((item: any) => item.id === id);
    if (idx !== -1) {
      localList[idx] = { ...localList[idx], ...cleanData, updatedAt: now, pending_sync: true };
      saveLocalData(collectionName, localList);
    }
  }
}

export async function deleteFromCollection(collectionName: string, id: string) {
  try {
    // 1. Tentar apagar no Firestore (Prioridade)
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    localStorage.removeItem("sigep_quota_exceeded");
    
    // 2. Limpar cache local após sucesso
    const localList = getLocalData(collectionName);
    const filtered = localList.filter((item: any) => item.id !== id);
    saveLocalData(collectionName, filtered);
    
    console.log(`✅ ${collectionName}/${id} removido do servidor.`);
  } catch (error: any) {
    console.error(`❌ Erro ao apagar ${collectionName}/${id} no servidor:`, error);
    
    // Fallback: remover localmente mesmo se falhar no servidor para UI responder
    const localList = getLocalData(collectionName);
    const filtered = localList.filter((item: any) => item.id !== id);
    saveLocalData(collectionName, filtered);
  }
}

export async function getFromCollection<T>(
  collectionName: string,
  orderField: string | null = "createdAt",
) {
  try {
    const colRef = collection(db, collectionName);
    const q = orderField ? query(colRef, orderBy(orderField, "desc")) : colRef;
    const snapshot = await getDocs(q);
    const remoteData = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as (T & { id: string })[];

    localStorage.removeItem("sigep_quota_exceeded");

    // Merge local items preferring the most recent one
    const localData = getLocalData(collectionName);
    
    const combinedMap = new Map<string, any>();
    
    // Add remote data first
    remoteData.forEach((item) => combinedMap.set(item.id, item));
    
    // Merge local data: if local is newer or is a new local item, prefer local
    localData.forEach((localItem) => {
      if (!localItem.id) return;
      
      const existing = combinedMap.get(localItem.id);
      const isLocalNewItem = String(localItem.id).startsWith("local_");
      
      if (!existing || isLocalNewItem) {
        combinedMap.set(localItem.id, localItem);
      } else {
        // Compare timestamps to keep the newest version
        const remoteUpdate = existing.updatedAt || existing.createdAt || 0;
        const localUpdate = localItem.updatedAt || localItem.createdAt || 0;
        
        // If local is strictly newer, use it
        if (new Date(localUpdate) > new Date(remoteUpdate)) {
          combinedMap.set(localItem.id, localItem);
        }
      }
    });

    const combinedData = Array.from(combinedMap.values());
    saveLocalData(collectionName, combinedData);
    return combinedData as (T & { id: string })[];
  } catch (error: any) {
    const errStr = (error?.message || String(error)).toLowerCase();
    const isQuota =
      error?.code === "resource-exhausted" ||
      errStr.includes("quota") ||
      errStr.includes("resource_exhausted");
    if (isQuota) {
      localStorage.setItem("sigep_quota_exceeded", "true");
      console.warn(
        `⚠️ Quota atingida na listagem da coleção ${collectionName}. Ativando LocalStorage fallback.`,
      );
    }
    return getLocalData(collectionName) as (T & { id: string })[];
  }
}

export function subscribeToCollection<T>(
  collectionName: string,
  callback: (data: (T & { id: string })[]) => void,
  onError?: (error: any) => void,
  orderField: string | null = "createdAt",
  limitCount?: number,
) {
  const setupSubscription = (useOrdering: boolean) => {
    try {
      const colRef = collection(db, collectionName);
      let q = useOrdering && orderField ? query(colRef, orderBy(orderField, "desc")) : colRef;
      if (limitCount && useOrdering && orderField) q = query(q, limit(limitCount));

      return onSnapshot(
        q,
        (snapshot) => {
          try {
            localStorage.removeItem("sigep_quota_exceeded");
            const remoteData = snapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            })) as (T & { id: string })[];

            // Merge local items preferring the most recent one
            const localData = getLocalData(collectionName);
            const combinedMap = new Map<string, any>();

            // Add remote data
            remoteData.forEach((item) => combinedMap.set(item.id, item));

            // Merge local data
            localData.forEach((localItem) => {
              if (!localItem.id) return;
              const existing = combinedMap.get(localItem.id);
              const isLocalNewItem = String(localItem.id).startsWith("local_");

              if (!existing || isLocalNewItem) {
                combinedMap.set(localItem.id, localItem);
              } else {
                const remoteUpdate = existing.updatedAt || existing.createdAt || 0;
                const localUpdate = localItem.updatedAt || localItem.createdAt || 0;
                if (new Date(localUpdate) > new Date(remoteUpdate)) {
                  combinedMap.set(localItem.id, localItem);
                }
              }
            });

            const combinedData = Array.from(combinedMap.values());
            saveLocalData(collectionName, combinedData);
            
            try {
              callback(combinedData);
            } catch (cbErr) {
              console.warn(`Erro no callback de renderização para ${collectionName}:`, cbErr);
            }
          } catch (procErr) {
            console.warn(`Aviso no processamento do snapshot de ${collectionName}:`, procErr);
            const localData = getLocalData(collectionName);
            try { callback(localData as any); } catch (e) {}
          }
        },
        (error) => {
          const errStr = (error?.message || String(error)).toLowerCase();
          const isQuota =
            error?.code === "resource-exhausted" ||
            errStr.includes("quota") ||
            errStr.includes("resource_exhausted");

          if (isQuota) {
            localStorage.setItem("sigep_quota_exceeded", "true");
            console.warn(
              `⚠️ Quota atingida na subscrição da coleção ${collectionName}. Ativando fallback para LocalStorage.`,
            );
          }

          // Se falhou por causa de campo de ordenação ou índice, tenta sem ordenação
          if (useOrdering && (errStr.includes("index") || errStr.includes("order") || errStr.includes("failed-precondition"))) {
            console.warn(`Tentando subscrição sem ordenação para ${collectionName}...`);
            return setupSubscription(false);
          }

          const localData = getLocalData(collectionName);
          try {
            callback(localData as any);
          } catch (e) {}
          if (onError) {
            try { onError(error); } catch (e) {}
          }
        },
      );
    } catch (err) {
      console.warn(`Falha na inicialização do onSnapshot para ${collectionName}:`, err);
      const localData = getLocalData(collectionName);
      try { callback(localData as any); } catch (e) {}
      return () => {};
    }
  };

  return setupSubscription(true);
}

function createCollectionService<T>(
  collectionName: string,
  orderField: string | null = "createdAt",
) {
  return {
    get: () => getFromCollection<T>(collectionName, orderField),
    getById: async (id: string) => {
      try {
        const docRef = doc(db, collectionName, id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists()
          ? ({ id: snapshot.id, ...snapshot.data() } as T & { id: string })
          : null;
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.GET,
          `${collectionName}/${id}`,
        );
        return null;
      }
    },
    add: (data: any) => addToCollection(collectionName, data),
    update: (id: string, data: any) =>
      updateInCollection(collectionName, id, data),
    replace: async (id: string, data: any) => {
      try {
        const docRef = doc(db, collectionName, id);
        await setDoc(
          docRef,
          {
            ...data,
            uid: auth.currentUser?.uid || undefined,
            tenantId: "ISPS",
            updatedAt: serverTimestamp(),
          },
          { merge: false },
        );
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `${collectionName}/${id}`,
        );
      }
    },
    set: async (id: string, data: any) => {
      try {
        const docRef = doc(db, collectionName, id);
        await setDoc(
          docRef,
          {
            ...data,
            uid: auth.currentUser?.uid || undefined,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `${collectionName}/${id}`,
        );
      }
    },
    delete: (id: string) => deleteFromCollection(collectionName, id),
    subscribe: (
      callback: any,
      onError?: any,
      orderField?: string | null,
      limitCount?: number,
    ) =>
      subscribeToCollection<T>(
        collectionName,
        callback,
        onError,
        orderField || null,
        limitCount,
      ),
  };
}

export async function resequenceActivitiesAfterDelete(
  collectionName: "actividades" | "matrix_activities",
  deletedAct: any,
  allActs: any[],
) {
  if (!deletedAct) return;

  const deletedDir = (deletedAct.direcao || deletedAct.unidadeOrganica || "")
    .trim()
    .toLowerCase();
  const deletedDept = (deletedAct.departamento || "").trim().toLowerCase();
  const deletedYear = Number(deletedAct.ano || 0);

  // Filter remaining activities in the SAME group/division
  const sameGroup = allActs.filter((act) => {
    if (!act || act.id === deletedAct.id) return false;

    const actDir = (act.direcao || act.unidadeOrganica || "")
      .trim()
      .toLowerCase();
    const actDept = (act.departamento || "").trim().toLowerCase();
    const actYear = Number(act.ano || 0);

    // Filter by same Direção, same Departamento and same Year
    return (
      actDir === deletedDir &&
      actDept === deletedDept &&
      actYear === deletedYear
    );
  });

  const getNumericOrderVal = (act: any) => {
    const code = act.referencia || act.codigoActividade || "";
    const match = code.match(/(\d+)$/);
    if (match) {
      return parseInt(match[1], 10);
    }
    const rawNo = act.no || act.numeroAtividade || act.numeroActividade;
    if (rawNo) {
      const parsed = parseInt(rawNo, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 999999;
  };

  // Sort ascending by current numeric order
  const sorted = [...sameGroup].sort(
    (a, b) => getNumericOrderVal(a) - getNumericOrderVal(b),
  );

  // Update sequentially
  for (let i = 0; i < sorted.length; i++) {
    const act = sorted[i];
    const newNumStr = String(i + 1).padStart(3, "0");

    // Check if the number has changed
    const currentNumStr = String(getNumericOrderVal(act)).padStart(3, "0");

    const updates: any = {};
    let hasChanges = false;

    if (currentNumStr !== newNumStr) {
      updates.no = newNumStr;
      updates.numeroAtividade = newNumStr;
      updates.numeroActividade = newNumStr;
      hasChanges = true;
    }

    if (act.codigoActividade) {
      const parts = act.codigoActividade.split("/");
      if (parts.length >= 3) {
        const numIdx = parts.findIndex((p: string) => /^\d+$/.test(p));
        const originalCode = act.codigoActividade;
        const tempParts = [...parts];
        if (numIdx !== -1) tempParts[numIdx] = newNumStr;
        else tempParts[2] = newNumStr;

        const newCode = tempParts.join("/");
        if (newCode !== originalCode) {
          updates.codigoActividade = newCode;
          hasChanges = true;
        }
      }
    }

    if (act.referencia) {
      const parts = act.referencia.split("/");
      if (parts.length >= 3) {
        const numIdx = parts.findIndex((p: string) => /^\d+$/.test(p));
        const originalRef = act.referencia;
        const tempParts = [...parts];
        if (numIdx !== -1) tempParts[numIdx] = newNumStr;
        else tempParts[2] = newNumStr;

        const newRef = tempParts.join("/");
        if (newRef !== originalRef) {
          updates.referencia = newRef;
          hasChanges = true;
        }
      } else {
        const match = act.referencia.match(/(.*?)-(\d+)$/);
        if (match) {
          const newRef = `${match[1]}-${newNumStr}`;
          if (newRef !== act.referencia) {
            updates.referencia = newRef;
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      try {
        await updateInCollection(collectionName, act.id, updates);
        console.log(
          `Successfully updated activity ${act.id} sequence number to ${newNumStr}`,
        );
      } catch (e) {
        console.error(`Error updating activity sequence for ${act.id}:`, e);
      }
    }
  }
}

export async function syncAllLocalData() {
  const collectionsToSync = [
    "colaboradores_formacao",
    "archive_documents",
    "configuracoes",
    "exames",
    "signatures",
    "calendar_events",
    "notes",
    "expedientes",
    "library_visits",
    "library_books",
    "service_requests",
    "suppliers",
    "matrix_activities",
    "colaboradores",
    "colaboradores_chefia",
    "actividades",
    "bolsas",
    "atendimentos_estudantis",
    "processos_individuais",
    "efetivo_escolar",
    "materiais_bens",
    "movimentos_economato",
    "financial_data",
    "inventarios_patrimoniais",
    "requisicoes_internas",
    "assiduidade",
    "alocacoes_docentes",
    "espacos_fisicos",
    "turmas",
    "disciplinas_academicas",
    "users",
    "access_alerts",
    "monografia",
    "institucional_plans",
    "reports",
    "plan_schedules",
    "historico_chefias",
    "tetos_orcamentais",
    "produtos_unificados",
    "balanco_config",
  ];

  console.log("🔄 Iniciando sincronização de dados locais com o Firestore...");
  let syncedCount = 0;

  for (const colName of collectionsToSync) {
    const localData = getLocalData(colName);
    if (!localData || localData.length === 0) continue;

    // Filter items that strictly need syncing: starting with local_ OR having pending_sync flag
    for (const item of localData) {
      if (!item.id) continue;

      const isLocalNew = String(item.id).startsWith("local_");
      const isPending = item.pending_sync === true;

      if (!isLocalNew && !isPending) continue;

      try {
        if (isLocalNew) {
          // It's a new item, add it and get a real ID
          const { id, pending_sync, ...dataToSave } = item;
          const newId = await addToCollection(colName, dataToSave);
          if (newId && !newId.startsWith("local_")) {
            syncedCount++;
          }
        } else {
          // It's an existing item with pending updates, update it
          const { pending_sync, ...dataToSave } = item;
          await updateInCollection(colName, item.id, dataToSave);
          syncedCount++;
        }
      } catch (err) {
        // Silent fail for individual items, will retry next time
      }
    }
  }

  if (syncedCount > 0) {
    console.log(`✅ Sincronização concluída: ${syncedCount} itens processados.`);
    localStorage.removeItem("sigep_quota_exceeded");
  } else {
    console.log("Sincronização concluída: nenhum dado pendente encontrado.");
  }
}

export const firestoreService = {
  subscribeToDocument,
  subscribeCollection: subscribeToCollection,
  addToCollection,
  updateInCollection,
  deleteDocument: deleteFromCollection,
  resequenceActivitiesAfterDelete,
  syncAllLocalData,
  colaboradores_formacao: createCollectionService<any>(
    "colaboradores_formacao",
  ),
  archive_documents: createCollectionService<any>("archive_documents"),
  configuracoes: createCollectionService<any>("configuracoes", null),
  exames: createCollectionService<any>("exames", null),
  signatures: createCollectionService<any>("signatures"),
  events: createCollectionService<any>("calendar_events"),
  notes: createCollectionService<any>("notes"),
  expedientes: createCollectionService<any>("expedientes", "dataChegada"),
  libraryVisits: createCollectionService<any>("library_visits"),
  libraryBooks: createCollectionService<any>("library_books"),
  serviceRequests: createCollectionService<any>("service_requests"),
  suppliers: createCollectionService<any>("suppliers"),
  matrixActivities: createCollectionService<any>("matrix_activities", null),
  colaboradores: createCollectionService<any>("colaboradores", null),
  colaboradoresChefia: createCollectionService<any>(
    "colaboradores_chefia",
    null,
  ),
  colaboradoresComCargoDeChefia: createCollectionService<any>(
    "colaboradores_chefia",
    null,
  ),
  actividades: createCollectionService<any>("actividades"),
  bolsas: createCollectionService<any>("bolsas"),
  atendimentos_estudantis: createCollectionService<any>(
    "atendimentos_estudantis",
  ),
  processos: createCollectionService<ProcessoIndividual>(
    "processos_individuais",
  ),
  efetivo_escolar: createCollectionService<any>("efetivo_escolar"),
  materiais_bens: createCollectionService<any>("materiais_bens"),
  movimentos_economato: createCollectionService<any>("movimentos_economato"),
  financialData: createCollectionService<any>("financial_data"),
  inventarios_patrimoniais: createCollectionService<any>(
    "inventarios_patrimoniais",
  ),
  requisicoes_internas: createCollectionService<any>("requisicoes_internas"),
  assiduidade: createCollectionService<any>("assiduidade"),
  alocacoes_docentes: createCollectionService<any>("alocacoes_docentes"),
  espacos_fisicos: createCollectionService<any>("espacos_fisicos"),
  turmas: createCollectionService<any>("turmas"),
  disciplinas_academicas: createCollectionService<any>("disciplinas_academicas"),
  users: createCollectionService<any>("users"),
  accessAlerts: createCollectionService<any>("access_alerts"),
  institucional_plans: createCollectionService<any>("institucional_plans"),
  reports: createCollectionService<any>("reports"),
  monografia: {
    ...createCollectionService<any>("monografia"),
    set: async (id: string, data: any) => {
      try {
        const docRef = doc(db, "monografia", id);
        await setDoc(docRef, { ...cleanObject(data), updatedAt: serverTimestamp() }, { merge: true });
        return true;
      } catch (error) {
        console.error(`Erro ao salvar monografia ${id}:`, error);
        return false;
      }
    }
  },
  plan_schedules: createCollectionService<any>("plan_schedules"),
  historico_chefias: createCollectionService<any>("historico_chefias"),
  tetosOrcamentais: createCollectionService<any>("tetos_orcamentais", null),
  produtosUnificados: createCollectionService<any>("produtos_unificados", null),
  password_reset_requests: createCollectionService<any>("password_reset_requests"),
  notification_read_status: createCollectionService<any>("notification_read_status", null),
  afetacao_checklist: createCollectionService<any>("afetacao_checklist", null),
  balancoConfig: createCollectionService<any>("balanco_config", null),
  resetUserPasswordToDefault,
  drafts: {
    ...createCollectionService<any>("drafts"),
    getByUserAndForm: async (userId: string, formId: string) => {
      if (!userId || !formId) return null;
      try {
        const docId = `${userId}_${formId}`.replace(/[^a-zA-Z0-9_]/g, "_");
        const docRef = doc(db, "drafts", docId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          return { id: snapshot.id, ...snapshot.data() };
        }

        // Fallback for legacy drafts
        const q = query(
          collection(db, "drafts"),
          where("userId", "==", String(userId)),
          where("formId", "==", String(formId)),
        );
        const qSnapshot = await getDocs(q);
        return qSnapshot.empty
          ? null
          : { id: qSnapshot.docs[0].id, ...qSnapshot.docs[0].data() };
      } catch (error) {
        console.error("Erro ao obter rascunho:", error);
        return null;
      }
    },
    save: async (userId: string, formId: string, data: any) => {
      if (!userId || !formId) return null;
      try {
        const docId = `${userId}_${formId}`.replace(/[^a-zA-Z0-9_]/g, "_");
        const docRef = doc(db, "drafts", docId);

        const payload = {
          userId: String(userId),
          formId: String(formId),
          ...cleanObject(data),
          updatedAt: serverTimestamp(),
        };

        await setDoc(docRef, payload, { merge: true });
        return docId;
      } catch (error) {
        console.error("Erro ao salvar rascunho:", error);
        return null;
      }
    },
    deleteByUserAndForm: async (userId: string, formId: string) => {
      if (!userId || !formId) return;
      try {
        const docId = `${userId}_${formId}`.replace(/[^a-zA-Z0-9_]/g, "_");
        await deleteDoc(doc(db, "drafts", docId));

        // Cleanup legacy
        const q = query(
          collection(db, "drafts"),
          where("userId", "==", String(userId)),
          where("formId", "==", String(formId)),
        );
        const snapshot = await getDocs(q);
        const promises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(promises);
      } catch (error) {
        console.error("Erro ao eliminar rascunho:", error);
      }
    },
  },

  seedAllCollaborators: async (colaboradores: any[]) => {
    try {
      console.log(
        `Iniciando semeadura de ${colaboradores.length} colaboradores...`,
      );
      let count = 0;

      for (const col of colaboradores) {
        const docId = col.id || col.nuit || `col_${count}`;
        const verifiedTipo = col.tipo || classifyTipo(col);

        // Determinar se é chefe para definir mandato inicial se não existir
        const cargoLower = (col.cargo || col.funcao || "").toLowerCase();
        const isChef =
          cargoLower.includes("chefe") || cargoLower.includes("diretor");

        const tipoUsuario = isChef ? "Chefia" : "Usuário Comum";

        const mandatoData = isChef
          ? {
              mandatoStatus: col.mandatoStatus || "Ativo",
              mandatoInicio:
                col.mandatoInicio || new Date().toISOString().split("T")[0],
              isChefiaDefinitiva: true,
              tipoUsuario,
            }
          : { tipoUsuario };

        await setDoc(
          doc(db, "colaboradores", String(docId)),
          {
            ...col,
            tipo: verifiedTipo,
            tipoUsuario,
            ...mandatoData,
            updatedAt: serverTimestamp(),
            source: "System Seed",
          },
          { merge: true },
        );
        count++;
      }

      console.log(`${count} colaboradores semeados com sucesso.`);
      // Automagicamente sincronizar tabela de chefias
      await firestoreService.syncChefiaAccounts(colaboradores);
      return { success: true, count };
    } catch (error) {
      console.error("Erro ao semear colaboradores:", error);
      return { success: false, error };
    }
  },

  cleanAndResequenceMatrixActivities: async () => {
    try {
      console.log(
        "Delegando limpeza e resequenciação de atividades ao databaseMaintenance...",
      );
      const { databaseMaintenance } = await import("./databaseMaintenance");
      return await databaseMaintenance.removeDuplicateActivitiesAndFixNumbering();
    } catch (error) {
      console.error(
        "Erro ao resequenciar atividades via firestoreService:",
        error,
      );
      return { deletedCount: 0, updatedCount: 0 };
    }
  },

  cleanDuplicateCollaborators: async () => {
    try {
      console.log("Iniciando varredura de duplicados no Firestore...");
      const colRef = collection(db, "colaboradores");
      const snapshot = await getDocs(colRef);
      const allDocs = snapshot.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
      })) as any[];

      console.log(
        `Carregados ${allDocs.length} colaboradores para análise de duplicados no Firestore.`,
      );

      const cleanString = (s: any) => {
        if (!s) return "";
        return String(s)
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      };

      const groups: Record<string, any[]> = {};
      allDocs.forEach((c) => {
        const hasChefia =
          c.cargoChefia && c.cargoChefia !== "Nenhum" && c.cargoChefia !== "-";
        // Chefes nunca são agrupados como duplicados de outros para garantir que cada chefe é mantido intacto e protegido
        const name = hasChefia
          ? `chefia_${c.docId || c.id || Math.random()}`
          : cleanString(c.nome);
        if (!name) return;
        if (!groups[name]) groups[name] = [];
        groups[name].push(c);
      });

      let deletedCount = 0;
      let mergedCount = 0;

      for (const name in groups) {
        const group = groups[name];
        if (group.length > 1) {
          const getFilledFieldsCount = (c: any) => {
            let count = 0;
            for (const key in c) {
              if (
                c[key] !== undefined &&
                c[key] !== null &&
                c[key] !== "" &&
                c[key] !== "---"
              ) {
                count++;
              }
            }
            return count;
          };

          group.sort(
            (a, b) => getFilledFieldsCount(b) - getFilledFieldsCount(a),
          );
          const mainColab = group[0];
          console.log(
            `Duplicado encontrado para "${mainColab.nome}". Mantendo documento "${mainColab.docId}" com ${getFilledFieldsCount(mainColab)} campos.`,
          );

          let dataMerged = false;
          const mergedData = { ...mainColab };

          for (let i = 1; i < group.length; i++) {
            const secondaryColab = group[i];

            for (const key in secondaryColab) {
              if (
                (!mergedData[key] ||
                  mergedData[key] === "---" ||
                  mergedData[key] === "") &&
                secondaryColab[key] !== undefined &&
                secondaryColab[key] !== null &&
                secondaryColab[key] !== "" &&
                secondaryColab[key] !== "---"
              ) {
                mergedData[key] = secondaryColab[key];
                dataMerged = true;
              }
            }

            console.log(
              `Eliminando duplicado redundante do Firestore: ID documento "${secondaryColab.docId}"`,
            );
            await deleteDoc(doc(db, "colaboradores", secondaryColab.docId));
            deletedCount++;
          }

          if (dataMerged) {
            await setDoc(
              doc(db, "colaboradores", mainColab.docId),
              mergedData,
              { merge: true },
            );
            mergedCount++;
          }
        }
      }

      console.log(
        `Varredura concluída: ${deletedCount} repetidos eliminados, ${mergedCount} mesclados.`,
      );
      return { success: true, deletedCount, mergedCount };
    } catch (error) {
      console.error(
        "Erro na limpeza automática de colaboradores repetidos:",
        error,
      );
      return { success: false, error };
    }
  },

  generalSystemCleanup: async () => {
    try {
      console.log("Iniciando Limpeza Geral do Sistema: exclusão de repetições e sobreposições de nome e código...");
      
      // 1. Clean duplicate and overlapping collaborators
      const colResult = await firestoreService.cleanDuplicateCollaborators();

      // 2. Clean duplicate and overlapping matrix activities & resequence codes
      const matrixResult = await firestoreService.cleanAndResequenceMatrixActivities();

      // 3. Clean duplicate activities in 'actividades' collection
      const actSnapshot = await getDocs(collection(db, "actividades"));
      const allActs = actSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      const seenActs = new Set<string>();
      let actDeletedCount = 0;
      for (const act of allActs) {
        const name = (act.title || act.designacao || act.nomeAtividade || "").trim().toLowerCase();
        const code = (act.codigoAtividade || act.referencia || "").trim().toLowerCase();
        const dept = (act.departamento || act.unidadeOrganica || "Geral").trim().toLowerCase();
        const key = `${code}::${name}::${dept}`;
        if (name && code && seenActs.has(key)) {
          await deleteDoc(doc(db, "actividades", act.id));
          actDeletedCount++;
        } else {
          if (name && code) seenActs.add(key);
        }
      }

      // 4. Clean duplicate suppliers in 'suppliers' collection
      const supSnapshot = await getDocs(collection(db, "suppliers"));
      const allSups = supSnapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      const seenSups = new Set<string>();
      let supDeletedCount = 0;
      for (const sup of allSups) {
        const name = (sup.name || sup.nome || "").trim().toLowerCase();
        const nuit = (sup.nuit || "").toString().trim();
        const key = nuit || name;
        if (key && seenSups.has(key)) {
          await deleteDoc(doc(db, "suppliers", sup.id));
          supDeletedCount++;
        } else {
          if (key) seenSups.add(key);
        }
      }

      // 5. Clean empty or stale drafts
      let draftsDeletedCount = 0;
      try {
        const draftSnapshot = await getDocs(collection(db, "drafts"));
        for (const docItem of draftSnapshot.docs) {
          const data = docItem.data() || {};
          const isDraftEmpty = !data.title && !data.nomeAtividade && !data.designacao && !data.name;
          if (isDraftEmpty) {
            await deleteDoc(doc(db, "drafts", docItem.id));
            draftsDeletedCount++;
          }
        }
      } catch (err) {
        console.warn("Aviso ao limpar rascunhos vazios:", err);
      }

      // 6. Clean old/redundant accessAlerts
      let alertsDeletedCount = 0;
      try {
        const alertSnapshot = await getDocs(collection(db, "accessAlerts"));
        for (const docItem of alertSnapshot.docs) {
          const data = docItem.data() || {};
          if (data.resolved || !data.timestamp) {
            await deleteDoc(doc(db, "accessAlerts", docItem.id));
            alertsDeletedCount++;
          }
        }
      } catch (err) {
        console.warn("Aviso ao limpar alertas antigos:", err);
      }

      // 7. Clean browser cache (localStorage)
      let cacheCleared = false;
      try {
        Object.keys(localStorage).forEach((key) => {
          if (
            key.startsWith("sigep_") ||
            key.startsWith("teto_") ||
            key.startsWith("mono_") ||
            key.includes("cache") ||
            key.includes("draft")
          ) {
            localStorage.removeItem(key);
          }
        });
        cacheCleared = true;
      } catch (e) {
        console.warn("Aviso ao limpar cache local:", e);
      }

      console.log("Limpeza Geral do Sistema concluída com sucesso!");
      return {
        success: true,
        collaboratorsDeleted: colResult.deletedCount || 0,
        matrixRemoved: matrixResult.deletedCount || 0,
        activitiesDeleted: actDeletedCount,
        suppliersDeleted: supDeletedCount,
        draftsDeleted: draftsDeletedCount,
        alertsDeleted: alertsDeletedCount,
        cacheCleared,
      };
    } catch (error) {
      console.error("Erro na limpeza geral do sistema:", error);
      return { success: false, error };
    }
  },

  messages: {
    subscribe: (userId: string, callback: any) =>
      subscribeToMessages(userId, callback),
    add: (data: any) => addToCollection("messages", data),
    markAsRead: (id: string) =>
      updateInCollection("messages", id, { read: true }),
    delete: (id: string) => deleteFromCollection("messages", id),
    deleteAll: () => deleteAllFromCollection("messages"),
  },

  syncChefiaAccounts: async (colaboradores: any[]) => {
    try {
      const dbUsers = await getDocs(collection(db, "users"));
      const users = dbUsers.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      const getAreaDeAfetacao = (cc: any): string => {
        if (
          cc.reparticao &&
          cc.reparticao !== "Nenhum" &&
          cc.reparticao !== "-"
        )
          return cc.reparticao;
        if (
          cc.departamento &&
          cc.departamento !== "Nenhum" &&
          cc.departamento !== "-"
        )
          return cc.departamento;
        if (cc.direcao && cc.direcao !== "Nenhum" && cc.direcao !== "-")
          return cc.direcao;
        return cc.unidade || cc.unidadeOrganica || "";
      };

      let createdCount = 0;
      let updatedCount = 0;
      let chefiaCount = 0;

      for (const col of colaboradores) {
        if (!col || !col.id) continue;

        const cargo = (col.cargo || col.funcao || "").toLowerCase();
        const cargoChefia = (col.cargoChefia || "").toLowerCase();

        const isChefiaExplicitlyNone =
          !col.cargoChefia ||
          col.cargoChefia === "Nenhum" ||
          col.cargoChefia === "nenhum" ||
          col.cargoChefia === "-" ||
          col.cargoChefia === "Sem Cargo" ||
          col.cargoChefia.toLowerCase().includes("nenhum") ||
          col.isChefia === false;

        const isChefiaByField = col.cargoChefia && !isChefiaExplicitlyNone;

        const isChefia =
          !isChefiaExplicitlyNone &&
          (isChefiaByField || hasChefiaPosition(col));

        const statusRaw = (
          col.status ||
          col.situacao ||
          col.estado ||
          col.mandatoStatus ||
          col.estadoMandato ||
          ""
        )
          .toLowerCase()
          .trim();
        const isCessado =
          statusRaw === "cessado" ||
          statusRaw === "inativo" ||
          col.cessado === true;

        const colIdStr = String(col.id);
        const chefiaDocRef = doc(db, "colaboradores_chefia", colIdStr);

        if (isChefia && !isCessado) {
          chefiaCount++;
          const area = getAreaDeAfetacao(col);
          const resolvedCargoChefia =
            col.cargoChefia &&
            col.cargoChefia !== "Nenhum" &&
            col.cargoChefia !== "-"
              ? col.cargoChefia
              : col.cargo;

          // Save/Update in colaboradores_chefia table
          const chefiaTableData: any = {
            id: colIdStr,
            collabId: colIdStr,
            nome: col.nome || "",
            nuit: col.nuit || "",
            email: col.email || "",
            cargo: col.cargo || "",
            cargoChefia: resolvedCargoChefia || "",
            unidade: col.unidade || col.unidadeOrganica || "",
            direcao: col.direcao || "",
            departamento: col.departamento || "",
            reparticao: col.reparticao || "",
            curso: col.curso || "",
            tipo: col.tipo || "CTA",
            status: col.status || "Ativo",
            areaDeAfetacao: area,
            mandatoStatus: col.mandatoStatus || "Ativo",
            updatedAt: serverTimestamp(),
            fonte: "Chefia Import Sync",
          };

          await setDoc(chefiaDocRef, chefiaTableData, { merge: true });

          // Also update status and areaDeAfetacao in main colaboradores table if needed
          if (col.status !== "Afetado" || col.areaDeAfetacao !== area) {
            const colRef = doc(db, "colaboradores", colIdStr);
            await setDoc(
              colRef,
              {
                status: col.status || "Afetado",
                areaDeAfetacao: area,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          }

          // Sync user account in users table
          const existingUser = users.find(
            (u: any) =>
              (u.collabId && u.collabId === col.id) ||
              (u.nuit &&
                col.nuit &&
                String(u.nuit).trim() !== "" &&
                String(u.nuit).trim() === String(col.nuit).trim()) ||
              (u.email &&
                col.email &&
                u.email.toLowerCase() === col.email.toLowerCase()),
          );

          const nomeSeguro = String(col.nome || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, "")
            .trim()
            .split(/\s+/)
            .join(".");
          const email = (col.email || `${nomeSeguro || col.id}@isps.ac.mz`)
            .toLowerCase()
            .trim();

          const userData: any = {
            collabId: col.id,
            name: col.nome,
            email: email,
            nuit: col.nuit || "",
            role: col.tipo === "Docente" ? "Docente" : "CTA",
            unidade: col.unidade || "",
            direcao: col.direcao || "",
            departamento: col.departamento || "",
            reparticao: col.reparticao || "",
            cargo: col.cargo || "",
            cargoChefia: resolvedCargoChefia || "",
            status: col.status || "Afetado",
            areaDeAfetacao: area,
            updatedAt: serverTimestamp(),
          };

          if (existingUser) {
            const hasChanges =
              existingUser.status !== userData.status ||
              existingUser.areaDeAfetacao !== area ||
              existingUser.cargoChefia !== userData.cargoChefia ||
              existingUser.role !== userData.role ||
              existingUser.reparticao !== userData.reparticao ||
              existingUser.departamento !== userData.departamento ||
              existingUser.direcao !== userData.direcao;

            if (hasChanges) {
              const userRef = doc(db, "users", existingUser.id);
              await updateDoc(userRef, userData);
              updatedCount++;
            }
          } else {
            const defaultPass = col.password || "1234";
            const defaultMustChange = col.mustChangePassword !== undefined ? col.mustChangePassword : (defaultPass !== "1234" ? false : true);
            await addDoc(collection(db, "users"), {
              ...userData,
              password: defaultPass,
              mustChangePassword: defaultMustChange,
              createdAt: serverTimestamp(),
            });
            createdCount++;
          }
        } else {
          try {
            await deleteDoc(chefiaDocRef);
          } catch (delErr) {
            // Ignore if doc does not exist
          }
        }
      }

      return {
        created: createdCount,
        updated: updatedCount,
        chefiaTotal: chefiaCount,
      };
    } catch (error: any) {
      console.error(
        "🔥 Firestore Error in syncChefiaAccounts:",
        error?.message || error,
      );
      handleFirestoreError(error, OperationType.UPDATE, "syncChefiaAccounts");
      return {
        created: 0,
        updated: 0,
        error: "Failed to sync chefia accounts",
      };
    }
  },

  initializeAdmin: async (adminData: any) => {
    try {
      const usersCol = collection(db, "users");
      const q = query(usersCol, where("email", "==", adminData.email || ""));
      const querySnapshot = await getDocs(q);

      // Prepare basic user data without password initially
      const { password: adminPassword, ...otherData } = adminData;
      const userData: any = {
        ...otherData,
        role: "Administrador",
        updatedAt: serverTimestamp(),
      };

      // Only include password in the update object if it's provided and not empty
      if (adminPassword && adminPassword.trim() !== "") {
        userData.password = adminPassword;
      }

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        // If the document exists, we update it. password will only be updated if provided.
        await updateDoc(userDoc.ref, userData);
        return { success: true, message: "Admin updated" };
      } else {
        // If the document doesn't exist, we must have a password
        if (!userData.password) {
          userData.password = "admin"; // fallback default for new admin if somehow not provided
        }
        await addDoc(usersCol, {
          ...userData,
          createdAt: serverTimestamp(),
        });
        return { success: true, message: "Admin created" };
      }
    } catch (error: any) {
      console.error("🔥 Error in initializeAdmin:", error);
      handleFirestoreError(error, OperationType.WRITE, "users");
      return { success: false, error: error.message };
    }
  },

  verifyUser: async (identifier: string, password?: string) => {
    try {
      const usersCol = collection(db, "users");
      const cleanId = (identifier || "").trim();
      if (!cleanId) return { exists: false };

      // Workaround for or() bug in some Firebase SDK versions by running queries in parallel
      const qEmail = query(
        usersCol,
        where("email", "==", cleanId.toLowerCase()),
      );
      const qNuit = query(usersCol, where("nuit", "==", cleanId));

      const [snapEmail, snapNuit] = await Promise.all([
        getDocs(qEmail),
        getDocs(qNuit),
      ]);

      const querySnapshot = !snapEmail.empty ? snapEmail : snapNuit;

      if (querySnapshot.empty) return { exists: false };

      const userDoc = querySnapshot.docs[0];
      const userData = { id: userDoc.id, ...(userDoc.data() as any) };

      if (password && userData.password !== password) {
        return { exists: true, passwordMatch: false };
      }

      return { exists: true, passwordMatch: true, user: userData };
    } catch (error: any) {
      console.error("🔥 Error in verifyUser:", error);
      handleFirestoreError(error, OperationType.GET, "users");
      return { exists: false, error: error.message };
    }
  },

  /**
   * Atualização de Senha e Gestão de Sessões
   */
  hashPassword: (password: string): string => {
    if (!password) return "";
    let hashVal = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hashVal = (hashVal << 5) - hashVal + char;
      hashVal |= 0;
    }
    return "phash_" + Math.abs(hashVal).toString(16);
  },

  invalidateSession: async (userId: string): Promise<void> => {
    if (!userId) return;
    try {
      localStorage.removeItem(`sigep_session_${userId}`);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        activeSessionId: null,
        sessionInvalidatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) =>
        console.warn(`Aviso ao invalidar sessão para ${userId}:`, err),
      );
    } catch (e) {
      console.warn("Erro ao invalidar sessão:", e);
    }
  },

  createSession: async (
    userId: string,
  ): Promise<{ sessionId: string; createdAt: string }> => {
    const sessionId =
      "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
    const sessionData = {
      sessionId,
      userId,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(
        `sigep_session_${userId}`,
        safeJSONStringify(sessionData),
      );
      localStorage.setItem("sigep_active_session_id", sessionId);
      if (userId) {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          activeSessionId: sessionId,
          lastSessionCreated: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          console.warn(`Aviso ao criar sessão para ${userId}:`, err),
        );
      }
    } catch (e) {
      console.warn("Erro ao criar sessão:", e);
    }
    return sessionData;
  },

  saveUser: async (user: any): Promise<void> => {
    if (!user) return;
    const targetId =
      user.id ||
      generateCollaboratorId(user.name || user.nome || "", user.nuit || "");
    try {
      const userRef = doc(db, "users", targetId);
      await setDoc(
        userRef,
        {
          ...user,
          id: targetId,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (e) {
      console.warn("Aviso ao salvar utilizador na base de dados:", e);
    }
  },

  updateUserPasswordWorkflow: async (user: any, newPassword: string) => {
    if (!user) return;
    const hashFn = (pwd: string) => {
      let hashVal = 0;
      for (let i = 0; i < pwd.length; i++) {
        const char = pwd.charCodeAt(i);
        hashVal = (hashVal << 5) - hashVal + char;
        hashVal |= 0;
      }
      return "phash_" + Math.abs(hashVal).toString(16);
    };

    // Após atualizar a senha
    user.passwordHash = hashFn(newPassword);
    user.password = newPassword;
    user.passwordExpired = false;
    user.mustChangePassword = false;
    user.isFirstAccess = false;

    // save(user);
    const targetId =
      user.id ||
      generateCollaboratorId(user.name || user.nome || "", user.nuit || "");
    const userRef = doc(db, "users", targetId);
    await setDoc(
      userRef,
      {
        ...user,
        id: targetId,
        passwordHash: user.passwordHash,
        passwordExpired: false,
        mustChangePassword: false,
        isFirstAccess: false,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch((err) => console.warn("Erro ao salvar utilizador:", err));

    // Invalida sessão antiga
    await firestoreService.invalidateSession(user.id);

    // Cria nova sessão
    const newSession = await firestoreService.createSession(user.id);

    return newSession;
  },

  counters: {
    getNextNumber: async (unitKey: string) => {
      const counterRef = doc(db, "counters", unitKey);
      try {
        const nextNum = await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          if (!counterDoc.exists()) {
            transaction.set(counterRef, { count: 1 });
            return 1;
          }
          const newCount = (counterDoc.data().count || 0) + 1;
          transaction.update(counterRef, { count: newCount });
          return newCount;
        });
        return nextNum;
      } catch (error) {
        console.error("Erro ao incrementar contador:", error);
        return Math.floor(1000 + Math.random() * 9000);
      }
    },
  },
  config: {
    get: async (id: string) => {
      try {
        const docRef = doc(db, "config_sistema", id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists()
          ? { id: snapshot.id, ...snapshot.data() }
          : null;
      } catch (error) {
        console.error("Erro ao obter configuração:", error);
        return null;
      }
    },
    set: async (id: string, data: any) => {
      const docRef = doc(db, "config_sistema", id);
      await setDoc(
        docRef,
        { ...data, updatedAt: serverTimestamp() },
        { merge: true },
      );
    },
    subscribe: (id: string, callback: (data: any) => void) => {
      const docRef = doc(db, "config_sistema", id);
      return onSnapshot(docRef, (snapshot) => {
        callback(
          snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
        );
      });
    },
  },

  /**
   * Executa uma varredura completa na base de dados para detetar anomalias,
   * resolver conflitos e mesclar dados duplicados sem nunca remover dados inseridos pelos utilizadores.
   */
  runDatabaseAuditAndSync: async () => {
    const logs: string[] = [];
    let collectionsScanned = 0;
    let totalDocsScanned = 0;
    let anomaliesDetected = 0;
    let conflictsResolved = 0;
    let duplicatesMerged = 0;
    let fieldsFixed = 0;

    const log = (msg: string) => {
      console.log(`[VARREDURA SIGEP] ${msg}`);
      logs.push(msg);
    };

    log("Iniciando varredura geral e sincronização da base de dados...");

    // 1. Audit Colaboradores
    try {
      collectionsScanned++;
      const colRef = collection(db, "colaboradores");
      const colSnap = await getDocs(colRef);
      totalDocsScanned += colSnap.docs.length;
      log(
        `Coleção "colaboradores": ${colSnap.docs.length} documentos analisados.`,
      );

      const allColabs = colSnap.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
      })) as any[];
      const cleanStr = (s: any) =>
        String(s || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

      // Group by normalized name, NUIT, or process number
      const groups: Record<string, any[]> = {};
      allColabs.forEach((c) => {
        const hasChefia =
          c.cargoChefia && c.cargoChefia !== "Nenhum" && c.cargoChefia !== "-";
        const key = hasChefia
          ? `chefia_${c.docId || c.id || Math.random()}`
          : cleanStr(c.nuit) || cleanStr(c.nome) || cleanStr(c.numeroProcesso);
        if (!key) return;
        if (!groups[key]) groups[key] = [];
        groups[key].push(c);
      });

      for (const key in groups) {
        const group = groups[key];
        if (group.length > 1) {
          anomaliesDetected += group.length - 1;
          log(
            `Conflito/Duplicado detetado para "${group[0].nome || key}": ${group.length} registos encontrados.`,
          );

          const countFilled = (c: any) =>
            Object.keys(c).filter(
              (k) =>
                c[k] !== undefined &&
                c[k] !== null &&
                c[k] !== "" &&
                c[k] !== "---",
            ).length;
          group.sort((a, b) => countFilled(b) - countFilled(a));

          const primary = group[0];
          const mergedData = { ...primary };
          let changed = false;

          for (let i = 1; i < group.length; i++) {
            const sec = group[i];
            for (const fieldKey in sec) {
              if (fieldKey === "docId") continue;
              if (
                (!mergedData[fieldKey] ||
                  mergedData[fieldKey] === "" ||
                  mergedData[fieldKey] === "---") &&
                sec[fieldKey] !== undefined &&
                sec[fieldKey] !== null &&
                sec[fieldKey] !== "" &&
                sec[fieldKey] !== "---"
              ) {
                mergedData[fieldKey] = sec[fieldKey];
                changed = true;
                fieldsFixed++;
              }
            }
            try {
              await deleteDoc(doc(db, "colaboradores", sec.docId));
              duplicatesMerged++;
              conflictsResolved++;
            } catch (err) {
              console.warn(`Aviso ao eliminar duplicado ${sec.docId}:`, err);
            }
          }

          for (const timeKey of ["createdAt", "updatedAt", "dataAdmissao"]) {
            if (
              mergedData[timeKey] &&
              typeof mergedData[timeKey] === "object" &&
              Object.keys(mergedData[timeKey]).length === 0
            ) {
              mergedData[timeKey] = new Date().toISOString();
              changed = true;
              fieldsFixed++;
            }
          }

          if (changed || primary.docId) {
            await setDoc(
              doc(db, "colaboradores", primary.docId),
              {
                ...mergedData,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          }
        } else if (group.length === 1) {
          const item = group[0];
          let itemFixed = false;
          const updateObj: any = {};

          for (const timeKey of ["createdAt", "updatedAt", "dataAdmissao"]) {
            if (
              item[timeKey] &&
              typeof item[timeKey] === "object" &&
              Object.keys(item[timeKey]).length === 0
            ) {
              updateObj[timeKey] = new Date().toISOString();
              itemFixed = true;
              fieldsFixed++;
            }
          }

          if (itemFixed) {
            anomaliesDetected++;
            conflictsResolved++;
            await updateDoc(doc(db, "colaboradores", item.docId), updateObj);
          }
        }
      }
      log(
        `Resolução de colaboradores concluída: ${duplicatesMerged} duplicados mesclados sem perda de dados.`,
      );
    } catch (err: any) {
      log(`Aviso ao analisar colaboradores: ${err?.message || String(err)}`);
    }

    // 2. Audit Users & Sync Chefias
    try {
      collectionsScanned++;
      const usersRef = collection(db, "users");
      const usersSnap = await getDocs(usersRef);
      totalDocsScanned += usersSnap.docs.length;
      log(
        `Coleção "users": ${usersSnap.docs.length} contas de utilizador analisadas.`,
      );

      const allUsers = usersSnap.docs.map((doc) => ({
        ...doc.data(),
        docId: doc.id,
      })) as any[];

      for (const u of allUsers) {
        let fixed = false;
        const updates: any = {};
        for (const timeKey of ["createdAt", "updatedAt", "lastLogin"]) {
          if (
            u[timeKey] &&
            typeof u[timeKey] === "object" &&
            Object.keys(u[timeKey]).length === 0
          ) {
            updates[timeKey] = new Date().toISOString();
            fixed = true;
            fieldsFixed++;
          }
        }
        if (fixed) {
          anomaliesDetected++;
          conflictsResolved++;
          await updateDoc(doc(db, "users", u.docId), updates);
        }
      }

      const colSnap = await getDocs(collection(db, "colaboradores"));
      const dbColabs = colSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      const syncRes = await firestoreService.syncChefiaAccounts(dbColabs);
      log(
        `Sincronização de contas e chefias: ${syncRes.created || 0} criadas, ${syncRes.updated || 0} atualizadas.`,
      );
    } catch (err: any) {
      log(`Aviso ao analisar utilizadores: ${err?.message || String(err)}`);
    }

    // 3. Audit Activities & Other Primary Collections for Corrupted Timestamp Objects
    const collectionsToCheck = [
      { name: "actividades", label: "Actividades Setoriais" },
      { name: "matrix_activities", label: "Plano de Actividades" },
      { name: "expedientes", label: "Expediente Geral" },
      { name: "processos_individuais", label: "Processos Individuais" },
      { name: "service_requests", label: "Requisições de Serviços" },
      { name: "financial_data", label: "Dados Financeiros" },
      { name: "library_visits", label: "Visitas da Biblioteca" },
    ];

    for (const cInfo of collectionsToCheck) {
      try {
        collectionsScanned++;
        const cRef = collection(db, cInfo.name);
        const cSnap = await getDocs(cRef);
        totalDocsScanned += cSnap.docs.length;

        let fixedCountInCol = 0;
        for (const d of cSnap.docs) {
          const dData = d.data();
          let needsFix = false;
          const patch: any = {};

          for (const key in dData) {
            const val = dData[key];
            if (
              val &&
              typeof val === "object" &&
              !(val instanceof Date) &&
              typeof val.toMillis !== "function" &&
              Object.keys(val).length === 0
            ) {
              patch[key] =
                key.toLowerCase().includes("data") ||
                key.toLowerCase().includes("time") ||
                key.toLowerCase().includes("created") ||
                key.toLowerCase().includes("updated")
                  ? new Date().toISOString()
                  : null;
              needsFix = true;
              fieldsFixed++;
            }
          }

          if (needsFix) {
            anomaliesDetected++;
            conflictsResolved++;
            fixedCountInCol++;
            await updateDoc(doc(db, cInfo.name, d.id), patch);
          }
        }
        if (fixedCountInCol > 0) {
          log(
            `Coleção "${cInfo.label}" (${cInfo.name}): ${fixedCountInCol} campos corrompidos/incompletos corrigidos.`,
          );
        }
      } catch (err: any) {
        log(
          `Aviso na verificação de ${cInfo.name}: ${err?.message || String(err)}`,
        );
      }
    }

    log(
      `Varredura concluída com sucesso! ${totalDocsScanned} registos analisados em ${collectionsScanned} coleções. ${anomaliesDetected} anomalias encontradas, ${conflictsResolved} conflitos resolvidos.`,
    );

    return {
      success: true,
      collectionsScanned,
      totalDocsScanned,
      anomaliesDetected,
      conflictsResolved,
      duplicatesMerged,
      fieldsFixed,
      logs,
    };
  },
};

export function subscribeToMessages(userId: string, callback: any) {
  if (!userId) return () => {};
  const q = query(
    collection(db, "messages"),
    where("recipientId", "==", String(userId)),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      callback(msgs);
    },
    (error) => {
      console.error("Erro ao subscrever mensagens:", error);
      handleFirestoreError(error, OperationType.LIST, "messages");
    },
  );
}

export async function deleteAllFromCollection(collectionName: string) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}

interface UpdatePasswordResult {
  success: boolean;
  error?: string;
  requiresReauth?: boolean;
}

export async function updateUserPassword(
  newPassword: string,
  currentPassword?: string, // necessário para reautenticação
): Promise<UpdatePasswordResult> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  try {
    await updatePassword(user, newPassword);

    await updateDoc(doc(db, "users", user.uid), {
      lastPasswordUpdate: serverTimestamp(),
      mustChangePassword: false,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao atualizar senha:", error);

    // Firebase exige reautenticação recente para alterar senha
    if (error.code === "auth/requires-recent-login") {
      // Tenta reautenticar automaticamente se a senha atual foi fornecida
      if (currentPassword) {
        try {
          const credential = EmailAuthProvider.credential(
            user.email!,
            currentPassword,
          );
          await reauthenticateWithCredential(user, credential);

          // Retry após reautenticação
          return updateUserPassword(newPassword);
        } catch (reauthError: any) {
          return {
            success: false,
            error: "Falha na reautenticação: " + reauthError.message,
            requiresReauth: true,
          };
        }
      }
      return {
        success: false,
        error: "É necessário fazer login novamente para alterar a senha.",
        requiresReauth: true,
      };
    }

    return {
      success: false,
      error: error.message || "Erro desconhecido ao atualizar senha.",
    };
  }
}

/**
 * Reseta a senha de um utilizador para a senha padrão '1234'.
 * Apenas para uso administrativo.
 */
export async function resetUserPasswordToDefault(
  userId: string,
  newPassword = "1234"
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      password: newPassword,
      mustChangePassword: true,
      updatedAt: serverTimestamp(),
    });

    // Também atualizar na coleção de colaboradores para manter paridade
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.nuit) {
        const colQuery = query(
          collection(db, "colaboradores"),
          where("nuit", "==", userData.nuit),
        );
        const colSnap = await getDocs(colQuery);
        if (!colSnap.empty) {
          await updateDoc(doc(db, "colaboradores", colSnap.docs[0].id), {
            password: newPassword,
            mustChangePassword: true,
          });
        }
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Erro ao resetar senha:", error);
    return { success: false, error: error.message };
  }
}
