import React, { useMemo, useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Building2,
  Briefcase,
  Settings,
  LayoutGrid,
  Pen,
  MessageSquare,
  FileText,
  ChevronRight,
  Bell,
  AlertTriangle,
  TrendingUp,
  FileCheck,
  DollarSign,
} from "lucide-react";
import { normalize as n, isMatch, toTitleCase as tc } from "../../lib/utils";
import { isBossUser, isSuperBossUser, getRoles } from "../../lib/auth";
import MainHeader from "../bloco1_apresentacao/MainHeader";
import { firestoreService } from "../../lib/firestoreService";
import { baseMenuItems } from "../../constants/menuHierarchy";

export default function MainMenu({
  user,
  onNavigate,
  onShowAlert,
  onBack,
  onLogout,
  onGestaoDocumentos,
  matrixActivities,
  onTetoOrcamental,
}: {
  user?: any;
  onNavigate: (
    title: string,
    items: {
      title: string;
      subItems?: { title: string; accessible?: boolean }[];
      accessible?: boolean;
    }[],
  ) => void;
  onShowAlert: (msg: string) => void;
  onBack: () => void;
  onLogout: () => void;
  onGestaoDocumentos?: () => void;
  matrixActivities?: any[];
  onTetoOrcamental?: () => void;
}) {
  const [pendingCount, setPendingCount] = useState(0);
  const [requisicoes, setRequisicoes] = useState<any[]>([]);
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [resetRequests, setResetRequests] = useState<any[]>([]);

  const isBudgetExpired = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const limitDate = new Date(currentYear, 11, 20, 23, 59, 59); // 11 é Dezembro
    return now > limitDate;
  }, []);

  const totalBudgetAmount = useMemo(() => {
    if (isBudgetExpired) return 0;
    return (matrixActivities || []).reduce((sum, act) => {
      let actVal = 0;
      let hasRub = false;
      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        const rSum = act.rubricas.reduce(
          (acc: number, r: any) => acc + Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0),
          0
        );
        if (rSum > 0) {
          actVal += rSum;
          hasRub = true;
        }
      }
      if (!hasRub) {
        actVal += Number(act.valorTotal || act.valor || act.orcamentoTotal || act.valorTotal || 0);
      }
      return sum + actVal;
    }, 0);
  }, [matrixActivities, isBudgetExpired]);

  const formattedBudget = useMemo(() => {
    return (
      totalBudgetAmount.toLocaleString("pt-MZ", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " MZN"
    );
  }, [totalBudgetAmount]);

  useEffect(() => {
    if (!user) return;
    const unsubReq = firestoreService.requisicoes_internas.subscribe(setRequisicoes);
    const unsubExp = firestoreService.expedientes.subscribe(setExpedientes);
    const unsubReset = firestoreService.password_reset_requests.subscribe(setResetRequests);
    return () => {
      unsubReq();
      unsubExp();
      unsubReset();
    };
  }, [user]);

  const pendingForMe = useMemo(() => {
    if (!user) return [];
    return [
      ...requisicoes.filter((req) => {
        const step = req.etapaAtual;
        const status = req.status;
        if (step === 0 && req.userId === user.id) return false;
        if (step === 1 && (user.departamento?.toLowerCase().includes("secretaria") || user.direcao?.toLowerCase().includes("secretaria"))) return true;
        if (step === 2 && (user.departamento?.toLowerCase().includes("economato") || user.direcao?.toLowerCase().includes("economato"))) return true;
        if (step === 3 && (user.cargo?.toLowerCase().includes("chefe") || user.role?.toLowerCase().includes("chefe"))) return true;
        if (step === 4 && status === "Favorável" && (user.departamento?.toLowerCase().includes("economato") || user.direcao?.toLowerCase().includes("economato"))) return true;
        if (step === 4 && status === "Desfavorável" && (user.departamento?.toLowerCase().includes("secretaria") || user.direcao?.toLowerCase().includes("secretaria"))) return true;
        if (step === 5 && req.userId === user.id) return true;
        return false;
      }),
      ...expedientes.filter((exp) => {
        if (exp.status === "Pendente" && (exp.destino?.toLowerCase() === user.departamento?.toLowerCase() || exp.destino?.toLowerCase() === user.direcao?.toLowerCase())) return true;
        return false;
      }),
      ...resetRequests.filter((req) => {
        return req.status === "Pendente" && (user.isOwner || user.role === "Administrador do Sistema");
      }),
    ];
  }, [requisicoes, expedientes, resetRequests, user]);

  const isAdmin = isSuperBossUser(user);

  const menuItems = useMemo(() => {
    const setAllAccessible = (node: any): any => ({
      ...node,
      accessible: true,
      visible: true,
      items: node.items?.map(setAllAccessible),
      subItems: node.subItems?.map(setAllAccessible),
    });

    return baseMenuItems.map(setAllAccessible);
  }, []);

  return (
    <div className="flex-1 min-h-0 w-full bg-white flex flex-col overflow-y-auto p-0">
      <main className="flex-1 min-h-0 w-full flex flex-col items-center p-0 overflow-y-auto mt-0">
        <div className="text-center mb-2 flex flex-col items-center shrink-0 mt-10">
          {pendingForMe.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border-2 border-red-500/20 p-4 rounded-3xl flex items-center gap-4 shadow-xl max-w-md animate-pulse"
            >
              <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <Bell size={24} />
              </div>
              <div className="text-left">
                <h4 className="text-red-900 font-black text-sm uppercase tracking-tight">Processos Pendentes</h4>
                <p className="text-red-700 text-xs font-bold leading-tight">
                  Existem {pendingForMe.length} notificações que requerem a sua atenção imediata no sistema.
                </p>
              </div>
            </motion.div>
          )}
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-amber-500 mb-1 lg:mb-2 mt-[1px] tracking-tighter font-serif bg-slate-950/80 border border-slate-800 px-5 py-2 lg:px-8 lg:py-3 rounded-2xl lg:rounded-[1.5rem] shadow-2xl backdrop-blur-md"
            style={{
              textShadow:
                "1px 1px 0 #000, 2px 2px 0 #000, 3px 3px 0 #000, 4px 4px 0 #000, 5px 5px 8px rgba(0,0,0,0.5)",
            }}
          >
            Menu Principal
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-500 font-medium font-serif italic mb-4">
            Selecione o bloco do sistema a que deseja aceder
          </p>

          {formattedBudget && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                if (onTetoOrcamental) {
                  onTetoOrcamental();
                } else {
                  onShowAlert(`Teto Orçamental da Instituição: ${formattedBudget}`);
                }
              }}
              className="mt-2 w-full max-w-md mx-auto flex items-center justify-center gap-3 bg-[#b91c1c] text-white px-6 py-3 rounded-2xl font-black tracking-wider hover:bg-red-800 active:scale-95 touch-manipulation transition-all shadow-xl border border-red-600/30 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <DollarSign size={20} className="text-white" />
              </div>
              <div className="text-left leading-tight w-full">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-widest font-black text-white/90">
                    TETO INSTITUIÇÃO
                  </span>
                  <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full font-black ${isBudgetExpired ? "bg-amber-400 text-slate-950 animate-pulse" : "bg-emerald-500 text-white"}`}>
                    {isBudgetExpired ? "Expirado" : `Válido até 20/12/${new Date().getFullYear()}`}
                  </span>
                </div>
                <span className="text-lg sm:text-xl font-extrabold text-white block mt-0.5">
                  {formattedBudget}
                </span>
              </div>
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-[90%] mx-auto py-2 sm:py-6">
          {[
            {
              title: "Órgão de Direção e Gestão",
              blockLabel: "Bloco 3 & 3.1",
              icon: LayoutGrid,
              color: "bg-[#1e3a8a]",
              items: menuItems[0]?.items,
              accessible: menuItems[0]?.accessible,
              visible: menuItems[0]?.visible,
            },
            {
              title: "Unidade orgânica",
              blockLabel: "Bloco 4, 4.1 & 4.2",
              icon: Building2,
              color: "bg-[#991b1b]",
              items: menuItems[1]?.items,
              accessible: menuItems[1]?.accessible,
              visible: menuItems[1]?.visible,
            },
            {
              title: "Serviços Centrais",
              blockLabel: "Bloco 5, 5.1 & 5.2",
              icon: Briefcase,
              color: "bg-[#4b5563]",
              items: menuItems[2]?.items,
              accessible: menuItems[2]?.accessible,
              visible: menuItems[2]?.visible,
            },
            {
              title: "Sistema",
              blockLabel: "Bloco 6",
              icon: Settings,
              color: "bg-slate-950",
              items: menuItems[3]?.items,
              accessible: menuItems[3]?.accessible,
              visible: menuItems[3]?.visible,
            },
            {
              title: "Documentos Normativos",
              blockLabel: "Bloco 7",
              icon: FileText,
              color: "bg-teal-800",
              items: [],
              accessible: true,
              visible: false,
              onClickDirect: () => onNavigate("Documentos Normativos", []),
            },
            {
              title: "Relatórios e Balanços",
              blockLabel: "Bloco 8",
              icon: TrendingUp,
              color: "bg-purple-800",
              items: [],
              accessible: true,
              visible: false,
              onClickDirect: () => onNavigate("Relatórios", []),
            },
            {
              title: "Relatório de Atividades",
              blockLabel: "Bloco 9",
              icon: FileCheck,
              color: "bg-amber-700",
              items: [],
              accessible: true,
              visible: false,
              onClickDirect: () => onNavigate("Relatório de Atividades", []),
            },
          ]
            .filter((item) => item && item.visible)
            .map((item: any, index) => (
              <button
                key={index}
                onClick={() => {
                  if (item.onClickDirect) {
                    item.onClickDirect();
                  } else {
                    onNavigate(item.title, item.items || []);
                  }
                }}
                className={`${item.color} w-full text-white p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-between gap-4 min-h-[180px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer text-center group relative`}
              >
                <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors shrink-0 mt-2">
                  <item.icon
                    className="w-10 h-10 lg:w-12 lg:h-12"
                    strokeWidth={1.5}
                  />
                </div>

                <span className={`${index === 0 ? "text-[13px]" : "text-sm sm:text-base lg:text-lg"} font-black font-serif tracking-tight leading-tight w-full text-center mt-1`}>
                  {item.title}
                </span>
              </button>
            ))}
        </div>
      </main>
    </div>
  );
}
