import {
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  getDirectionAbbreviation,
  getDepartmentAbbreviation,
  getActivityInitials,
} from "./utils";

export const databaseMaintenance = {
  /**
   * Remove atividades duplicadas na base de dados (matrix_activities) e corrige
   * a ordem de numeração sequencial das atividades (no, numeroDirecao, codigoAtividade)
   * sem repetições ou saltos (gaps).
   */
  async removeDuplicateActivitiesAndFixNumbering() {
    console.log(
      "Iniciando remoção de duplicatas por fusão/substituição e correção da numeração das atividades...",
    );
    try {
      const colRef = collection(db, "matrix_activities");
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) {
        console.log("Nenhuma atividade encontrada em matrix_activities.");
        return { deletedCount: 0, updatedCount: 0 };
      }

      const rawDocs = snapshot.docs.map((document) => ({
        id: document.id,
        ...(document.data() as any),
      }));

      // 1. Agrupar e Consolidar Atividades Duplicadas (por Nome, por Código ou por Sobreposição)
      const normalize = (str: string) =>
        String(str || "")
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, " ");

      const n = rawDocs.length;
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (i: number): number => {
        if (parent[i] === i) return i;
        parent[i] = find(parent[i]);
        return parent[i];
      };
      const union = (i: number, j: number) => {
        const rootI = find(i);
        const rootJ = find(j);
        if (rootI !== rootJ) {
          parent[rootI] = rootJ;
        }
      };

      // Mapeamentos para detetar duplicados/sobreposições
      const titleDeptMap = new Map<string, number>();
      const codeDeptMap = new Map<string, number>();
      const globalCodeMap = new Map<string, number>();

      rawDocs.forEach((act, idx) => {
        const title = normalize(act.nomeAtividade || act.title || act.designacao || "");
        const dept = normalize(act.departamento || act.unidadeOrganica || act.direcao || "GERAL");
        const year = String(act.ano || act.year || act.selectedYear || "2027");
        const code = normalize(
          act.codigoAtividade || act.numeroAtividade || act.nAtividade || act.no || act.referencia || ""
        );

        const titleKey = `${dept}|${title}|${year}`;
        const codeKey = `${dept}|${code}|${year}`;

        // Unir por mesmo título no mesmo departamento/ano
        if (title !== "") {
          if (titleDeptMap.has(titleKey)) {
            union(idx, titleDeptMap.get(titleKey)!);
          } else {
            titleDeptMap.set(titleKey, idx);
          }
        }

        // Unir por mesmo código no mesmo departamento/ano
        if (code !== "") {
          if (codeDeptMap.has(codeKey)) {
            union(idx, codeDeptMap.get(codeKey)!);
          } else {
            codeDeptMap.set(codeKey, idx);
          }

          // Unir por código idêntico globalmente (evita sobreposição de código entre diferentes registos)
          if (globalCodeMap.has(code)) {
            union(idx, globalCodeMap.get(code)!);
          } else {
            globalCodeMap.set(code, idx);
          }
        }
      });

      // Agrupar índices por raiz do Union-Find
      const clusterMap = new Map<number, number[]>();
      for (let i = 0; i < n; i++) {
        const root = find(i);
        if (!clusterMap.has(root)) clusterMap.set(root, []);
        clusterMap.get(root)!.push(i);
      }

      const duplicatesIds: string[] = [];
      const uniqueDocs: any[] = [];
      let mergedCount = 0;

      const getFilledScore = (obj: any) => {
        return Object.entries(obj).reduce((score, [k, v]) => {
          if (
            k !== "id" &&
            v !== null &&
            v !== undefined &&
            v !== "" &&
            v !== 0 &&
            (!Array.isArray(v) || v.length > 0)
          ) {
            return score + 1;
          }
          return score;
        }, 0);
      };

      for (const indices of clusterMap.values()) {
        const group = indices.map((i) => rawDocs[i]);
        if (group.length === 1) {
          uniqueDocs.push(group[0]);
        } else {
          // Ordena registos para que o mais completo seja o principal
          group.sort((a, b) => getFilledScore(b) - getFilledScore(a));
          const primary = { ...group[0] };
          let modifiedPrimary = false;
          const mergedUpdates: Record<string, any> = {};

          for (let i = 1; i < group.length; i++) {
            const secondary = group[i];
            duplicatesIds.push(secondary.id);

            // Funde/Substitui quaisquer campos em falta no registo principal
            Object.keys(secondary).forEach((field) => {
              if (field === "id") return;
              const priVal = primary[field];
              const secVal = secondary[field];

              const isPriEmpty =
                priVal === undefined ||
                priVal === null ||
                priVal === "" ||
                priVal === 0 ||
                (Array.isArray(priVal) && priVal.length === 0);
              const isSecFilled =
                secVal !== undefined &&
                secVal !== null &&
                secVal !== "" &&
                secVal !== 0 &&
                (!Array.isArray(secVal) || secVal.length > 0);

              if (isPriEmpty && isSecFilled) {
                primary[field] = secVal;
                mergedUpdates[field] = secVal;
                modifiedPrimary = true;
              }
            });
          }

          if (modifiedPrimary) {
            try {
              await updateDoc(
                doc(db, "matrix_activities", primary.id),
                mergedUpdates,
              );
              mergedCount++;
            } catch (err) {
              console.warn("Erro ao atualizar registo fundido:", err);
            }
          }

          uniqueDocs.push(primary);
        }
      }

      // 2. Apagar Duplicatas e Atividades de Património no Firestore (em matrix_activities e actividades)
      let deletedCount = 0;
      if (duplicatesIds.length > 0) {
        console.log(
          `Encontradas ${duplicatesIds.length} atividades para eliminação (duplicadas/património). A remover do Firestore...`,
        );
        for (let i = 0; i < duplicatesIds.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = duplicatesIds.slice(i, i + 500);
          chunk.forEach((id) => {
            batch.delete(doc(db, "matrix_activities", id));
            batch.delete(doc(db, "actividades", id));
            deletedCount++;
          });
          await batch.commit();
        }
        console.log(
          `${deletedCount} registos eliminados definitivamente da base de dados.`,
        );
      }

      // 3. Reordenar e Renumerar Atividades Únicas Restantes STRICTLY POR DEPARTAMENTO (A COMEÇAR EM 001)
      const deptGroups: Record<string, any[]> = {};
      uniqueDocs.forEach((act) => {
        const deptKey = (
          act.departamento ||
          act.unidadeOrganica ||
          "GERAL"
        ).trim();
        if (!deptGroups[deptKey]) deptGroups[deptKey] = [];
        deptGroups[deptKey].push(act);
      });

      const directionCounters: Record<string, number> = {};
      const updates: { id: string; data: any }[] = [];

      Object.keys(deptGroups).forEach((deptKey) => {
        const deptActs = deptGroups[deptKey];
        // Ordena internamente por título/nome da atividade
        deptActs.sort((a, b) => {
          const titleA = String(a.nomeAtividade || a.title || a.designacao || "");
          const titleB = String(b.nomeAtividade || b.title || b.designacao || "");
          return titleA.localeCompare(titleB);
        });

        // Para CADA departamento, a numeração COMEÇA SEMPRE em 001
        deptActs.forEach((act, idx) => {
          const newNo = String(idx + 1).padStart(3, "0");

          const dirKey = (act.direcao || "SEM DIREÇÃO").toUpperCase();
          if (!directionCounters[dirKey]) directionCounters[dirKey] = 0;
          directionCounters[dirKey]++;
          const newNumeroDirecao = String(directionCounters[dirKey]).padStart(3, "0");

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

          updates.push({
            id: act.id,
            data: {
              no: newNo,
              numeroAtividade: newNo,
              nAtividade: newNo,
              codigoAtividade: newCode,
              referencia: newCode,
              numeroDirecao: newNumeroDirecao,
              numeroDepartamento: newNo,
            },
          });
        });
      });

      // Executa as atualizações em lotes de 500
      for (let i = 0; i < updates.length; i += 500) {
        const batch = writeBatch(db);
        const chunk = updates.slice(i, i + 500);
        chunk.forEach((update) => {
          const docRef = doc(db, "matrix_activities", update.id);
          batch.set(docRef, update.data, { merge: true });
        });
        await batch.commit();
      }

      // A limpeza de cache local agora é gerida pela lógica de fusão do firestoreService
      // para evitar perda de dados não sincronizados (local_)
      console.log(
        `Renumeração e exclusão concluídas. Deletadas: ${deletedCount}. Atualizadas: ${updates.length}`,
      );
      return { deletedCount, updatedCount: updates.length };
    } catch (err) {
      console.error("Erro ao remover duplicatas e renumerar atividades:", err);
      throw err;
    }
  },

  /**
   * Executa a limpeza específica de departamentos e atividades solicitada pelo usuário
   */
  async cleanupDatabaseForUser() {
    console.log(
      "Iniciando limpeza e exclusão de departamentos e atividades solicitadas pelo usuário...",
    );

    // Coleções para limpar atividades
    const activityCollections = ["actividades", "matrix_activities"];
    let deletedActivitiesCount = 0;

    for (const colName of activityCollections) {
      try {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);

        if (!snapshot.empty) {
          const batch = writeBatch(db);
          let colDeletedCount = 0;

          snapshot.docs.forEach((document) => {
            const data = document.data() || {};
            const dept = String(data.departamento || "")
              .trim()
              .toUpperCase();
            const sector = String(data.setor || "")
              .trim()
              .toUpperCase();
            const rep = String(data.reparticao || "")
              .trim()
              .toUpperCase();
            const dir = String(data.direcao || "")
              .trim()
              .toUpperCase();
            const title = String(data.title || data.designacao || "")
              .trim()
              .toUpperCase();

            let shouldDelete = false;

            // 1. "excluir o DEPARTAMENTO DAI e todas as suas atividades"
            if (
              dept === "DAI" ||
              sector === "DAI" ||
              rep === "DAI" ||
              dir === "DAI" ||
              dept.includes("AUDITORIA INTERNA")
            ) {
              shouldDelete = true;
            }

            // 2. "excluir todas as atividade que estao na direcao geral, mantedo as atividade da UGEA"
            const isDirecaoGeral =
              dir === "DIREÇÃO GERAL" ||
              dir === "DIREÇÃO-GERAL" ||
              dir === "GDG" ||
              dir.includes("DIREÇÃO GERAL");
            const isUGEA =
              dept === "UGEA" ||
              sector === "UGEA" ||
              rep === "UGEA" ||
              title.includes("UGEA");
            if (isDirecaoGeral && !isUGEA) {
              shouldDelete = true;
            }

            // 3. "EXCLUIR Serviços Gerais"
            const isServicosGerais =
              dept === "SERVIÇOS GERAIS" ||
              dept === "SERVICOS GERAIS" ||
              sector === "SERVIÇOS GERAIS" ||
              sector === "SERVICOS GERAIS" ||
              rep === "SERVIÇOS GERAIS" ||
              rep === "SERVICOS GERAIS" ||
              dir === "SERVIÇOS GERAIS" ||
              dir === "SERVICOS GERAIS";
            if (isServicosGerais) {
              shouldDelete = true;
            }

            // 4. "eXCLUIR TODAS AS ATIVIDADES DO DPEP"
            const isDPEP =
              dept === "DPEP" ||
              sector === "DPEP" ||
              rep === "DPEP" ||
              dept.includes("PLANIFICAÇÃO") ||
              dept.includes("PLANIFICACAO") ||
              dept.includes("ESTUDOS E PROJETOS") ||
              sector.includes("PLANIFICAÇÃO") ||
              sector.includes("PLANIFICACAO");
            if (isDPEP) {
              shouldDelete = true;
            }

            if (shouldDelete) {
              batch.delete(doc(db, colName, document.id));
              colDeletedCount++;
            }
          });

          if (colDeletedCount > 0) {
            await batch.commit();
            deletedActivitiesCount += colDeletedCount;
            console.log(
              `Removidos ${colDeletedCount} documentos de ${colName}`,
            );
          }
        }
      } catch (err) {
        console.error(`Erro ao limpar atividades na coleção ${colName}:`, err);
      }
    }

    // Limpar colaboradores e usuários de DAI, Serviços Gerais se houver
    const entityCollections = ["colaboradores", "users"];
    let deletedEntitiesCount = 0;

    for (const colName of entityCollections) {
      try {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);

        if (!snapshot.empty) {
          const batch = writeBatch(db);
          let colDeletedCount = 0;

          snapshot.docs.forEach((document) => {
            const data = document.data() || {};
            const dept = String(data.departamento || "")
              .trim()
              .toUpperCase();
            const sector = String(data.setor || "")
              .trim()
              .toUpperCase();
            const dir = String(data.direcao || "")
              .trim()
              .toUpperCase();

            let shouldDelete = false;

            // Excluir de DAI
            if (
              dept === "DAI" ||
              sector === "DAI" ||
              dir === "DAI" ||
              dept.includes("AUDITORIA INTERNA")
            ) {
              shouldDelete = true;
            }

            // Excluir de Serviços Gerais
            const isServicosGerais =
              dept === "SERVIÇOS GERAIS" ||
              dept === "SERVICOS GERAIS" ||
              sector === "SERVIÇOS GERAIS" ||
              sector === "SERVICOS GERAIS" ||
              dir === "SERVIÇOS GERAIS" ||
              dir === "SERVICOS GERAIS";
            if (isServicosGerais) {
              shouldDelete = true;
            }

            if (shouldDelete) {
              batch.delete(doc(db, colName, document.id));
              colDeletedCount++;
            }
          });

          if (colDeletedCount > 0) {
            await batch.commit();
            deletedEntitiesCount += colDeletedCount;
            console.log(
              `Removidos ${colDeletedCount} colaboradores/usuários de ${colName}`,
            );
          }
        }
      } catch (err) {
        console.error(`Erro ao limpar coleção ${colName}:`, err);
      }
    }

    // A limpeza de cache local agora é gerida de forma segura pela lógica de fusão do firestoreService
    // preservando itens com prefixo 'local_' que ainda não foram sincronizados.
    console.log(
      `Limpeza concluída! Atividades deletadas: ${deletedActivitiesCount}. Colaboradores/Usuários deletados: ${deletedEntitiesCount}`,
    );
    return { deletedActivitiesCount, deletedEntitiesCount };
  },

  /**
   * Limpa uma coleção inteira (em lotes para evitar problemas de quota/performance)
   */
  async clearCollection(collectionName: string) {
    console.log(`Iniciando limpeza da coleção: ${collectionName}`);
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log(`Coleção ${collectionName} já está vazia.`);
      return 0;
    }

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((document) => {
      batch.delete(doc(db, collectionName, document.id));
      count++;
    });

    await batch.commit();
    console.log(
      `Limpeza concluída: ${count} documentos removidos de ${collectionName}`,
    );
    return count;
  },

  /**
   * Limpa todos os dados de atividades e fluxos de teste do sistema,
   * preservando estritamente a lista de colaboradores e contas de utilizador.
   */
  async fullSystemReset() {
    const collectionsToClear = [
      "matrix_activities",
      "actividades",
      "plano_actividades",
      "plan_schedules",
      "calendar_events",
      "expedientes",
      "notes",
      "service_requests",
      "archive_documents",
      "bolsas",
      "financial_data",
      "materiais_bens",
      "suppliers",
      "library_visits",
      "library_books",
      "messages",
      "accessAlerts",
      "drafts",
      "processos",
      "processos_individuais",
      "monografia",
      "reports",
      "institucional_plans",
      "signatures",
      "efetivo_escolar",
      "alunos",
      "matriculas",
      "alocacoes_docentes",
      "turmas",
      "disciplinas_academicas",
      "espacos_fisicos",
      "exames",
      "atendimentos_estudantis",
      "colaboradores_formacao",
      "assiduidade",
      "movimentos_economato",
      "inventarios_patrimoniais",
      "requisicoes_internas",
      "documentos_normativos",
      "configuracoes",
      "tetos_orcamentais",
      "produtos_unificados",
      "balanco_config",
    ];

    const results = await Promise.all(
      collectionsToClear.map((col) => this.clearCollection(col)),
    );

    // Limpar apenas caches específicos de UI, preservando dados de coleções principais
    try {
      Object.keys(localStorage).forEach((k) => {
        if (
          k.startsWith("sigep_dept_activities_") ||
          k.startsWith("teto_atribuido_") ||
          k.startsWith("mono_") ||
          k === "sigep_unified_products" ||
          k === "sigep_deleted_products" ||
          k === "isps_balanco_logo"
        ) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.warn("Aviso ao limpar cache local de teste:", e);
    }

    const totalRemoved = results.reduce((acc, curr) => acc + curr, 0);
    return {
      totalRemoved,
      details: collectionsToClear.map((col, i) => ({
        collection: col,
        count: results[i],
      })),
    };
  },
};
