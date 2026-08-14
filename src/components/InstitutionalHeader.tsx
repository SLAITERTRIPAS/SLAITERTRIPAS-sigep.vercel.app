import React from 'react';
import { ISPSLogo } from './InstitutionAssets';

export function resolveOrgaoName(unidadeName?: string, direcaoName?: string): string {
  if (unidadeName && unidadeName.trim() && unidadeName !== "UNIDADE ORGÂNICA") {
    const uUpper = unidadeName.toUpperCase().trim();
    if (uUpper.includes("SERVIÇO") || uUpper.includes("SERVICO") || uUpper === "SC") {
      return "SERVIÇOS CENTRAIS";
    }
    if (uUpper.includes("DIREÇÃO E GESTÃO") || uUpper.includes("DIRECAO E GESTAO") || uUpper === "ODG") {
      return "ÓRGÃO DE DIREÇÃO E GESTÃO";
    }
    if (uUpper.includes("ORGÂNICA") || uUpper.includes("ORGANICA") || uUpper === "UO") {
      return "UNIDADE ORGÂNICA";
    }
    return uUpper;
  }

  if (direcaoName) {
    const dUpper = direcaoName.toUpperCase().trim();
    if (
      dUpper.includes("DICOSAFA") ||
      dUpper.includes("DICOSSER") ||
      dUpper.includes("SERVIÇO") ||
      dUpper.includes("SERVICO")
    ) {
      return "SERVIÇOS CENTRAIS";
    }
    if (
      dUpper.includes("GABINETE") ||
      dUpper.includes("DIRETOR-GERAL") ||
      dUpper.includes("DIREÇÃO E GESTÃO") ||
      dUpper.includes("DIRECAO E GESTAO") ||
      dUpper.includes("CONSELHO") ||
      dUpper.includes("GDG")
    ) {
      return "ÓRGÃO DE DIREÇÃO E GESTÃO";
    }
    if (
      dUpper.includes("ENGENHARIA") ||
      dUpper.includes("DIVISÃO") ||
      dUpper.includes("DIVISAO") ||
      dUpper.includes("INCUBACAO") ||
      dUpper.includes("CIE") ||
      dUpper.includes("CENTRO")
    ) {
      return "UNIDADE ORGÂNICA";
    }
  }

  return (unidadeName || "UNIDADE ORGÂNICA").toUpperCase();
}

export type PlanLevelType = "institucional" | "direcao" | "departamento" | "reparticao" | "setor";

