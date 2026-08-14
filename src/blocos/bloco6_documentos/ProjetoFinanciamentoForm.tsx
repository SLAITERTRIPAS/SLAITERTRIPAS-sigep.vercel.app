import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Save,
  Printer,
  Plus,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Layers,
  ArrowLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { firestoreService } from "../../lib/firestoreService";
import { ISPSLogo } from "../../components/InstitutionAssets";
import { OfficialDocumentSignatures } from "../../components/OfficialDocumentSignatures";

interface CronogramaLinha {
  id: string;
  fase: string;
  atividade: string;
  responsavel: string;
  prazo: string; // Ex: "Mês 1", "Mês 2" ou datas
}

interface OrcamentoLinha {
  id: string;
  categoria: "Recursos Humanos" | "Materiais/Equipamentos" | "Serviços de Terceiros" | "Despesas Administrativas";
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

interface EquipeLinha {
  id: string;
  nome: string;
  funcao: string;
  curriculo: string;
}

interface IndicadorLinha {
  id: string;
  nome: string;
  meta: string;
  ferramenta: string;
}

interface ProjetoFinanciamentoFormProps {
  user: any;
  onCancel: () => void;
}

export default function ProjetoFinanciamentoForm({
  user,
  onCancel,
}: ProjetoFinanciamentoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);

