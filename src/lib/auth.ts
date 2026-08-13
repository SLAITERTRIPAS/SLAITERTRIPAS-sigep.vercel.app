import { normalize as n, isMatch } from "./utils";
import { DEPARTAMENTOS, REPARTICOES, SECTORES } from "../constants/formOptions";

// Departments that do not have strict internal sector structure
const UNSTRUCTURED_DEPTS = [
  "Gabinete do Diretor-Geral",
  "Secretaria Executiva",
  "Unidade Gestora e Executora de Aquisições",
  "Departamento de Cooperação e Relações Exteriores",
  "Departamento de Controlo Técnico e de Qualidade",
  "Departamento Jurídico",
];

export const isStructuredDept = (deptName: string) => {
  return !UNSTRUCTURED_DEPTS.includes(deptName);
};

export const isDPEPUser = (user: any): boolean => {
  if (!user) return false;
  if (isSuperBossUser(user)) return true;

  const role = String(user.role || "").toLowerCase();
  const title = String(user.title || "").toLowerCase();
  const cargo = String(user.cargo || "").toLowerCase();
  const cargoChefia = String(user.cargoChefia || "").toLowerCase();
  const dept = String(user.departamento || "").toLowerCase();
  const dir = String(user.direcao || "").toLowerCase();
  const setor = String(user.setor || user.reparticao || "").toLowerCase();
  const titulo = String(user.titulo || "").toLowerCase();

  const combined = `${role} ${title} ${cargo} ${cargoChefia} ${dept} ${dir} ${setor} ${titulo}`;

  return (
    combined.includes("dpep") ||
    combined.includes("planificação") ||
    combined.includes("planificacao") ||
    combined.includes("estudos e projetos") ||
    combined.includes("estudos e projectos") ||
    combined.includes("planificador")
  );
};

export const isDepartmentMatch = (deptA?: string, deptB?: string): boolean => {
  if (!deptA || !deptB) return false;

  const escapeReg = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const norm = (s: string) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^(departamento|diretor do|diretor da|diretor de|direccao|direcao|divisao|reparticao|setor|sector|chefe do|chefe de|chefe da|depto|dep|centro de|gabinete do|gabinete de)\s+/gi, "")
      .replace(/\b(de|da|do|dos|das)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const a = norm(deptA);
  const b = norm(deptB);

  if (!a || !b) return false;
  if (a === b) return true;

  const regA = new RegExp(`(?:^|\\b|_|\\s)${escapeReg(a)}(?:$|\\b|_|\\s)`, "i");
  const regB = new RegExp(`(?:^|\\b|_|\\s)${escapeReg(b)}(?:$|\\b|_|\\s)`, "i");

  return regA.test(b) || regB.test(a);
};

export const isUnitBelongsToDirection = (unitName?: string, directionName?: string): boolean => {
  if (!unitName || !directionName) return false;
  if (isDepartmentMatch(unitName, directionName)) return true;

  const normTarget = directionName.trim();
  for (const [dirKey, deptList] of Object.entries(DEPARTAMENTOS)) {
    if (isDepartmentMatch(dirKey, normTarget)) {
      if (deptList.some((d) => isDepartmentMatch(d, unitName))) {
        return true;
      }
    }
  }
  return false;
};

