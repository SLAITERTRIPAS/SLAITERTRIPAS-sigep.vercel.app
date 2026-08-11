import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Mail,
  Send,
  Save,
  X,
  Printer,
  ShieldCheck,
  MapPin,
  Hash,
  User,
  FileText,
  Globe,
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";

type ExpedienteTipo = "Entrada" | "Saída" | "Sic";

export default function FormularioExpediente({
  user,
  onCancel,
  tipoInitial = "Entrada",
}: {
  user: any;
  onCancel: () => void;
  tipoInitial?: ExpedienteTipo;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tipo, setTipo] = useState<ExpedienteTipo>(tipoInitial);

  const [formData, setFormData] = useState({
    numero: "A carregar...",
    data: new Date().toISOString().split("T")[0],
    assunto: "",
    origem:
      tipoInitial === "Entrada"
        ? ""
        : user?.departamento || user?.direcao || "Secretaria Geral",
    destino:
      tipoInitial === "Saída"
        ? ""
        : user?.departamento || user?.direcao || "Secretaria Geral",
    referenciaExterna: "",
    observacoes: "",
    urgencia: "Normal",
  });

  React.useEffect(() => {
    const generateCode = async () => {
      const prefix =
        tipo === "Entrada" ? "Ent" : tipo === "Saída" ? "Sai" : "Sic";
      const unitKey = `EXP-${prefix}-${new Date().getFullYear()}`;
      const nextNum = await firestoreService.counters.getNextNumber(unitKey);
      const paddedNum = String(nextNum).padStart(3, "0");
      setFormData((prev) => ({
        ...prev,
        numero: `${prefix}/${new Date().getFullYear()}/${paddedNum}`,
      }));
    };
    generateCode();
  }, [tipo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await firestoreService.expedientes.add({
        ...formData,
        tipo,
        status: "Pendente",
        criadoPor: user.name,
        userId: user.id,
        timestamp: new Date().toISOString(),
        historico: [
          {
            data: new Date().toISOString(),
            setor: user.departamento || "Secretaria Geral",
            acao: `Registro Inicial (${tipo})`,
            parecer: "Expediente registado no sistema.",
          },
        ],
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("Erro ao registar expediente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Success Overlay */}
      {isSubmitted && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:hidden">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">
              Expediente registado!
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              O expediente{" "}
              <span className="font-bold text-slate-900">
                {formData.numero}
              </span>{" "}
              foi gravado com sucesso. O número de rastreio está ativo.
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => window.print()}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Imprimir comprovativo / guia
              </button>
              <button
                onClick={onCancel}
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-slate-200 transition-all"
              >
                Fechar e voltar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-200"
      >
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-6 relative z-10">
            <div
              className={`p-4 rounded-2xl backdrop-blur-md border border-white/10 ${tipo === "Entrada" ? "bg-blue-500/20" : "bg-amber-500/20"}`}
            >
              {tipo === "Entrada" ? (
                <Mail className="text-blue-400" size={32} />
              ) : (
                <Send className="text-amber-400" size={32} />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none">
                Registo de expediente
              </h1>
              <p className="text-slate-400 text-xs font-bold tracking-[0.2em] mt-1 italic">
                Gestão core de correspondência
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-black text-slate-500 tracking-widest leading-tight">
              Nº de Protocolo
            </div>
            <div className="text-lg font-mono font-black text-white leading-tight">
              {formData.numero}
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-100 p-4 bg-gray-50/50 gap-4">
          <button
            type="button"
            onClick={() => setTipo("Entrada")}
            className={`flex-1 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${tipo === "Entrada" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-200"}`}
          >
            Entrada
          </button>
          <button
            type="button"
            onClick={() => setTipo("Saída")}
            className={`flex-1 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${tipo === "Saída" ? "bg-amber-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-200"}`}
          >
            Saída
          </button>
          <button
            type="button"
            onClick={() => setTipo("Sic")}
            className={`flex-1 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${tipo === "Sic" ? "bg-emerald-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-200"}`}
          >
            SIC
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <Globe size={18} className="text-slate-400" />
                <h3 className="font-black text-slate-900 text-xs tracking-widest">
                  Procedência / destino
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    {tipo === "Entrada"
                      ? "Origem (Remetente)"
                      : "Origem (Setor Interno)"}
                  </label>
                  <input
                    required
                    value={formData.origem}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        origem: e.target.value,
                      }))
                    }
                    placeholder={
                      tipo === "Entrada"
                        ? "Ex: Ministério da Educação"
                        : "Setor de Origem"
                    }
                    className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    {tipo === "Entrada"
                      ? "Destino (Setor Interno)"
                      : "Destino (Destinatário)"}
                  </label>
                  <input
                    required
                    value={formData.destino}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        destino: e.target.value,
                      }))
                    }
                    placeholder={
                      tipo === "Entrada"
                        ? "Setor de Destino"
                        : "Ex: Direção Provincial"
                    }
                    className="w-full p-3 border rounded-xl text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                <FileText size={18} className="text-slate-400" />
                <h3 className="font-black text-slate-900 text-xs tracking-widest">
                  Dados do documento
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    Referência Externa (se houver)
                  </label>
                  <input
                    value={formData.referenciaExterna}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        referenciaExterna: e.target.value,
                      }))
                    }
                    placeholder="Ex: Ofício nº 123/2026"
                    className="w-full p-3 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-slate-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          data: e.target.value,
                        }))
                      }
                      className="w-full p-3 border rounded-xl text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Urgência
                    </label>
                    <select
                      value={formData.urgencia}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          urgencia: e.target.value,
                        }))
                      }
                      className="w-full p-3 border rounded-xl text-sm outline-none"
                    >
                      <option>Normal</option>
                      <option>Urgente</option>
                      <option>Muito Urgente</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Assunto / descrição do expediente
            </label>
            <textarea
              required
              rows={4}
              value={formData.assunto}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, assunto: e.target.value }))
              }
              placeholder="Descreva o conteúdo principal do documento..."
              className="w-full p-4 border rounded-2xl text-sm focus:ring-2 focus:ring-slate-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                "A processar..."
              ) : (
                <>
                  <Save size={16} /> Gravar no protocolo
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
