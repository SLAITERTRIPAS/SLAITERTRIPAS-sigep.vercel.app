import React, { useState, useEffect } from "react";
import {
  User,
  Maximize2,
  Minimize2,
  Minus,
  Power,
  ArrowLeft,
  Bell,
  ChevronRight,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Mail,
  MessageSquare,
  AlertCircle,
  Settings,
  Database,
  X,
  RefreshCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import NotificationCenter from "../bloco5_sistema/NotificationCenter";
import ChangePasswordModal from "./ChangePasswordModal";
import ShareProcessoModal from "../../components/modals/ShareProcessoModal";
import { toTitleCase as tc, confirmWorkspaceExit } from "../../lib/utils";
import { getRoles, isSuperBossUser } from "../../lib/auth";

interface MainHeaderProps {
  user?: any;
  colaboradores?: any[];
  onBack?: () => void;
  onLogout?: () => void;
  showBack?: boolean;
  title?: string;
  actions?: React.ReactNode;
  breadcrumb?: string[];
  onBreadcrumbClick?: (index: number, crumbText: string) => void;
  unreadMessagesCount?: number;
  onOpenMessages?: () => void;
  onOpenBackup?: () => void;
  onMinimize?: () => void;
  onSync?: () => void;
}

const textShadowStyle = {
  textShadow: `
    1px 1px 0px #000,
    2px 2px 0px #000,
    3px 3px 0px #000,
    4px 4px 0px #000,
    5px 5px 10px rgba(0,0,0,0.8)
  `,
};

const textShadowLight = {
  textShadow: "1px 1px 0px #000, 2px 2px 0px #000",
};

export default function MainHeader({
  user,
  colaboradores = [],
  onBack,
  onLogout,
  showBack = true,
  title,
  actions,
  breadcrumb,
  onBreadcrumbClick,
  unreadMessagesCount = 0,
  onOpenMessages,
  onOpenBackup,
  onMinimize,
  onSync,
}: MainHeaderProps) {
  const [now, setNow] = useState(new Date());
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rawDayOfWeek = now.toLocaleDateString("pt-PT", { weekday: "long" });
  const dayOfWeek =
    rawDayOfWeek.charAt(0).toUpperCase() + rawDayOfWeek.slice(1);
  const dateStr = now.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const userTitle =
    user?.title || user?.cargoChefia || user?.cargo || user?.role || "";
  const roles = getRoles(userTitle);
  const isAllowedForNotifications =
    isSuperBossUser(user) || roles.isDG || roles.isDC || roles.isCD;

  const [isOnline, setIsOnline] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const getDisplayName = (u: any) => {
    if (u?.name) {
      const parts = u.name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
      return u.name;
    }
    return u?.id || u?.nuit || "Utilizador";
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange,
      );
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const docEl = document.documentElement;
      const requestMethod =
        docEl.requestFullscreen ||
        (docEl as any).mozRequestFullScreen ||
        (docEl as any).webkitRequestFullScreen ||
        (docEl as any).msRequestFullscreen;
      if (requestMethod) {
        requestMethod.call(docEl).catch((err) => {
          console.warn("Erro ao tentar entrar em tela cheia:", err);
        });
      }
    } else {
      const exitMethod =
        document.exitFullscreen ||
        (document as any).mozCancelFullScreen ||
        (document as any).webkitExitFullscreen ||
        (document as any).msExitFullscreen;
      if (exitMethod) {
        exitMethod.call(document).catch((err) => {
          console.warn("Erro ao tentar sair de tela cheia:", err);
        });
      }
    }
  };

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handleStatus);
    window.addEventListener("offline", handleStatus);
    return () => {
      window.removeEventListener("online", handleStatus);
      window.removeEventListener("offline", handleStatus);
    };
  }, []);

  return (
    <>
      {showPasswordModal && (
        <ChangePasswordModal
          user={user}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
      <ShareProcessoModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        userName={user?.name}
      />
      <header
        className="bg-[#050b38] w-full flex flex-col flex-none z-50 shadow-2xl relative border-b border-white/20"
        style={{ fontFamily: '"Bookman Old Style", serif' }}
      >
        <div className="w-full flex justify-between items-center px-2 sm:px-4 md:px-6 pt-1 pb-1 gap-2 md:gap-4">
          {/* Left - Logos */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="flex border-2 border-white p-0.5 rounded-xl items-center justify-center bg-white overflow-hidden w-8 h-8 md:w-11 md:h-11 shrink-0 shadow-lg">
              <img
                src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad"
                alt="Logo ISPS"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <h1
                  className="text-xs md:text-lg lg:text-xl font-black tracking-tight text-white"
                  style={textShadowStyle}
                >
                  SIGEP-
                </h1>
                <h1
                  className="text-xs md:text-lg lg:text-xl font-black tracking-tight text-[#FFB800]"
                  style={textShadowStyle}
                >
                  ISPS
                </h1>
              </div>
              <h2
                className="text-[6px] md:text-[7px] font-black tracking-[0.2em] text-white uppercase"
                style={textShadowLight}
              >
                Gestão de Planificação
              </h2>
            </div>
          </div>

          {/* Center - Date & Time (Floating Box) */}
          <div 
            className="hidden lg:flex flex-col items-center justify-center border-2 border-white/20 px-4 py-1 bg-[#0a0f2b] min-w-[220px] mx-auto overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-t-white/40 border-l-white/40"
            style={{ 
              fontFamily: '"Bookman Old Style", serif',
              borderRadius: '0.5px' 
            }}
          >
            <div className="flex flex-col items-center justify-center gap-0.5 w-full leading-tight">
              <span
                className="text-[#FFB800] text-sm font-black tracking-widest uppercase"
                style={textShadowStyle}
              >
                {dayOfWeek}
              </span>
              <span
                className="text-white text-lg font-black tracking-[0.1em] tabular-nums"
                style={textShadowStyle}
              >
                {timeStr}
              </span>
              <span
                className="text-white text-[10px] font-black tracking-widest"
                style={textShadowStyle}
              >
                {dateStr}
              </span>
            </div>
          </div>

          {/* Right - User Info and System Controls */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Notification Center */}
            {isAllowedForNotifications && <NotificationCenter user={user} />}
            
            {/* User Profile Area */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <div className="w-8 h-8 md:w-11 md:h-11 bg-[#E1E8FA] rounded-2xl border-2 border-[#FFB800] flex items-center justify-center text-[#121c60] shadow-xl overflow-hidden">
                  {(() => {
                    const colab = colaboradores.find(
                      (c) => c.nuit === user?.nuit || c.email === user?.email,
                    );
                    const photo =
                      user?.photoURL ||
                      user?.photo ||
                      colab?.photo ||
                      colab?.foto;
                    return photo ? (
                      <img
                        src={photo}
                        alt={user?.name || "Utilizador"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User
                        className="w-6 h-6 md:w-[28px] md:h-[28px]"
                        strokeWidth={2.5}
                      />
                    );
                  })()}
                </div>
                <div className="absolute -bottom-1 -right-0.5 w-4 h-4 bg-[#00FF00] rounded-full border-2 border-[#050b38]"></div>
              </div>

              <div className="hidden sm:flex flex-col gap-1 min-w-0">
                <span
                  className="text-white font-black text-[8px] md:text-[10px] lg:text-[11px] tracking-widest truncate max-w-[180px] lg:max-w-[220px] uppercase"
                  style={textShadowStyle}
                >
                  {getDisplayName(user).toUpperCase()}
                </span>
                <div className="bg-[#FFB800] text-black text-[5px] md:text-[6px] font-black px-3 py-0.5 rounded shadow-md tracking-wider uppercase truncate">
                  {isSuperBossUser(user)
                    ? "PROPRIETÁRIO E PROGRAMADOR"
                    : (
                        user?.cargo ||
                        user?.role ||
                        "Administrador"
                      ).toUpperCase()}
                </div>
                <div className="bg-black/60 text-white text-[5px] md:text-[6px] font-black px-3 py-0.5 rounded shadow-md tracking-wider uppercase truncate border border-white/10">
                  {isSuperBossUser(user)
                    ? "PROPRIETÁRIO DO SISTEMA"
                    : (user?.direcao || user?.departamento || "").toUpperCase()}
                </div>
              </div>
            </div>

            {/* System Icons (Window Controls style) */}
            <div className="flex items-center gap-1.5 md:gap-2">
              {isSuperBossUser(user) && (
                <button
                  onClick={onSync}
                  title="Sincronizar"
                  className="w-7 h-7 flex items-center justify-center border-2 border-blue-500 rounded bg-transparent text-blue-500 hover:bg-blue-500/10 transition-all"
                >
                  <RefreshCcw size={16} />
                </button>
              )}
              <button
                onClick={onOpenBackup}
                title="Base de Dados"
                className="w-7 h-7 flex items-center justify-center border-2 border-slate-400 rounded bg-transparent text-slate-100 hover:bg-slate-400/10 transition-all"
              >
                <Database size={16} />
              </button>
              <button
                onClick={onMinimize}
                title="Minimizar"
                className="w-7 h-7 flex items-center justify-center border-2 border-yellow-500 rounded bg-transparent text-yellow-500 hover:bg-yellow-500/10 transition-all"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={toggleFullscreen}
                title="Maximizar"
                className="w-7 h-7 flex items-center justify-center border-2 border-green-500 rounded bg-transparent text-green-500 hover:bg-green-500/10 transition-all"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={onLogout}
                title="Sair / Fechar"
                className="w-7 h-7 flex items-center justify-center border-2 border-red-500 rounded bg-transparent text-red-500 hover:bg-red-500/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Separator and Title */}
        <div className="w-full px-2 sm:px-4 md:px-6 pb-1 pt-0.5 border-t border-white/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBack && onBack && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBack();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBack();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBack();
                  }}
                  className="bg-transparent hover:bg-amber-500/10 border-2 border-amber-500/70 text-amber-500 active:scale-95 px-3 py-1 rounded-full flex items-center gap-2 font-black shadow-lg transition-all cursor-pointer relative z-10 select-none"
                  title="Voltar"
                >
                  <ArrowLeft size={16} strokeWidth={3} />
                  <span className="text-[6px] font-black tracking-widest uppercase">
                    Voltar
                  </span>
                </button>
              )}

              <h2
                className="text-[#FFB800] text-[9px] md:text-[12px] lg:text-base font-black tracking-widest leading-none uppercase"
                style={textShadowStyle}
              >
                {title || "Menu Principal"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00FF00] rounded-full shadow-[0_0_10px_#00FF00]"></div>
              <span
                className="text-white text-[7px] md:text-[8px] font-black tracking-[0.1em] uppercase"
                style={textShadowLight}
              >
                Sistema online
              </span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
