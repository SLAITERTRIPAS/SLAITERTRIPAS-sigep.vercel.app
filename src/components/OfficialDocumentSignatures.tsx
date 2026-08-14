import React, { useState } from "react";
import { PenTool, CheckCircle, Upload } from "lucide-react";

export interface SignatureBoxProps {
  roleTitle: string; // Ex: "ELABORADOR (NÍVEL DO ELABORADOR)" ou "DIRETOR (NÍVEL DO DIRETOR)"
  defaultName?: string;
  defaultDegree?: string;
  editable?: boolean;
  signatureImage?: string;
  onSignatureChange?: (val: string) => void;
  date?: string;
}

export const OfficialSignatureCard: React.FC<SignatureBoxProps> = ({
  roleTitle,
  defaultName = "",
  defaultDegree = "(NÍVEL DE ESCOLARIDADE)",
  editable = false,
  signatureImage,
  onSignatureChange,
  date,
}) => {
  const [name, setName] = useState(defaultName);
  const [degree, setDegree] = useState(defaultDegree);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="w-full max-w-[340px] md:max-w-[380px] min-h-[190px] mx-auto bg-white border-2 border-slate-900 rounded-[2.5rem] p-6 flex flex-col justify-between items-center text-center shadow-sm relative print:border-2 print:border-black print:rounded-[2rem] print:shadow-none print:break-inside-avoid">
      {/* 1. Título do Cargo / Nível (Topo) */}
      <div className="w-full">
        <h4 className="text-xs md:text-sm font-black font-serif text-slate-900 uppercase tracking-wider leading-tight">
          {roleTitle}
        </h4>
      </div>

      {/* 2. Área Central da Assinatura / Linha */}
      <div className="w-full flex flex-col items-center justify-center my-3 relative min-h-[55px]">
        {signatureImage ? (
          <div className="relative mb-1">
            <img
              src={signatureImage}
              alt="Assinatura"
              className="max-h-12 max-w-[200px] object-contain mx-auto"
            />
          </div>
        ) : (
          <div className="h-8 flex items-center justify-center text-slate-300 print:hidden text-[10px] italic">
            Espaço para Assinatura / Rúbrica
          </div>
        )}

        {/* Linha Horizontal Oficial de Assinatura */}
        <div className="w-4/5 max-w-[260px] h-[1.5px] bg-slate-900 my-1"></div>
      </div>

      {/* 3. Nome e Nível de Escolaridade (Fundo) */}
      <div className="w-full space-y-0.5">
        {editable && isEditing ? (
          <div className="space-y-1.5 print:hidden">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="NOME COMPLETO"
              className="w-full text-center text-xs font-black uppercase tracking-wide border-b border-slate-400 bg-slate-50 py-0.5 outline-none"
            />
            <input
              type="text"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="(NÍVEL DE ESCOLARIDADE)"
              className="w-full text-center text-[11px] font-bold text-slate-600 border-b border-slate-300 bg-slate-50 py-0.5 outline-none"
            />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-bold"
            >
              Concluir
            </button>
          </div>
        ) : (
          <div
            onClick={() => editable && setIsEditing(true)}
            className={editable ? "cursor-pointer group hover:bg-slate-50 p-1 rounded-lg transition-colors" : ""}
          >
            <p className="text-xs md:text-sm font-black font-serif text-slate-900 uppercase tracking-wide leading-tight">
              {name || "NOME DO RESPONSÁVEL"}
            </p>
            <p className="text-[10px] md:text-xs font-bold text-slate-700 uppercase tracking-normal leading-tight mt-0.5">
              {degree.startsWith("(") ? degree : `(${degree})`}
            </p>
            {editable && (
              <span className="text-[8px] text-blue-600 underline font-sans opacity-0 group-hover:opacity-100 transition-opacity print:hidden block mt-0.5">
                Clique para editar nome / escolaridade
              </span>
            )}
          </div>
        )}

        {date && (
          <p className="text-[9px] text-slate-400 font-mono mt-1">
            Data: {date}
          </p>
        )}
      </div>
    </div>
  );
};

export interface OfficialDocumentSignaturesProps {
  isDPEP?: boolean;
  elaboradorName?: string;
  elaboradorDegree?: string;
  elaboradorRole?: string;
  diretorName?: string;
  diretorDegree?: string;
  diretorRole?: string;
  chefeDPEPName?: string;
  chefeDPEPDegree?: string;
  diretorGeralName?: string;
  diretorGeralDegree?: string;
  editable?: boolean;
  date?: string;
  user?: any;
  className?: string;
}