export const canAccessArea = (
  user: any,
  targetDir: string,
  targetDept: string,
  targetSector: string,
) => {
  if (!user) return false;
  
  // Super Boss, Admin e DPEP (Departamento de Planificação) possuem soberania total sobre todas as áreas
  if (isSuperBossUser(user) || isDPEPUser(user)) {
    return true;
  }

  const roles = getRoles(user.title || user.cargo || user.cargoChefia || user.role || "");
  // DG (Diretor Geral) tem acesso institucional total
  if (roles.isDG) {
    return true;
  }

  const norm = (s: string) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ (departamento|depto|dep|reparticao|rep|setor|direcao|direccao|curso|divisao|unidade|de|do|da|dos|das) /g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const uDir = user.direcao || user.orgao || "";
  const uDept = norm(user.departamento || "");
  const uSector = norm(user.setor || user.reparticao || "");
  const isUserDCC = roles.isDCC;

  const tDept = norm(targetDept || "");
  const tSector = norm(targetSector || "");

  const isDCCArea = 
    tDept.includes("dcc") || 
    tDept.includes("curso") ||
    tSector.includes("dcc") || 
    tSector.includes("curso");

  // "o plano do dcc, nunca deve ser visto por outros departamentos"
  if (isDCCArea && !isUserDCC) {
    return false;
  }

  // Se o utilizador é de uma Direção (ex: CIE, DICOSAFA) e o alvo é de outra Direção
  if (uDir && targetDir) {
    if (!isUnitBelongsToDirection(targetDir, uDir) && !isDepartmentMatch(uDir, targetDir)) {
      return false;
    }
  }

  // "cada departamento e unico, e independente"
  if (uDept && tDept) {
    if (!isDepartmentMatch(uDept, tDept)) {
      return false; // Departamentos diferentes nunca cruzam dados
    }
  }

  if (uSector && tSector) {
    if (!isDepartmentMatch(uSector, tSector)) {
      return false; // Setores diferentes dentro do departamento também não se cruzam
    }
  }

  return true;
};

/**
 * Filters activities based on user permissions.
 * O DPEP (DEPARTAMENTO DE PLANIFICAÇÃO ESTUDOS E PROJETOS), DIREÇÃO CENTRAL (DG/DC) E ADMINS TÊM ACESSO TOTAL SOBERANO SEM RESTRIÇÕES A TODOS OS PLANOS EM TEMPO REAL.
 * FORA DISSO, CADA ORÇAMENTO É MANTIDO STRICTAMENTE NO SEU SETOR/DEPARTAMENTO PLANIFICADO.
 */
