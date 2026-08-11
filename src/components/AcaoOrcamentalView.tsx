import React, { useState, useMemo, useEffect } from "react";
import { firestoreService } from "../lib/firestoreService";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  Coins,
  PieChart,
  HelpCircle,
  Printer,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InstitutionalHeader } from "./InstitutionalHeader";
import { printElementById } from "../lib/printUtils";
import { UNIDADES_ORGANICAS_SISTEMA, DEPARTAMENTOS } from "../constants/formOptions";
import { isSuperBossUser, canAccessArea, getAuthorizedActivities } from "../lib/auth";

interface AcaoOrcamentalViewProps {
  user: any;
  title: string;
  activities: any[];
  onShowAlert: (msg: string) => void;
  onBack?: () => void;
}

export const OFFICIAL_SISTAFE_RUBRICAS = [
  { code: "112101", name: "Ajuda de custo dentro do país para pessoal civil" },
  { code: "112102", name: "Ajuda de custo fora do país para pessoal civil" },
  { code: "121001", name: "Combustíveis e lubrificantes" },
  { code: "121002", name: "Material para manutenção e reparação de bens imóveis" },
  { code: "121003", name: "Material para manutenção e reparação de bens móveis" },
  { code: "121005", name: "Material de consumo para escritório" },
  { code: "121006", name: "Material duradouro de escritório" },
  { code: "121007", name: "Fardamentos e calçados" },
  { code: "121008", name: "Sobressalentes para equipamentos máquinas e motores" },
  { code: "121009", name: "Medicamentos e apósitos" },
  { code: "121010", name: "Géneros alimentícios" },
  { code: "121011", name: "Material de limpeza e higiene" },
  { code: "121014", name: "Ferramentas de uso duradouro" },
  { code: "121015", name: "Material de consumo para ensino e formação" },
  { code: "121016", name: "Material duradouro para ensino e formação" },
  { code: "121017", name: "Material de consumo para desporto" },
  { code: "121018", name: "Material duradouro para desporto" },
  { code: "121020", name: "Material de representação" },
  { code: "121021", name: "Material de festividades, homenagens e premiação" },
  { code: "121022", name: "Material de consumo para informática" },
  { code: "121023", name: "Material duradouro para informática" },
  { code: "121024", name: "Software de base" },
  { code: "121026", name: "Material de consumo para copa e cozinha" },
  { code: "121027", name: "Material duradouro para copa e cozinha" },
  { code: "121028", name: "Sementes, plantas e insumos" },
  { code: "121029", name: "Material para conservação de estradas e vias" },
  { code: "121030", name: "Bandeiras e flâmulas" },
  { code: "121031", name: "Material para conservação de rede de electrificação" },
  { code: "121032", name: "Material de aplicação restritiva" },
  { code: "121033", name: "Material para aplicação em projectos sociais e assistência social" },
  { code: "121034", name: "Material para conservação de rede de água e esgoto" },
  { code: "121098", name: "Outros bens de consumo" },
  { code: "121099", name: "Outros bens duradouros" },
  { code: "122001", name: "Comunicações em geral" },
  { code: "122002", name: "Passagens dentro do país" },
  { code: "122004", name: "Renda de instalações" },
  { code: "122005", name: "Manutenção e reparação de bens imóveis" },
  { code: "122006", name: "Manutenção e reparação de bens móveis" },
  { code: "122007", name: "Manutenção e reparação de veículos" },
  { code: "122009", name: "Seguros" },
  { code: "122012", name: "Água" },
  { code: "122013", name: "Energia eléctrica" },
  { code: "122021", name: "Limpeza e conservação" },
  { code: "122024", name: "Serviços gráficos" },
  { code: "122099", name: "Outros serviços" },
  { code: "143107", name: "Transferências a comunidade local" },
  { code: "143401", name: "Bolsa de estudos no país" },
  { code: "143499", name: "Outras transferências a famílias" },
];

export function getParentRubrica(rubricaRaw?: string): string {
  const clean = (rubricaRaw || "").trim().toLowerCase();
  const codeMatch = clean.match(/^(\d{2,6})/);
  const code = codeMatch ? codeMatch[1] : "";

  if (code.startsWith("11") || clean.includes("ajuda") || clean.includes("diari") || clean.includes("pessoal")) {
    return "Ajudas de Custo (Capítulo 11)";
  }
  if (code.startsWith("121") || (code.startsWith("12") && !code.startsWith("122")) || clean.includes("material") || clean.includes("bens") || clean.includes("consumo") || clean.includes("duradouro") || clean.includes("combustivel") || clean.includes("generos") || clean.includes("medicament") || clean.includes("escritorio") || clean.includes("fardamento")) {
    return "Bens e Materiais (Capítulo 12.1)";
  }
  if (code.startsWith("122") || clean.includes("servico") || clean.includes("comunicacao") || clean.includes("agua") || clean.includes("energia") || clean.includes("manutencao") || clean.includes("reparacao") || clean.includes("renda") || clean.includes("seguro") || clean.includes("limpeza")) {
    return "Serviços (Capítulo 12.2)";
  }
  if (code.startsWith("143") || clean.includes("bolsa") || clean.includes("transferencia") || clean.includes("comunidade") || clean.includes("familia")) {
    return "Transferências e Subsídios (Capítulo 14)";
  }
  if (clean.includes("salario") || clean.includes("vencimento") || clean.includes("remuneracao")) {
    return "Remunerações do Pessoal";
  }
  return "Outras Despesas de Funcionamento";
}

export function getOfficialRubricaLabel(rubricaRaw?: string, necessidadeRaw?: string): string {
  const rubTrim = (rubricaRaw || "").trim();
  const necTrim = (necessidadeRaw || "").trim();
  const combined = `${rubTrim} ${necTrim}`.trim();
  if (!combined) return "121098 - Outros bens de consumo";

  const lowerCombined = combined.toLowerCase();
  const cleanCombined = lowerCombined.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Procurar código de 6 dígitos oficial nas strings recebidas
  for (const item of OFFICIAL_SISTAFE_RUBRICAS) {
    if (lowerCombined.includes(item.code)) {
      return `${item.code} - ${item.name}`;
    }
  }

  // 2. Procurar correspondência exata ou parcial com o nome oficial da rúbrica
  for (const item of OFFICIAL_SISTAFE_RUBRICAS) {
    const cleanItemName = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (cleanCombined.includes(cleanItemName) || cleanItemName.includes(cleanCombined)) {
      return `${item.code} - ${item.name}`;
    }
  }

  // 3. Mapeamento por palavras-chave oficiais do SISTAFE Moçambique
  if (
    cleanCombined.includes("combust") ||
    cleanCombined.includes("lubrificant") ||
    cleanCombined.includes("gasoleo") ||
    cleanCombined.includes("gasolina") ||
    cleanCombined.includes("combustivel")
  ) {
    return "121001 - Combustíveis e lubrificantes";
  }
  if (cleanCombined.includes("ajuda de custo") && cleanCombined.includes("fora")) {
    return "112102 - Ajuda de custo fora do país para pessoal civil";
  }
  if (
    cleanCombined.includes("ajuda de custo") ||
    cleanCombined.includes("diaria") ||
    cleanCombined.includes("subsidio de viagem")
  ) {
    return "112101 - Ajuda de custo dentro do país para pessoal civil";
  }
  if (
    cleanCombined.includes("manutencao de bens imoveis") ||
    cleanCombined.includes("reparacao de bens imoveis") ||
    cleanCombined.includes("edificio") ||
    cleanCombined.includes("obra")
  ) {
    return "121002 - Material para manutenção e reparação de bens imóveis";
  }
  if (
    cleanCombined.includes("manutencao de bens moveis") ||
    cleanCombined.includes("reparacao de bens moveis")
  ) {
    return "121003 - Material para manutenção e reparação de bens móveis";
  }
  if (
    cleanCombined.includes("escritorio") ||
    cleanCombined.includes("resma") ||
    cleanCombined.includes("papel") ||
    cleanCombined.includes("caneta") ||
    cleanCombined.includes("pasta") ||
    cleanCombined.includes("esferografica")
  ) {
    return "121005 - Material de consumo para escritório";
  }
  if (
    cleanCombined.includes("duradouro de escritorio") ||
    cleanCombined.includes("mesa") ||
    cleanCombined.includes("cadeira") ||
    cleanCombined.includes("armario")
  ) {
    return "121006 - Material duradouro de escritório";
  }
  if (
    cleanCombined.includes("fardamento") ||
    cleanCombined.includes("calcado") ||
    cleanCombined.includes("vestuario") ||
    cleanCombined.includes("uniforme")
  ) {
    return "121007 - Fardamentos e calçados";
  }
  if (
    cleanCombined.includes("sobressalente") ||
    cleanCombined.includes("peca") ||
    cleanCombined.includes("motor")
  ) {
    return "121008 - Sobressalentes para equipamentos máquinas e motores";
  }
  if (
    cleanCombined.includes("medicamento") ||
    cleanCombined.includes("saude") ||
    cleanCombined.includes("aposito") ||
    cleanCombined.includes("farmacia")
  ) {
    return "121009 - Medicamentos e apósitos";
  }
  if (
    cleanCombined.includes("generos alimenticios") ||
    cleanCombined.includes("alimento") ||
    cleanCombined.includes("lanche") ||
    cleanCombined.includes("refeicao") ||
    cleanCombined.includes("agua mineral") ||
    cleanCombined.includes("catering")
  ) {
    return "121010 - Géneros alimentícios";
  }
  if (
    cleanCombined.includes("limpeza") ||
    cleanCombined.includes("higiene") ||
    cleanCombined.includes("detergente") ||
    cleanCombined.includes("sabao")
  ) {
    return "121011 - Material de limpeza e higiene";
  }
  if (cleanCombined.includes("ferramenta")) {
    return "121014 - Ferramentas de uso duradouro";
  }
  if (
    cleanCombined.includes("ensino") ||
    cleanCombined.includes("formacao") ||
    cleanCombined.includes("pedagogico") ||
    cleanCombined.includes("modulo")
  ) {
    return "121015 - Material de consumo para ensino e formação";
  }
  if (
    cleanCombined.includes("desporto") ||
    cleanCombined.includes("esporte") ||
    cleanCombined.includes("bola")
  ) {
    return "121018 - Material duradouro para desporto";
  }
  if (
    cleanCombined.includes("consumo para informatica") ||
    cleanCombined.includes("toner") ||
    cleanCombined.includes("tinteiro") ||
    cleanCombined.includes("cartucho")
  ) {
    return "121022 - Material de consumo para informática";
  }
  if (
    cleanCombined.includes("computador") ||
    cleanCombined.includes("laptop") ||
    cleanCombined.includes("impressora") ||
    cleanCombined.includes("servidor")
  ) {
    return "121023 - Material duradouro para informática";
  }
  if (cleanCombined.includes("software") || cleanCombined.includes("licenca")) {
    return "121024 - Software de base";
  }
  if (
    cleanCombined.includes("copa") ||
    cleanCombined.includes("cozinha") ||
    cleanCombined.includes("cha") ||
    cleanCombined.includes("cafe")
  ) {
    return "121026 - Material de consumo para copa e cozinha";
  }
  if (
    cleanCombined.includes("semente") ||
    cleanCombined.includes("planta") ||
    cleanCombined.includes("insumo") ||
    cleanCombined.includes("adubo")
  ) {
    return "121028 - Sementes, plantas e insumos";
  }
  if (
    cleanCombined.includes("comunicacao") ||
    cleanCombined.includes("telefone") ||
    cleanCombined.includes("internet") ||
    cleanCombined.includes("credito") ||
    cleanCombined.includes("recarga")
  ) {
    return "122001 - Comunicações em geral";
  }
  if (
    cleanCombined.includes("passagem") ||
    cleanCombined.includes("transporte") ||
    cleanCombined.includes("viagem") ||
    cleanCombined.includes("bilhete")
  ) {
    return "122002 - Passagens dentro do país";
  }
  if (
    cleanCombined.includes("renda") ||
    cleanCombined.includes("aluguel") ||
    cleanCombined.includes("locacao")
  ) {
    return "122004 - Renda de instalações";
  }
  if (
    cleanCombined.includes("reparacao de veiculo") ||
    cleanCombined.includes("manutencao de veiculo") ||
    cleanCombined.includes("oficina") ||
    cleanCombined.includes("pneu")
  ) {
    return "122007 - Manutenção e reparação de veículos";
  }
  if (cleanCombined.includes("seguro")) {
    return "122009 - Seguros";
  }
  if (cleanCombined.includes("agua")) {
    return "122012 - Água";
  }
  if (
    cleanCombined.includes("energia") ||
    cleanCombined.includes("eletrica") ||
    cleanCombined.includes("electrica") ||
    cleanCombined.includes("credelec")
  ) {
    return "122013 - Energia eléctrica";
  }
  if (
    cleanCombined.includes("servicos graficos") ||
    cleanCombined.includes("impressao") ||
    cleanCombined.includes("banner") ||
    cleanCombined.includes("encadernacao")
  ) {
    return "122024 - Serviços gráficos";
  }
  if (cleanCombined.includes("comunidade")) {
    return "143107 - Transferências a comunidade local";
  }
  if (cleanCombined.includes("bolsa")) {
    return "143401 - Bolsa de estudos no país";
  }
  if (cleanCombined.includes("familia")) {
    return "143499 - Outras transferências a famílias";
  }
  if (cleanCombined.includes("servico") || cleanCombined.includes("consultoria")) {
    return "122099 - Outros serviços";
  }
  if (
    cleanCombined.includes("bens") ||
    cleanCombined.includes("material") ||
    cleanCombined.includes("consumo")
  ) {
    return "121098 - Outros bens de consumo";
  }

  if (rubTrim) {
    return rubTrim;
  }

  return "121098 - Outros bens de consumo";
}

