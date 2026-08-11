import React, { useState, useEffect } from "react";
import { Pen, Upload, X, Loader2, FileText, CheckCircle, List } from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { motion, AnimatePresence } from "motion/react";

type TabType = "signatures" | "despachos" | "pareceres";

export default function AssinaturaDigitalView({
  user,
  onBack,
}: {
  user: any;
  onBack: () => void;
}) {
  const [signature, setSignature] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("signatures");

  useEffect(() => {
    const unsub = firestoreService.signatures.subscribe((sigs: any[]) => {
      const userSig = sigs.find((sig) => sig.userId === user?.id);
      setSignature(userSig || null);
    });
    return unsub;
  }, [user]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        try {
          if (signature) {
            await firestoreService.signatures.update(signature.id, {
              data: base64String,
              updatedAt: new Date().toISOString(),
            });
          } else {
            await firestoreService.signatures.add({
              userId: user?.id,
              userName: user?.name,
              data: base64String,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.error("Error updating signature", e);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 md:p-10 font-serif">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
      >
        <X size={20} /> Voltar
      </button>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 max-w-4xl w-full overflow-hidden flex flex-col min-h-[600px]">
        {/* Header Section */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter">
            Gestão de Assinaturas e Atos
          </h1>
          <p className="text-slate-500 italic">
            Gerencie suas assinaturas digitais, consulte seus despachos e acompanhe seus pareceres emitidos.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-4 bg-white sticky top-0 z-10">
          <button
            onClick={() => setActiveTab("signatures")}
            className={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${
              activeTab === "signatures"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Pen size={18} /> Minhas Assinaturas
          </button>
          <button
            onClick={() => setActiveTab("despachos")}
            className={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${
              activeTab === "despachos"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <CheckCircle size={18} /> Meus Despachos
          </button>
          <button
            onClick={() => setActiveTab("pareceres")}
            className={`px-6 py-4 flex items-center gap-2 font-bold text-sm transition-all border-b-2 ${
              activeTab === "pareceres"
                ? "border-blue-900 text-blue-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileText size={18} /> Meus Pareceres
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "signatures" && (
              <motion.div
                key="signatures"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
                  <h3 className="text-lg font-black text-slate-800 mb-4 text-center">Assinatura Digitalizada</h3>
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white mb-6">
                    {signature ? (
                      <img
                        src={signature.data}
                        alt="Assinatura"
                        className="max-h-40 max-w-full object-contain mb-6"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <Pen size={32} className="text-slate-300" />
                      </div>
                    )}

                    <label className="cursor-pointer flex items-center gap-3 bg-blue-900 text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-blue-800 transition-all shadow-lg">
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                      {signature ? "Alterar Assinatura" : "Carregar Assinatura"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={loading}
                      />
                    </label>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-slate-500 font-medium">
                      Local onde serão armazenadas todas as suas assinaturas para uso em documentos oficiais.
                    </p>
                    {signature && (
                      <p className="text-xs text-slate-400">
                        Última atualização: {new Date(signature.updatedAt || signature.createdAt).toLocaleDateString("pt-PT")}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "despachos" && (
              <motion.div
                key="despachos"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <div className="w-20 h-20 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Meus Despachos</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-4 mb-8 italic">
                  Lugar onde serão armazenados todos os seus despachos emitidos no sistema, permitindo consulta histórica e acompanhamento.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 w-full">
                  <p className="text-slate-400 font-medium italic">Nenhum despacho registado nesta conta até ao momento.</p>
                </div>
              </motion.div>
            )}

            {activeTab === "pareceres" && (
              <motion.div
                key="pareceres"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-6">
                  <FileText size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Meus Pareceres</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-4 mb-8 italic">
                  Lugar onde serão armazenados todos os seus pareceres técnicos, instrutivos e vinculativos emitidos em processos.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 w-full">
                  <p className="text-slate-400 font-medium italic">Nenhum parecer registado nesta conta até ao momento.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
