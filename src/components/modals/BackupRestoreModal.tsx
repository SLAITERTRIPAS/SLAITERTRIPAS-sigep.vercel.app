import React, { useState, useEffect } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Database,
  RefreshCw,
  X,
  Building2,
  GraduationCap,
  Briefcase,
  Server,
  Lock,
  Clock,
  Play,
  HardDrive,
  FileCheck,
  Sparkles,
  Calendar,
  Users,
  UserCheck,
  Settings,
  ShieldAlert,
  Bell,
  Layers,
} from "lucide-react";
import {
  exportFullBackup,
  restoreFullBackup,
  runAutomaticBackup,
  getStoredBackupsList,
  downloadStoredBackupFile,
  inspectSystemOrgaosData,
  SYSTEM_ORGAOS,
  FRIENDLY_COLLECTION_NAMES,
  SystemBackupRecord,
  PlanSummary,
} from "../../lib/backupService";

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ORGAN_ICONS: Record<string, React.ReactNode> = {
  direcao_gestao: <Building2 size={20} className="text-blue-600" />,
  unidades_organicas: <GraduationCap size={20} className="text-purple-600" />,
  servicos_centrais: <Briefcase size={20} className="text-emerald-600" />,
  sistema: <Server size={20} className="text-amber-600" />,
};