  // Data de hoje formatada
  const hoje = new Date();
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const formattedDate = `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;

  // Estado do Formulário - Capa & Textos
  const [formData, setFormData] = useState({
    nomeProjeto: "Plano de Expansão e Modernização Tecnológica do Campus Songo",
    proponente: "Instituto Superior Politécnico de Songo (ISPS)",
    responsavelLegal: "Prof. António Cristo Pinto Madeira (Diretor-Geral)",
    responsavelTecnico: "MSc. Slaiter Tripas (Diretor de TIC)",
    dataLocal: `Songo, ${formattedDate}`,
    contacto: "info@isps.ac.mz | +258 252 82000",
    
    // 2. Resumo Executivo
    resumoExecutivo: "Este projeto visa modernizar a infraestrutura de laboratórios e conectividade do ISPS no campus de Songo, capacitando as divisões de engenharia eletrotécnica e mecânica com equipamentos de última geração e garantindo acesso de alta velocidade a recursos educacionais digitais.",
    
    // 3. Diagnóstico e Justificativa
    contexto: "O campus do ISPS está localizado na vila de Songo, província de Tete, num ponto estratégico de geração de energia de Moçambique (Cahora Bassa). Contudo, a rápida evolução tecnológica e as exigências curriculares impõem uma modernização drástica dos laboratórios.",
    problemaCentral: "Falta de kits experimentais modernos de eletrónica de potência e energias renováveis, acompanhada de conectividade instável para estudantes residentes.",
    publicoBeneficiado: "650 estudantes matriculados nos cursos de Engenharia e 45 docentes e técnicos de laboratório.",

    // 4. Objetivos
    objetivoGeral: "Modernizar a infraestrutura pedagógica e tecnológica do ISPS, estabelecendo laboratórios de referência em Engenharia de Energias Renováveis até dezembro de 2027.",
    objetivosEspecificos: "1. Adquirir 12 novos kits experimentais de energia solar e eólica;\n2. Expandir a rede Wi-Fi de alta densidade para 100% das áreas comuns do campus;\n3. Capacitar 15 docentes e técnicos no uso avançado dos novos equipamentos experimentais.",

    // 5. Metodologia e Estratégia
    metodologia: "O projeto será executado em três fases: 1) Aquisição e desembaraço aduaneiro dos equipamentos; 2) Instalação física e configuração de rede Wi-Fi; 3) Formação de formadores e início de projetos práticos. A governança será partilhada entre a Divisão de Engenharia e o Departamento de Finanças.",
    inovacaoDiferencial: "Uso de laboratórios remotos interligados com a indústria de energia Cahora Bassa para simulações reais.",
    parcerias: "Direção de Divisão de Engenharia, EDM (Eletricidade de Moçambique), UGEA.",
    riscosMitigacao: "Atraso na importação de equipamentos. Mitigação: Início célere do concurso pela UGEA no Mês 1 e fornecedores com stock nacional.",

    // 10. Sustentabilidade
    sustentabilidade: "Os custos de manutenção preventiva dos equipamentos e largura de banda de Internet serão integrados no orçamento geral anual da DICOSAFA, com receitas parciais de cursos de extensão e consultorias à indústria promovidas pelo CIE (Centro de Incubação de Empresas).",

    // 11. Anexos
    anexosTexto: "1. Estatuto Orgânico do ISPS em Diário da República;\n2. Portfólio técnico de laboratórios existentes;\n3. Carta de Apoio Institucional da HCB (Hidroelétrica de Cahora Bassa).",
    referencias: "Regulamento Académico do ISPS, Plano Estratégico do Ensino Superior de Moçambique (PEES)."
  });

  // Linhas do Cronograma (Passo 6)
  const [cronograma, setCronograma] = useState<CronogramaLinha[]>([
    { id: "c1", fase: "Fase I - Aquisição", atividade: "Lançamento do Concurso Público pela UGEA", responsavel: "UGEA / DICOSAFA", prazo: "Mês 1-2" },
    { id: "c2", fase: "Fase I - Aquisição", atividade: "Importação e tombamento de kits laboratoriais", responsavel: "Depto Património", prazo: "Mês 3" },
    { id: "c3", fase: "Fase II - Instalação", atividade: "Instalação física e cablagem de rede Wi-Fi", responsavel: "Depto TIC / Engenharia", prazo: "Mês 4-5" },
    { id: "c4", fase: "Fase III - Capacitação", atividade: "Formação de formadores para uso de kits experimentais", responsavel: "DAP / Docentes", prazo: "Mês 6" }
  ]);

  // Linhas do Orçamento (Passo 7)
  const [orcamento, setOrcamento] = useState<OrcamentoLinha[]>([
    { id: "o1", categoria: "Recursos Humanos", descricao: "Consultor de Redes e Infraestruturas", quantidade: 1, valorUnitario: 120000 },
    { id: "o2", categoria: "Materiais/Equipamentos", descricao: "Kits Experimentais de Energia Solar e Eólica", quantidade: 6, valorUnitario: 250000 },
    { id: "o3", categoria: "Materiais/Equipamentos", descricao: "Access Points Industriais Wi-Fi 6", quantidade: 10, valorUnitario: 35000 },
    { id: "o4", categoria: "Serviços de Terceiros", descricao: "Cablagem Estruturada de Fibra Óptica (Instalação)", quantidade: 1, valorUnitario: 180000 },
    { id: "o5", categoria: "Despesas Administrativas", descricao: "Publicações de Editais e Suporte de Reuniões", quantidade: 1, valorUnitario: 45000 }
  ]);

  // Linhas da Equipa (Passo 8)
  const [equipe, setEquipe] = useState<EquipeLinha[]>([
    { id: "e1", nome: "MSc. Slaiter Tripas", funcao: "Coordenador Geral e Técnico", curriculo: "Mestre em Engenharia de Redes com 8 anos de experiência na administração pública." },
    { id: "e2", nome: "Prof. António Cristo Pinto Madeira", funcao: "Supervisor Institucional", curriculo: "Doutor em Ciências Físicas, Diretor-Geral do ISPS com larga experiência em cooperação internacional." },
    { id: "e3", nome: "Dr. Jaime Langa", funcao: "Gestor Financeiro", curriculo: "Licenciado em Contabilidade e Diretor da DICOSAFA, especialista em Orçamento do Estado." }
  ]);

  // Linhas de Indicadores (Passo 9)
  const [indicadores, setIndicadores] = useState<IndicadorLinha[]>([
    { id: "i1", nome: "Taxa de cobertura Wi-Fi no campus", meta: "100% de cobertura operacional", ferramenta: "Testes de cobertura de sinal via software de rede" },
    { id: "i2", nome: "Estudantes capacitados em energias", meta: "Mínimo de 180 graduados por ano", ferramenta: "Pauta de exames do Registo Académico" },
    { id: "i3", nome: "Docentes habilitados nos laboratórios", meta: "15 docentes certificados no uso de kits", ferramenta: "Relatório final de formação assinado pelo DAP" }
  ]);

  // Cálculos Automáticos do Orçamento
  const totalPorCategoria = (cat: string) => {
    return orcamento
      .filter((item) => item.categoria === cat)
      .reduce((sum, item) => sum + item.quantidade * item.valorUnitario, 0);
  };

  const totalGeralOrcamento = orcamento.reduce(
    (sum, item) => sum + item.quantidade * item.valorUnitario,
    0
  );

  // Handlers para adicionar linhas dinamicamente
  const handleAddCronograma = () => {
    setCronograma((prev) => [
      ...prev,
      {
        id: `c_new_${Date.now()}`,
        fase: "",
        atividade: "",
        responsavel: "",
        prazo: "",
      },
    ]);
  };

  const handleAddOrcamento = () => {
    setOrcamento((prev) => [
      ...prev,
      {
        id: `o_new_${Date.now()}`,
        categoria: "Materiais/Equipamentos",
        descricao: "",
        quantidade: 1,
        valorUnitario: 0,
      },
    ]);
  };

  const handleAddEquipe = () => {
    setEquipe((prev) => [
      ...prev,
      {
        id: `e_new_${Date.now()}`,
        nome: "",
        funcao: "",
        curriculo: "",
      },
    ]);
  };

  const handleAddIndicador = () => {
    setIndicadores((prev) => [
      ...prev,
      {
        id: `i_new_${Date.now()}`,
        nome: "",
        meta: "",
        ferramenta: "",
      },
    ]);
  };

  // Handlers para remover linhas
  const handleRemoveCronograma = (id: string) => {
    setCronograma((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveOrcamento = (id: string) => {
    setOrcamento((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveEquipe = (id: string) => {
    setEquipe((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRemoveIndicador = (id: string) => {
    setIndicadores((prev) => prev.filter((item) => item.id !== id));
  };

  // Handler para submeter e persistir no Firestore
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const docCode = `PF-${formData.nomeProjeto.toUpperCase().substring(0, 15).replace(/\s/g, "-")}-${Date.now().toString().slice(-4)}`;
      
      await firestoreService.requisicoes_internas.add({
        codigo: docCode,
        tipo: "Projeto para Financiamento",
        formData: {
          ...formData,
          cronograma,
          orcamento,
          equipe,
          indicadores,
          totalGeral: totalGeralOrcamento,
        },
        dataEmissao: formattedDate,
        emitidoPor: user?.displayName || user?.name || "Administrador",
        status: "Emitido",
        createdAt: new Date().toISOString(),
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar o projeto de financiamento no sistema.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const nextStep = () => {
    if (activeStep < 11) setActiveStep(activeStep + 1);
  };

  const prevStep = () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 md:p-10 text-slate-800 font-sans print:border-0 print:shadow-none print:p-0">
      
      {/* Botões do Topo (Escondidos na Impressão) */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 pb-6 border-b border-slate-100 no-print">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold transition-all text-sm group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar a Documentos
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-all border border-slate-300"
          >
            <Printer size={14} /> Imprimir Projeto Completo
          </button>
          
          <button
            onClick={() => handleSave()}
            disabled={isSubmitting || isSubmitted}
            className={`flex items-center gap-2 font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-xl ${
              isSubmitted
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            {isSubmitting ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : isSubmitted ? (
              <CheckCircle size={14} />
            ) : (
              <Save size={14} />
            )}
            {isSubmitted ? "Guardado no Sistema" : "Salvar no Firestore"}
          </button>
        </div>
      </div>

      {/* Alerta de Sucesso */}
      {isSubmitted && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 no-print">
          <CheckCircle className="text-emerald-500" size={20} />
          <div>
            <p className="font-bold">Projeto de Financiamento registado com sucesso!</p>
            <p className="text-xs">O documento foi anexado à base de dados digital e pode ser impresso ou consultado.</p>
          </div>
        </div>
      )}