export const getAuthorizedActivities = (activities: any[], user: any) => {
  if (!activities) return [];
  if (!user) return activities;

  const roles = getRoles(user.title || user.cargo || user.cargoChefia || user.role || "");
  const role = (user.role || "").toLowerCase();

  const isSysAdmin =
    role === "admin" ||
    role === "administrador" ||
    role === "administrador do sistema" ||
    role === "proprietario" ||
    user.isOwner === true;

  // Órgão Máximo de Planificação e Direção Geral (Diretor Geral, SuperBoss, Admin, DPEP)
  // Eles possuem acesso soberano institucional. Diretores de Direção/Departamentos vêem estritamente o seu setor.
  if (isSysAdmin || roles.isDG || isSuperBossUser(user) || isDPEPUser(user)) {
    return activities;
  }

  const uEmail = String(user.email || "").toLowerCase();
  const uId = user.uid || user.id;

  const norm = (s: string) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ (departamento|depto|dep|reparticao|rep|setor|direcao|direccao|curso|divisao|unidade|de|do|da|dos|das) /g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const uDir = user.direcao || user.orgao || user.title || user.cargoChefia || "";
  const uDept = user.departamento || "";
  const uDeptNorm = norm(uDept);
  const uSetorNorm = norm(user.setor || user.reparticao || "");
  const uCursoNorm = norm(user.curso || "");

  const isUserDCC = roles.isDCC;

  return activities.filter((a) => {
    if (!a) return false;

    // O criador da atividade sempre pode visualizar a sua própria atividade
    const creator = String(a.createdBy || a.emailCriador || "").toLowerCase();
    if ((creator && creator === uEmail) || (a.userId && uId && a.userId === uId)) {
      return true;
    }

    const aDir = a.direcao || a.orgao || a.unidadeOrganica || "";
    const aDept = a.departamento || a.unidade || a.solicitante || a.origem || "";
    const aSector = a.setor || a.reparticao || "";
    const aCurso = a.curso || a.titulo || a.designacao || a.nome || "";

    const aDeptNorm = norm(aDept);
    const aSectorNorm = norm(aSector);
    const aCursoNorm = norm(aCurso);

    // Verificar se a atividade foi explicitamente partilhada com o departamento/setor do utilizador
    const sharedDepts = [
      a.departamentoDestinatario,
      a.paraDepartamento,
      a.destinatario,
      a.orgaoDestinatario,
      a.departamentoDestino,
      ...(Array.isArray(a.destinatarios) ? a.destinatarios : []),
      ...(Array.isArray(a.partilhadoCom) ? a.partilhadoCom : []),
      ...(Array.isArray(a.departamentosDestinatarios) ? a.departamentosDestinatarios : []),
      ...(Array.isArray(a.sharedWith) ? a.sharedWith : []),
    ].map((d) => String(d || "")).filter(Boolean);

    const sharedSectors = [
      a.setorDestinatario,
      a.reparticaoDestinataria,
      a.paraSetor,
      a.setorDestino,
      ...(Array.isArray(a.setoresDestinatarios) ? a.setoresDestinatarios : []),
    ].map((s) => String(s || "")).filter(Boolean);

    if (
      (uDept && sharedDepts.some((d) => isDepartmentMatch(d, uDept))) ||
      (uSetorNorm && sharedSectors.some((s) => isDepartmentMatch(s, uSetorNorm)))
    ) {
      return true;
    }

    const isDCCAct = 
      aDeptNorm.includes("dcc") || 
      aDeptNorm.includes("curso") ||
      aSectorNorm.includes("dcc") || 
      aSectorNorm.includes("curso") ||
      aCursoNorm.includes("dcc") || 
      aCursoNorm.includes("curso");

    // "o plano do dcc, nunca deve ser visto por outros departamentos"
    if (isDCCAct) {
      if (!isUserDCC) {
        return false;
      }
      if (uCursoNorm && aCursoNorm && isDepartmentMatch(uCursoNorm, aCursoNorm)) {
        return true;
      }
      if (uDeptNorm && aDeptNorm && isDepartmentMatch(uDeptNorm, aDeptNorm)) {
        return true;
      }
      return false;
    }

    // "cada departamento e unico, e independente"
    if (uDept && aDept) {
      if (isDepartmentMatch(uDept, aDept)) {
        if (uSetorNorm && aSectorNorm) {
          return isDepartmentMatch(uSetorNorm, aSectorNorm);
        }
        return true;
      }
      return false;
    }

    // Se o utilizador tiver apenas setor/repartição sem departamento
    if (uSetorNorm && aSectorNorm) {
      return isDepartmentMatch(uSetorNorm, aSectorNorm);
    }

    // Se o utilizador pertence a uma Direção/Órgão e a atividade pertence a essa Direção ou a um departamento dessa Direção
    if (uDir) {
      if (aDir && isDepartmentMatch(aDir, uDir)) {
        return true;
      }
      if (aDept && isUnitBelongsToDirection(aDept, uDir)) {
        return true;
      }
    }

    return false;
  });
};

/**
 * Determines the user's primary workspace area for dashboard redirection.
 */
export const getUserWorkspace = (user: any) => {
  if (user.areaDeAfetacao) return user.areaDeAfetacao;
  return (
    user.setor || user.reparticao || user.departamento || user.direcao || ""
  );
};

/**
 * Checks if a user is a boss (Director, Chief, etc.) based on their name/role.
 */
export const isBossUser = (userName: string = "") => {
  const norm = n(userName);
  return (
    norm.includes("chefe") ||
    norm.includes("diretor") ||
    norm.includes("director") ||
    norm.includes("coordenador") ||
    norm.includes("adjunto") ||
    norm.includes("secretaria") ||
    norm.includes("presidente") ||
    norm.includes("proprietario") ||
    norm.includes("administrador") ||
    norm.includes("responsavel") ||
    norm.includes("ugea") ||
    norm.includes("dpep")
  );
};

/**
 * Checks if a user is a Super Boss (Director General or System Admin).
 */