export const OfficialDocumentSignatures: React.FC<OfficialDocumentSignaturesProps> = ({
  isDPEP = false,
  elaboradorName,
  elaboradorDegree,
  elaboradorRole,
  diretorName,
  diretorDegree,
  diretorRole,
  chefeDPEPName,
  chefeDPEPDegree,
  diretorGeralName,
  diretorGeralDegree,
  editable = false,
  date,
  user,
  className = "",
}) => {
  // 1. Determinar se o documento é do DPEP / Planificação
  const isDPEPDocument =
    isDPEP ||
    user?.departamento?.toUpperCase().includes("DPEP") ||
    user?.direcao?.toUpperCase().includes("DPEP") ||
    user?.setor?.toUpperCase().includes("PLANIFICA") ||
    user?.reparticao?.toUpperCase().includes("PLANIFICA") ||
    user?.departamento?.toUpperCase().includes("PLANIFICA") ||
    user?.role?.toUpperCase().includes("PLANIFICA") ||
    user?.cargo?.toUpperCase().includes("PLANIFICA");

  // Resolver Nomes e Escolaridades padrões baseados no contexto
  const resolvedElaboradorName =
    elaboradorName || user?.name || user?.displayName || "NOME DO ELABORADOR";
  const resolvedElaboradorDegree =
    elaboradorDegree || user?.nivelAcademico || user?.escolaridade || "(LICENCIADO / TÉCNICO)";
  const resolvedElaboradorRole =
    elaboradorRole || (user?.cargoChefia && user.cargoChefia !== "Nenhum" ? user.cargoChefia : user?.cargo || "O ELABORADOR");

  const resolvedDiretorName =
    diretorName || user?.diretorNome || "NOME DO DIRETOR CENTRAL";
  const resolvedDiretorDegree =
    diretorDegree || "(LICENCIADO / MESTRE / DOUTOR)";
  const resolvedDiretorRole =
    diretorRole || (user?.direcao ? `DIRETOR CENTRAL (${user.direcao.toUpperCase()})` : "DIRETOR CENTRAL (NÍVEL DO DIRETOR)");

  const resolvedChefeDPEPName =
    chefeDPEPName || "CHEFE DO DEPARTAMENTO (DPEP)";
  const resolvedChefeDPEPDegree =
    chefeDPEPDegree || "(MESTRE / LICENCIADO)";

  const resolvedDiretorGeralName =
    diretorGeralName || "PROF. DOUTOR / DIRETOR GERAL";
  const resolvedDiretorGeralDegree =
    diretorGeralDegree || "(DOUTOR / PHD)";

  return (
    <div className={`w-full my-10 pt-6 border-t border-slate-200 print:border-t-0 print:pt-4 print:my-6 ${className}`}>
      <div className="w-full flex flex-col md:flex-row justify-around items-center gap-8 md:gap-12 print:flex-row print:justify-between print:gap-8">
        {isDPEPDocument ? (
          <>
            {/* 1. CHEFE DO DPEP */}
            <OfficialSignatureCard
              roleTitle="O CHEFE DO DEPARTAMENTO DE PLANIFICAÇÃO (DPEP)"
              defaultName={resolvedChefeDPEPName}
              defaultDegree={resolvedChefeDPEPDegree}
              editable={editable}
              date={date}
            />

            {/* 2. DIRETOR GERAL */}
            <OfficialSignatureCard
              roleTitle="DIRETOR GERAL (NÍVEL DO DIRETOR GERAL)"
              defaultName={resolvedDiretorGeralName}
              defaultDegree={resolvedDiretorGeralDegree}
              editable={editable}
              date={date}
            />
          </>
        ) : (
          <>
            {/* 1. ELABORADOR */}
            <OfficialSignatureCard
              roleTitle={`ELABORADOR (${resolvedElaboradorRole.toUpperCase()})`}
              defaultName={resolvedElaboradorName}
              defaultDegree={resolvedElaboradorDegree}
              editable={editable}
              date={date}
            />

            {/* 2. DIRETOR CENTRAL DA ÁREA */}
            <OfficialSignatureCard
              roleTitle={resolvedDiretorRole}
              defaultName={resolvedDiretorName}
              defaultDegree={resolvedDiretorDegree}
              editable={editable}
              date={date}
            />
          </>
        )}
      </div>
    </div>
  );
};
