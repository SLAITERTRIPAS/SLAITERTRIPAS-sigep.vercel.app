const fs = require('fs');
let content = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf8');

// 1. Fix isPlanificacaoOrDPEP
const oldPlan = `  const isPlanificacaoOrDPEP = useMemo(() => {
    if (isSuperBossUser(user)) return true;
    const userDept = String(
      user?.departamento || user?.setor || user?.reparticao || "",
    ).toUpperCase();
    const userRole = String(user?.cargo || user?.role || "").toUpperCase();
    const currentTitle = String(title || "").toUpperCase();
    return (
      userDept.includes("PLANIFICAÇÃO") ||
      userDept.includes("PLANIFICACAO") ||
      userDept.includes("DPEP") ||
      userRole.includes("PLANIFICAÇÃO") ||
      userRole.includes("PLANIFICACAO") ||
      userRole.includes("DPEP") ||
      currentTitle.includes("PLANIFICAÇÃO") ||
      currentTitle.includes("PLANIFICACAO") ||
      currentTitle.includes("DPEP")
    );
  }, [user, title]);`;

const newPlan = `  const isPlanificacaoOrDPEP = useMemo(() => {
    if (isSuperBossUser(user)) return true;
    const userDept = String(
      user?.departamento || user?.setor || user?.reparticao || "",
    ).toUpperCase();
    const userRole = String(
      user?.cargo || user?.title || user?.role || user?.cargoChefia || "",
    ).toUpperCase();

    // Se o departamento do utilizador é um departamento de ensino/unidade orgânica como Construção Civil, NUNCA é planificação institucional global
    if (userDept.includes("ENGENHARIA") || userDept.includes("CONSTRUÇÃO") || userDept.includes("CONSTRUCAO") || userDept.includes("CIVIL")) {
      return false;
    }

    return (
      userDept.includes("DPEP") ||
      userDept.includes("DIREÇÃO DE PLANIFICAÇÃO") ||
      userDept.includes("DIRECAO DE PLANIFICACAO") ||
      userRole.includes("CHEFE DO DPEP") ||
      userRole.includes("DIRETOR DO DPEP") ||
      (userDept.includes("PLANIFICAÇÃO") && !userDept.includes("DEPARTAMENTO"))
    );
  }, [user]);`;

if (content.includes(oldPlan)) {
  content = content.replace(oldPlan, newPlan);
  console.log("Replaced isPlanificacaoOrDPEP successfully!");
} else {
  console.log("Could not find oldPlan");
}

// 2. Fix userDepartamento and useEffect
const oldDeptAndEffect = `  const userDepartamento = useMemo(() => {
    return user?.departamento || title || "Departamento";
  }, [user, title]);

  React.useEffect(() => {
    if (isPlanificacaoOrDPEP || isSuperBossUser(user)) {
      setSelectedLevel("institucional");
      setSelectedUnit("todos");
    } else {
      const roleStr = String(user?.cargo || user?.title || user?.role || user?.cargoChefia || "").toLowerCase();
      const isDirector = roleStr.includes("diretor") || roleStr.includes("director");
      if (isDirector) {
        setSelectedLevel("direcao");
        setSelectedUnit(userDirecao);
      } else if (user?.setor || user?.reparticao) {
        setSelectedLevel("setor");
        setSelectedUnit(user?.setor || user?.reparticao);
      } else {
        setSelectedLevel("departamento");
        setSelectedUnit(userDepartamento);
      }
    }
  }, [title, isPlanificacaoOrDPEP, user, userDirecao, userDepartamento]);`;

const newDeptAndEffect = `  const userDepartamento = useMemo(() => {
    if (user?.departamento) return user.departamento;
    const userRoleStr = String(user?.title || user?.cargo || user?.cargoChefia || "");
    if (userRoleStr.includes("Construção Civil") || userRoleStr.includes("Civil")) {
      return "Departamento de Engenharia de Construção Civil";
    }
    if (title && title !== "Ação Orçamental" && title !== "Orçamento" && title !== "Plano Setorial") {
      return title;
    }
    return "Departamento";
  }, [user, title]);

  const roles = useMemo(() => getRoles(user?.title || user?.cargo || user?.cargoChefia || user?.role || ""), [user]);
  const isCentralDirector = isSuperBossUser(user) || roles.isDG || roles.isDC;

  React.useEffect(() => {
    if (isPlanificacaoOrDPEP || isSuperBossUser(user)) {
      setSelectedLevel("institucional");
      setSelectedUnit("todos");
    } else if (isCentralDirector) {
      setSelectedLevel("direcao");
      setSelectedUnit(userDirecao);
    } else if (user?.setor || user?.reparticao) {
      setSelectedLevel("setor");
      setSelectedUnit(user?.setor || user?.reparticao);
    } else {
      setSelectedLevel("departamento");
      setSelectedUnit(userDepartamento);
    }
  }, [isPlanificacaoOrDPEP, user, isCentralDirector, userDirecao, userDepartamento]);`;

if (content.includes(oldDeptAndEffect)) {
  content = content.replace(oldDeptAndEffect, newDeptAndEffect);
  console.log("Replaced userDepartamento and useEffect successfully!");
} else {
  console.log("Could not find oldDeptAndEffect");
}

// 3. Fix sectorActivities filtering logic
const oldSectorLogic = `      if (isDirector && userDirecao) {
        // Direção: visualiza e consolida o orçamento de todos os departamentos sob a alçada da direção
        baseActivities = baseActivities.filter((act) =>
          isCreator(act) ||
          matchesUnitStr(act.direcao || act.direccao || act.unidadeOrganica, userDirecao) ||
          canAccessArea(user, act.direcao || "", act.departamento || "", act.setor || "")
        );
      }`;

const newSectorLogic = `      if (isCentralDirector && userDirecao) {
        // Direção Central (Diretor Geral / Diretor Central): visualiza e consolida o orçamento da direção
        baseActivities = baseActivities.filter((act) =>
          isCreator(act) ||
          matchesUnitStr(act.direcao || act.direccao || act.unidadeOrganica, userDirecao) ||
          canAccessArea(user, act.direcao || "", act.departamento || "", act.setor || "")
        );
      }`;

if (content.includes(oldSectorLogic)) {
  content = content.replace(oldSectorLogic, newSectorLogic);
  console.log("Replaced sectorActivities isCentralDirector logic successfully!");
} else {
  console.log("Could not find oldSectorLogic");
}

fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', content);
