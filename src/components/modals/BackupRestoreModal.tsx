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
} from "lucide-react";
import {
  exportFullBackup,
  restoreFullBackup,
  runAutomaticBackup,
  getStoredBackupsList,
  downloadStoredBackupFile,
  SYSTEM_ORGAOS,
  SystemBackupRecord,
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
  const [statusMessage, setStatusMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [organStats, setOrganStats] = useState<Record<string, number> | null>(null);
  const [storedBackups, setStoredBackups] = useState<SystemBackupRecord[]>([]);
  const [currentOrganProcessing, setCurrentOrganProcessing] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadStoredBackups();
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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setLoading(true);
        setStatusMessage("A ler o ficheiro de backup e a restaurar dados por Órgão no Firestore...");
        setErrorMessage("");
        setSuccessMessage("");
        setCurrentOrganProcessing("");

        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        const { totalRestored, restoredStats, organStats: restoredOrgans } = await restoreFullBackup(
          parsed,
          (msg) => {
            setStatusMessage(msg);
            if (msg.includes("Órgão")) {
              setCurrentOrganProcessing(msg);
            }
          },
        );

        setStats(restoredStats);
        setOrganStats(restoredOrgans);
        setSuccessMessage(
          `Restauração concluída com sucesso! ${totalRestored} registos foram salvos nos 4 Órgãos do sistema. O sistema irá atualizar em instantes...`,
        );
        setTimeout(() => {
          window.location.reload();
        }, 2000);
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
                  <span className="text-[11px] text-gray-500 font-semibold">
                    44 coleções ativas no Firestore
                  </span>
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
                <div className="border-2 border-emerald-100 bg-emerald-50/40 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-600 transition-all">
                  <div>
                    <div className="w-10 h-10 bg-emerald-700 text-white rounded-xl flex items-center justify-center mb-3 shadow-md">
                      <Upload size={20} />
                    </div>
                    <h4 className="font-black text-emerald-900 text-base mb-1">
                      Restaurar de Ficheiro Local
                    </h4>
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                      Selecione um ficheiro JSON anteriormente exportado para regravar integralmente a informação nos 4 Órgãos do Firestore.
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
                      accept=".json"
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

          {/* Stats Summary por Coleção */}
          {stats && Object.keys(stats).length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
              <h5 className="font-black text-[#121c60] text-xs uppercase tracking-wider flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-600" />
                <span>Resumo das Coleções Processadas por Órgão:</span>
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-2">
                {Object.entries(stats).map(([col, count]) => (
                  <div
                    key={col}
                    className="bg-white p-2.5 rounded-xl border border-gray-200/80 flex justify-between items-center text-xs shadow-2xs"
                  >
                    <span className="font-semibold text-gray-700 truncate mr-2" title={col}>
                      {col}
                    </span>
                    <span className="bg-[#121c60] text-white px-2 py-0.5 rounded-full font-black text-[10px]">
                      {count}
                    </span>
                  </div>
                ))}
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


