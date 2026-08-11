import React, { useState, useEffect } from "react";
import { Save, Printer, Plus, Trash2, FileText } from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import SignatureUpload from "../bloco5_sistema/SignatureUpload";
import { FormLayout } from "../../components/shared/FormLayout";

interface CustosLinha {
  id: string;
  nome: string;
  descricao: string;
  dias: string;
  valorDiario: string;
  valorTotal: string;
}

interface InformacaoPropostaProps {
  user: any;
  onCancel: () => void;
}

export default function InformacaoPropostaForm({
  user,
  onCancel,
}: InformacaoPropostaProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Obter data atual para preenchimento automático
  const hoje = new Date();
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const formattedDate = `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
  const anoAtual = hoje.getFullYear().toString();

  // Estado do formulário
  const [formData, setFormData] = useState({
    numeroProposta: "02",
    siglaUnidade: "DPEP",
    codigoNumero: "025.5",
    ano: anoAtual,
    departamento: "DEPARTAMENTO DE PLANIFICAÇÃO, ESTUDOS E PROJETOS (DPEP)",
    dataDocumento: formattedDate,
    autoridadeDestino: "Exmo. Senhor Diretor-Geral",
    assunto:
      "Pedido de Autorização para Deslocação e Pagamento de Abonos de Ajudas de Custos.",
    nomeAutoridade: "Prof. António Cristo Pinto Madeira",
    tituloAutoridade: "Diretor-Geral",

    // Detalhes da deslocação
    nomeActividade: "[nome da actividade]",
    localActividade: "[local]",
    datasActividade: "[datas]",
    dataPartida: "[data de partida]",
    dataRegresso: "[data de regresso]",
    participantes: "[nome(s)]",

    // Corpo do Texto
    textoCorpo1:
      "No âmbito da actividade [nome da actividade], a realizar-se em [local], entre os dias [datas], venho por este meio solicitar a devida autorização para a deslocação de [nome do colaborador/equipa], bem como o pagamento dos respetivos abonos de ajudas de custos, conforme previsto nos regulamentos internos e legislação aplicável.",
    textoCorpo2:
      "A participação nesta actividade é de caráter essencial para assegurar representação oficial, execução de tarefas técnicas, acompanhamento de projeto, etc., contribuindo para o cumprimento das metas estabelecidas e para o reforço da cooperação institucional.",

    // Página 2
    justificacao:
      "A presença do(s) colaborador(es) é indispensável para garantir a execução das responsabilidades atribuídas e assegurar os resultados esperados da actividade.",
    anexos: [
      "Convite/agenda da actividade",
      "Documentos de suporte",
      "Regulamento aplicável",
    ],
    LocalDataRequerente: `Songo, ${formattedDate}`,
    nomeRequerente: "NOME DO CHEFE MAXIOMO DO SETOR",
    cargoRequerente: "Assistente Estagiário",
    setorRequerente: "DPEP",
    assinaturaRequerente: "",
    notaViagem:
      "Nesta viagem o funcionário irá viajar de transporte colectivo.",

    // Despachos
    despachoDicosafa:
      "Favorável. Submeto à consideração de Sua Excia o Senhor Diretor-Geral para a devida autorização dos abonos e deslocação correspondentes.",
    nomeDiretorDicosafa: "Dr. Jaime Langa",
    cargoDiretorDicosafa: "Director da DICOSAFA",
    assinaturaDiretorDicosafa: "",
    dataDespachoDicosafa: formattedDate,

    despachoDiretorGeral:
      "Autorizo nos termos propostos. Proceda-se em conformidade legal e orçamental.",
    nomeDiretorGeral: "Prof. António Cristo Pinto Madeira",
    cargoDiretorGeral: "Diretor-Geral",
    assinaturaDiretorGeral: "",
    dataDespachoDiretorGeral: formattedDate,
  });

  // Linhas da tabela de custos (critérios predefinidos de acordo com o anexo)
  const [custos, setCustos] = useState<CustosLinha[]>([
    {
      id: "1",
      nome: "",
      descricao: "",
      dias: "",
      valorDiario: "",
      valorTotal: "8060.00",
    },
    {
      id: "2",
      nome: "",
      descricao: "",
      dias: "",
      valorDiario: "------",
      valorTotal: "",
    },
  ]);

  // Carregar número sequencial automático por setor/unidade
  useEffect(() => {
    if (!formData.siglaUnidade) return;
    const fetchNextNumber = async () => {
      try {
        const key = `INFORMACAO-PROPOSTA-${formData.siglaUnidade.trim().toUpperCase()}`;
        const nextNum = await firestoreService.counters.getNextNumber(key);
        const formattedNum = nextNum.toString().padStart(2, "0");
        setFormData((prev) => ({
          ...prev,
          numeroProposta: formattedNum,
        }));
      } catch (err) {
        console.error("Erro ao buscar contador por setor:", err);
      }
    };
    fetchNextNumber();
  }, [formData.siglaUnidade]);

  const handleAddCusto = () => {
    const nextId = (custos.length + 1).toString();
    setCustos((prev) => [
      ...prev,
      {
        id: nextId,
        nome: "",
        descricao: "",
        dias: "0",
        valorDiario: "0",
        valorTotal: "0",
      },
    ]);
  };

  const handleRemoveCusto = (id: string) => {
    if (custos.length <= 1) return;
    setCustos((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCustoChange = (
    id: string,
    field: keyof CustosLinha,
    value: string,
  ) => {
    setCustos((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };
          if (field === "dias" || field === "valorDiario") {
            const diasNum = parseFloat(updated.dias) || 0;
            const valorNum = parseFloat(updated.valorDiario) || 0;
            updated.valorTotal = (diasNum * valorNum).toFixed(2);
          }
          return updated;
        }
        return c;
      }),
    );
  };

  // Calcular o total geral. Se for zero (nenhum valor preenchido), o padrão é 8060.00 como no anexo oficial
  const totalGeral =
    custos.reduce((acc, c) => acc + (parseFloat(c.valorTotal) || 0), 0) ||
    8060.0;

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const docCode = `Informação Proposta Nº ${formData.numeroProposta}/ISPS/GDG/${formData.siglaUnidade}/${formData.codigoNumero}/${formData.ano}`;
      await firestoreService.requisicoes_internas.add({
        codigo: docCode,
        tipo: "Informação Proposta",
        formData: {
          ...formData,
          custos: custos,
          totalGeral: totalGeral,
        },
        dataEmissao: formData.dataDocumento,
        emitidoPor: user?.displayName || user?.name || "Administrador",
        status: "Emitido",
        assinaturaChefe: formData.assinaturaRequerente,
        createdAt: new Date().toISOString(),
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao registar o documento no sistema.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Construir textos dinâmicos reais baseados nos inputs do utilizador
  const obterTextoCorpo1Real = () => {
    return `No âmbito da actividade ${formData.nomeActividade}, a realizar-se em ${formData.localActividade}, entre os dias ${formData.datasActividade}, venho por este meio solicitar a devida autorização para a deslocação de ${formData.participantes}, bem como o pagamento dos respetivos abonos de ajudas de custos, conforme previsto nos regulamentos internos e legislação aplicável.`;
  };

  return (
    <FormLayout
      hidePrintHeader={true}
      title="Informação Proposta"
      subtitle="Gabinete do Diretor-Geral - MIP-04/IP"
      icon={FileText}
      bannerColor="bg-blue-900"
      iconColor="text-white"
      trackingCode={`Nº ${formData.numeroProposta}/${formData.siglaUnidade}`}
      onCancel={onCancel}
      onSubmit={handleSave}
      isSubmitting={isSubmitting}
      isSubmitted={isSubmitted}
      successTitle="Informação Proposta Gravada!"
      successMessage="O documento foi registado com sucesso no sistema e está pronto para impressão."
      maxWidth="max-w-5xl"
    >
      <div className="space-y-12">
        {/* Editor do Formulário Interativo */}
        <div className="bg-white rounded-2xl space-y-6 print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Nº Proposta
              </label>
              <input
                type="text"
                value={formData.numeroProposta}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, numeroProposta: e.target.value }))
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Unidade (Sigla)
              </label>
              <input
                type="text"
                value={formData.siglaUnidade}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, siglaUnidade: e.target.value }))
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Código Referência
              </label>
              <input
                type="text"
                value={formData.codigoNumero}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, codigoNumero: e.target.value }))
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Ano
              </label>
              <input
                type="text"
                value={formData.ano}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, ano: e.target.value }))
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Departamento Emissor
              </label>
              <input
                type="text"
                value={formData.departamento}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, departamento: e.target.value }))
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Data do Documento
              </label>
              <input
                type="text"
                value={formData.dataDocumento}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, dataDocumento: e.target.value }))
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t pt-6">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-900 pl-2">
                Detalhes da Deslocação
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    Actividade
                  </label>
                  <input
                    type="text"
                    value={formData.nomeActividade}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        nomeActividade: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    Local
                  </label>
                  <input
                    type="text"
                    value={formData.localActividade}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        localActividade: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    Datas descritas
                  </label>
                  <input
                    type="text"
                    value={formData.datasActividade}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        datasActividade: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-900 pl-2">
                Datas e Participantes
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Partida
                    </label>
                    <input
                      type="text"
                      value={formData.dataPartida}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          dataPartida: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Regresso
                    </label>
                    <input
                      type="text"
                      value={formData.dataRegresso}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          dataRegresso: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">
                    Participantes
                  </label>
                  <input
                    type="text"
                    value={formData.participantes}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        participantes: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-900 pl-2">
                Abonos e Custos
              </h4>
              <button
                type="button"
                onClick={handleAddCusto}
                className="flex items-center gap-1.5 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-800 transition-all shadow-md"
              >
                <Plus size={14} /> Adicionar Beneficiário
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider border-b">
                    <th className="p-4 w-12 text-center">Ord.</th>
                    <th className="p-4">Nome do Beneficiário</th>
                    <th className="p-4">Descrição</th>
                    <th className="p-4 w-20 text-center">Dias</th>
                    <th className="p-4 w-32">Valor Diário</th>
                    <th className="p-4 w-32">Total</th>
                    <th className="p-4 w-12 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {custos.map((c, idx) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={c.nome}
                          onChange={(e) =>
                            handleCustoChange(c.id, "nome", e.target.value)
                          }
                          className="w-full p-2.5 bg-white border border-slate-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={c.descricao}
                          onChange={(e) =>
                            handleCustoChange(c.id, "descricao", e.target.value)
                          }
                          className="w-full p-2.5 bg-white border border-slate-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={c.dias}
                          onChange={(e) =>
                            handleCustoChange(c.id, "dias", e.target.value)
                          }
                          className="w-full p-2.5 bg-white border border-slate-100 rounded-lg text-xs text-center outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={c.valorDiario}
                          onChange={(e) =>
                            handleCustoChange(
                              c.id,
                              "valorDiario",
                              e.target.value,
                            )
                          }
                          className="w-full p-2.5 bg-white border border-slate-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-4 font-black text-slate-900 bg-slate-50/30">
                        {parseFloat(c.valorTotal || "0").toLocaleString(
                          "pt-PT",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveCusto(c.id)}
                          disabled={custos.length <= 1}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900 text-white">
                    <td
                      colSpan={5}
                      className="p-4 text-right font-black uppercase tracking-widest text-[10px]"
                    >
                      Total Geral Estimado:
                    </td>
                    <td
                      colSpan={2}
                      className="p-4 font-black text-sm text-[#FFB800]"
                    >
                      {totalGeral.toLocaleString("pt-PT", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      MZN
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Requerente (Nome do Chefe)
              </label>
              <input
                type="text"
                value={formData.nomeRequerente}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, nomeRequerente: e.target.value }))
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                Cargo do Requerente
              </label>
              <input
                type="text"
                value={formData.cargoRequerente}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    cargoRequerente: e.target.value,
                  }))
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Configuração de Despachos Oficiais */}
          <div className="border-t pt-6 space-y-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-l-4 border-blue-900 pl-2">
              Homologação & Despachos Oficiais
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bloco DICOSAFA */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
                    1. Diretor DICOSAFA
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          despachoDicosafa:
                            "Favorável. Submeto à consideração de Sua Excia o Senhor Diretor-Geral para a devida autorização dos abonos correspondentes.",
                        }))
                      }
                      className="px-2 py-1 bg-white hover:bg-slate-100 border text-[9px] font-bold rounded-lg shadow-sm transition-all"
                    >
                      Favorável
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          despachoDicosafa:
                            "Não favorável face à indisponibilidade orçamental nesta rubrica do trimestre.",
                        }))
                      }
                      className="px-2 py-1 bg-white hover:bg-slate-100 border text-[9px] font-bold text-red-600 rounded-lg shadow-sm transition-all"
                    >
                      Indisponível
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Parecer Técnico
                  </label>
                  <textarea
                    rows={2}
                    value={formData.despachoDicosafa}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        despachoDicosafa: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={formData.nomeDiretorDicosafa}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          nomeDiretorDicosafa: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Data
                    </label>
                    <input
                      type="text"
                      value={formData.dataDespachoDicosafa}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          dataDespachoDicosafa: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Assinatura Digital
                  </label>
                  <SignatureUpload
                    label=""
                    value={formData.assinaturaDiretorDicosafa}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        assinaturaDiretorDicosafa: val,
                      }))
                    }
                    user={user}
                  />
                </div>
              </div>

              {/* Bloco Diretor-Geral */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">
                    2. Diretor-Geral
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          despachoDiretorGeral:
                            "Autorizo nos termos propostos. Proceda-se em conformidade legal e orçamental.",
                        }))
                      }
                      className="px-2 py-1 bg-white hover:bg-slate-100 border text-[9px] font-bold rounded-lg shadow-sm transition-all"
                    >
                      Autorizar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          despachoDiretorGeral:
                            "Não autorizado. Devolva-se para as devidas retificações do plano de viagem.",
                        }))
                      }
                      className="px-2 py-1 bg-white hover:bg-slate-100 border text-[9px] font-bold text-red-600 rounded-lg shadow-sm transition-all"
                    >
                      Recusar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Despacho
                  </label>
                  <textarea
                    rows={2}
                    value={formData.despachoDiretorGeral}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        despachoDiretorGeral: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={formData.nomeDiretorGeral}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          nomeDiretorGeral: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Data
                    </label>
                    <input
                      type="text"
                      value={formData.dataDespachoDiretorGeral}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          dataDespachoDiretorGeral: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 bg-white border border-slate-100 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Assinatura Digital
                  </label>
                  <SignatureUpload
                    label=""
                    value={formData.assinaturaDiretorGeral}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        assinaturaDiretorGeral: val,
                      }))
                    }
                    user={user}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-xs tracking-widest uppercase"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-md"
            >
              <Printer size={18} /> Imprimir A4
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isSubmitted}
              className="px-10 py-3 bg-blue-900 text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-blue-800 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 flex items-center gap-2 uppercase"
            >
              <Save size={18} />{" "}
              {isSubmitting
                ? "A Gravar..."
                : isSubmitted
                  ? "Documento Gravado"
                  : "Gravar Digital"}
            </button>
          </div>
        </div>

        {/* DOCUMENTO OFICIAL FORMATADO EM A4 PARA IMPRESSÃO (Folha 1) */}
        <div className="max-w-[210mm] mx-auto bg-white p-[15mm] shadow-2xl border border-slate-200 font-serif text-slate-950 relative min-h-[297mm] flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:h-[297mm] print:break-after-page mt-12 mb-8 hidden sm:flex">
          <div className="space-y-6 flex-1">
            {/* Cabeçalho oficial com Logo */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div className="flex items-center gap-4">
                <img
                  src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad"
                  alt="Logo ISPS"
                  className="h-16 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <div className="leading-tight text-left">
                  <h1 className="text-xs font-black tracking-tight text-slate-900 uppercase font-sans">
                    INSTITUTO SUPERIOR POLITÉCNICO DE SONGO
                  </h1>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-700 font-sans mt-0.5">PROVÍNCIA DE TETE</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-700 font-sans">DISTRITO DE CAHORA-BASSA</p>
                </div>
              </div>
              <div className="text-right leading-none">
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded font-black border tracking-wider">
                  MIP-04/IP
                </span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-base font-black text-slate-950 tracking-wide font-sans uppercase">
                Gabinete do Diretor-Geral
              </h2>
              <h3 className="text-xs font-bold text-slate-700 font-sans tracking-tight uppercase">
                {formData.departamento}
              </h3>
            </div>

            {/* Código do Documento / Título */}
            <div className="text-center py-2 border-y-2 border-slate-900 my-4 flex justify-between items-center px-4 font-sans font-bold text-xs">
              <span>Informação Proposta Nº {formData.numeroProposta}</span>
              <span>
                /ISPS/GDG/{formData.siglaUnidade}/{formData.codigoNumero}/
                {formData.ano}
              </span>
            </div>

            {/* Retângulo de Despachos Oficial e Dinâmico */}
            <div className="grid grid-cols-2 border border-slate-950 min-h-[140px] my-4 font-sans text-[10px] text-slate-900">
              {/* Parecer / Despacho da DICOSAFA */}
              <div className="border-r border-slate-950 p-3 flex flex-col justify-between relative bg-slate-50/40">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider font-extrabold text-blue-900 mb-1 border-b pb-1">
                    1. Parecer Técnico (DICOSAFA)
                  </span>
                  <p className="italic text-xs font-medium text-slate-800 leading-tight whitespace-pre-wrap font-serif">
                    "{formData.despachoDicosafa || "Pendente de parecer..."}"
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                  <div className="text-[8px] font-bold text-slate-500 leading-none">
                    <p className="uppercase">
                      {formData.nomeDiretorDicosafa || "Diretor DICOSAFA"}
                    </p>
                    <p className="text-[7px] text-slate-400 mt-0.5">
                      {formData.cargoDiretorDicosafa || "Director"}
                    </p>
                    <p className="text-[7px] text-slate-400 mt-0.5">
                      Data: {formData.dataDespachoDicosafa}
                    </p>
                  </div>
                  {formData.assinaturaDiretorDicosafa && (
                    <img
                      src={formData.assinaturaDiretorDicosafa}
                      alt="Assinatura DICOSAFA"
                      className="h-10 w-auto object-contain mix-blend-multiply"
                    />
                  )}
                </div>
                <div className="absolute bottom-1 right-2 text-[7px] text-slate-300 font-bold">
                  DICOSAFA
                </div>
              </div>

              {/* Despacho do Diretor-Geral */}
              <div className="p-3 flex flex-col justify-between relative bg-slate-50/40">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider font-extrabold text-emerald-900 mb-1 border-b pb-1">
                    2. Despacho (Diretor-Geral)
                  </span>
                  <p className="italic text-xs font-bold text-slate-900 leading-tight whitespace-pre-wrap font-serif">
                    "
                    {formData.despachoDiretorGeral || "Pendente de despacho..."}
                    "
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                  <div className="text-[8px] font-bold text-slate-500 leading-none">
                    <p className="uppercase">
                      {formData.nomeDiretorGeral || "Diretor-Geral"}
                    </p>
                    <p className="text-[7px] text-slate-400 mt-0.5">
                      {formData.cargoDiretorGeral || "Diretor-Geral"}
                    </p>
                    <p className="text-[7px] text-slate-400 mt-0.5">
                      Data: {formData.dataDespachoDiretorGeral}
                    </p>
                  </div>
                  {formData.assinaturaDiretorGeral && (
                    <img
                      src={formData.assinaturaDiretorGeral}
                      alt="Assinatura Diretor-Geral"
                      className="h-10 w-auto object-contain mix-blend-multiply"
                    />
                  )}
                </div>
                <div className="absolute bottom-1 right-2 text-[7px] text-slate-300 font-bold">
                  GDG
                </div>
              </div>
            </div>

            {/* Data e Destinatário */}
            <div className="flex justify-between items-start font-sans text-xs pt-2">
              <div>
                <span className="font-bold">Data:</span>{" "}
                {formData.dataDocumento}
              </div>
              <div className="text-right font-bold text-slate-900">
                {formData.autoridadeDestino}
              </div>
            </div>

            {/* Assunto */}
            <div className="font-sans text-xs font-bold text-slate-900 border-b border-dashed pb-2">
              Assunto: {formData.assunto}
            </div>

            {/* Saudação e Abertura */}
            <div className="space-y-4 text-xs leading-relaxed text-justify">
              <p className="font-bold">
                Exmo(a). Senhor(a) {formData.nomeAutoridade},{" "}
                {formData.tituloAutoridade}
              </p>
              <p>{obterTextoCorpo1Real()}</p>
              <p>{formData.textoCorpo2}</p>
            </div>

            {/* Detalhes da Deslocação */}
            <div className="bg-slate-50 border p-4 rounded-xl font-sans text-xs space-y-1 my-4">
              <h4 className="font-black text-slate-900 mb-2 uppercase text-[10px] tracking-wider">
                Detalhes da Deslocação:
              </h4>
              <div>
                <span className="font-bold text-slate-600">Actividade:</span>{" "}
                {formData.nomeActividade}
              </div>
              <div>
                <span className="font-bold text-slate-600">Local:</span>{" "}
                {formData.localActividade}
              </div>
              <div>
                <span className="font-bold text-slate-600">Datas:</span>{" "}
                {formData.dataPartida} a {formData.dataRegresso}
              </div>
              <div>
                <span className="font-bold text-slate-600">
                  Participante(s):
                </span>{" "}
                {formData.participantes}
              </div>
            </div>

            {/* Tabela de Custos */}
            <div className="space-y-2">
              <h4 className="font-sans font-black text-slate-900 uppercase text-[10px] tracking-wider">
                Tabela de Custos / Abonos:
              </h4>
              <table className="w-full font-sans text-[10px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                    <th className="border-r border-slate-400 p-1.5 text-center w-10">
                      Ord.
                    </th>
                    <th className="border-r border-slate-400 p-1.5 text-left">
                      Nome do Beneficiário
                    </th>
                    <th className="border-r border-slate-400 p-1.5 text-left">
                      Descrição
                    </th>
                    <th className="border-r border-slate-400 p-1.5 text-center w-12">
                      Dias
                    </th>
                    <th className="border-r border-slate-400 p-1.5 text-right w-24">
                      Valor Diário
                    </th>
                    <th className="p-1.5 text-right w-28">Valor Total (MZN)</th>
                  </tr>
                </thead>
                <tbody>
                  {custos.map((c, idx) => (
                    <tr key={c.id} className="border-b border-slate-400">
                      <td className="border-r border-slate-400 p-1.5 text-center">
                        {idx + 1}
                      </td>
                      <td className="border-r border-slate-400 p-1.5">
                        {c.nome || ""}
                      </td>
                      <td className="border-r border-slate-400 p-1.5">
                        {c.descricao || ""}
                      </td>
                      <td className="border-r border-slate-400 p-1.5 text-center">
                        {c.dias || ""}
                      </td>
                      <td className="border-r border-slate-400 p-1.5 text-right">
                        {c.valorDiario === "------"
                          ? "------"
                          : !c.valorDiario
                            ? ""
                            : isNaN(parseFloat(c.valorDiario))
                              ? c.valorDiario
                              : parseFloat(c.valorDiario).toLocaleString(
                                  "pt-PT",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}
                      </td>
                      <td className="p-1.5 text-right font-bold">
                        {!c.valorTotal
                          ? ""
                          : isNaN(parseFloat(c.valorTotal))
                            ? c.valorTotal
                            : parseFloat(c.valorTotal).toLocaleString("pt-PT", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-b border-slate-400">
                    <td
                      colSpan={5}
                      className="border-r border-slate-400 p-1.5 text-right"
                    >
                      Total:
                    </td>
                    <td className="p-1.5 text-right text-slate-950 text-xs font-black">
                      {totalGeral.toLocaleString("pt-PT", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rodapé Oficial da Primeira Página */}
          <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-[8px] text-slate-400 font-sans font-bold mt-12">
            <div className="leading-snug">
              ISPS | Bairro Catondo, Recinto do Campus do ISPS. Caixa Postal
              nº146 <br />
              Tel: +258 875253322, Fax: +258 252-82338, email:
              secretariado@ispsongo.ac.mz. Página oficial: www.ispsongo.ac.mz
            </div>
            <div className="bg-red-700 h-6 w-12 rounded-sm ml-4 print:bg-red-700"></div>
          </div>
        </div>

        {/* DOCUMENTO OFICIAL FORMATADO EM A4 PARA IMPRESSÃO (Folha 2) */}
        <div className="max-w-[210mm] mx-auto bg-white p-[15mm] shadow-2xl border border-slate-200 font-serif text-slate-950 relative min-h-[297mm] flex flex-col justify-between print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:h-[297mm] mb-12 hidden sm:flex">
          <div className="space-y-6 flex-1">
            {/* Cabeçalho oficial com Logo reduzido */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <span className="text-[10px] text-slate-400 font-sans font-bold">
                Informação Proposta Nº {formData.numeroProposta}
              </span>
              <span className="text-[10px] text-slate-400 font-sans font-bold">
                Pág. 2
              </span>
            </div>

            {/* Justificação */}
            <div className="space-y-2 text-xs">
              <h4 className="font-sans font-black text-slate-900 uppercase text-[10px] tracking-wider">
                Justificação:
              </h4>
              <p className="text-justify leading-relaxed">
                {formData.justificacao}
              </p>
            </div>

            {/* Anexos */}
            <div className="space-y-2">
              <h4 className="font-sans font-black text-slate-900 uppercase text-[10px] tracking-wider">
                Anexos:
              </h4>
              <ul className="list-disc list-inside font-sans text-xs space-y-1 text-slate-800">
                {formData.anexos.map((anexo, idx) => (
                  <li key={idx} className="font-medium">
                    {anexo}
                  </li>
                ))}
              </ul>
            </div>

            {/* Fecho de cortesia */}
            <div className="text-xs pt-2">
              Na expectativa da vossa aprovação, apresento os meus melhores
              cumprimentos.
            </div>

            <div className="text-xs pt-4 font-sans text-slate-600">
              {formData.LocalDataRequerente}
            </div>

            {/* Bloco de Assinatura do Requerente */}
            <div className="text-center pt-8 max-w-sm mx-auto flex flex-col items-center">
              <p className="font-sans font-black uppercase tracking-widest text-[10px] text-slate-500 mb-2">
                O Chefe do Departamento
              </p>
              <div className="w-64">
                <SignatureUpload
                  label=""
                  value={formData.assinaturaRequerente}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      assinaturaRequerente: val,
                    }))
                  }
                  user={user}
                />
              </div>

              <div className="text-center mt-2 font-sans">
                <p className="font-black text-slate-900 text-xs">
                  ({formData.nomeRequerente.toUpperCase()})
                </p>
                <p className="text-[10px] text-slate-500 italic font-bold mt-0.5">
                  ({formData.cargoRequerente})
                </p>
              </div>
            </div>

            {/* Nota de Viagem (N.B) */}
            <div className="border-l-4 border-slate-900 pl-3 py-1 font-sans text-[10px] font-bold text-slate-700 italic my-6">
              N.B: {formData.notaViagem}
            </div>
          </div>

          {/* Rodapé Oficial da Segunda Página */}
          <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-[8px] text-slate-400 font-sans font-bold">
            <div className="leading-snug">
              ISPS | Bairro Catondo, Recinto do Campus do ISPS. Caixa Postal
              nº146 <br />
              Tel: +258 875253322, Fax: +258 252-82338, email:
              secretariado@ispsongo.ac.mz. Página oficial: www.ispsongo.ac.mz
            </div>
            <div className="bg-red-700 h-6 w-12 rounded-sm ml-4 print:bg-red-700"></div>
          </div>
        </div>
      </div>
    </FormLayout>
  );
}