const normalizeStr = (str?: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(departamento|depto|dep|reparticao|rep|setor|direcao|direccao|de|do|da|dos|das)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const matchesUnitStr = (actVal?: string, targetVal?: string): boolean => {
  if (!targetVal || targetVal === "todos") return true;
  if (!actVal) return false;
  const rawA = actVal.toLowerCase().trim();
  const rawT = targetVal.toLowerCase().trim();
  if (rawA.includes(rawT) || rawT.includes(rawA)) return true;

  // RH / Recursos Humanos / Gestão de Pessoal aliases matching
  const isTargetRH =
    rawT.includes("pessoal") ||
    rawT.includes("recursos humanos") ||
    rawT === "rh" ||
    rawT === "drh" ||
    rawT.includes("gestao de pessoal");
  const isActRH =
    rawA.includes("pessoal") ||
    rawA.includes("recursos humanos") ||
    rawA === "rh" ||
    rawA === "drh" ||
    rawA.includes("gestao de pessoal");

  if (isTargetRH && isActRH) return true;

  const normA = normalizeStr(actVal);
  const normT = normalizeStr(targetVal);
  if (!normA || !normT) return false;
  return normA.includes(normT) || normT.includes(normA);
};

const matchesDeptStr = (actVal?: string, targetVal?: string): boolean => {
  if (!targetVal || targetVal === "todos") return true;
  if (!actVal) return false;
  const normA = normalizeStr(actVal);
  const normT = normalizeStr(targetVal);
  if (!normA || !normT) return false;
  return normA === normT;
};

export default function AcaoOrcamentalView({
  user,
  title,
  activities,
  onShowAlert,
  onBack,
}: AcaoOrcamentalViewProps) {
  const [activeTab, setActiveTab] = useState<
    "rubricas" | "overview" | "reforco"
  >("rubricas");

  const [selectedLevel, setSelectedLevel] = useState<
    "institucional" | "direcao" | "departamento" | "reparticao" | "setor"
  >("institucional");
  const [selectedUnit, setSelectedUnit] = useState<string>("todos");

  const isPlanificacaoOrDPEP = useMemo(() => {
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
  }, [user, title]);

  // Extrair unidades organizacionais por nível
  const levelUnits = useMemo(() => {
    const direcoes = new Set<string>();
    const departamentos = new Set<string>();
    const reparticoes = new Set<string>();
    const setores = new Set<string>();

    activities.forEach((act) => {
      const d = act.direcao || act.direccao || act.unidadeOrganica;
      if (d && typeof d === "string" && d.trim()) direcoes.add(d.trim());

      const dep = act.departamento || act.unidadeOrganica || act.orgao || act.solicitante || act.unidade || act.origem;
      if (dep && typeof dep === "string" && dep.trim()) departamentos.add(dep.trim());

      const rep = act.reparticao;
      if (rep && typeof rep === "string" && rep.trim()) reparticoes.add(rep.trim());

      const set = act.setor;
      if (set && typeof set === "string" && set.trim()) setores.add(set.trim());
    });

    if (title && typeof title === "string" && title.trim()) {
      departamentos.add(title.trim());
      setores.add(title.trim());
    }
    if (user?.departamento) departamentos.add(user.departamento.trim());
    if (user?.direcao) direcoes.add(user.direcao.trim());
    if (user?.reparticao) reparticoes.add(user.reparticao.trim());
    if (user?.setor) setores.add(user.setor.trim());

    // Para o setor de planificação, garantir que todas as direções oficiais apareçam no dropbox
    if (isPlanificacaoOrDPEP) {
      UNIDADES_ORGANICAS_SISTEMA.forEach(u => {
        u.direcoes.forEach(d => direcoes.add(d));
      });
    }

    return {
      direcao: Array.from(direcoes).sort(),
      departamento: Array.from(departamentos).sort(),
      reparticao: Array.from(reparticoes).sort(),
      setor: Array.from(setores).sort(),
    };
  }, [activities, title, user, isPlanificacaoOrDPEP]);

  const userDirecao = useMemo(() => {
    if (user?.direcao) return user.direcao;
    const dept = user?.departamento || title || "";
    for (const u of UNIDADES_ORGANICAS_SISTEMA) {
      for (const d of u.direcoes) {
        if (d.toLowerCase() === dept.toLowerCase() || (DEPARTAMENTOS[d] && DEPARTAMENTOS[d].some(x => x.toLowerCase() === dept.toLowerCase()))) {
          return d;
        }
      }
    }
    return user?.direcao || "DICOSSER";
  }, [user, title]);

  const userDepartamento = useMemo(() => {
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
      } else {
        setSelectedLevel("departamento");
        setSelectedUnit(userDepartamento);
      }
    }
  }, [title, isPlanificacaoOrDPEP, user, userDirecao, userDepartamento]);

  // Resetar a unidade selecionada quando muda o nível
  const handleLevelChange = (
    lvl: "institucional" | "direcao" | "departamento" | "reparticao" | "setor"
  ) => {
    if (!isPlanificacaoOrDPEP) return; // Apenas o setor de planificação pode alterar o nível
    setSelectedLevel(lvl);
    setSelectedUnit("todos");
  };

  // Filtrar atividades conforme o Nível Estrutural e a Unidade Selecionada
  const sectorActivities = useMemo(() => {
    let baseActivities = activities;

    // Se o utilizador não for da Planificação / DPEP, restringe à sua área (Departamento estrito ou Direção)
    if (!isPlanificacaoOrDPEP) {
      const roleStr = String(user?.cargo || user?.title || user?.role || user?.cargoChefia || "").toLowerCase();
      const isDirector = roleStr.includes("diretor") || roleStr.includes("director");

      // STRICT AUTHORIZATION ENFORCEMENT FIRST
      // This ensures a department cannot see another department's budget
      baseActivities = getAuthorizedActivities(activities, user);

      if (isDirector && userDirecao) {
        // Direção: visualiza e consolida o orçamento de todos os departamentos sob a alçada da direção
        baseActivities = baseActivities.filter((act) =>
          matchesUnitStr(act.direcao || act.direccao || act.unidadeOrganica, userDirecao) ||
          canAccessArea(user, act.direcao || "", act.departamento || "", act.setor || "")
        );
      } else if (userDepartamento) {
        // Cada Departamento possui orçamento próprio (soma isolada das suas atividades)
        baseActivities = baseActivities.filter((act) =>
          matchesDeptStr(act.departamento, userDepartamento) ||
          (!act.departamento && (
            matchesDeptStr(act.solicitante, userDepartamento) ||
            matchesDeptStr(act.unidade, userDepartamento) ||
            matchesDeptStr(act.orgao, userDepartamento)
          ))
        );
      }
    }

    if (selectedLevel === "institucional") {
      return baseActivities;
    }

    if (selectedUnit === "todos") {
      return baseActivities.filter((act) => {
        if (selectedLevel === "direcao") {
          return !!(act.direcao || act.direccao || act.unidadeOrganica);
        }
        if (selectedLevel === "departamento") {
          return !!act.departamento;
        }
        if (selectedLevel === "reparticao") {
          return !!act.reparticao;
        }
        if (selectedLevel === "setor") {
          return !!act.setor;
        }
        return true;
      });
    }

    return baseActivities.filter((act) => {
      if (selectedLevel === "direcao") {
        return matchesUnitStr(act.direcao || act.direccao || act.unidadeOrganica, selectedUnit);
      }
      if (selectedLevel === "departamento") {
        if (act.departamento) {
          return matchesDeptStr(act.departamento, selectedUnit);
        }
        return (
          matchesDeptStr(act.solicitante, selectedUnit) ||
          matchesDeptStr(act.unidade, selectedUnit) ||
          matchesDeptStr(act.origem, selectedUnit) ||
          matchesDeptStr(act.orgao, selectedUnit)
        );
      }
      if (selectedLevel === "reparticao") {
        return matchesUnitStr(act.reparticao, selectedUnit);
      }
      if (selectedLevel === "setor") {
        return matchesUnitStr(act.setor, selectedUnit);
      }

      return matchesUnitStr(act.departamento, selectedUnit);
    });
  }, [activities, selectedLevel, selectedUnit, isPlanificacaoOrDPEP, user, userDirecao, userDepartamento]);

  // Total Geral do valor de todas as atividades planificadas (Orçamento do Nível/Departamento)
  const totalOrcamentadoSetor = useMemo(() => {
    return sectorActivities.reduce((sum, act) => {
      let actVal = 0;
      let hasRub = false;

      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        const rSum = act.rubricas.reduce(
          (acc: number, r: any) =>
            acc + Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0),
          0
        );
        if (rSum > 0) {
          actVal += rSum;
          hasRub = true;
        }
      }

      // Apenas considera o valor das rubricas explicitamente planificadas
      if (!hasRub) {
        actVal += Number(
          act.valor ||
            act.orcamentoTotal ||
            act.valorTotal ||
            act.orcamento ||
            act.custoTotal ||
            0
        );
      }
      return sum + actVal;
    }, 0);
  }, [sectorActivities]);

  // Coletânea completa e agrupamento detalhado por Rúbricas e Necessidades
  const rubricasBreakdown = useMemo(() => {
    const rubricaMap: {
      [rubricaName: string]: {
        rubricaName: string;
        totalValorRubrica: number;
        necessidadesMap: {
          [necKey: string]: {
            necessidadeName: string;
            nomeProduto?: string;
            quantidadeTotal: number;
            valorTotalNecessidade: number;
            atividadesCount: number;
            precoUnitario?: number;
            especificacao?: string;
          };
        };
      };
    } = {};

    sectorActivities.forEach((act) => {
      let hasProcessedRubrica = false;

      // 1. Array de rúbricas cadastrado (Apenas produtos/itens expressamente planificados no plano de atividade)
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const rawRub = (
            r.rubrica ||
            r.nomeRubrica ||
            r.code ||
            r.categoria ||
            "Outras Despesas / Geral"
          ).trim();
          const necessidadeStr = (
            r.necessidade ||
            r.descricao ||
            r.nomeProduto ||
            r.item ||
            r.name ||
            act.designacao ||
            act.title ||
            "Necessidade Geral"
          ).trim();
          const rubricaStr = getOfficialRubricaLabel(rawRub, necessidadeStr);
          const prodName = String(r.nomeProduto || r.especificacao || r.produto || r.item || "").trim();
          const qty = Number(r.quantidade || r.qtd || 1);
          const val = Number(
            r.valorTotal || r.total || r.valor || r.precoTotal || r.custo || 0
          );
          const pUnit = Number(r.precoUnitario || r.preco || (qty > 0 ? val / qty : 0));

          if (val >= 0 || qty >= 0) {
            hasProcessedRubrica = true;
            if (!rubricaMap[rubricaStr]) {
              rubricaMap[rubricaStr] = {
                rubricaName: rubricaStr,
                totalValorRubrica: 0,
                necessidadesMap: {},
              };
            }
            rubricaMap[rubricaStr].totalValorRubrica += val;

            const necKey = `${necessidadeStr}${prodName ? ` - [Produto: ${prodName}]` : ""}`;
            if (!rubricaMap[rubricaStr].necessidadesMap[necKey]) {
              rubricaMap[rubricaStr].necessidadesMap[necKey] = {
                necessidadeName: necessidadeStr,
                nomeProduto: prodName,
                quantidadeTotal: 0,
                valorTotalNecessidade: 0,
                atividadesCount: 0,
                precoUnitario: pUnit,
                especificacao: r.especificacao || "",
              };
            }
            rubricaMap[rubricaStr].necessidadesMap[necKey].quantidadeTotal += qty;
            rubricaMap[rubricaStr].necessidadesMap[necKey].valorTotalNecessidade += val;
            rubricaMap[rubricaStr].necessidadesMap[necKey].atividadesCount += 1;
          }
        });
      }

      // 3. Fallback para atividades que têm orçamento planificado no plano de atividades mas sem array de rubricas detalhado
      if (!hasProcessedRubrica) {
        const val = Number(
          act.valor ||
            act.orcamentoTotal ||
            act.valorTotal ||
            act.orcamento ||
            act.custoTotal ||
            0
        );
        if (val > 0) {
          const rawRub = (
            act.rubrica ||
            act.categoria ||
            "Despesas Gerais de Funcionamento"
          ).trim();
          const necessidadeStr = (
            act.necessidade ||
            act.designacao ||
            act.title ||
            "Atividade Planificada"
          ).trim();
          const rubricaStr = getOfficialRubricaLabel(rawRub, necessidadeStr);
          const qty = Number(act.quantidade || act.qtd || 1);

          if (!rubricaMap[rubricaStr]) {
            rubricaMap[rubricaStr] = {
              rubricaName: rubricaStr,
              totalValorRubrica: 0,
              necessidadesMap: {},
            };
          }
          rubricaMap[rubricaStr].totalValorRubrica += val;

          if (!rubricaMap[rubricaStr].necessidadesMap[necessidadeStr]) {
            rubricaMap[rubricaStr].necessidadesMap[necessidadeStr] = {
              necessidadeName: necessidadeStr,
              quantidadeTotal: 0,
              valorTotalNecessidade: 0,
              atividadesCount: 0,
            };
          }
          rubricaMap[rubricaStr].necessidadesMap[necessidadeStr].quantidadeTotal += qty;
          rubricaMap[rubricaStr].necessidadesMap[necessidadeStr].valorTotalNecessidade += val;
          rubricaMap[rubricaStr].necessidadesMap[necessidadeStr].atividadesCount += 1;
        }
      }
    });

    return Object.values(rubricaMap)
      .map((rub) => ({
        ...rub,
        necessidadesList: Object.values(rub.necessidadesMap).sort(
          (a, b) => b.valorTotalNecessidade - a.valorTotalNecessidade
        ),
      }))
      .sort((a, b) => b.totalValorRubrica - a.totalValorRubrica);
  }, [sectorActivities]);

  const parentRubricasBreakdown = useMemo(() => {
    const parentMap: {
      [parentName: string]: {
        parentName: string;
        totalValor: number;
        itemsCount: number;
      };
    } = {};

    sectorActivities.forEach((act) => {
      let processed = false;
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const rawRub = (r.rubrica || r.nomeRubrica || r.code || r.categoria || act.rubrica || "Geral").trim();
          const parent = getParentRubrica(rawRub);
          const val = Number(r.valorTotal || r.total || r.valor || r.precoTotal || r.custo || 0);
          processed = true;

          if (!parentMap[parent]) {
            parentMap[parent] = { parentName: parent, totalValor: 0, itemsCount: 0 };
          }
          parentMap[parent].totalValor += val;
          parentMap[parent].itemsCount += 1;
        });
      }
      if (!processed) {
        const val = Number(act.valor || act.orcamentoTotal || act.valorTotal || act.orcamento || act.custoTotal || 0);
        if (val > 0) {
          const rawRub = (act.rubrica || act.categoria || "Outras Despesas").trim();
          const parent = getParentRubrica(rawRub);
          if (!parentMap[parent]) {
            parentMap[parent] = { parentName: parent, totalValor: 0, itemsCount: 0 };
          }
          parentMap[parent].totalValor += val;
          parentMap[parent].itemsCount += 1;
        }
      }
    });

    return Object.values(parentMap).sort((a, b) => b.totalValor - a.totalValor);
  }, [sectorActivities]);

  // Extrair rubricas, necessidades e valores de forma agregada
  const aggregatedRubricasAndNeeds = useMemo(() => {
    const map: {
      [key: string]: { rubrica: string; necessidade: string; valor: number };
    } = {};

    sectorActivities.forEach((act) => {
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const rubricaStr = (r.rubrica || r.code || "Diversos / Geral").trim();
          const necessidadeStr = (
            r.necessidade ||
            r.descricao ||
            r.name ||
            act.designacao ||
            act.title ||
            "Sem Descrição"
          ).trim();
          const valorNum = Number(r.valorTotal || r.total || r.valor || 0);

          const key = `${rubricaStr}-${necessidadeStr}`;
          if (!map[key]) {
            map[key] = {
              rubrica: rubricaStr,
              necessidade: necessidadeStr,
              valor: 0,
            };
          }
          map[key].valor += valorNum;
        });
      } else {
        // Fallback caso não possua a estrutura de rubricas
        const rubricaStr = (act.rubrica || "Diversos / Geral").trim();
        const necessidadeStr = (
          act.designacao ||
          act.necessidade ||
          act.title ||
          "Necessidade Geral"
        ).trim();
        const valorNum = Number(act.valor || act.orcamentoTotal || 0);

        const key = `${rubricaStr}-${necessidadeStr}`;
        if (!map[key]) {
          map[key] = {
            rubrica: rubricaStr,
            necessidade: necessidadeStr,
            valor: 0,
          };
        }
        map[key].valor += valorNum;
      }
    });

    return Object.values(map).sort((a, b) => b.valor - a.valor);
  }, [sectorActivities]);

  const totalValue = useMemo(() => {
    return aggregatedRubricasAndNeeds.reduce(
      (sum, item) => sum + item.valor,
      0,
    );
  }, [aggregatedRubricasAndNeeds]);

  // Pivot table calculations for rubricas and necessities
  const pivotTableData = useMemo(() => {
    const categories: {
      [key: string]: {
        label: string;
        items: { [key: string]: { label: string; qty: number; value: number } };
        blankQty: number;
        blankValue: number;
        totalQty: number;
        totalValue: number;
      };
    } = {
      SALARIO_REMUNERACOES: {
        label: "SALÁRIO E REMUNERAÇÕES",
        items: {
          "CORPO DOCENTE EFETIVO": {
            label: "CORPO DOCENTE EFETIVO",
            qty: 0,
            value: 0,
          },
          "CORPO DOCENTE CONTRATADO": {
            label: "CORPO DOCENTE CONTRATADO",
            qty: 0,
            value: 0,
          },
          "CTA EFETIVO": { label: "CTA EFETIVO", qty: 0, value: 0 },
          "CTA CONTRATADO": { label: "CTA CONTRATADO", qty: 0, value: 0 },
        },
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
      BENS_121: {
        label: "BENS_121",
        items: {},
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
      DEMAIS_DESPESAS_COM_O_PESSOAL_112: {
        label: "DEMAIS_DESPESAS_COM_O_PESSOAL_112",
        items: {},
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
      DEMAIS_TRANFERÊNCIAS_A_FAMÍLIAS_1434: {
        label: "DEMAIS_TRANFERÊNCIAS_A_FAMÍLIAS_1434",
        items: {},
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
      SERVIÇOS_122: {
        label: "SERVIÇOS_122",
        items: {},
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
      OUTRAS_DESPESAS: {
        label: "OUTRAS DESPESAS / AJUDAS DE CUSTO",
        items: {},
        blankQty: 0,
        blankValue: 0,
        totalQty: 0,
        totalValue: 0,
      },
    };

    sectorActivities.forEach((act) => {
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const rub = String(r.rubrica || r.code || "").trim();
          const nec = String(
            r.necessidade ||
              r.descricao ||
              r.name ||
              act.designacao ||
              act.title ||
              "",
          ).trim();
          const val = Number(r.valorTotal || r.total || r.valor || 0);
          const qty = Number(r.quantidade || r.qtd || 1);

          let catKey = "OUTRAS_DESPESAS";
          let overrideItemKey: string | null = null;
          const combinedText = `${rub} ${nec}`.toUpperCase();

          if (
            combinedText.includes("DOCENTE EFETIVO") ||
            combinedText.includes("PROFESSOR EFETIVO") ||
            (combinedText.includes("DOCENTE") &&
              combinedText.includes("EFETIVO"))
          ) {
            catKey = "SALARIO_REMUNERACOES";
            overrideItemKey = "CORPO DOCENTE EFETIVO";
          } else if (
            combinedText.includes("DOCENTE CONTRATADO") ||
            combinedText.includes("PROFESSOR CONTRATADO") ||
            (combinedText.includes("DOCENTE") &&
              combinedText.includes("CONTRATADO"))
          ) {
            catKey = "SALARIO_REMUNERACOES";
            overrideItemKey = "CORPO DOCENTE CONTRATADO";
          } else if (
            combinedText.includes("CTA EFETIVO") ||
            combinedText.includes("TÉCNICO EFETIVO") ||
            combinedText.includes("TECNICO EFETIVO") ||
            (combinedText.includes("CTA") && combinedText.includes("EFETIVO"))
          ) {
            catKey = "SALARIO_REMUNERACOES";
            overrideItemKey = "CTA EFETIVO";
          } else if (
            combinedText.includes("CTA CONTRATADO") ||
            combinedText.includes("TÉCNICO CONTRATADO") ||
            combinedText.includes("TECNICO CONTRATADO") ||
            (combinedText.includes("CTA") &&
              combinedText.includes("CONTRATADO"))
          ) {
            catKey = "SALARIO_REMUNERACOES";
            overrideItemKey = "CTA CONTRATADO";
          } else if (
            combinedText.includes("121") ||
            combinedText.includes("BENS")
          ) {
            catKey = "BENS_121";
          } else if (
            combinedText.includes("112") ||
            combinedText.includes("PESSOAL") ||
            combinedText.includes("SALARIO") ||
            combinedText.includes("SALÁRIO") ||
            combinedText.includes("REMUNERAÇÃO") ||
            combinedText.includes("REMUNERACAO")
          ) {
            catKey = "SALARIO_REMUNERACOES";
          } else if (
            combinedText.includes("143") ||
            combinedText.includes("131") ||
            combinedText.includes("FAMÍLIA") ||
            combinedText.includes("FAMILIA") ||
            combinedText.includes("TRANSFERÊNCIA") ||
            combinedText.includes("TRANSFERENCIA")
          ) {
            catKey = "DEMAIS_TRANFERÊNCIAS_A_FAMÍLIAS_1434";
          } else if (
            combinedText.includes("122") ||
            combinedText.includes("SERVIÇOS") ||
            combinedText.includes("SERVICOS") ||
            combinedText.includes("SERVIÇO") ||
            combinedText.includes("SERVICO")
          ) {
            catKey = "SERVIÇOS_122";
          }

          if (catKey) {
            const itemKey =
              overrideItemKey || nec || rub || "Outra Necessidade";
            if (!categories[catKey].items[itemKey]) {
              categories[catKey].items[itemKey] = {
                label: itemKey,
                qty: 0,
                value: 0,
              };
            }
            categories[catKey].items[itemKey].qty += qty;
            categories[catKey].items[itemKey].value += val;
            categories[catKey].totalQty += qty;
            categories[catKey].totalValue += val;
          }
        });
      } else {
        const rub = String(act.rubrica || "").trim();
        const nec = String(
          act.designacao || act.necessidade || act.title || "",
        ).trim();
        const val = Number(act.valor || act.orcamentoTotal || 0);
        const qty = Number(act.quantidade || act.qtd || 1);

        let catKey = "OUTRAS_DESPESAS";
        let overrideItemKey: string | null = null;
        const combinedText = `${rub} ${nec}`.toUpperCase();

        if (
          combinedText.includes("DOCENTE EFETIVO") ||
          combinedText.includes("PROFESSOR EFETIVO") ||
          (combinedText.includes("DOCENTE") && combinedText.includes("EFETIVO"))
        ) {
          catKey = "SALARIO_REMUNERACOES";
          overrideItemKey = "CORPO DOCENTE EFETIVO";
        } else if (
          combinedText.includes("DOCENTE CONTRATADO") ||
          combinedText.includes("PROFESSOR CONTRATADO") ||
          (combinedText.includes("DOCENTE") &&
            combinedText.includes("CONTRATADO"))
        ) {
          catKey = "SALARIO_REMUNERACOES";
          overrideItemKey = "CORPO DOCENTE CONTRATADO";
        } else if (
          combinedText.includes("CTA EFETIVO") ||
          combinedText.includes("TÉCNICO EFETIVO") ||
          combinedText.includes("TECNICO EFETIVO") ||
          (combinedText.includes("CTA") && combinedText.includes("EFETIVO"))
        ) {
          catKey = "SALARIO_REMUNERACOES";
          overrideItemKey = "CTA EFETIVO";
        } else if (
          combinedText.includes("CTA CONTRATADO") ||
          combinedText.includes("TÉCNICO CONTRATADO") ||
          combinedText.includes("TECNICO CONTRATADO") ||
          (combinedText.includes("CTA") && combinedText.includes("CONTRATADO"))
        ) {
          catKey = "SALARIO_REMUNERACOES";
          overrideItemKey = "CTA CONTRATADO";
        } else if (
          combinedText.includes("121") ||
          combinedText.includes("BENS")
        ) {
          catKey = "BENS_121";
        } else if (
          combinedText.includes("112") ||
          combinedText.includes("PESSOAL") ||
          combinedText.includes("SALARIO") ||
          combinedText.includes("SALÁRIO") ||
          combinedText.includes("REMUNERAÇÃO") ||
          combinedText.includes("REMUNERACAO")
        ) {
          catKey = "SALARIO_REMUNERACOES";
        } else if (
          combinedText.includes("143") ||
          combinedText.includes("131") ||
          combinedText.includes("FAMÍLIA") ||
          combinedText.includes("FAMILIA") ||
          combinedText.includes("TRANSFERÊNCIA") ||
          combinedText.includes("TRANSFERENCIA")
        ) {
          catKey = "DEMAIS_TRANFERÊNCIAS_A_FAMÍLIAS_1434";
        } else if (
          combinedText.includes("122") ||
          combinedText.includes("SERVIÇOS") ||
          combinedText.includes("SERVICOS") ||
          combinedText.includes("SERVIÇO") ||
          combinedText.includes("SERVICO")
        ) {
          catKey = "SERVIÇOS_122";
        }

        if (catKey) {
          const itemKey = overrideItemKey || nec || rub || "Necessidade Geral";
          if (!categories[catKey].items[itemKey]) {
            categories[catKey].items[itemKey] = {
              label: itemKey,
              qty: 0,
              value: 0,
            };
          }
          categories[catKey].items[itemKey].qty += qty;
          categories[catKey].items[itemKey].value += val;
          categories[catKey].totalQty += qty;
          categories[catKey].totalValue += val;
        }
      }
    });

    return categories;
  }, [sectorActivities]);

  const grandTotals = useMemo(() => {
    let totalQty = 0;
    let totalValue = 0;
    Object.values(pivotTableData).forEach((g: any) => {
      totalQty += g.totalQty;
      totalValue += g.totalValue;
    });
    return { totalQty, totalValue };
  }, [pivotTableData]);

  // Matriz Tabela Dinâmica Oficial SISTAFE com Códigos de Rúbricas
  const [expandedPivotRows, setExpandedPivotRows] = useState<Record<string, boolean>>({});
  const [showOnlyNonZeroPivot, setShowOnlyNonZeroPivot] = useState<boolean>(true);

  const sistafePivotData = useMemo(() => {
    const map: Record<
      string,
      {
        code: string;
        label: string;
        totalQuant: number;
        totalValor: number;
        itemsMap: Record<
          string,
          {
            label: string;
            nomeProduto?: string;
            quant: number;
            valor: number;
            precoUnitario?: number;
            especificacao?: string;
            count: number;
          }
        >;
      }
    > = {};

    // Se o utilizador desativar o filtro "Apenas Utilizadas", mostra todas as 36 rúbricas oficiais
    if (!showOnlyNonZeroPivot) {
      OFFICIAL_SISTAFE_RUBRICAS.forEach((item) => {
        const fullLabel = `${item.code} - ${item.name}`;
        map[fullLabel] = {
          code: item.code,
          label: fullLabel,
          totalQuant: 0,
          totalValor: 0,
          itemsMap: {},
        };
      });

      map["(em branco)"] = {
        code: "999999",
        label: "(em branco)",
        totalQuant: 0,
        totalValor: 0,
        itemsMap: {},
      };
    }

    sectorActivities.forEach((act) => {
      let hasRubrica = false;

      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const rubStr = String(r.rubrica || r.nomeRubrica || r.code || "").trim();
          const necStr = String(
            r.necessidade || r.descricao || r.nomeProduto || r.item || act.designacao || act.title || ""
          ).trim();
          const prodName = String(r.nomeProduto || r.especificacao || r.produto || r.item || "").trim();
          const qty = Number(r.quantidade || r.qtd || 1);
          const val = Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0);
          const pUnit = Number(r.precoUnitario || r.preco || (qty > 0 ? val / qty : 0));

          if (val >= 0 || qty >= 0) {
            hasRubrica = true;
            const targetLabel = getOfficialRubricaLabel(rubStr, necStr);

            if (!map[targetLabel]) {
              map[targetLabel] = {
                code: targetLabel.substring(0, 6),
                label: targetLabel,
                totalQuant: 0,
                totalValor: 0,
                itemsMap: {},
              };
            }

            map[targetLabel].totalQuant += qty;
            map[targetLabel].totalValor += val;

            const itemKey = `${necStr}${prodName ? ` [Produto: ${prodName}]` : ""}`;
            if (!map[targetLabel].itemsMap[itemKey]) {
              map[targetLabel].itemsMap[itemKey] = {
                label: necStr,
                nomeProduto: prodName,
                quant: 0,
                valor: 0,
                precoUnitario: pUnit,
                especificacao: r.especificacao || "",
                count: 0,
              };
            }
            map[targetLabel].itemsMap[itemKey].quant += qty;
            map[targetLabel].itemsMap[itemKey].valor += val;
            map[targetLabel].itemsMap[itemKey].count += 1;
          }
        });
      }

      if (!hasRubrica) {
        const val = Number(
          act.valor || act.orcamentoTotal || act.valorTotal || act.orcamento || act.custoTotal || 0
        );
        const qty = Number(act.quantidade || act.qtd || 1);
        const rubStr = String(act.rubrica || act.categoria || "").trim();
        const necStr = String(act.necessidade || act.designacao || act.title || "").trim();

        if (val >= 0 || qty >= 0) {
          const targetLabel = getOfficialRubricaLabel(rubStr, necStr);
          if (!map[targetLabel]) {
            map[targetLabel] = {
              code: targetLabel.substring(0, 6),
              label: targetLabel,
              totalQuant: 0,
              totalValor: 0,
              itemsMap: {},
            };
          }

          map[targetLabel].totalQuant += qty;
          map[targetLabel].totalValor += val;

          const itemKey = necStr || "Atividade Planificada";
          if (!map[targetLabel].itemsMap[itemKey]) {
            map[targetLabel].itemsMap[itemKey] = {
              label: itemKey,
              quant: 0,
              valor: 0,
              count: 0,
            };
          }
          map[targetLabel].itemsMap[itemKey].quant += qty;
          map[targetLabel].itemsMap[itemKey].valor += val;
          map[targetLabel].itemsMap[itemKey].count += 1;
        }
      }
    });

    return Object.values(map)
      .filter((row) => !showOnlyNonZeroPivot || row.totalValor > 0 || row.totalQuant > 0)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [sectorActivities]);

  const sistafeGrandTotals = useMemo(() => {
    return sistafePivotData.reduce(
      (acc, curr) => ({
        quant: acc.quant + curr.totalQuant,
        valor: acc.valor + curr.totalValor,
      }),
      { quant: 0, valor: 0 }
    );
  }, [sistafePivotData]);

  const toggleExpandPivotRow = (label: string) => {
    setExpandedPivotRows((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const expandAllPivotRows = () => {
    const all: Record<string, boolean> = {};
    sistafePivotData.forEach((row) => {
      all[row.label] = true;
    });
    setExpandedPivotRows(all);
  };

  const collapseAllPivotRows = () => {
    setExpandedPivotRows({});
  };

  // Reforço state
  const [reforcoForm, setReforcoForm] = useState({
    rubrica: "",
    valor: "",
    justificativa: "",
    fonte: "OE",
  });
  const [solicitacoes, setSolicitacoes] = useState<any[]>([
    {
      id: "REF-2026-001",
      rubrica: "Bens e Serviços (Material de Escritório)",
      valor: 45000,
      justificativa:
        "Necessidade de aquisição extra de consumíveis para exames do 1º Semestre.",
      fonte: "OE",
      status: "Pendente",
      data: "2026-07-10 09:30",
    },
  ]);

  const isDAF =
    user?.departamento?.toUpperCase().includes("DAF") ||
    title?.toUpperCase().includes("DAF");

  // Teto Orçamental a nível da Instituição (Global)
  const tetoInstitucional = 50000000; // 50M MZN Institucional

  const canEditTeto = useMemo(() => {
    const userDept = String(
      user?.departamento || user?.setor || "",
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
      userRole.includes("TÉCNICO") ||
      userRole.includes("TECNICO") ||
      userRole.includes("CHEFE") ||
      currentTitle.includes("PLANIFICAÇÃO") ||
      currentTitle.includes("PLANIFICACAO") ||
      currentTitle.includes("DPEP")
    );
  }, [user, title]);

  const docTetoId = `teto_${selectedLevel}_${selectedUnit}_${title}`.replace(/[^a-zA-Z0-9_]/g, "_");
  const storageKey = `teto_atribuido_${selectedLevel}_${selectedUnit}_${title}`;
  const [customTeto, setCustomTeto] = useState<number>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? Number(saved) : 0;
  });

  useEffect(() => {
    const unsub = firestoreService.subscribeToDocument<any>("tetos_orcamentais", docTetoId, (docData) => {
      if (docData && typeof docData.valor === "number") {
        setCustomTeto(docData.valor);
        localStorage.setItem(storageKey, String(docData.valor));
      }
    });
    return () => unsub();
  }, [docTetoId, storageKey]);

  const [isEditingTeto, setIsEditingTeto] = useState(false);
  const [tempTetoInput, setTempTetoInput] = useState<string>("");

  // Determinar o teto orçamental estático padrão por nível hierárquico
  const defaultTeto = useMemo(() => {
    // Se não existirem atividades registadas/orçamentadas para este setor/departamento, limpa o valor (0 MZN)
    if (sectorActivities.length === 0) {
      return 0;
    }

    const titleUpper = title.toUpperCase();
    if (
      titleUpper.includes("DIRETOR GERAL") ||
      titleUpper.includes("GABINETE") ||
      titleUpper.includes("DPEP") ||
      titleUpper.includes("CONSELHO")
    ) {
      return 15000000; // 15M MZN
    } else if (
      titleUpper.includes("DIREÇÃO") ||
      titleUpper.includes("DIVISÃO") ||
      titleUpper.includes("DICOSAFA") ||
      titleUpper.includes("DICOSSER")
    ) {
      return 5000000; // 5M MZN
    } else if (
      titleUpper.includes("DEPARTAMENTO") ||
      titleUpper.includes("UNIDADE")
    ) {
      return 1500000; // 1.5M MZN
    } else {
      return 500000; // 500k MZN (Repartições / Setores)
    }
  }, [title, sectorActivities.length]);

  const tetoMax = sectorActivities.length === 0 ? 0 : (customTeto > 0 ? customTeto : defaultTeto);

  const handleSaveTeto = async () => {
    const val = Number(tempTetoInput);
    if (isNaN(val) || val <= 0) {
      onShowAlert("Por favor, insira um valor válido para o teto atribuído.");
      return;
    }
    setCustomTeto(val);
    localStorage.setItem(storageKey, String(val));
    setIsEditingTeto(false);

    try {
      await firestoreService.tetosOrcamentais.set(docTetoId, {
        valor: val,
        level: selectedLevel,
        unit: selectedUnit,
        title,
        updatedAt: new Date().toISOString(),
      });
      onShowAlert(
        "Teto orçamental atribuído inserido/atualizado com sucesso na base de dados (Firestore) pelo Planificador!",
      );
    } catch (e) {
      console.error("Erro ao salvar teto no Firestore:", e);
      onShowAlert("Teto atualizado com sucesso no ecrã!");
    }
  };

  // Calcular despesa real planejada com base nas actividades do setor
  const totalDespesaPlanificada = useMemo(() => {
    return sectorActivities.reduce((sum, act) => {
      let actVal = 0;
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        const rSum = act.rubricas.reduce(
          (s: number, r: any) =>
            s +
            Number(
              r.valorTotal ||
                r.total ||
                r.valor ||
                r.precoTotal ||
                r.custo ||
                Number(r.quantidade || r.qtd || 0) *
                  Number(r.precoUnitario || r.valorUnitario || r.preco || 0) ||
                0,
            ),
          0,
        );
        if (rSum > 0) {
          actVal = rSum;
        } else {
          actVal = Number(
            act.valor ||
              act.orcamentoTotal ||
              act.valorTotal ||
              act.orcamento ||
              act.custoTotal ||
              0,
          );
        }
      } else {
        actVal = Number(
          act.valor ||
            act.orcamentoTotal ||
            act.valorTotal ||
            act.orcamento ||
            act.custoTotal ||
            0,
        );
      }
      return sum + actVal;
    }, 0);
  }, [sectorActivities]);

  const saldoDisponivel = tetoMax - totalDespesaPlanificada;
  const percentagemExecucao =
    tetoMax > 0 ? (totalDespesaPlanificada / tetoMax) * 100 : 0;

  // Filtrar despesas por Fonte de Financiamento
  const despesaPorFonte = useMemo(() => {
    let oe = 0;
    let rp = 0;
    let outros = 0;

    sectorActivities.forEach((act) => {
      let valor = 0;
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        const rSum = act.rubricas.reduce(
          (s: number, r: any) =>
            s +
            Number(
              r.valorTotal ||
                r.total ||
                r.valor ||
                r.precoTotal ||
                r.custo ||
                Number(r.quantidade || r.qtd || 0) *
                  Number(r.precoUnitario || r.valorUnitario || r.preco || 0) ||
                0,
            ),
          0,
        );
        if (rSum > 0) {
          valor = rSum;
        } else {
          valor = Number(
            act.valor ||
              act.orcamentoTotal ||
              act.valorTotal ||
              act.orcamento ||
              act.custoTotal ||
              0,
          );
        }
      } else {
        valor = Number(
          act.valor ||
            act.orcamentoTotal ||
            act.valorTotal ||
            act.orcamento ||
            act.custoTotal ||
            0,
        );
      }

      const fonte = (act.orcamento || act.fonteFinanciamento || "OE").toUpperCase();

      if (
        fonte.includes("OE") ||
        fonte.includes("ESTADO") ||
        fonte.includes("GERAL")
      ) {
        oe += valor;
      } else if (
        fonte.includes("RP") ||
        fonte.includes("RECEITA") ||
        fonte.includes("PRÓPRIA")
      ) {
        rp += valor;
      } else {
        outros += valor;
      }
    });

    return { oe, rp, outros };
  }, [sectorActivities]);

  // Mantemos compatibilidade com o histórico anterior se necessário
  const despesasPorRubrica = useMemo(() => {
    return aggregatedRubricasAndNeeds.map((item) => ({
      name: item.rubrica,
      valor: item.valor,
      count: 1,
      actividades: [item.necessidade],
    }));
  }, [aggregatedRubricasAndNeeds]);

  const handleSubmitReforco = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !reforcoForm.rubrica ||
      !reforcoForm.valor ||
      !reforcoForm.justificativa
    ) {
      onShowAlert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const novoPedido = {
      id: `REF-2026-0${solicitacoes.length + 1}`,
      rubrica: reforcoForm.rubrica,
      valor: Number(reforcoForm.valor),
      justificativa: reforcoForm.justificativa,
      fonte: reforcoForm.fonte,
      status: "Pendente",
      data: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    setSolicitacoes([novoPedido, ...solicitacoes]);
    onShowAlert(
      "Pedido de reforço de crédito orçamental submetido com sucesso para validação!",
    );
    setReforcoForm({
      rubrica: "",
      valor: "",
      justificativa: "",
      fonte: "OE",
    });
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-fade-in max-w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm"
              title="Voltar"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Ação Orçamental
            </h2>
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-1">
              Gabinete do {title} &bull; Gestão de Limites e Dotações
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${
              activeTab === "overview"
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/10"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab("rubricas")}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${
              activeTab === "rubricas"
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/10"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            Rúbricas & Despesas
          </button>
          <button
            onClick={() => setActiveTab("reforco")}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all ${
              activeTab === "reforco"
                ? "bg-slate-900 text-white shadow-md shadow-slate-950/10"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
            disabled={isDAF}
          >
            Reforço de Crédito {isDAF ? "(Acesso Restrito)" : ""}
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Institutional Budget Ceiling Banner */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                  Nível Institucional
                </span>
                <span className="text-xs font-bold text-slate-400">
                  Diretrizes Orçamentais do ISPS
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Teto Orçamental Geral da Instituição
              </h3>
              <p className="text-xs text-slate-300">
                Dotação orçamental máxima consolidada a nível institucional.
              </p>
            </div>
            <div className="text-right bg-white/10 px-6 py-3 rounded-2xl border border-white/10">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                Teto Institucional
              </p>
              <p className="text-2xl font-black font-mono text-white">
                {tetoInstitucional.toLocaleString()} MZN
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
            <div className="bg-gradient-to-br from-blue-50/50 to-blue-50/10 p-6 rounded-3xl border border-blue-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                      Teto Atribuído (Setor / Direção)
                    </p>
                    <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                      {tetoMax.toLocaleString()} MZN
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Coins size={20} />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal mb-4">
                  Limite orçamental atribuído a este setor / direção para o
                  exercício atual.
                </p>
              </div>
              {canEditTeto && (
                <div className="pt-3 border-t border-blue-100">
                  {!isEditingTeto ? (
                    <button
                      onClick={() => {
                        setTempTetoInput(String(tetoMax));
                        setIsEditingTeto(true);
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors shadow-sm"
                    >
                      Inserir / Alterar Teto Atribuído
                    </button>
                  ) : (
                    <div className="space-y-3 bg-white p-3 rounded-2xl border border-blue-200">
                      <div>
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                          Novo Teto Atribuído (MZN):
                        </label>
                        <input
                          type="number"
                          value={tempTetoInput}
                          onChange={(e) => setTempTetoInput(e.target.value)}
                          placeholder="Ex: 2500000"
                          className="w-full p-2.5 text-xs font-bold border rounded-xl outline-none focus:border-blue-600 font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveTeto}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setIsEditingTeto(false)}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-amber-50/50 to-amber-50/10 p-6 rounded-3xl border border-amber-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    Despesa Planificada
                  </p>
                  <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                    {totalDespesaPlanificada.toLocaleString()} MZN
                  </p>
                </div>
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <TrendingDown size={20} />
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-1 overflow-hidden">
                <div
                  className={`h-full rounded-full ${percentagemExecucao > 90 ? "bg-rose-500" : "bg-amber-500"}`}
                  style={{ width: `${Math.min(percentagemExecucao, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-2 text-right">
                {percentagemExecucao.toFixed(1)}% do Teto Utilizado
              </p>
            </div>

            <div
              className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between ${
                saldoDisponivel >= 0
                  ? "bg-gradient-to-br from-emerald-50/50 to-emerald-50/10 border-emerald-100"
                  : "bg-gradient-to-br from-rose-50/50 to-rose-50/10 border-rose-100"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      saldoDisponivel >= 0
                        ? "text-emerald-500"
                        : "text-rose-500"
                    }`}
                  >
                    Saldo Disponível
                  </p>
                  <p
                    className={`text-2xl font-black font-mono mt-1 ${
                      saldoDisponivel >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {saldoDisponivel.toLocaleString()} MZN
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    saldoDisponivel >= 0
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-rose-100 text-rose-600"
                  }`}
                >
                  <TrendingUp size={20} />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {saldoDisponivel >= 0
                  ? "Crédito orçamental remanescente para o registo de novas actividades."
                  : "Atenção: A planificação excede o limite estipulado. Reduza custos ou solicite reforço."}
              </p>
            </div>
          </div>

          {/* Gráfico de Fontes de Financiamento */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <PieChart size={16} className="text-slate-500" /> Fontes de
                Financiamento Utilizadas
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>Orçamento Geral do Estado (OE)</span>
                    <span className="font-mono">
                      {despesaPorFonte.oe.toLocaleString()} MZN
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{
                        width: `${totalDespesaPlanificada > 0 ? (despesaPorFonte.oe / totalDespesaPlanificada) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>Receitas Próprias (RP)</span>
                    <span className="font-mono">
                      {despesaPorFonte.rp.toLocaleString()} MZN
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-3">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{
                        width: `${totalDespesaPlanificada > 0 ? (despesaPorFonte.rp / totalDespesaPlanificada) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                    <span>Outras Fontes (Doadores / Fundos Externos)</span>
                    <span className="font-mono">
                      {despesaPorFonte.outros.toLocaleString()} MZN
                    </span>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-3">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{
                        width: `${totalDespesaPlanificada > 0 ? (despesaPorFonte.outros / totalDespesaPlanificada) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black tracking-widest text-amber-400 uppercase mb-3">
                  Auditoria Interna DPEP
                </h4>
                <p className="text-xl font-bold tracking-tight mb-2 leading-snug">
                  Conformidade Orçamental do Setor
                </p>
                <div className="mt-4 flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-3.5">
                  <AlertCircle
                    size={18}
                    className="text-amber-400 shrink-0 mt-0.5"
                  />
                  <p className="text-[11px] text-slate-300 leading-normal">
                    {saldoDisponivel >= 0
                      ? "O seu setor está em conformidade com as diretrizes da DAF e DPEP. O saldo atual é positivo."
                      : "Défice detetado. Por favor, reajuste os valores das actividades orçamentadas ou use o formulário de reforço."}
                  </p>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-6 pt-4 border-t border-white/10 font-bold uppercase tracking-wider">
                Última sincronização: Hoje
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rúbricas Tab */}
      {activeTab === "rubricas" && (
        <div className="space-y-6">
          {/* Seletor Nível Organizacional e Unidade para visualização e impressão */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  📂 Ação Orçamental & Distribuição de Necessidades
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione o nível e unidade organizacional para visualizar o orçamento geral e necessidades de consumo.
                </p>
              </div>

              <button
                onClick={() =>
                  printElementById(
                    "acao-orcamental-print-area",
                    `Acao_Orcamental_${selectedLevel}_${selectedUnit.replace(/\s+/g, "_")}`,
                  )
                }
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-black tracking-wider text-xs uppercase px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-100/50 cursor-pointer h-[42px] shrink-0"
              >
                <Printer size={15} strokeWidth={2.5} /> Imprimir Relatório
              </button>
            </div>

            {/* Barra de Seleção de Nível Estrutural */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mr-2 shrink-0">
                  Nível:
                </span>

                {isPlanificacaoOrDPEP ? (
                  <>
                    <button
                      onClick={() => handleLevelChange("institucional")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedLevel === "institucional"
                          ? "bg-slate-900 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }`}
                    >
                      🏛️ Institucional (Geral)
                    </button>

                    <button
                      onClick={() => handleLevelChange("direcao")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedLevel === "direcao"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }`}
                    >
                      🏢 Por Direção
                    </button>

                    <button
                      onClick={() => handleLevelChange("departamento")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedLevel === "departamento"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }`}
                    >
                      📂 Por Departamento
                    </button>

                    <button
                      onClick={() => handleLevelChange("reparticao")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedLevel === "reparticao"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }`}
                    >
                      📍 Por Repartição
                    </button>

                    <button
                      onClick={() => handleLevelChange("setor")}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedLevel === "setor"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }`}
                    >
                      📌 Por Setor
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedLevel("direcao");
                        setSelectedUnit(userDirecao);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedLevel === "direcao"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }`}
                    >
                      🏢 Por Direção: {userDirecao}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedLevel("departamento");
                        setSelectedUnit(userDepartamento);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedLevel === "departamento"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }`}
                    >
                      📂 Por Departamento: {userDepartamento}
                    </button>
                  </>
                )}
              </div>

              {/* Seletor da Unidade Conforme o Nível Escolhido */}
              {selectedLevel !== "institucional" && (isPlanificacaoOrDPEP || selectedLevel === "departamento" || (DEPARTAMENTOS[userDirecao] || []).length > 1) && (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    {selectedLevel === "direcao" ? "Por Direção:" : "Departamento:"}
                  </label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full md:w-64 bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer shadow-xs"
                  >
                    {isPlanificacaoOrDPEP && (
                      <option value="todos">
                        {selectedLevel === "direcao" ? "Todas as Direções" : `Todas as Unidades (${selectedLevel.toUpperCase()})`}
                      </option>
                    )}
                    {isPlanificacaoOrDPEP ? (
                      (levelUnits[selectedLevel] || []).map((unit, idx) => (
                        <option key={idx} value={unit}>
                          {unit}
                        </option>
                      ))
                    ) : selectedLevel === "direcao" ? (
                      <option value={userDirecao}>{userDirecao}</option>
                    ) : (
                      <>
                        <option value={userDepartamento}>{userDepartamento}</option>
                        {DEPARTAMENTOS[userDirecao]?.map((dep, idx) => (
                          <option key={idx} value={dep}>{dep}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Cards de Métricas Resumo do Orçamento Geral */}
          {sectorActivities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-sm border border-slate-700">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 block mb-1">
                Orçamento Geral Calculado (Atividades)
              </span>
              <div className="text-2xl font-black font-mono text-white">
                {Math.max(
                  totalOrcamentadoSetor,
                  rubricasBreakdown.reduce((acc, curr) => acc + curr.totalValorRubrica, 0)
                ).toLocaleString("pt-MZ", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-xs text-slate-300 font-sans">MZN</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">
                Nível: {selectedLevel.toUpperCase()} {selectedUnit !== "todos" ? `• ${selectedUnit}` : ""}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Rúbricas Ativas
              </span>
              <div className="text-2xl font-black font-mono text-slate-800">
                {rubricasBreakdown.length}{" "}
                <span className="text-xs text-slate-400 font-sans">Rúbricas</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                {sectorActivities.length} Atividades Planificadas
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                Necessidades Mapeadas
              </span>
              <div className="text-2xl font-black font-mono text-slate-800">
                {rubricasBreakdown.reduce((acc, curr) => acc + curr.necessidadesList.length, 0)}{" "}
                <span className="text-xs text-slate-400 font-sans">Necessidades</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Especificadas em Rúbrica
              </span>
            </div>
            </div>
          ) : (
            <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-slate-200 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coins className="text-slate-300" size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Sem Plano Orçamental Registado</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-2 leading-relaxed">
                Não foram encontradas atividades planificadas para o nível estrutural 
                <strong className="text-slate-900 font-black px-1.5">
                  {selectedLevel.toUpperCase()}
                </strong> 
                {selectedUnit !== "todos" && (
                  <>
                    na unidade <strong className="text-slate-900 font-black px-1.5">{selectedUnit}</strong>
                  </>
                )}
                . O orçamento só é gerado após a inserção de atividades e rúbricas na matriz.
              </p>
            </div>
          )}

          {/* Resumo Executivo Rápido por Categoria / Rúbrica */}
          {sectorActivities.length > 0 && (
            <div className="bg-sky-900/5 border border-sky-200/80 p-5 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-sky-900 flex items-center gap-2">
                💡 Resumo Consolidado por Rúbrica (Materiais, Serviços, Ajudas de Custo)
              </h4>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full">
                {parentRubricasBreakdown.length} Rúbricas Mães Mapeadas
              </span>
            </div>

            {parentRubricasBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {parentRubricasBreakdown.map((rub, idx) => {
                  const grandTotal = Math.max(
                    totalOrcamentadoSetor,
                    parentRubricasBreakdown.reduce((acc, curr) => acc + curr.totalValor, 0)
                  );
                  const pct = grandTotal > 0 ? (rub.totalValor / grandTotal) * 100 : 0;
                  const isMaterial = rub.parentName.toLowerCase().includes("bens") || rub.parentName.toLowerCase().includes("material");
                  const isServicos = rub.parentName.toLowerCase().includes("serviços");
                  const isAjudas = rub.parentName.toLowerCase().includes("ajuda");

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isMaterial
                          ? "bg-amber-500/10 border-amber-300 ring-1 ring-amber-400/20"
                          : isServicos
                          ? "bg-blue-500/10 border-blue-300 ring-1 ring-blue-400/20"
                          : isAjudas
                          ? "bg-emerald-500/10 border-emerald-300 ring-1 ring-emerald-400/20"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 truncate mb-1">
                        {isMaterial ? "📦 " : isServicos ? "⚙️ " : isAjudas ? "✈️ " : "🏷️ "}
                        {rub.parentName}
                      </div>
                      <div className="text-lg font-black font-mono text-slate-900">
                        {rub.totalValor.toLocaleString("pt-MZ", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-[10px] font-sans font-normal text-slate-500">MZN</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 font-medium">
                        <span>{rub.itemsCount} rubricas/atividades</span>
                        <span className="font-bold text-sky-800">{pct.toFixed(1)}% do total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-2">
                Nenhuma rúbrica ou valor cadastrado para este nível.
              </p>
            )}
            </div>
          )}

          {/* Seção Principal de Resumo Tabela Dinâmica SISTAFE (Matriz Orçamental) */}
          {sectorActivities.length > 0 && (
            <>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  📊 Matriz Tabela Dinâmica - Ação Orçamental (SISTAFE)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Resumo das rúbricas oficiais e necessidades agrupadas por código, quantitativos e valores acumulados.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOnlyNonZeroPivot(!showOnlyNonZeroPivot)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    showOnlyNonZeroPivot
                      ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                      : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {showOnlyNonZeroPivot ? "✓ Apenas com Valor" : "Mostrar Todas as Rúbricas"}
                </button>
                <button
                  type="button"
                  onClick={expandAllPivotRows}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer transition-colors"
                >
                  + Expandir Todos
                </button>
                <button
                  type="button"
                  onClick={collapseAllPivotRows}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer transition-colors"
                >
                  − Recolher Todos
                </button>
              </div>
            </div>

            {/* Tabela Dinâmica com Visualização Excel SISTAFE */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-slate-300 rounded-xl shadow-xs">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-blue-900 text-white text-[10px] tracking-wider">
                    <th className="p-4 font-black border-r border-blue-800">
                      N/O
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      NOME DA RUBRICA
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      NOME DA NECESSIDADE
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      NOME DO PRODUTO/SERVICO
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      QUANTIDADE
                    </th>
                    <th className="p-4 font-black border-r border-blue-800">
                      VALOR TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(() => {
                    const filteredRows = sistafePivotData.filter((row) => {
                      if (!showOnlyNonZeroPivot) return true;
                      return row.totalQuant > 0 || row.totalValor > 0;
                    });

                    if (filteredRows.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-400 italic">
                            Nenhum dado encontrado para o filtro selecionado.
                          </td>
                        </tr>
                      );
                    }

                    return filteredRows.map((row, idx) => {
                      const isExpanded = !!expandedPivotRows[row.label];
                      const hasItems = Object.keys(row.itemsMap).length > 0;

                      return (
                        <React.Fragment key={idx}>
                          {/* Linha da Rúbrica */}
                          <tr className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${row.totalValor > 0 ? "font-bold text-slate-900" : "text-slate-500"}`}>
                            <td className="p-3 border border-slate-200 font-mono text-xs">
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="p-3 border border-slate-200 font-bold">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleExpandPivotRow(row.label)}
                                  className="w-4 h-4 rounded border border-slate-400 bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-700 hover:bg-slate-200 cursor-pointer shrink-0"
                                >
                                  {isExpanded ? "−" : "+"}
                                </button>
                                <span>{row.label}</span>
                              </div>
                            </td>
                            <td className="p-3 border border-slate-200 text-slate-600">
                              —
                            </td>
                            <td className="p-3 border border-slate-200 text-slate-600">
                              —
                            </td>
                            <td className="p-3 text-center border border-slate-200 font-mono font-bold text-blue-900">
                              {row.totalQuant > 0 ? row.totalQuant.toLocaleString("pt-MZ") : "—"}
                            </td>
                            <td className="p-3 text-right border border-slate-200 font-mono font-bold text-blue-950">
                              {row.totalValor > 0
                                ? row.totalValor.toLocaleString("pt-MZ", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) + " MZN"
                                : "0,00 MZN"}
                            </td>
                          </tr>

                          {/* Sub-itens Expandidos (Necessidades & Produtos) */}
                          {isExpanded && hasItems &&
                            Object.values(row.itemsMap).map((item: any, iIdx) => (
                              <tr key={iIdx} className="border-b border-slate-100 bg-slate-50/70 text-slate-700">
                                <td className="p-3 border border-slate-200 font-mono text-[10px] text-slate-400">
                                  {String(idx + 1).padStart(2, "0")}.{iIdx + 1}
                                </td>
                                <td className="p-3 border border-slate-200 font-medium text-slate-600">
                                  ↳ {row.label}
                                </td>
                                <td className="p-3 border border-slate-200 font-semibold text-slate-800">
                                  {item.label}
                                </td>
                                <td className="p-3 border border-slate-200 font-medium text-slate-700">
                                  {item.nomeProduto || "—"}
                                  {item.especificacao && <div className="text-[10px] text-slate-500 italic">{item.especificacao}</div>}
                                </td>
                                <td className="p-3 text-center border border-slate-200 font-mono font-bold text-blue-900 bg-blue-50/40">
                                  {item.quant > 0 ? item.quant.toLocaleString("pt-MZ") : "—"}
                                </td>
                                <td className="p-3 text-right border border-slate-200 font-mono font-semibold text-slate-800">
                                  {item.valor.toLocaleString("pt-MZ", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }) + " MZN"}
                                </td>
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    });
                  })()}

                  {/* Linha de Total Geral */}
                  <tr className="bg-slate-200 text-slate-900 border-t-2 border-b-2 border-slate-800 font-black">
                    <td className="p-3 border border-slate-400 text-left font-black uppercase">
                      Total Geral
                    </td>
                    <td className="p-3 text-center border border-slate-400 font-mono font-black text-blue-950">
                      {sistafeGrandTotals.quant.toLocaleString("pt-MZ")}
                    </td>
                    <td className="p-3 text-right border border-slate-400 font-mono font-black text-sky-900">
                      {sistafeGrandTotals.valor.toLocaleString("pt-MZ", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      MZN
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div
            id="acao-orcamental-print-area"
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden"
          >
            {/* Cabeçalho Institucional Oficial Padronizado */}
            <InstitutionalHeader 
              unidadeName={user?.unidadeOrganica || "UNIDADE ORGÂNICA"}
              direcaoName={selectedUnit !== "todos" ? selectedUnit : user?.direcao}
              departamentoName={user?.departamento}
              reparticaoName={user?.reparticao}
              sectorName={user?.setor}
              year={new Date().getFullYear()}
              title="AÇÃO ORÇAMENTAL SISTAFE"
            />

            {/* Tabela Impressa no Formato Tabela Dinâmica SISTAFE */}
            <div className="overflow-x-auto border border-slate-400 rounded-lg">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-300 text-slate-900 border-b-2 border-slate-800 font-black">
                    <th className="p-2.5 border border-slate-400">Rubrica e Necessidade</th>
                    <th className="p-2.5 text-right border border-slate-400 w-52 font-mono">Valor Total (MZN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 bg-white">
                  {sistafePivotData.map((row, idx) => (
                    <React.Fragment key={idx}>
                      <tr className={`border-b border-slate-300 ${row.totalValor > 0 ? "font-bold text-slate-900 bg-slate-50/50" : "text-slate-500"}`}>
                        <td className="p-2 border border-slate-300 font-bold">{row.label}</td>
                        <td className="p-2 text-right border border-slate-300 font-mono font-bold">
                          {row.totalValor > 0
                            ? row.totalValor.toLocaleString("pt-MZ", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0,00"}
                        </td>
                      </tr>
                      {Object.values(row.itemsMap).map((item: any, iIdx) => (
                        <tr key={iIdx} className="border-b border-slate-200 text-slate-700 bg-white">
                          <td className="p-1.5 pl-8 border border-slate-300 font-normal text-slate-700 text-[11px]" style={{ letterSpacing: '0.3px' }}>
                            └─ {item.label}
                            {item.nomeProduto && ` [Produto: ${item.nomeProduto}]`}
                            {item.quant > 0 && ` (${item.quant} un/L${item.precoUnitario ? ` × ${item.precoUnitario} MT` : ""})`}
                            {item.especificacao && ` - ${item.especificacao}`}
                          </td>
                          <td className="p-1.5 text-right border border-slate-300 font-mono text-slate-800 text-[11px]" style={{ letterSpacing: '0.3px' }}>
                            {item.valor.toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  <tr className="bg-slate-300 text-slate-900 border-t-2 border-b-2 border-slate-900 font-black text-xs">
                    <td className="p-2.5 border border-slate-400 font-black">Total Geral</td>
                    <td className="p-2.5 text-right border border-slate-400 font-mono font-black">
                      {sistafeGrandTotals.valor.toLocaleString("pt-MZ", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      MZN
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </>)}
        </div>
      )}

      {/* Reforço de Crédito Tab */}
      {activeTab === "reforco" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus size={16} className="text-blue-600" /> Nova Solicitação
            </h3>

            <form onSubmit={handleSubmitReforco} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Rúbrica de Despesa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bens e Serviços / Combustível"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold"
                  value={reforcoForm.rubrica}
                  onChange={(e) =>
                    setReforcoForm({ ...reforcoForm, rubrica: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Valor (MZN) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 50000"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono font-bold"
                    value={reforcoForm.valor}
                    onChange={(e) =>
                      setReforcoForm({ ...reforcoForm, valor: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Fonte de Custeio
                  </label>
                  <select
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                    value={reforcoForm.fonte}
                    onChange={(e) =>
                      setReforcoForm({ ...reforcoForm, fonte: e.target.value })
                    }
                  >
                    <option value="OE">OE (Geral)</option>
                    <option value="RP">RP (Próprias)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Justificativa Técnica *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Justifique detalhadamente a necessidade do reforço de crédito para as actividades do setor..."
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold leading-relaxed"
                  value={reforcoForm.justificativa}
                  onChange={(e) =>
                    setReforcoForm({
                      ...reforcoForm,
                      justificativa: e.target.value,
                    })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2"
              >
                <Send size={14} /> Submeter para Avaliação
              </button>
            </form>
          </div>

          {/* Lista de Solicitações */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">
              Histórico de Pedidos de Reforço
            </h3>

            <div className="space-y-4">
              {solicitacoes.map((sol) => (
                <div
                  key={sol.id}
                  className="border border-slate-150 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <div>
                      <span className="text-[10px] font-black font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {sol.id}
                      </span>
                      <h4 className="font-extrabold text-slate-800 text-xs mt-1.5">
                        {sol.rubrica}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-blue-600 block">
                        {sol.valor.toLocaleString()} MZN
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                        Fonte: {sol.fonte}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed mb-4">
                    {sol.justificativa}
                  </p>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-400">
                    <span>Submetido em: {sol.data}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[9px] font-black ${
                        sol.status === "Pendente"
                          ? "bg-amber-100 text-amber-700"
                          : sol.status === "Aprovado"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {sol.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
