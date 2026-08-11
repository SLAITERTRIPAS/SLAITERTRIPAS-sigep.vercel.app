import React from "react";
import { Users, FileText, BarChart3, DollarSign, GraduationCap, FolderOpen, FileCheck } from "lucide-react";

interface CardItem {
  title: string;
  sub: string;
  icon: any;
  color: string;
  target: string;
}

export default function VisaoGeralCards({
  onNavigate,
  user,
  title,
}: {
  onNavigate: (item: string) => void;
  user: any;
  title: string;
}) {
  const getCardDetails = (cardTitle: string): CardItem => {
    const upper = cardTitle.toUpperCase();
    
    let target = cardTitle;
    if (upper === "EFETIVO GERAL") target = "Gestão de Pessoal";
    if (upper === "PLANOS DE ATIVIDADES") target = "Plano";
    if (upper === "RELATÓRIOS") target = "Relatórios";
    if (upper === "RECURSOS FINANCEIROS") target = "Balanço";
    if (upper === "CORPO DISCENTE") target = "Gestão Académica";
    if (upper === "GESTÃO DE EXPEDIENTE") target = "Gestão de Expediente";

    if (upper.includes("EFETIVO")) {
      return {
        title: cardTitle,
        sub: "Consulta e Gestão de Pessoal e Efetivo",
        icon: Users,
        color: "border-blue-900 bg-blue-50/30 text-blue-950 hover:bg-blue-50",
        target,
      };
    }
    if (upper.includes("PLANO")) {
      return {
        title: cardTitle,
        sub: "Planificação e Acompanhamento de Atividades",
        icon: FileText,
        color: "border-emerald-900 bg-emerald-50/30 text-emerald-950 hover:bg-emerald-50",
        target,
      };
    }
    if (upper.includes("RELATÓRIO")) {
      return {
        title: cardTitle,
        sub: "Relatórios de Desempenho e Indicadores",
        icon: BarChart3,
        color: "border-amber-900 bg-amber-50/30 text-amber-950 hover:bg-amber-50",
        target,
      };
    }
    if (upper.includes("RECURSOS") || upper.includes("BALANÇO")) {
      return {
        title: cardTitle,
        sub: "Orçamento, Balanço e Gestão Financeira",
        icon: DollarSign,
        color: "border-purple-900 bg-purple-50/30 text-purple-950 hover:bg-purple-50",
        target,
      };
    }
    if (upper.includes("DISCENTE") || upper.includes("ESTUDANTE")) {
      return {
        title: cardTitle,
        sub: "Estudantes, Cursos e Matrículas",
        icon: GraduationCap,
        color: "border-indigo-900 bg-indigo-50/30 text-indigo-950 hover:bg-indigo-50",
        target,
      };
    }
    if (upper.includes("EXPEDIENTE")) {
      return {
        title: cardTitle,
        sub: "Correspondência, Documentos e Expedientes",
        icon: FolderOpen,
        color: "border-rose-900 bg-rose-50/30 text-rose-950 hover:bg-rose-50",
        target,
      };
    }
    if (upper.includes("ASSINATURA")) {
      return {
        title: cardTitle,
        sub: "Validação e Assinatura de Documentos",
        icon: FileCheck,
        color: "border-teal-900 bg-teal-50/30 text-teal-950 hover:bg-teal-50",
        target,
      };
    }
    return {
      title: cardTitle,
      sub: "Gestão e Acompanhamento",
      icon: FileText,
      color: "border-slate-900 bg-slate-50/30 text-slate-950 hover:bg-slate-50",
      target,
    };
  };

  const rawCards = [
    "EFETIVO GERAL",
    "PLANOS DE ATIVIDADES",
    "RELATÓRIOS",
    "RECURSOS FINANCEIROS",
    "CORPO DISCENTE",
    "GESTÃO DE EXPEDIENTE",
  ];

  const cards = rawCards.map(getCardDetails);

  return (
    <div className="flex flex-col items-center w-full max-w-full mx-auto p-4 sm:p-8 space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full">
        {cards.map((card) => {
          const IconComp = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => onNavigate(card.target)}
              className={`w-full min-h-[140px] flex flex-col justify-between border-2 rounded-2xl p-4 text-left transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] cursor-pointer group ${card.color}`}
            >
              <div className="flex items-center justify-between">
                <IconComp className="w-6 h-6 shrink-0 text-slate-900 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black/10 rounded">
                  Aceder
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-sans font-black text-slate-900 text-xs sm:text-sm tracking-tighter uppercase">
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-600 font-medium mt-1 line-clamp-2">
                  {card.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
