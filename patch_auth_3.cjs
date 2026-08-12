const fs = require('fs');
let content = fs.readFileSync('src/lib/auth.ts', 'utf8');

const oldFuncRegex = /\/\*\*[\s\S]*?Filters activities based on user permissions[\s\S]*?\*\/[\s\S]*?export const getAuthorizedActivities = \([\s\S]*?^};/m;

const newFunc = `/**
 * Filters activities based on user permissions.
 * OS VALORES GERAIS PLANIFICADOS POR DEPARTAMENTOS SÓ PODEM SER VISTOS PELO ÓRGÃO MÁXIMO DA DIREÇÃO (DIRETOR CENTRAL / DG / ADMIN / SUPERBOSS / DPEP).
 * FORA DISSO, CADA ORÇAMENTO É MANTIDO STRICTAMENTE NO SEU SETOR/DEPARTAMENTO PLANIFICADO.
 */
export const getAuthorizedActivities = (activities: any[], user: any) => {
  if (!activities) return [];
  if (!user) return activities;

  if (isSuperBossUser(user)) return activities;

  const roles = getRoles(user.title || user.cargo || user.cargoChefia || user.role || "");
  const role = (user.role || "").toLowerCase();
  const userDeptRaw = String(user.departamento || "").toLowerCase();
  const userRoleRaw = String(user.title || user.cargo || user.role || user.cargoChefia || "").toLowerCase();

  const isSysAdmin =
    role === "admin" ||
    role === "administrador" ||
    role === "administrador do sistema" ||
    role === "proprietario" ||
    user.isOwner === true;

  const isDPEP =
    userDeptRaw.includes("dpep") ||
    userRoleRaw.includes("dpep") ||
    userRoleRaw.includes("planificação geral") ||
    userRoleRaw.includes("chefe do dpep");

  // Órgão Máximo da Direção Central (Diretor Geral, Diretor Central, SuperBoss, Admin, DPEP Geral)
  // ÚNICOS que podem ver e consolidar os orçamentos globais de todos os departamentos.
  if (isSysAdmin || roles.isDG || roles.isDC || isDPEP) {
    return activities;
  }

  // Para todos os outros cargos (Diretor de Curso / DCC, Chefe de Departamento, Chefe de Setor, Docentes, Funcionários):
  // Cada orçamento é mantido estritamente no setor/departamento planificado sem ser disperso ou agrupado com outros.

  const uEmail = String(user.email || "").toLowerCase();
  const uId = user.uid || user.id;

  const norm = (s: string) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\b(departamento|depto|dep|reparticao|rep|setor|direcao|direccao|curso|divisao|unidade|de|do|da|dos|das)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const uDeptNorm = norm(user.departamento || "");
  const uDirNorm = norm(user.direcao || "");
  const uSetorNorm = norm(user.setor || user.reparticao || "");
  const uCursoNorm = norm(user.curso || user.title || user.cargo || user.cargoChefia || "");

  // Detetar se o utilizador pertence à Construção Civil / Engenharia Civil
  const uFullString = (
    String(user.departamento || "") + " " +
    String(user.direcao || "") + " " +
    String(user.setor || user.reparticao || "") + " " +
    String(user.curso || "") + " " +
    String(user.title || user.cargo || user.cargoChefia || "") + " " +
    String(user.areaDeAfetacao || "")
  ).toLowerCase();

  const isCivilUser =
    uFullString.includes("civil") ||
    uFullString.includes("construcao") ||
    uFullString.includes("construção");

  return activities.filter((a) => {
    if (!a) return false;

    // Criador ou ID
    const creator = String(a.createdBy || a.emailCriador || "").toLowerCase();
    if ((creator && creator === uEmail) || (a.userId && uId && a.userId === uId)) return true;

    const aDir = String(a.direcao || a.direccao || a.unidadeOrganica || "").trim();
    const aDept = String(a.departamento || a.unidade || a.orgao || a.solicitante || a.origem || "").trim();
    const aSector = String(a.setor || a.reparticao || "").trim();
    const aCurso = String(a.curso || a.titulo || a.designacao || a.nome || "").trim();

    // GARANTIA TOTAL PARA O DEPARTAMENTO DE CONSTRUÇÃO CIVIL
    if (isCivilUser) {
      const aFullString = (
        aDir + " " + aDept + " " + aSector + " " + aCurso + " " +
        String(a.descricao || "") + " " + String(a.codigo || "") + " " +
        String(a.referencia || "")
      ).toLowerCase();
      if (
        aFullString.includes("civil") ||
        aFullString.includes("construcao") ||
        aFullString.includes("construção")
      ) {
        return true;
      }
    }

    const aDeptNorm = norm(aDept);
    const aDirNorm = norm(aDir);
    const aSectorNorm = norm(aSector);
    const aCursoNorm = norm(aCurso);

    // Se o utilizador tem setor/repartição especificado
    if (uSetorNorm && aSectorNorm) {
      if (aSectorNorm.includes(uSetorNorm) || uSetorNorm.includes(aSectorNorm) || aSectorNorm === uSetorNorm) {
        return true;
      }
    }

    // Se o utilizador tem departamento especificado
    if (uDeptNorm && aDeptNorm) {
      if (aDeptNorm.includes(uDeptNorm) || uDeptNorm.includes(aDeptNorm) || aDeptNorm === uDeptNorm) {
        return true;
      }
    }

    // Se o curso do utilizador / título corresponde
    if (uCursoNorm && (aDeptNorm || aCursoNorm)) {
      if (
        (aDeptNorm && (aDeptNorm.includes(uCursoNorm) || uCursoNorm.includes(aDeptNorm))) ||
        (aCursoNorm && (aCursoNorm.includes(uCursoNorm) || uCursoNorm.includes(aCursoNorm)))
      ) {
        return true;
      }
    }

    // Se a Direção corresponde
    if (uDirNorm && aDirNorm && (aDirNorm.includes(uDirNorm) || uDirNorm.includes(aDirNorm))) {
      // Se a atividade tem departamento e o utilizador tem departamento, garantir que combinam
      if (uDeptNorm && aDeptNorm) {
        return aDeptNorm.includes(uDeptNorm) || uDeptNorm.includes(aDeptNorm);
      }
      return true;
    }

    if (canAccessArea(user, aDir, aDept, aSector)) {
      return true;
    }

    return false;
  });
};`;

if (oldFuncRegex.test(content)) {
  content = content.replace(oldFuncRegex, newFunc);
  fs.writeFileSync('src/lib/auth.ts', content);
  console.log("Updated getAuthorizedActivities in auth.ts successfully!");
} else {
  console.log("Could not match oldFuncRegex in auth.ts");
}