export const InstitutionalHeader = ({
  direcaoName,
  departamentoName,
  reparticaoName,
  sectorName,
  year,
  isOwner,
  isPlanificacaoHeader,
  unidadeName,
  title,
  planLevel,
  isRecomendado,
}: {
  direcaoName?: string;
  departamentoName?: string;
  reparticaoName?: string;
  sectorName?: string;
  year: number;
  isOwner?: boolean;
  isPlanificacaoHeader?: boolean;
  isRecomendado?: boolean;
  unidadeName?: string;
  title?: string;
  planLevel?: PlanLevelType;
}) => {
  // Garantir que os nomes estão em maiúsculas e resolver o Órgão correto
  const displayUnidade = resolveOrgaoName(unidadeName, direcaoName);
  const displayDirecao = (direcaoName || "").toUpperCase().trim();
  const displayDepartamento = (departamentoName || "").toUpperCase().trim();
  const displayReparticao = (reparticaoName || "").toUpperCase().trim();
  const displaySector = (sectorName || "").toUpperCase().trim();

  // Determinar o nível de plano
  let inferredLevel: PlanLevelType = planLevel || "institucional";
  if (!planLevel) {
    if (displaySector) inferredLevel = "setor";
    else if (displayReparticao) inferredLevel = "reparticao";
    else if (displayDepartamento) inferredLevel = "departamento";
    else if (displayDirecao) inferredLevel = "direcao";
    else inferredLevel = "institucional";
  }

  // Título dinâmico rigoroso por nível
  let displayTitle = "";
  if (title) {
    displayTitle = title.toUpperCase().trim();
  } else {
    switch (inferredLevel) {
      case "institucional":
        displayTitle = "PLANO INSTITUCIONAL DE ATIVIDADES";
        break;
      case "direcao":
        displayTitle = displayDirecao 
          ? (displayDirecao.startsWith("DIREÇÃO") ? `PLANO DE ATIVIDADE DA ${displayDirecao}` : `PLANO DE ATIVIDADE DA DIREÇÃO DE ${displayDirecao}`)
          : "PLANO DE ATIVIDADE DA DIREÇÃO";
        break;
      case "departamento":
        displayTitle = displayDepartamento
          ? (displayDepartamento.startsWith("DEPARTAMENTO") ? `PLANO DE ATIVIDADE DO ${displayDepartamento}` : `PLANO DE ATIVIDADE DO DEPARTAMENTO DE ${displayDepartamento}`)
          : "PLANO DE ATIVIDADE DO DEPARTAMENTO";
        break;
      case "reparticao":
        displayTitle = displayReparticao
          ? (displayReparticao.startsWith("REPARTIÇÃO") || displayReparticao.startsWith("REPARTICAO") ? `PLANO DE ATIVIDADE DA ${displayReparticao}` : `PLANO DE ATIVIDADE DA REPARTIÇÃO DE ${displayReparticao}`)
          : "PLANO DE ATIVIDADE DA REPARTIÇÃO";
        break;
      case "setor":
        displayTitle = displaySector
          ? (displaySector.startsWith("SETOR") ? `PLANO DE ATIVIDADE DO ${displaySector}` : `PLANO DE ATIVIDADE DO SETOR DE ${displaySector}`)
          : "PLANO DE ATIVIDADE DO SETOR";
        break;
    }
  }

  return (
    <div className="text-center mb-6 flex flex-col items-center w-full bg-white p-8 rounded-t-[2.5rem]">
      {/* 1. Logótipo Oficial do ISPS */}
      <div className="mb-5 flex items-center justify-center">
        <ISPSLogo
          className="w-36 h-auto max-h-24 object-contain drop-shadow-sm"
          alt="Logótipo ISPS"
        />
      </div>

      {/* 2. Nome do Instituto */}
      <h2 className="text-[2.2rem] font-black text-slate-900 uppercase tracking-tight mb-1.5 leading-none">
        INSTITUTO SUPERIOR POLITÉCNICO DE SONGO
      </h2>

      {/* 3. Província / Distrito */}
      <div className="flex flex-col items-center gap-0.5 mb-5">
        <h3 className="text-base font-bold text-slate-700 uppercase tracking-[0.1em]">
          PROVÍNCIA DE TETE
        </h3>
        <h3 className="text-base font-bold text-slate-700 uppercase tracking-[0.1em]">
          DISTRITO DE CAHORA-BASSA
        </h3>
      </div>
      
      {/* 4. Hierarquia Organizacional Independente */}
      <div className="flex flex-col items-center gap-1.5 mb-5">
        {/* Órgão */}
        <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
          {displayUnidade}
        </h4>

        {/* Direção (se aplicável ao nível) */}
        {displayDirecao && (inferredLevel !== "institucional" || displayDirecao !== "TODAS AS ÁREAS (GERAL)") && (
          <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
            {displayDirecao}
          </h4>
        )}

        {/* Departamento (se aplicável ao nível) */}
        {displayDepartamento && (inferredLevel === "departamento" || inferredLevel === "reparticao" || inferredLevel === "setor") && (
          <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
            {displayDepartamento}
          </h4>
        )}

        {/* Repartição / Setor (se aplicável ao nível) */}
        {(displayReparticao || displaySector) && (inferredLevel === "reparticao" || inferredLevel === "setor") && (
          <h4 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
            {displayReparticao} {displayReparticao && displaySector ? "-" : ""} {displaySector}
          </h4>
        )}
      </div>

      {/* 5. Título do Plano (EM VERMELHO ou AZUL para RECOMENDADO) */}
      <h5 className={`text-[1.4rem] font-black ${isRecomendado ? 'text-blue-600' : 'text-red-600'} uppercase mt-2 tracking-tight`}>
        {isRecomendado ? displayTitle.replace("PLANO DE ATIVIDADE", "PLANO INSTITUCIONAL RECOMENDADO") : displayTitle}
      </h5>

      {/* 6. Linha Divisória */}
      <div className="w-full max-w-5xl h-[3px] bg-slate-900 mt-6 mb-6"></div>

      {/* 7. Exercício Económico */}
      <div className="mt-2">
        <span className="text-[1.3rem] font-black text-slate-900 uppercase tracking-tight bg-[#f1f5f9] px-10 py-3 rounded-[1.2rem] border border-slate-200 shadow-sm">
          EXERCÍCIO ECONÓMICO: {year || 2027}
        </span>
      </div>
    </div>
  );
};