      {/* ÍNDICE VISUAL DE ETAPAS (Apenas no ecrã) */}
      <div className="mb-10 no-print overflow-x-auto whitespace-nowrap py-2 border-b border-slate-100">
        <div className="flex gap-2 min-w-max">
          {[
            { step: 1, title: "1. Capa" },
            { step: 2, title: "2. Resumo" },
            { step: 3, title: "3. Diagnóstico" },
            { step: 4, title: "4. Objetivos" },
            { step: 5, title: "5. Metodologia" },
            { step: 6, title: "6. Cronograma" },
            { step: 7, title: "7. Orçamento" },
            { step: 8, title: "8. Equipe" },
            { step: 9, title: "9. Indicadores" },
            { step: 10, title: "10. Sustentabilidade" },
            { step: 11, title: "11. Anexos" }
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => setActiveStep(item.step)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                activeStep === item.step
                  ? "bg-blue-50 text-blue-800 border-blue-400 font-black shadow-sm"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* DOCUMENTO PRINCIPAL (Imprimível em formato A4 oficial) */}
      <div className="p-8 border border-slate-100 rounded-3xl bg-slate-50/50 shadow-inner md:p-12 print:border-0 print:shadow-none print:bg-white print:p-0">
        
        {/* CABEÇALHO INSTITUCIONAL DO ISPS */}
        <div className="flex flex-col items-center text-center pb-8 border-b-2 border-double border-slate-300 mb-10">
          <div className="w-20 h-20 mb-4 flex items-center justify-center">
            <ISPSLogo />
          </div>
          <h2 className="text-xl font-black text-blue-950 font-serif tracking-tight uppercase">
            República de Moçambique
          </h2>
          <h3 className="text-md font-bold text-slate-800 uppercase mt-1">
            Instituto Superior Politécnico de Songo
          </h3>
          <p className="text-xs text-slate-500 italic mt-0.5">Criado pelo Decreto nº 33/2008 de 10 de Setembro</p>
          <div className="w-16 h-1 bg-amber-500 mt-4 rounded-full"></div>
        </div>

        {/* ECRÃ DE EDITAR: PASSO A PASSO NO COMPUTADOR, MAIS VISTA DE IMPRESSÃO COMPLETA SE PRINT FOR REQUISITADO */}
        <div className="print:hidden">
          
          {/* PASSO 1: CAPA E IDENTIFICAÇÃO */}
          {activeStep === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-blue-900 border-b border-slate-200 pb-2 mb-4">
                <FileText size={20} />
                <h4 className="text-lg font-black tracking-tight uppercase font-sans">1. Capa e Identificação</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Projeto</label>
                  <input
                    type="text"
                    value={formData.nomeProjeto}
                    onChange={(e) => setFormData({ ...formData, nomeProjeto: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instituição Proponente</label>
                  <input
                    type="text"
                    value={formData.proponente}
                    onChange={(e) => setFormData({ ...formData, proponente: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Responsável Legal</label>
                  <input
                    type="text"
                    value={formData.responsavelLegal}
                    onChange={(e) => setFormData({ ...formData, responsavelLegal: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Responsável Técnico</label>
                  <input
                    type="text"
                    value={formData.responsavelTecnico}
                    onChange={(e) => setFormData({ ...formData, responsavelTecnico: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data e Local</label>
                  <input
                    type="text"
                    value={formData.dataLocal}
                    onChange={(e) => setFormData({ ...formData, dataLocal: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contatos de Expediente</label>
                  <input
                    type="text"
                    value={formData.contacto}
                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 2: RESUMO EXECUTIVO */}
          {activeStep === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-blue-900 border-b border-slate-200 pb-2 mb-4">
                <Info size={20} />
                <h4 className="text-lg font-black tracking-tight uppercase font-sans">2. Resumo Executivo</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Forneça uma síntese atraente de uma página com o problema, solução, público-alvo, investimento solicitado e impacto. Deve convencer o avaliador a ler o projeto por inteiro.
              </p>
              <div>
                <textarea
                  rows={8}
                  value={formData.resumoExecutivo}
                  onChange={(e) => setFormData({ ...formData, resumoExecutivo: e.target.value })}
                  className="w-full p-4 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Escreva a síntese executiva do projeto..."
                />
              </div>
            </motion.div>
          )}

          {/* PASSO 3: DIAGNÓSTICO E JUSTIFICATIVA */}
          {activeStep === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-blue-900 border-b border-slate-200 pb-2 mb-4">
                <AlertTriangle size={20} />
                <h4 className="text-lg font-black tracking-tight uppercase font-sans">3. Diagnóstico e Justificativa</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contexto Regional e Demanda</label>
                  <textarea
                    rows={4}
                    value={formData.contexto}
                    onChange={(e) => setFormData({ ...formData, contexto: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Problema Central a Resolver</label>
                  <textarea
                    rows={3}
                    value={formData.problemaCentral}
                    onChange={(e) => setFormData({ ...formData, problemaCentral: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Público-Alvo Beneficiado</label>
                  <input
                    type="text"
                    value={formData.publicoBeneficiado}
                    onChange={(e) => setFormData({ ...formData, publicoBeneficiado: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 4: OBJETIVOS */}
          {activeStep === 4 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-blue-900 border-b border-slate-200 pb-2 mb-4">
                <TrendingUp size={20} />
                <h4 className="text-lg font-black tracking-tight uppercase font-sans">4. Objetivos (Metodologia SMART)</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Objetivo Geral</label>
                  <textarea
                    rows={3}
                    value={formData.objetivoGeral}
                    onChange={(e) => setFormData({ ...formData, objetivoGeral: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Objetivos Específicos (Metas mensuráveis)</label>
                  <textarea
                    rows={5}
                    value={formData.objetivosEspecificos}
                    onChange={(e) => setFormData({ ...formData, objetivosEspecificos: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Liste os objetivos específicos, um por linha..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 5: METODOLOGIA E ESTRATÉGIA DE EXECUÇÃO */}
          {activeStep === 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-blue-900 border-b border-slate-200 pb-2 mb-4">
                <Layers size={20} />
                <h4 className="text-lg font-black tracking-tight uppercase font-sans">5. Metodologia e Abordagem</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estratégia de Implementação</label>
                  <textarea
                    rows={4}
                    value={formData.metodologia}
                    onChange={(e) => setFormData({ ...formData, metodologia: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Diferencial Inovador</label>
                  <input
                    type="text"
                    value={formData.inovacaoDiferencial}
                    onChange={(e) => setFormData({ ...formData, inovacaoDiferencial: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parcerias Envolvidas</label>
                    <input
                      type="text"
                      value={formData.parcerias}
                      onChange={(e) => setFormData({ ...formData, parcerias: e.target.value })}
                      className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Análise de Riscos e Mitigação</label>
                    <input
                      type="text"
                      value={formData.riscosMitigacao}
                      onChange={(e) => setFormData({ ...formData, riscosMitigacao: e.target.value })}
                      className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 6: CRONOGRAMA DE EXECUÇÃO */}
          {activeStep === 6 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                <div className="flex items-center gap-3 text-blue-900">
                  <Calendar size={20} />
                  <h4 className="text-lg font-black tracking-tight uppercase font-sans">6. Cronograma de Execução</h4>
                </div>
                <button
                  type="button"
                  onClick={handleAddCronograma}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus size={14} /> Adicionar Linha
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                      <th className="p-4 w-1/4">Fase</th>
                      <th className="p-4 w-1/3">Atividade</th>
                      <th className="p-4">Responsável</th>
                      <th className="p-4">Prazo / Meses</th>
                      <th className="p-4 w-12">Remover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {cronograma.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.fase}
                            onChange={(e) => {
                              const updated = [...cronograma];
                              updated[idx].fase = e.target.value;
                              setCronograma(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Fase I..."
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.atividade}
                            onChange={(e) => {
                              const updated = [...cronograma];
                              updated[idx].atividade = e.target.value;
                              setCronograma(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Descrição da atividade..."
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.responsavel}
                            onChange={(e) => {
                              const updated = [...cronograma];
                              updated[idx].responsavel = e.target.value;
                              setCronograma(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Quem executa..."
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.prazo}
                            onChange={(e) => {
                              const updated = [...cronograma];
                              updated[idx].prazo = e.target.value;
                              setCronograma(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Mês 1, Tri 2, etc."
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveCronograma(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* PASSO 7: ORÇAMENTO DETALHADO */}
          {activeStep === 7 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                <div className="flex items-center gap-3 text-blue-900">
                  <DollarSign size={20} />
                  <h4 className="text-lg font-black tracking-tight uppercase font-sans">7. Orçamento Detalhado</h4>
                </div>
                <button
                  type="button"
                  onClick={handleAddOrcamento}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus size={14} /> Adicionar Despesa
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                      <th className="p-4 w-1/4">Categoria</th>
                      <th className="p-4 w-1/3">Item / Descrição</th>
                      <th className="p-4 w-20">Quant.</th>
                      <th className="p-4 w-32">Unitário (MT)</th>
                      <th className="p-4 w-32">Total (MT)</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {orcamento.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <select
                            value={item.categoria}
                            onChange={(e) => {
                              const updated = [...orcamento];
                              updated[idx].categoria = e.target.value as any;
                              setOrcamento(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:outline-none"
                          >
                            <option value="Recursos Humanos">Recursos Humanos</option>
                            <option value="Materiais/Equipamentos">Materiais/Equipamentos</option>
                            <option value="Serviços de Terceiros">Serviços de Terceiros</option>
                            <option value="Despesas Administrativas">Despesas Administrativas</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={(e) => {
                              const updated = [...orcamento];
                              updated[idx].descricao = e.target.value;
                              setOrcamento(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Descrição da despesa..."
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={item.quantidade}
                            min={1}
                            onChange={(e) => {
                              const updated = [...orcamento];
                              updated[idx].quantidade = Math.max(1, parseInt(e.target.value) || 1);
                              setOrcamento(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none text-center"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={item.valorUnitario}
                            min={0}
                            onChange={(e) => {
                              const updated = [...orcamento];
                              updated[idx].valorUnitario = Math.max(0, parseFloat(e.target.value) || 0);
                              setOrcamento(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none text-right font-medium"
                          />
                        </td>
                        <td className="p-3 text-right font-bold text-slate-700 pr-4">
                          {(item.quantidade * item.valorUnitario).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveOrcamento(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTAIS DO ORÇAMENTO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-slate-600 uppercase tracking-wide">Resumo por Categoria:</p>
                  <div className="flex justify-between">
                    <span>Recursos Humanos:</span>
                    <span className="font-bold">{totalPorCategoria("Recursos Humanos").toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Materiais / Equipamentos:</span>
                    <span className="font-bold">{totalPorCategoria("Materiais/Equipamentos").toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Serviços de Terceiros:</span>
                    <span className="font-bold">{totalPorCategoria("Serviços de Terceiros").toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Despesas Administrativas:</span>
                    <span className="font-bold">{totalPorCategoria("Despesas Administrativas").toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-end border-l border-slate-200 pl-6">
                  <span className="text-xs uppercase font-bold text-slate-400">Total Geral do Financiamento</span>
                  <span className="text-2xl font-black text-blue-900 mt-1">
                    {totalGeralOrcamento.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}
                  </span>
                  <span className="text-[10px] text-slate-500 italic mt-1">Contrapartida do ISPS em infraestrutura já instalada</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 8: EQUIPE E GESTÃO */}
          {activeStep === 8 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                <div className="flex items-center gap-3 text-blue-900">
                  <Users size={20} />
                  <h4 className="text-lg font-black tracking-tight uppercase font-sans">8. Equipe e Gestão</h4>
                </div>
                <button
                  type="button"
                  onClick={handleAddEquipe}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus size={14} /> Adicionar Membro
                </button>
              </div>

              <div className="space-y-4">
                {equipe.map((item, idx) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-white grid grid-cols-1 md:grid-cols-4 gap-4 items-start relative hover:border-slate-300 transition-all">
                    <button
                      type="button"
                      onClick={() => handleRemoveEquipe(item.id)}
                      className="absolute top-4 right-4 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Profissional</label>
                      <input
                        type="text"
                        value={item.nome}
                        onChange={(e) => {
                          const updated = [...equipe];
                          updated[idx].nome = e.target.value;
                          setEquipe(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                        placeholder="Nome completo..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Função no Projeto</label>
                      <input
                        type="text"
                        value={item.funcao}
                        onChange={(e) => {
                          const updated = [...equipe];
                          updated[idx].funcao = e.target.value;
                          setEquipe(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                        placeholder="Coordenador, Técnico, etc..."
                      />
                    </div>
                    <div className="md:col-span-2 pr-8">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Currículo Resumido / Qualificações</label>
                      <textarea
                        rows={2}
                        value={item.curriculo}
                        onChange={(e) => {
                          const updated = [...equipe];
                          updated[idx].curriculo = e.target.value;
                          setEquipe(updated);
                        }}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                        placeholder="Formação, histórico e qualificações essenciais..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PASSO 9: INDICADORES E AVALIAÇÃO */}
          {activeStep === 9 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                <div className="flex items-center gap-3 text-blue-900">
                  <CheckCircle size={20} />
                  <h4 className="text-lg font-black tracking-tight uppercase font-sans">9. Indicadores e Avaliação</h4>
                </div>
                <button
                  type="button"
                  onClick={handleAddIndicador}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus size={14} /> Adicionar Indicador
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                      <th className="p-4 w-1/3">Indicador (Quantitativo / Qualitativo)</th>
                      <th className="p-4 w-1/3">Meta Alvo</th>
                      <th className="p-4">Ferramenta / Fonte de Coleta</th>
                      <th className="p-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {indicadores.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.nome}
                            onChange={(e) => {
                              const updated = [...indicadores];
                              updated[idx].nome = e.target.value;
                              setIndicadores(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Ex: Taxa de uso laboratorial..."
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.meta}
                            onChange={(e) => {
                              const updated = [...indicadores];
                              updated[idx].meta = e.target.value;
                              setIndicadores(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Ex: Crescimento de 40%..."
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.ferramenta}
                            onChange={(e) => {
                              const updated = [...indicadores];
                              updated[idx].ferramenta = e.target.value;
                              setIndicadores(updated);
                            }}
                            className="w-full p-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none"
                            placeholder="Ex: Registos de visitas de biblioteca..."
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveIndicador(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* PASSO 10: SUSTENTABILIDADE E CONTINUIDADE */}
          {activeStep === 10 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-blue-900 border-b border-slate-200 pb-2 mb-4">
                <HelpCircle size={20} />
                <h4 className="text-lg font-black tracking-tight uppercase font-sans">10. Sustentabilidade e Continuidade</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Descreva de que forma os equipamentos e as metas operacionais do projeto serão financiados após o fim dos recursos externos. Indique fontes de receitas correntes, serviços de extensão ou dotações públicas estáveis.
              </p>
              <div>
                <textarea
                  rows={8}
                  value={formData.sustentabilidade}
                  onChange={(e) => setFormData({ ...formData, sustentabilidade: e.target.value })}
                  className="w-full p-4 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Descreva a sustentabilidade financeira..."
                />
              </div>
            </motion.div>
          )}

          {/* PASSO 11: ANEXOS E REFERÊNCIAS */}
          {activeStep === 11 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center gap-3 text-blue-900 border-b border-slate-200 pb-2 mb-4">
                <FileText size={20} />
                <h4 className="text-lg font-black tracking-tight uppercase font-sans">11. Anexos e Referências</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Checklist de Documentos Anexados</label>
                  <textarea
                    rows={6}
                    value={formData.anexosTexto}
                    onChange={(e) => setFormData({ ...formData, anexosTexto: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Estatuto, Certificados, Currículos, etc..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Referências Bibliográficas / Fontes Técnicas</label>
                  <textarea
                    rows={6}
                    value={formData.referencias}
                    onChange={(e) => setFormData({ ...formData, referencias: e.target.value })}
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Legislação, Planos Estratégicos, Projetos Anteriores..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* CONTROLES DE NAVEGAÇÃO DE PASSO */}
          <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={activeStep === 1}
              className={`px-4 py-2 rounded-xl font-bold text-xs border ${
                activeStep === 1
                  ? "bg-slate-50 text-slate-300 border-slate-200 cursor-default"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100 transition-all"
              }`}
            >
              Anterior
            </button>
            
            <span className="text-xs text-slate-400 font-bold">
              Passo {activeStep} de 11
            </span>

            {activeStep < 11 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-700 text-white hover:bg-blue-800 font-bold px-6 py-2 rounded-xl text-xs transition-all shadow-md flex items-center gap-1"
              >
                Próximo <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSubmitting || isSubmitted}
                className="bg-blue-700 text-white hover:bg-blue-800 font-bold px-6 py-2 rounded-xl text-xs transition-all shadow-md"
              >
                Finalizar e Salvar
              </button>
            )}
          </div>

        </div>

        {/* VISTA DE IMPRESSÃO COMPLETA (Apenas visível no comando window.print()) */}
        <div className="hidden print:block space-y-12 text-sm leading-relaxed text-justify">
          
          {/* CAPA OFICIAL DO PROJETO */}
          <div className="min-h-[800px] flex flex-col justify-between items-center text-center p-8 border border-slate-200 rounded-3xl bg-white shadow-sm">
            <div></div>
            <div className="space-y-6">
              <h1 className="text-3xl font-black text-blue-950 font-serif leading-tight uppercase tracking-tight max-w-3xl">
                {formData.nomeProjeto}
              </h1>
              <p className="text-lg font-bold text-slate-600 uppercase tracking-widest">{formData.proponente}</p>
              <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full mt-6"></div>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-500 uppercase">
              <p><strong>Responsável Legal:</strong> {formData.responsavelLegal}</p>
              <p><strong>Responsável Técnico:</strong> {formData.responsavelTecnico}</p>
              <p><strong>Contacto:</strong> {formData.contacto}</p>
              <p className="font-bold text-slate-800 mt-4">{formData.dataLocal}</p>
            </div>
          </div>

          <div className="page-break"></div>

          {/* 2. RESUMO EXECUTIVO */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-blue-950 border-b border-slate-300 pb-1 uppercase font-serif">
              2. Resumo Executivo
            </h4>
            <p className="text-slate-700">{formData.resumoExecutivo}</p>
          </div>

          {/* 3. DIAGNÓSTICO E JUSTIFICATIVA */}
          <div className="space-y-4 mt-8">
            <h4 className="text-lg font-bold text-blue-950 border-b border-slate-300 pb-1 uppercase font-serif">
              3. Diagnóstico e Justificativa
            </h4>
            <p className="text-slate-700"><strong>Enquadramento e Contexto:</strong> {formData.contexto}</p>
            <p className="text-slate-700"><strong>Definição do Problema Central:</strong> {formData.problemaCentral}</p>
            <p className="text-slate-700"><strong>Público Beneficiado Directamente:</strong> {formData.publicoBeneficiado}</p>
          </div>

          {/* 4. OBJETIVOS */}
          <div className="space-y-4 mt-8">
            <h4 className="text-lg font-bold text-blue-950 border-b border-slate-300 pb-1 uppercase font-serif">
              4. Objetivos Estratégicos
            </h4>
            <p className="text-slate-700"><strong>Objetivo Geral:</strong> {formData.objetivoGeral}</p>
            <div className="text-slate-700">
              <strong>Objetivos Específicos:</strong>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {formData.objetivosEspecificos.split("\n").map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 5. METODOLOGIA */}
          <div className="space-y-4 mt-8">
            <h4 className="text-lg font-bold text-blue-950 border-b border-slate-300 pb-1 uppercase font-serif">
              5. Metodologia e Estratégia de Execução
            </h4>
            <p className="text-slate-700"><strong>Metodologia de Trabalho:</strong> {formData.metodologia}</p>
            <p className="text-slate-700"><strong>Factor de Inovação e Diferencial:</strong> {formData.inovacaoDiferencial}</p>
            <p className="text-slate-700"><strong>Parcerias e Cooperações:</strong> {formData.parcerias}</p>
            <p className="text-slate-700"><strong>Riscos Identificados e Plano de Mitigação:</strong> {formData.riscosMitigacao}</p>
          </div>

          <div className="page-break"></div>

          {/* 6. CRONOGRAMA */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-blue-950 border-b border-slate-300 pb-1 uppercase font-serif">
              6. Cronograma de Execução Física
            </h4>
            <table className="w-full text-left border-collapse border border-slate-300 text-xs mt-2">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="p-3 border-r border-slate-300 font-bold uppercase w-1/4">Fase</th>
                  <th className="p-3 border-r border-slate-300 font-bold uppercase w-1/3">Atividade</th>
                  <th className="p-3 border-r border-slate-300 font-bold uppercase">Responsável</th>
                  <th className="p-3 font-bold uppercase">Prazo / Meses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cronograma.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 border-r border-slate-300 font-medium">{item.fase}</td>
                    <td className="p-3 border-r border-slate-300">{item.atividade}</td>
                    <td className="p-3 border-r border-slate-300">{item.responsavel}</td>
                    <td className="p-3">{item.prazo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 7. ORÇAMENTO */}
          <div className="space-y-4 mt-10">
            <h4 className="text-lg font-bold text-blue-950 border-b border-slate-300 pb-1 uppercase font-serif">
              7. Orçamento Geral e Estimativas de Gasto
            </h4>
            <table className="w-full text-left border-collapse border border-slate-300 text-xs mt-2">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="p-3 border-r border-slate-300 font-bold uppercase w-1/4">Categoria</th>
                  <th className="p-3 border-r border-slate-300 font-bold uppercase">Descrição do Item</th>
                  <th className="p-3 border-r border-slate-300 font-bold uppercase w-16 text-center">Quant.</th>
                  <th className="p-3 border-r border-slate-300 font-bold uppercase w-28 text-right">Unitário (MT)</th>
                  <th className="p-3 font-bold uppercase w-28 text-right">Total (MT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orcamento.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 border-r border-slate-300">{item.categoria}</td>
                    <td className="p-3 border-r border-slate-300">{item.descricao}</td>
                    <td className="p-3 border-r border-slate-300 text-center">{item.quantidade}</td>
                    <td className="p-3 border-r border-slate-300 text-right">
                      {item.valorUnitario.toLocaleString("pt-MZ")} MT
                    </td>
                    <td className="p-3 text-right font-bold">
                      {(item.quantidade * item.valorUnitario).toLocaleString("pt-MZ")} MT
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-t border-slate-300">
                  <td colSpan={4} className="p-3 text-right uppercase border-r border-slate-300">Total Geral Solicitado:</td>
                  <td className="p-3 text-right text-blue-900 font-black">
                    {totalGeralOrcamento.toLocaleString("pt-MZ")} MT
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="page-break"></div>

          {/* 8. EQUIPE E GESTÃO */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-blue-950 border-b border-slate-300 pb-1 uppercase font-serif">
              8. Recursos Humanos e Governança
            </h4>
            <div className="space-y-4 mt-2">
              {equipe.map((item) => (
                <div key={item.id} className="border border-slate-200 p-3.5 rounded-lg">
                  <p className="font-bold text-slate-800">{item.nome} — <span className="text-slate-600 font-normal">{item.funcao}</span></p>
                  <p className="text-xs text-slate-500 mt-1 italic">{item.curriculo}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 9. INDICADORES */}
          <div className="space-y-4 mt-10">
            <h4 className="text-lg font-bold text-blue-950 border-b border-slate-300 pb-1 uppercase font-serif">
              9. Indicadores de Resultado e Impacto
            </h4>
            <table className="w-full text-left border-collapse border border-slate-300 text-xs mt-2">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="p-3 border-r border-slate-300 font-bold uppercase w-1/3">Indicador</th>
                  <th className="p-3 border-r border-slate-300 font-bold uppercase w-1/3">Meta Alvo</th>
                  <th className="p-3 font-bold uppercase">Fonte / Ferramenta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {indicadores.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3 border-r border-slate-300">{item.nome}</td>
                    <td className="p-3 border-r border-slate-300">{item.meta}</td>
                    <td className="p-3">{item.ferramenta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 10. SUSTENTABILIDADE */}
          <div className="space-y-4 mt-10">
            <h4 className="text-lg font-bold text-blue-950 border-b border-slate-300 pb-1 uppercase font-serif">
              10. Plano de Sustentabilidade e Continuidade
            </h4>
            <p className="text-slate-700">{formData.sustentabilidade}</p>
          </div>

          {/* 11. ANEXOS */}
          <div className="space-y-4 mt-10">
            <h4 className="text-lg font-bold text-blue-950 border-b border-slate-300 pb-1 uppercase font-serif">
              11. Anexos e Fontes Bibliográficas
            </h4>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="font-bold text-xs uppercase text-slate-500">Documentos em Anexo:</p>
                <p className="text-xs text-slate-700 whitespace-pre-line mt-1">{formData.anexosTexto}</p>
              </div>
              <div>
                <p className="font-bold text-xs uppercase text-slate-500">Referências de Suporte:</p>
                <p className="text-xs text-slate-700 whitespace-pre-line mt-1">{formData.referencias}</p>
              </div>
            </div>
          </div>

          {/* ASSINATURAS OFICIAIS DO ISPS */}
          <div className="mt-20">
            <OfficialDocumentSignatures
              elaboradorNome={user?.displayName || user?.name || "MSc. Slaiter Tripas"}
              elaboradorCargo={user?.cargoChefia || "Director de TIC"}
              homologadorNome="Prof. António Cristo Pinto Madeira"
              homologadorCargo="Diretor-Geral do ISPS"
            />
          </div>

        </div>

      </div>

    </div>
  );
}
