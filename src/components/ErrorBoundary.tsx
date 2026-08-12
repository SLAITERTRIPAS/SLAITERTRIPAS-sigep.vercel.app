import React, { ErrorInfo, ReactNode, Key } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  key?: Key;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends (React.Component as any) {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "ErrorBoundary apanhou um erro de renderização:",
      error,
      errorInfo,
    );

    const errStr = String(error?.message || error || "");
    if (
      errStr.includes("FIRESTORE") ||
      errStr.includes("INTERNAL ASSERTION FAILED") ||
      errStr.includes("Unexpected state") ||
      errStr.includes("Could not reach Cloud Firestore") ||
      errStr.includes("Converting circular structure to JSON") ||
      errStr.includes("circular structure")
    ) {
      // Auto-recuperação imediata para erros transitórios/internos do SDK Firestore ou estruturas circulares
      setTimeout(() => {
        if ((this as any).state.hasError) {
          (this as any).setState({ hasError: false, error: null });
        }
      }, 300);
    }
  }

  handleTryAgain = () => {
    (this as any).setState({ hasError: false, error: null });
    if ((this as any).props.onReset) {
      (this as any).props.onReset();
    }
  };

  handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem("sigep_logged_in_user");
      localStorage.removeItem("sigep_current_view");
      localStorage.removeItem("sigep_users_cache");
      sessionStorage.clear();
    } catch (e) {
      console.warn("Erro ao limpar cache:", e);
    }
    window.location.reload();
  };

  render() {
    if ((this as any).state.hasError) {
      const errStr = String((this as any).state.error?.message || (this as any).state.error || "");
      const isFirestoreInternalError =
        errStr.includes("FIRESTORE") ||
        errStr.includes("INTERNAL ASSERTION FAILED") ||
        errStr.includes("Unexpected state") ||
        errStr.includes("Converting circular structure to JSON") ||
        errStr.includes("circular structure");

      if (isFirestoreInternalError) {
        // Se for erro interno do Firestore, tenta renderizar o conteúdo original enquanto auto-recupera em background
        return (this as any).props.children;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-xl w-full bg-white rounded-3xl p-8 shadow-2xl border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600 font-black text-2xl">
              !
            </div>
            <h2 className="text-xl font-black mb-2 text-slate-900 tracking-tight">
              Falha de Renderização Detetada
            </h2>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              O sistema intercetou e isolou um erro nesta vista para evitar que
              a aplicação fique indisponível.
            </p>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-left mb-6 overflow-auto max-h-36 font-mono text-[11px] border border-slate-800">
              <code>
                {(this as any).state.error?.toString() || "Erro desconhecido"}
              </code>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={this.handleTryAgain}
                className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                Recuperar Vista / Tentar Novamente
              </button>
              <button
                type="button"
                onClick={this.handleClearCacheAndReload}
                className="w-full sm:w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Limpar Cache e Reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