export const isSuperBossUser = (user: any) => {
  if (!user) return false;
  const role = (user.role || "").toLowerCase();
  const title = (user.title || "").toLowerCase();
  const cargo = (user.cargo || "").toLowerCase();
  const cargoChefia = (user.cargoChefia || "").toLowerCase();
  const email = (user.email || "").toLowerCase();
  const normName = n(user.name || "").replace(/\s+/g, "");

  if (
    role === "admin" ||
    role === "administrador" ||
    role === "administrador do sistema" ||
    role === "administrador de sistema" ||
    role === "proprietario" ||
    role === "proprietário" ||
    user.isOwner === true ||
    title === "administrador" ||
    title === "administrador do sistema" ||
    cargo === "administrador" ||
    cargo === "administrador do sistema" ||
    cargoChefia === "administrador" ||
    cargoChefia === "administrador do sistema"
  )
    return true;

  if (
    user.categoria === "Programador e Proprietário do Sistema" ||
    user.categoria === "Proprietário e Programador do Sistema" ||
    user.categoria === "Proprietario E Progrramador Do Sistema" ||
    user.categoria === "Administrador e Proprietário do Sistema" ||
    user.categoria === "Administrador e Proprietario do Sistema" ||
    user.cargo === "Programador e Proprietário do Sistema" ||
    user.cargo === "Administrador e Proprietário do Sistema" ||
    user.cargo === "Administrador e Proprietario do Sistema"
  )
    return true;

  const uNuit = (user.nuit || "").toString();
  if (uNuit === "108164611") return true;

  const lowName = (user.name || user.nome || "").toLowerCase();
  if (lowName.includes("slaiter")) return true;

  return (
    normName.includes("diretorgeral") ||
    normName.includes("diretorsistema") ||
    normName.includes("administradorsistema") ||
    email === "slaitertripas@gmail.com" ||
    user.name === "Administrador Sistema"
  );
};

/**
 * Common role checkers for UI conditional rendering.
 */
export const getRoles = (title: string = "") => {
  const norm = n(title);
  const t = norm.replace(/\s+/g, ""); // Normalized and space-less

  const isDG = t.includes("diretorgeral");
  const isDC =
    t.includes("diretorcentral") ||
    t.includes("diretordadivisao") ||
    t.includes("diretorda") ||
    t.includes("dicosser");
  const isCD =
    t.includes("chefedodepartamento") ||
    t.includes("chefededepartamento") ||
    t.includes("chefedaunidade") ||
    t === "chefedorh" ||
    t === "chefedefinancas" ||
    t === "chefededp" ||
    t === "chefedasg" ||
    t === "chefededtic" ||
    t === "chefededla" ||
    t === "chefededle" ||
    t === "chefededpa" ||
    t === "chefedodra" ||
    t === "chefedodae" ||
    t === "chefesecretariaexecutiva" ||
    t.includes("chefedeinfraestruturaemanutencao") ||
    t === "diretordocurso" ||
    t === "diretordecurso" ||
    t === "DPEP" ||
    t === "chefedoDPEP";
  const isAdjunto = t.includes("adjunto");
  const isCR =
    t.includes("chefedareparticao") ||
    t.includes("chefedereparticao") ||
    t === "diretordocurso" ||
    t === "diretordecurso";

  const isDICOSAFA_Dept =
    t.includes("departamentoderecursoshumanos") ||
    t.includes("departamentodefinancas") ||
    t.includes("departamentodepatrimonio") ||
    t.includes("secretariageral") ||
    t.includes("departamentotic") ||
    t.includes("departamentolardeestudantes") ||
    t.includes("departamentodeproducaoalimentar") ||
    t.includes("unidadegestoraeexecutoradeaquisicoes");

  const isPessoal = t.includes("reparticaodepessoal");

  return {
    isDG,
    isDC,
    isCD,
    isAdjunto,
    isCR,
    isPessoal,
    isDCC:
      t.includes("diretordocurso") ||
      t.includes("diretordoscursos") ||
      t === "diretordecurso",
    isBoss:
      t.includes("chefe") ||
      t.includes("diretor") ||
      t.includes("secretariaexecutiva") ||
      t.includes("adjunto"),
    isConsRep: t.includes("conselhoderepresentantes"),
    isConsAdm: t.includes("conselhoadministrativoedegestao"),
    isConsTec: t.includes("conselhotecnicoedequalidade"),
    isDICOSAFA_Dept,
    isGDG:
      t.includes("chefedo-gdg") ||
      t.includes("gabinetedodiretorgeral") ||
      t.includes("chefedodepartamentodegdg"),
  };
};