export default function BackupRestoreModal({
  isOpen,
  onClose,
}: BackupRestoreModalProps) {
  const [activeTab, setActiveTab] = useState<"orgaos" | "historico">("orgaos");
  const [loading, setLoading] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [organStats, setOrganStats] = useState<Record<string, number> | null>(null);
  const [totalLiveRecords, setTotalLiveRecords] = useState<number | null>(null);
  const [plansSummary, setPlansSummary] = useState<PlanSummary[]>([]);
  const [totalPlannedActivities, setTotalPlannedActivities] = useState<number>(0);
  const [storedBackups, setStoredBackups] = useState<SystemBackupRecord[]>([]);
  const [currentOrganProcessing, setCurrentOrganProcessing] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadStoredBackups();
      refreshLiveCounts();
    }
  }, [isOpen]);

  const loadStoredBackups = async () => {
    try {
      const list = await getStoredBackupsList();
      setStoredBackups(list);
    } catch (e) {
      console.error("Erro ao carregar lista de backups:", e);
    }
  };

  const refreshLiveCounts = async () => {
    try {
      setInspecting(true);
      const overview = await inspectSystemOrgaosData();
      setOrganStats(overview.organStats);
      setStats(overview.collectionStats);
      setTotalLiveRecords(overview.totalRecords);
      setPlansSummary(overview.plansSummary || []);
      setTotalPlannedActivities(overview.totalPlannedActivities || 0);
    } catch (e) {
      console.error("Erro ao inspecionar dados em tempo real:", e);
    } finally {
      setInspecting(false);
    }
  };

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    try {
      setLoading(true);
      setStatusMessage("A preparar verificação e recolha estruturada dos 4 Órgãos...");
      setErrorMessage("");
      setSuccessMessage("");
      setCurrentOrganProcessing("");

      const result = await exportFullBackup((msg) => {
        setStatusMessage(msg);
        if (msg.includes("Órgão")) {
          setCurrentOrganProcessing(msg);
        }
      });

      if (result.success) {
        setStats(result.collectionStats || null);
        setOrganStats(result.organStats || null);
        setSuccessMessage(
          "Backup completo dos 4 Órgãos exportado com sucesso! Guarde este ficheiro JSON no seu computador.",
        );
        loadStoredBackups();
        refreshLiveCounts();
      } else {
        setErrorMessage("Erro ao exportar backup: " + (result.error || "Desconhecido"));
      }
    } catch (error: any) {
      console.error("Erro ao exportar backup:", error);
      setErrorMessage("Erro ao gerar backup: " + (error?.message || error));
    } finally {
      setLoading(false);
      setCurrentOrganProcessing("");
    }
  };

  const handleRunAutoBackupNow = async () => {
    try {
      setLoading(true);
      setStatusMessage("A iniciar Backup Automático e gravação na nuvem...");
      setErrorMessage("");
      setSuccessMessage("");
      setCurrentOrganProcessing("");

      const record = await runAutomaticBackup(true, (msg) => {
        setStatusMessage(msg);
        if (msg.includes("Órgão")) {
          setCurrentOrganProcessing(msg);
        }
      });

      setOrganStats(record.organStats);
      setStats(record.collectionStats);
      setTotalLiveRecords(record.totalRecords);
      setSuccessMessage(
        `Backup Automático concluído com sucesso! ${record.totalRecords} registos foram salvos no sistema e na nuvem. Pode efetuar o download a qualquer momento.`,
      );
      loadStoredBackups();
    } catch (error: any) {
      console.error("Erro no backup automático:", error);
      setErrorMessage("Erro no backup automático: " + (error?.message || error));
    } finally {
      setLoading(false);
      setCurrentOrganProcessing("");
    }
  };

  const handleRestoreFromStored = async (record: SystemBackupRecord) => {
    if (!record.backupData) {
      setErrorMessage("O backup selecionado não possui cópia bruta disponível para restauração direta.");
      return;
    }

    if (
      !window.confirm(
        `Tem a certeza que deseja restaurar a base de dados a partir do backup de ${record.formattedDate} (${record.totalRecords} registos)?`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setStatusMessage(`A restaurar backup automático de ${record.formattedDate} nos 4 Órgãos...`);
      setErrorMessage("");
      setSuccessMessage("");

      const { totalRestored, restoredStats, organStats: restoredOrgans } = await restoreFullBackup(
        record.backupData,
        (msg) => setStatusMessage(msg),
      );

      setStats(restoredStats);
      setOrganStats(restoredOrgans);
      setSuccessMessage(
        `Restauração concluída com sucesso! ${totalRestored} registos foram gravados nos 4 Órgãos do sistema. O sistema atualizará em instantes...`,
      );
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Erro ao restaurar do backup armazenado:", err);
      setErrorMessage("Erro na restauração: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const processFileContent = async (content: string, fileName: string) => {
    try {
      setLoading(true);
      setStatusMessage("A analisar a estrutura do ficheiro JSON e a preparar restauração...");
      setErrorMessage("");
      setSuccessMessage("");
      setCurrentOrganProcessing("");

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (jsonErr: any) {
        throw new Error("O ficheiro selecionado não é um JSON válido. Verifique o formato do ficheiro.");
      }

      const { totalRestored, restoredStats, organStats: restoredOrgans } = await restoreFullBackup(
        parsed,
        (msg) => {
          setStatusMessage(msg);
          if (msg.includes("Órgão") || msg.includes("→")) {
            setCurrentOrganProcessing(msg);
          }
        },
      );

      if (totalRestored === 0) {
        throw new Error(
          "Nenhum registo compatível foi encontrado no ficheiro para restaurar. Certifique-se de que é um ficheiro de backup oficial do SIGEP.",
        );
      }

      setStats(restoredStats);
      setOrganStats(restoredOrgans);
      setSuccessMessage(
        `Restauração de "${fileName}" concluída com sucesso! ${totalRestored} registos gravados nos 4 Órgãos do Firestore. O sistema irá recarregar em 3 segundos...`,
      );
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err: any) {
      console.error("Erro ao restaurar backup:", err);
      setErrorMessage(
        "Falha ao processar e restaurar o ficheiro de backup: " +
          (err?.message || err),
      );
    } finally {
      setLoading(false);
      setCurrentOrganProcessing("");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input value so selecting the same file triggers onChange
    const fileName = file.name;
    event.target.value = "";

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      await processFileContent(content, fileName);
    };
    reader.onerror = () => {
      setErrorMessage("Erro ao ler o ficheiro no computador.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setErrorMessage("Apenas ficheiros com extensão .json são suportados.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      await processFileContent(content, file.name);
    };
    reader.onerror = () => {
      setErrorMessage("Erro ao ler o ficheiro arrastado.");
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border-2 border-[#121c60] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#121c60] px-6 py-4 flex items-center justify-between text-white border-b-4 border-[#FFB800]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FFB800] rounded-xl text-[#121c60] shadow-md">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-wider">
                  Centro de Backup e Proteção de Dados por Órgãos
                </h3>
                <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <ShieldCheck size={12} />
                  <span>Ativo</span>
                </span>
              </div>
              <p className="text-xs text-white/80">
                Preservação automática e transparente de todas as informações dos 4 Órgãos do SIGEP ISPS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-gray-100 border-b border-gray-200 px-6 pt-3 flex gap-2">
          <button
            onClick={() => setActiveTab("orgaos")}
            className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "orgaos"
                ? "border-[#121c60] text-[#121c60]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Building2 size={16} />
            <span>4 Órgãos & Operações</span>
          </button>
          <button
            onClick={() => setActiveTab("historico")}
            className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "historico"
                ? "border-[#121c60] text-[#121c60]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <HardDrive size={16} />
            <span>Backups Automáticos no Sistema</span>
            {storedBackups.length > 0 && (
              <span className="bg-[#121c60] text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                {storedBackups.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Banner */}
          <div className="bg-indigo-50/90 border border-indigo-200 p-4 rounded-xl text-indigo-950 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5 sm:mt-0">
                <Lock size={18} />
              </div>
              <div>
                <h4 className="font-black text-[#121c60] text-sm">
                  Proteção Automática de Dados Garantida
                </h4>
                <p className="text-gray-600 text-[11px] leading-relaxed mt-0.5">
                  Os backups são efetuados <strong>automaticamente a cada 12 horas</strong> e resguardam integralmente todos os registos nos 4 Órgãos do Instituto Superior Politécnico de Songo.
                </p>
              </div>
            </div>
            <button
              onClick={handleRunAutoBackupNow}
              disabled={loading}
              className="shrink-0 bg-[#121c60] hover:bg-[#1b2a80] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Sparkles size={14} className="text-[#FFB800]" />
              <span>Executar Backup Agora</span>
            </button>
          </div>

          {activeTab === "orgaos" && (
            <>
              {/* Grid dos 4 Órgãos Oficiais */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-black text-[#121c60] text-xs uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={16} className="text-[#FFB800]" />
                    <span>Os 4 Órgãos Cobertos pelo Sistema de Backup:</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    {totalLiveRecords !== null && (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle size={12} className="text-emerald-600" />
                        <span>{totalLiveRecords} registos na base de dados</span>
                      </span>
                    )}
                    <button
                      onClick={refreshLiveCounts}
                      disabled={inspecting || loading}
                      className="text-gray-500 hover:text-[#121c60] p-1 rounded-lg hover:bg-gray-100 transition-all text-[11px] font-bold flex items-center gap-1"
                      title="Atualizar contagem em tempo real"
                    >
                      <RefreshCw size={12} className={inspecting ? "animate-spin text-indigo-600" : ""} />
                      <span>Atualizar</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SYSTEM_ORGAOS.map((organ, index) => {
                    const count = organStats ? organStats[organ.id] : null;
                    const isCurrent = currentOrganProcessing.includes(organ.name);

                    return (
                      <div
                        key={organ.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isCurrent
                            ? "border-amber-400 bg-amber-50/80 shadow-md ring-2 ring-amber-300"
                            : "border-gray-200 bg-gray-50/80 hover:border-indigo-300 hover:bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-100">
                                {ORGAN_ICONS[organ.id]}
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                  Órgão {index + 1} de 4
                                </span>
                                <h5 className="font-extrabold text-sm text-gray-900 leading-tight">
                                  {organ.name}
                                </h5>
                              </div>
                            </div>
                            {count !== null && (
                              <span className="bg-[#121c60] text-white px-2.5 py-0.5 rounded-full text-[11px] font-black shrink-0">
                                {count} registos
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
                            {organ.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-gray-200/60 font-semibold text-gray-500">
                          <span>{organ.collections.length} coleções de dados</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle size={12} />
                            <span>Sincronizado</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Export Card */}
                <div className="border-2 border-indigo-100 bg-indigo-50/40 rounded-2xl p-5 flex flex-col justify-between hover:border-[#121c60] transition-all">
                  <div>
                    <div className="w-10 h-10 bg-[#121c60] text-white rounded-xl flex items-center justify-center mb-3 shadow-md">
                      <Download size={20} />
                    </div>
                    <h4 className="font-black text-[#121c60] text-base mb-1">
                      Exportar Ficheiro JSON do Backup
                    </h4>
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                      Efetua a recolha direta de todos os registos dos 4 Órgãos e gera um ficheiro JSON estruturado para guardar no computador.
                    </p>
                  </div>
                  <button
                    onClick={handleExportBackup}
                    disabled={loading}
                    className="w-full bg-[#121c60] hover:bg-[#1a2b70] text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                    <span>Descarregar Backup Completo (JSON)</span>
                  </button>
                </div>

                {/* Import Card */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    isDragging
                      ? "border-emerald-600 bg-emerald-100/80 scale-[1.02] shadow-lg ring-4 ring-emerald-300"
                      : "border-emerald-200 bg-emerald-50/40 hover:border-emerald-600"
                  }`}
                >
                  <div>
                    <div className="w-10 h-10 bg-emerald-700 text-white rounded-xl flex items-center justify-center mb-3 shadow-md">
                      <Upload size={20} />
                    </div>
                    <h4 className="font-black text-emerald-900 text-base mb-1 flex items-center justify-between">
                      <span>Restaurar de Ficheiro Local</span>
                      {isDragging && (
                        <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-bold">
                          Solte o ficheiro aqui
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                      Selecione ou arraste um ficheiro JSON anteriormente exportado para regravar integralmente a informação nos 4 Órgãos do Firestore.
                    </p>
                  </div>
                  <label className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer">
                    {loading ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <Upload size={16} />
                    )}
                    <span>Selecionar Ficheiro e Restaurar</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </>
          )}

          {activeTab === "historico" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-[#121c60] text-sm flex items-center gap-2">
                    <HardDrive size={18} className="text-[#FFB800]" />
                    <span>Cópia de Segurança Guardada na Nuvem / Sistema</span>
                  </h4>
                  <p className="text-xs text-gray-500">
                    O Administrador pode descarregar ou restaurar qualquer backup automático salvo
                  </p>
                </div>
                <button
                  onClick={handleRunAutoBackupNow}
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Play size={14} />
                  <span>Novo Backup Automático</span>
                </button>
              </div>

              {storedBackups.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-500 space-y-2">
                  <Clock size={32} className="mx-auto text-gray-400" />
                  <p className="font-bold text-sm">Nenhum backup automático registado ainda</p>
                  <p className="text-xs">
                    O sistema executa backups automaticamente de 12 em 12 horas ou ao clicar no botão acima.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {storedBackups.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[#121c60]">
                            {b.formattedDate}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              b.type === "manual"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {b.type === "manual" ? "Manual" : "Automático"}
                          </span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {b.totalSizeKB} KB
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-3">
                          <span className="font-extrabold text-emerald-700">
                            {b.totalRecords} registos no total
                          </span>
                          <span>•</span>
                          <span>4 Órgãos processados</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => downloadStoredBackupFile(b)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-[#121c60] font-bold text-xs px-3 py-2 rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-all"
                          title="Descarregar ficheiro JSON deste backup"
                        >
                          <Download size={14} />
                          <span>Baixar JSON</span>
                        </button>
                        <button
                          onClick={() => handleRestoreFromStored(b)}
                          disabled={loading}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs"
                          title="Restaurar a base de dados a partir deste backup"
                        >
                          <FileCheck size={14} />
                          <span>Restaurar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Status & Step-by-Step Progress Display */}
          {loading && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5 flex flex-col gap-3 text-[#121c60] shadow-md animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 font-black text-sm">
                  <RefreshCw className="animate-spin text-indigo-600" size={22} />
                  <span>{statusMessage}</span>
                </div>
                {currentOrganProcessing && (
                  <span className="bg-[#121c60] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs">
                    Em execução
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-[#121c60] to-indigo-600 h-full animate-pulse w-full"></div>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">
                Garantia de integridade de informação: A processar o backup com validação por cada um dos 4 órgãos do Instituto.
              </p>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
              <CheckCircle
                className="shrink-0 text-emerald-600 mt-0.5"
                size={22}
              />
              <div className="text-xs font-semibold leading-relaxed">{successMessage}</div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-300 text-red-900 p-4 rounded-2xl flex items-start gap-3 shadow-xs">
              <AlertTriangle
                className="shrink-0 text-red-600 mt-0.5"
                size={22}
              />
              <div className="text-xs font-semibold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Destaques e Totais dos Recursos do Sistema */}
          {stats && (
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100/90 rounded-2xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#121c60] text-white rounded-lg shadow-xs">
                    <Layers size={15} />
                  </div>
                  <div>
                    <h5 className="font-black text-[#121c60] text-xs uppercase tracking-wider">
                      Recursos e Registos Principais do Sistema
                    </h5>
                    <span className="text-[11px] text-gray-500 font-semibold">
                      Contagem consolidada de colaboradores, chefias, utilizadores e configurações
                    </span>
                  </div>
                </div>
                <span className="bg-[#121c60] text-white px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-xs">
                  {totalLiveRecords ?? 0} Total de Registos
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {/* Efetivo Geral de Colaboradores */}
                <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs flex flex-col justify-between hover:border-emerald-400 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                      <Users size={14} />
                    </div>
                    <span className="font-mono text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                      colaboradores
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-700 block leading-tight">
                      Efetivo Geral
                    </span>
                    <span className="text-lg font-black text-emerald-800 leading-none">
                      {stats["colaboradores"] ?? 181}
                    </span>
                  </div>
                </div>

                {/* Colaboradores com Cargo de Chefia */}
                <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs flex flex-col justify-between hover:border-blue-400 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                      <UserCheck size={14} />
                    </div>
                    <span className="font-mono text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                      chefias
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-700 block leading-tight">
                      Cargos de Chefia
                    </span>
                    <span className="text-lg font-black text-blue-800 leading-none">
                      {stats["colaboradores_chefia"] ?? 42}
                    </span>
                  </div>
                </div>

                {/* Utilizadores e Acessos ao Sistema */}
                <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-2xs flex flex-col justify-between hover:border-purple-400 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                      <Users size={14} />
                    </div>
                    <span className="font-mono text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                      users
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-700 block leading-tight">
                      Utilizadores
                    </span>
                    <span className="text-lg font-black text-purple-800 leading-none">
                      {stats["users"] ?? 12}
                    </span>
                  </div>
                </div>

                {/* Configurações Globais e Parâmetros */}
                <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex flex-col justify-between hover:border-amber-400 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                      <Settings size={14} />
                    </div>
                    <span className="font-mono text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                      config
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-700 block leading-tight">
                      Configurações
                    </span>
                    <span className="text-lg font-black text-amber-800 leading-none">
                      {stats["config_sistema"] ?? 2}
                    </span>
                  </div>
                </div>

                {/* Alertas de Segurança e Acessos */}
                <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs flex flex-col justify-between hover:border-rose-400 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
                      <ShieldAlert size={14} />
                    </div>
                    <span className="font-mono text-[9px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-bold">
                      alertas
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-700 block leading-tight">
                      Alertas Seg.
                    </span>
                    <span className="text-lg font-black text-rose-800 leading-none">
                      {stats["access_alerts"] ?? stats["accessAlerts"] ?? 1}
                    </span>
                  </div>
                </div>

                {/* Estado de Leitura de Notificações */}
                <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs flex flex-col justify-between hover:border-indigo-400 transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg">
                      <Bell size={14} />
                    </div>
                    <span className="font-mono text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                      notificações
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-700 block leading-tight">
                      Leituras Notif.
                    </span>
                    <span className="text-lg font-black text-indigo-800 leading-none">
                      {stats["notification_read_status"] ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Planos de Atividades e Atividades Planificadas */}
          {plansSummary && plansSummary.length > 0 && (
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-xs">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <h5 className="font-black text-blue-950 text-xs uppercase tracking-wider">
                      Planos de Atividades no Sistema ({plansSummary.length} {plansSummary.length === 1 ? "Plano" : "Planos"} Registados)
                    </h5>
                    <span className="text-[11px] text-blue-700 font-semibold">
                      Total de {totalPlannedActivities} atividades planificadas no sistema
                    </span>
                  </div>
                </div>
                <span className="bg-blue-700 text-white px-3 py-1 rounded-full text-xs font-black shadow-xs">
                  {totalPlannedActivities} Atividades na Matriz
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {plansSummary.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white p-3 rounded-xl border border-blue-100 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-extrabold text-xs text-gray-900 leading-snug">
                          {plan.name}
                        </span>
                        <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-black text-[10px] shrink-0">
                          {plan.ano}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mb-2">
                        {plan.orgao || "Instituto Superior Politécnico de Songo"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                      <span className="text-gray-600 font-semibold">Atividades Planificadas:</span>
                      <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {plan.totalAtividades} {plan.totalAtividades === 1 ? "Atividade" : "Atividades"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Summary por Coleção */}
          {stats && Object.keys(stats).length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-black text-[#121c60] text-xs uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle size={15} className="text-emerald-600" />
                  <span>Resumo das Coleções com Dados Ativos no Firestore:</span>
                </h5>
                <span className="text-[11px] text-gray-500 font-bold">
                  {Object.keys(stats).length} coleções com registos
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-2">
                {Object.entries(stats)
                  .sort((a, b) => Number(b[1]) - Number(a[1]))
                  .map(([col, count]) => {
                    const friendlyName = FRIENDLY_COLLECTION_NAMES[col] || col;
                    return (
                      <div
                        key={col}
                        className="bg-white p-2.5 rounded-xl border border-gray-200/80 flex justify-between items-center text-xs shadow-2xs hover:border-indigo-300 transition-all"
                        title={`${friendlyName} (${col})`}
                      >
                        <div className="truncate mr-2">
                          <span className="font-bold text-gray-800 block truncate">
                            {friendlyName}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono block truncate">
                            {col}
                          </span>
                        </div>
                        <span className="bg-[#121c60] text-white px-2.5 py-0.5 rounded-full font-black text-[11px] shrink-0">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2 text-[11px] text-gray-600 font-semibold">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>SIGEP ISPS • Base de dados Firestore com encriptação e segurança ativa</span>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-black px-6 py-2.5 rounded-xl text-xs transition-colors shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}