export const isPersonnelBoss = (user: any) => {
  if (!user) return false;
  const title =
    user.title || user.cargoChefia || user.cargo || user.reparticao || "";
  const roles = getRoles(title);
  const norm = n(title).replace(/\s+/g, "");
  return (
    (roles.isPessoal && roles.isCR) ||
    norm.includes("chefedereparticaodepessoal")
  );
};

export const isPatrimonioBossOrAdmin = (
  user: any,
  colaboradores?: any[],
  processos?: any[],
) => {
  if (!user) return false;
  if (isSuperBossUser(user)) return true;

  const email = (user.email || "").toLowerCase();
  if (
    email === "slaitertripas@gmail.com"
  )
    return true;
  if (email.includes("gércio.chaibande") || email.includes("gercio.chaibande"))
    return true;

  const name = (user.name || "").toLowerCase();
  if (
    name.includes("gércio") ||
    name.includes("gercio") ||
    name.includes("chaibande")
  )
    return true;

  const role = (user.role || "").toUpperCase();
  const departamento = (user.departamento || "").toUpperCase();
  const cargo = (user.cargo || "").toUpperCase();
  const cargoChefia = (user.cargoChefia || "").toUpperCase();
  const title = (user.title || "").toUpperCase();

  const isPatriText = (str: string) =>
    str.includes("PATRIM") ||
    str.includes("CHEFE DE DP") ||
    str.includes("CHEFE DO DP") ||
    str.includes("CHEFE DE PATRIM") ||
    str.includes("REPARTIÇÃO DE E-PATRI");

  if (
    isPatriText(role) ||
    isPatriText(departamento) ||
    isPatriText(cargo) ||
    isPatriText(cargoChefia) ||
    isPatriText(title)
  ) {
    return true;
  }

  if (colaboradores && colaboradores.length > 0) {
    const colab = colaboradores.find(
      (c) =>
        (c.email &&
          user.email &&
          c.email.toLowerCase() === user.email.toLowerCase()) ||
        (c.nome &&
          user.name &&
          c.nome.toLowerCase() === user.name.toLowerCase()) ||
        (c.nuit && user.nuit && c.nuit === user.nuit),
    );
    if (colab) {
      if (
        (colab.departamento || "").toUpperCase().includes("PATRIM") &&
        (colab.cargo || colab.cargoChefia || "").toUpperCase().includes("CHEFE")
      ) {
        return true;
      }
      if (
        isPatriText((colab.departamento || "").toUpperCase()) ||
        isPatriText((colab.cargo || "").toUpperCase()) ||
        isPatriText((colab.cargoChefia || "").toUpperCase())
      ) {
        return true;
      }
    }
  }

  if (processos && processos.length > 0) {
    const proc = processos.find(
      (p) =>
        (p.email &&
          user.email &&
          p.email.toLowerCase() === user.email.toLowerCase()) ||
        (p.nome &&
          user.name &&
          p.nome.toLowerCase() === user.name.toLowerCase()) ||
        (p.nuit && user.nuit && p.nuit === user.nuit),
    );
    if (proc) {
      if (
        (proc.departamento || "").toUpperCase().includes("PATRIM") &&
        (proc.cargo || proc.cargoChefia || "").toUpperCase().includes("CHEFE")
      ) {
        return true;
      }
      if (
        isPatriText((proc.departamento || "").toUpperCase()) ||
        isPatriText((proc.cargo || "").toUpperCase()) ||
        isPatriText((proc.cargoChefia || "").toUpperCase())
      ) {
        return true;
      }
    }
  }

  return false;
};
