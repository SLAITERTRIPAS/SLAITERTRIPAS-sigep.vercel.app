import React, { useState } from "react";
import { 
  ArrowLeft, 
  BookOpen, 
  ShieldCheck, 
  Database, 
  Zap, 
  Network, 
  Activity, 
  FileText,
  Clock,
  Layers,
  Cpu,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Calendar,
  Lock,
  Compass,
  TrendingUp,
  Server,
  FolderTree,
  Building2,
  GraduationCap,
  Sparkles,
  Menu
} from "lucide-react";

interface ProjetoTeoricoViewProps {
  onBack: () => void;
}

export default function ProjetoTeoricoView({ onBack }: ProjetoTeoricoViewProps) {
  const [activeSection, setActiveSection] = useState<string>("introducao");

  const sections = [
    { id: "introducao", label: "1. Introdução & Contexto" },
    { id: "odg_completo", label: "2. Órgão de Direção e Gestão (ODG)" },
    { id: "uo_completo", label: "3. Unidade Orgânica (UO)" },
    { id: "sc_completo", label: "4. Serviços Centrais (DICOSAFA & DICOSSER)" },
    { id: "tecnologia_sistema", label: "5. Sistema: Arquitetura & Tecnologias" },
    { id: "menus_mapeados", label: "6. Mapeamento de Menus" },
    { id: "fluxos_trabalho", label: "7. Engenharia de Workflows" },
    { id: "campos_nosql", label: "8. Dicionário NoSQL Firestore" },
    { id: "conclusao", label: "9. Conclusão & Visão de Futuro" }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-serif selection:bg-blue-100 text-slate-900 print:bg-white print:p-0">
      
      {/* Barra superior de controlo (não imprimível) */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-950 font-sans font-bold transition-all text-sm group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Voltar ao SIGEP
          </button>
          <div className="h-4 w-px bg-slate-200"></div>
          <span className="text-xs font-sans text-slate-500 font-medium">
            SIGEP ISPS &copy; 2026 - Manual Técnico e Projeto Teórico de Engenharia
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-700 text-white hover:bg-blue-800 font-sans font-bold px-4 py-2.5 rounded-lg text-xs transition-all shadow-sm"
          >
            <Printer size={14} /> Imprimir Documento de Projeto
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8 grid grid-cols-1 lg:grid-cols-4 gap-8 print:block print:p-0">
        
        {/* Painel Lateral de Navegação (não imprimível) */}
        <div className="lg:col-span-1 space-y-6 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-blue-900">
              <BookOpen size={20} />
              <h3 className="font-sans font-black tracking-tight text-sm uppercase">
                Índice Geral
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Consulte e navegue pelos módulos estruturais e pelas justificações de tecnologia do SIGEP.
            </p>
            <div className="h-px bg-slate-100"></div>
            <nav className="space-y-1 font-sans text-xs">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-semibold transition-all text-left ${
                    activeSection === section.id
                      ? "bg-blue-50 text-blue-900 font-bold border-l-4 border-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{section.label}</span>
                  <ChevronRight size={14} className={activeSection === section.id ? "text-blue-700" : "text-slate-400"} />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Corpo do Documento Principal */}
        <div className="lg:col-span-3 space-y-12 print:w-full">
          
          {/* Capa Principal Académica */}
          <div className="bg-white border-2 border-slate-300 p-16 shadow-lg rounded-sm min-h-[950px] flex flex-col items-center justify-between text-center relative overflow-hidden print:shadow-none print:border-none">
            <div className="absolute top-0 left-0 w-full h-3 bg-blue-950"></div>
            
            <div className="space-y-4">
              <h1 className="text-2xl font-bold tracking-widest text-slate-900 font-sans uppercase">
                INSTITUTO SUPERIOR POLITÉCNICO DE SONGO
              </h1>
              <p className="text-xs tracking-wider text-slate-500 font-sans uppercase">
                Repartição de Tecnologias de Informação e Comunicação | Gabinete do Diretor-Geral
              </p>
              <div className="w-24 h-1 bg-slate-900 mx-auto mt-4"></div>
            </div>

            <div className="space-y-8 my-auto">
              <div className="space-y-4">
                <span className="text-xs font-sans font-black tracking-[0.5em] text-blue-700 uppercase block">
                  Projeto Teórico de Concepção e Engenharia de Software
                </span>
                <h2 className="text-4xl font-black text-slate-950 tracking-tight leading-none font-sans">
                  SIGEP: Sistema Integrado de Gestão e Planificação do ISPS
                </h2>
                <div className="h-1 bg-blue-100 max-w-md mx-auto my-6"></div>
                <h3 className="text-lg font-bold text-slate-800 italic max-w-2xl mx-auto">
                  "Estudo do Organograma Completo, Composição de Direções, Funcionalidades, Tecnologia de Persistência Cloud e Engenharia de Software"
                </h3>
              </div>
              <p className="max-w-xl mx-auto text-slate-600 leading-relaxed text-md font-serif text-justify px-4">
                Este documento constitui o projeto teórico integral do SIGEP. Descreve de forma pormenorizada a composição humana e as competências de cada direção, departamento, repartição e setor do ISPS, integrando as razões científicas e de infraestrutura regional na escolha das tecnologias NoSQL e reativas utilizadas.
              </p>
            </div>

            <div className="space-y-8 w-full max-w-2xl font-sans text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-2">
                  <div className="h-px bg-slate-200 w-full"></div>
                  <span>Soberania Digital</span>
                </div>
                <div className="space-y-2">
                  <div className="h-px bg-slate-200 w-full"></div>
                  <span>Arquitetura Reativa</span>
                </div>
                <div className="space-y-2">
                  <div className="h-px bg-slate-200 w-full"></div>
                  <span>Resiliência de Rede</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 font-sans">
              <p className="font-bold text-slate-900 tracking-wider">SONGO – MOÇAMBIQUE</p>
              <p className="text-slate-400 text-xs">Ano Letivo de 2026 | Versão 2.0.0-PRO</p>
            </div>
          </div>

          {/* Artigo / Documento Completo */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-12 lg:p-16 space-y-16 text-slate-900 leading-relaxed text-justify font-serif print:border-none print:shadow-none print:p-0">
            
            {/* Secção 1: Introdução */}
            <section id="introducao" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
                <Compass className="text-blue-700" size={28} />
                <h3 className="text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
                  1. Introdução & Contexto
                </h3>
              </div>
              <p className="indent-10 text-lg leading-loose">
                A informatização dos serviços administrativos e letivos no <strong>Instituto Superior Politécnico de Songo (ISPS)</strong> não constitui apenas uma atualização tecnológica, mas sim uma imperiosa necessidade de soberania e eficiência operacional. Diante de fluxos analógicos descentralizados, baseados na circulação de formulários em papel e ficheiros de folha de cálculo isolados, o SIGEP foi concebido como a plataforma unificadora do ecossistema institucional.
              </p>
              <p className="indent-10 text-lg leading-loose">
                Este projeto teórico foi elaborado para descrever detalhadamente o organograma completo que governa o sistema, especificando de forma exaustiva a composição humana, as competências legais e as funcionalidades de cada direção. Ademais, este documento expõe de forma pormenorizada a arquitetura do <strong>Sistema</strong>, fundamentando cientificamente as decisões de engenharia de software e a escolha das tecnologias de ponta adaptadas à realidade de infraestrutura de Moçambique.
              </p>
            </section>

            {/* Secção 2: Órgão de Direção e Gestão (ODG) */}
            <section id="odg_completo" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
                <Building2 className="text-blue-700" size={28} />
                <h3 className="text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
                  2. Órgão de Direção e Gestão (ODG)
                </h3>
              </div>
              <p className="indent-10 text-lg leading-loose">
                O <strong>Órgão de Direção e Gestão (ODG)</strong> do ISPS representa a autoridade máxima de governabilidade, coordenação estratégica, planificação financeira e representação legal da instituição. No SIGEP, o ODG atua como o validador supremo de fluxos, deliberações e orçamentos. Abaixo, descreve-se detalhadamente a composição e as funcionalidades de cada estrutura constituinte e de conselho do ODG:
              </p>

              <div className="space-y-8 pl-4 border-l-2 border-blue-900">
                
                {/* 2.1 Conselho de Representantes */}
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-blue-950 font-sans">
                    2.1 Conselho de Representantes (CR)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Composição Humana Detalhada:</strong> Representantes eleitos do corpo docente, representantes dos estudantes das divisões curriculares, representantes do pessoal técnico-administrativo, parceiros da indústria local e representantes designados pela tutela governamental.
                  </p>
                  <p className="text-md text-slate-700 leading-relaxed text-justify">
                    <em>Funcionalidades no Sistema:</em> O CR é o órgão deliberativo máximo de fiscalização do ISPS. Utiliza o menu de **Deliberações do Conselho** e o painel de **Acompanhamento de Metas Estratégicas** para fiscalizar os rumos do instituto. Através do sistema, este conselho analisa de forma global e eletrônica os relatórios consolidados de execução orçamental físico-financeira gerados pela DICOSAFA e os pareceres de auditoria. Emite pareceres e homologações finais digitais sobre o Plano Estratégico do ISPS e valida grandes diretrizes orçamentais anuais antes da sua submissão ao Ministério de tutela.
                  </p>
                </div>

                {/* 2.2 Gabinete do Diretor-Geral */}
                <div className="space-y-6">
                  <h4 className="text-xl font-bold text-blue-950 font-sans border-b border-slate-200 pb-2">
                    2.2 Gabinete do Diretor-Geral (GDG)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Composição Humana Detalhada:</strong> Diretor-Geral, Assessores de Direção e Oficiais de Apoio de Gabinete.
                  </p>
                  <p className="text-md text-slate-700 leading-relaxed text-justify">
                    <em>Funcionalidades e Setor no Sistema:</em> O GDG é a instância executiva central e de decisão última da instituição. No SIGEP, o setor opera como o **Ponto de Homologação Final**. Através do menu **Aprovação de Requisições de Logística e Despesas**, o Diretor-Geral examina e julga todos os processos com pareceres favoráveis da UGEA, DPEP e DICOSAFA. Permite ao Diretor-Geral aplicar a sua assinatura eletrónica criptográfica (baseada em *hash* seguro) para autorizar despesas, pagamentos a fornecedores, adiantamentos de ajudas de custo e uso de viaturas oficiais. Através do menu **Painel de Despachos**, o gabinete gera despachos administrativos estruturados em formato PDF oficial com carimbo digital integrado, que são disparados e arquivados de forma automatizada no processo individual digital de cada funcionário.
                  </p>

                  {/* 2.2.1 Chefe do GDG */}
                  <div className="pl-6 border-l border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">
                      2.2.1 Chefe do Gabinete do Diretor-Geral (Chefe do GDG)
                    </h5>
                    <p className="text-xs text-slate-500 italic">Cargo de Direção: Responsável pela coordenação executiva de expediente e fluxo de gabinete.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Atua como o **Filtro Técnico e Supervisor de Expediente**. O Chefe do GDG acede ao menu **Controlo de Fluxos de Expedientes**, onde realiza a triagem eletrónica de todos os requerimentos, memorandos e processos vindos de outras divisões e departamentos. Ele pode devolver processos incompletos aos setores de origem, adicionar notas de encaminhamento técnico e delegar tarefas específicas a assessores ou chefes de departamento diretamente pelo sistema. Apenas os processos validados e despachados favoravelmente pelo Chefe do GDG entram na fila de decisão final do Diretor-Geral.
                    </p>
                  </div>

                  {/* 2.2.2 Secretaria Executiva */}
                  <div className="pl-6 border-l border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">
                      2.2.2 Secretaria Executiva
                    </h5>
                    <p className="text-xs text-slate-500 italic">Corpo Técnico: Assistência direta, protocolo e gestão de atendimento ao público do gabinete.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Atua na **Gestão Documental e de Agenda**. Opera ativamente o menu de **Registo de Correspondência (Entradas e Saídas)**, onde digitaliza documentos físicos recebidos, insere metadados básicos e atribui o número de protocolo oficial do ISPS. Também gerencia o menu de **Calendário e Agenda do Diretor-Geral**, agendando audiências com parceiros externos, reuniões extraordinárias dos conselhos e audiências com estudantes, notificando de forma automática os envolvidos por correio eletrónico institucional e alertas na plataforma SIGEP.
                    </p>
                  </div>
                </div>

                {/* 2.3 Conselho Administrativo e de Gestão */}
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-blue-950 font-sans">
                    2.3 Conselho Administrativo e de Gestão (CAG)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Composição Humana Detalhada:</strong> Diretor-Geral (que preside), Diretor da DICOSAFA, Chefe do Departamento de Recursos Humanos, Chefe do Departamento de Finanças, Chefe do Departamento de Património, e um representante eleito do pessoal técnico e administrativo.
                  </p>
                  <p className="text-md text-slate-700 leading-relaxed text-justify">
                    <em>Funcionalidades no Sistema:</em> O CAG é responsável pelo planeamento operacional e gestão orçamental e patrimonial. Atua diretamente nos menus de **Parametrização Orçamental e Limites de Gastos**, deliberando sobre tetos financeiros globais e setoriais. O conselho analisa mensalmente o painel integrado de desvios orçamentais e vota propostas de redistribuição interna ou reforço de rubricas financeiras da **Matriz de Actividades** para garantir a continuidade operacional das aulas práticas, manutenção predial do campus de Songo e gestão de frotas.
                  </p>
                </div>

                {/* 2.4 Conselho Técnico e de Qualidade */}
                <div className="space-y-3">
                  <h4 className="text-xl font-bold text-blue-950 font-sans">
                    2.4 Conselho Técnico e de Qualidade (CTQ)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Composição Humana Detalhada:</strong> Chefe do DCTQ, Diretor da Divisão de Engenharia, Chefes dos Departamentos de Engenharia Eletrotécnica, Construção Civil e Mecânica, Diretores de Cursos, Responsáveis de Laboratórios Científicos e Engenheiros Especialistas em Avaliação de Qualidade.
                  </p>
                  <p className="text-md text-slate-700 leading-relaxed text-justify">
                    <em>Funcionalidades no Sistema:</em> O CTQ serve como o corpo consultivo de auditoria de conformidade técnica, acadêmica e pedagógica. Atua ativamente no menu de **Diagnóstico Inteligente** e de **Auditoria de Desempenho**, analisando a integridade dos dados curriculares, consistência de pautas no Registo Académico, conformidade física de equipamentos do laboratório inventariados no sistema, e emite relatórios técnicos e pareceres digitais sobre propostas de novas atividades da Matriz antes de estas seguirem para deliberação orçamental do CAG ou despacho do Gabinete do Diretor-Geral.
                  </p>
                </div>

                {/* 2.5 DPEP */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-blue-950 font-sans border-b border-slate-200 pb-2">
                    2.5 Departamento de Planificação, Estudos e Projetos (DPEP)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Sectores Integrantes:</strong> Repartição de Planificação e Orçamentação, Setor de Estatística e Informação e Setor de Monitoria de Projetos Estruturais.
                  </p>
                  <p className="text-md text-slate-700 leading-relaxed text-justify">
                    <em>Funcionalidades no Sistema:</em> O DPEP parametriza o ecossistema orçamental global no menu **Gestão da Matriz de Actividades**. A *Repartição de Planificação* utiliza a ferramenta para cadastrar os programas institucionais, metas e sub-atividades orçamentadas de cada divisão letiva do ISPS. O *Setor de Estatística* opera ferramentas de tratamento analítico de dados, gerando pautas estatísticas consolidadas de desempenho letivo e retenção de estudantes. O *Setor de Monitoria* rastreia cronogramas de obras de infraestrutura no campus e metas de projetos de cooperação, gerando alertas preditivos de desvio de cronograma e relatórios físico-financeiros em tempo real de apoio à Direção-Geral.
                  </p>
                </div>

                {/* 2.6 UGEA */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-blue-950 font-sans border-b border-slate-200 pb-2">
                    2.6 Unidade Gestora Executora das Aquisições (UGEA)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Sectores Integrantes:</strong> Repartição de Concurso e Contratação Pública, Setor de Cadastro de Fornecedores e Setor de Gestão e Fiscalização de Contratos.
                  </p>
                  <p className="text-md text-slate-700 leading-relaxed text-justify">
                    <em>Funcionalidades no Sistema:</em> A UGEA é o garante da legalidade no aprovisionamento de materiais para o ISPS. No menu **Gestão de Fornecedores**, a equipa realiza a acreditação cadastral eletrónica de prestadores de serviços, verificando certidões de regularidade fiscal estatais. No menu **Produtos e Preços de Referência (Catálogo de Mercado)**, a *Repartição de Concurso* valida propostas financeiras contra índices médios oficiais para evitar sobrefaturações. O *Setor de Gestão de Contratos* fiscaliza prazos de entrega e garantias técnicas de equipamentos comprados para os laboratórios de Songo, emitindo pareceres eletrónicos para liberação de pagamentos na DICOSAFA.
                  </p>
                </div>

                {/* 2.7 DCRE */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-blue-950 font-sans border-b border-slate-200 pb-2">
                    2.7 Departamento de Cooperação e Relações Exteriores (DCRE)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Sectores Integrantes:</strong> Repartição de Cooperação Internacional e Parcerias, Setor de Mobilidade Académica e Sector de Protocolo e Relações Públicas.
                  </p>
                  <p className="text-md text-slate-700 leading-relaxed text-justify">
                    <em>Funcionalidades no Sistema:</em> O DCRE gerencia o intercâmbio de recursos e mobilidades institucionais. Através do menu **Registo de Convénios**, a *Repartição de Cooperação* rastreia a validade jurídica de memorandos com universidades e indústrias nacionais e estrangeiras (ex: parcerias energéticas associadas a Cahora Bassa). O *Setor de Mobilidade Académica* acompanha processos de bolsas para docentes do ISPS em doutoramentos ou estágios, arquivando os seus relatórios periódicos no sistema. O *Setor de Protocolo* opera o **Calendário de Eventos Institucionais**, reservando salas, agendando visitas ao campus e tratando de vistos de acolhimento diretamente pelo SIGEP.
                  </p>
                </div>

                {/* 2.8 Departamento de Controlo Técnico e de Qualidade */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-blue-950 font-sans border-b border-slate-200 pb-2">
                    2.8 Departamento de Controlo Técnico e de Qualidade (DCTQ)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Sectores Integrantes:</strong> Repartição de Inspeção de Processos Administrativos, Setor de Garantia de Qualidade Académica e Setor de Auditoria de Redes e Dados do Sistema.
                  </p>
                  <p className="text-md text-slate-700 leading-relaxed text-justify">
                    <em>Funcionalidades no Sistema:</em> O DCTQ opera como o auditor e fiscalizador interno do ecossistema SIGEP. No menu **Diagnóstico Inteligente**, a *Repartição de Inspeção* executa testes de integridade para detetar anomalias orçamentais, duplicados em requisições ou anomalias de expediente. O *Setor de Garantia de Qualidade Académica* rastreia o cumprimento de planos curriculares e assiduidade dos docentes em ligação direta com a Divisão de Engenharia. O *Setor de Auditoria do Sistema* monitoriza ativamente os **Logs de Auditoria NoSQL**, identificando alterações anómalas de privilégios ou registos, prevenindo fraudes internas e emitindo alertas reativos imediatos ao Diretor-Geral.
                  </p>
                </div>

                {/* 2.9 Departamento Jurídico */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-blue-950 font-sans border-b border-slate-200 pb-2">
                    2.9 Departamento Jurídico (DJ)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Sectores Integrantes:</strong> Setor de Contencioso Administrativo e Laboral, e Setor de Minutas, Pareceres e Contratos.
                  </p>
                  <p className="text-md text-slate-700 leading-relaxed text-justify">
                    <em>Funcionalidades no Sistema:</em> O DJ é o escudo legal do ISPS. Utiliza o menu **Validação de Pareceres de Contratos** para redigir e retificar as minutas de convénios de cooperação propostas pelo DCRE ou contratos públicos gerados pela UGEA. O *Setor de Contencioso* acompanha processos disciplinares laborais de funcionários ou inquéritos estudantis em ligação com a DICOSSER, indexando certidões de legalidade aos perfis digitais na coleção de colaboradores e garantindo que todas as decisões do Diretor-Geral cumprem a Lei de Probidade Pública de Moçambique.
                  </p>
                </div>

              </div>
            </section>

            {/* Secção 3: Unidade Orgânica (UO) */}
            <section id="uo_completo" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
                <Network className="text-blue-700" size={28} />
                <h3 className="text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
                  3. Unidade Orgânica (UO)
                </h3>
              </div>
              <p className="indent-10 text-lg leading-loose">
                A <strong>Unidade Orgânica (UO)</strong> do ISPS representa a força acadêmica, científica e de extensão da instituição. Traduz-se nas divisões letivas e centros de pesquisa e desenvolvimento de Songo. No SIGEP, a sua atuação reflete o planeamento de aulas práticas, infraestrutura laboratorial e aproveitamento académico:
              </p>

              <div className="space-y-8 pl-4 border-l-2 border-blue-900">
                
                {/* 3.1 Divisão de Engenharia */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-blue-950 font-sans border-b border-slate-200 pb-2">
                    3.1 Divisão de Engenharia (DE)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Composição Humana Geral:</strong> Diretor da Divisão, Diretor Adjunto Pedagógico, Chefes dos Departamentos Académicos, Coordenadores de Cursos, Corpo Docente, Investigadores e Técnicos de Laboratório.
                  </p>
                  
                  {/* 3.1.1 Diretor da Divisão de Engenharia */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.1.1 Diretor da Divisão de Engenharia (Aceder):</h5>
                    <p className="text-xs text-slate-500 italic">Função Executiva: Dirigir, superintender, coordenar e representar cientificamente e administrativamente a Divisão de Engenharia do ISPS.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Através da funcionalidade <strong>Aceder</strong>, o Diretor da Divisão valida as propostas de submissão de atividades e aquisições laboratoriais curriculares elaboradas pelos departamentos antes de as submeter ao Departamento de Finanças da DICOSAFA ou ao Gabinete do Diretor-Geral. Ele aprova os planos de distribuição docente e homologa as pautas de notas finais no sistema.
                    </p>
                  </div>

                  {/* 3.1.2 Diretor Adjunto Pedagógico */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.1.2 Diretor Adjunto Pedagógico (DAP):</h5>
                    <p className="text-xs text-slate-500 italic">Função Pedagógica: Planificar, coordenar, organizar e superintender as atividades letivas, de avaliação e curriculares da Divisão.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Opera de forma direta o painel de **Estrutura Orgânica (Gestão de Cursos)** e o **Calendário Académico**. Controla a distribuição de cargas horárias docentes, alocação de turmas, valida os planos analíticos das disciplinas de engenharia e supervisiona o lançamento atempado de notas e exames no Registo Académico.
                    </p>
                  </div>

                  {/* 3.1.3 Departamento de Pesquisa e Extensão */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.1.3 Departamento de Pesquisa e Extensão (DPE):</h5>
                    <p className="text-xs text-slate-500 italic">Composto por: Setor de Investigação Científica e Publicações, e Setor de Projetos de Extensão Universitária e Apoio à Comunidade.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Utiliza o menu de **Gestão de Projetos Científicos e Extensão** para registrar e monitorar linhas de pesquisa ativas de docentes do ISPS, cadastrar artigos e livros científicos publicados, e controlar o desenvolvimento físico e de despesas de projetos de extensão técnica de apoio às comunidades de Songo.
                    </p>
                  </div>

                  {/* 3.1.4 Departamento de Engenharia Eletrotécnica */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.1.4 Departamento de Engenharia Eletrotécnica (DEE):</h5>
                    <p className="text-xs text-slate-500 italic">Gere os cursos de: Engenharia Elétrica, Engenharia Eletrónica e Telecomunicações, e Engenharia de Energias Renováveis.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Utiliza o menu de **Submissão de Propostas da Matriz** para planejar, quantificar e justificar as necessidades de insumos elétricos e eletrónicos para aulas práticas. Atribui disciplinas a professores no painel letivo e valida as pautas pedagógicas específicas destes cursos técnicos.
                    </p>
                  </div>

                  {/* 3.1.5 Departamento de Engenharia de Construção Civil */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.1.5 Departamento de Engenharia de Construção Civil (DECC):</h5>
                    <p className="text-xs text-slate-500 italic">Gere os cursos de: Engenharia Civil e Engenharia Hidráulica (foco em Obras Hidráulicas e Hidrologia).</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Opera no menu de **Submissão de Propostas da Matriz** para requisitar materiais de ensaio de solos e betão, equipamentos topográficos e softwares de modelação estrutural. Realiza o controlo pedagógico de disciplinas teóricas e práticas de construção e de engenharia de águas.
                    </p>
                  </div>

                  {/* 3.1.6 Departamento de Engenharia de Construção Mecânica */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.1.6 Departamento de Engenharia de Construção Mecânica (DECM):</h5>
                    <p className="text-xs text-slate-500 italic">Gere os cursos de: Engenharia Mecânica e Engenharia de Tecnologia Térmica / Climatização.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Utiliza o menu **Submissão de Propostas da Matriz** para orçamentar gases térmicos, metais de ensaio, eletrodos de soldadura e ferramentas mecânicas. Organiza o agendamento de aulas práticas e controla as pautas letivas e assiduidade dos docentes vinculados ao departamento.
                    </p>
                  </div>

                  {/* 3.1.7 Departamento de Disciplinas Gerais */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.1.7 Departamento de Disciplinas Gerais (DDG):</h5>
                    <p className="text-xs text-slate-500 italic">Gere as disciplinas transversais: Matemática, Física, Química, Desenho Técnico e Introdução à Programação.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Coordena a alocação de docentes comuns a todos os cursos de engenharia no primeiro e segundo ano e utiliza o menu de **Estrutura Orgânica** para consolidar os planos pedagógicos e acompanhar as taxas de reprovação ou retenção destas matérias fundamentais do ISPS.
                    </p>
                  </div>

                  {/* 3.1.8 Departamento Técnico e de Apoio */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.1.8 Departamento Técnico e de Apoio (DTA):</h5>
                    <p className="text-xs text-slate-500 italic">Responsável por: Oficinas de Engenharia, Laboratórios de Ensaios Científicos, Logística Interna da Divisão de Engenharia.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Atua na linha de frente operacional através do menu **Gestão de Ativos e Produtos (Inventariável)**, realizando o cadastro, codificação e controle de estoque de insumos químicos, ferramentas físicas, aparelhos de ensaio, além de monitorar o cronograma de manutenção e calibração periódica dos equipamentos dos laboratórios de Songo.
                    </p>
                  </div>
                </div>

                {/* 3.2 CIE */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-blue-950 font-sans border-b border-slate-200 pb-2">
                    3.2 Centro de Incubação de Empresas (CIE)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Composição Humana Geral:</strong> Diretor do CIE, Chefes dos Departamentos de Negócios, Consultoria e Prospecção, Mentores Tecnológicos e Empreendedores de Startups Incubadas.
                  </p>
                  
                  {/* 3.2.1 Diretor do CIE */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.2.1 Diretor do CIE (Aceder):</h5>
                    <p className="text-xs text-slate-500 italic">Função Executiva: Dirigir, fomentar e representar o ecossistema de incubação, inovação e parcerias com o setor industrial do CIE-ISPS.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Utiliza a funcionalidade <strong>Aceder</strong> para obter uma visão consolidada de todos os projetos e empresas. Homologa relatórios de progresso de incubação de startups, autoriza propostas orçamentais de prestação de consultorias técnicas externas para a indústria regional e valida a entrada de novas startups incubadas na base de dados do sistema.
                    </p>
                  </div>

                  {/* 3.2.2 DPGNDE */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.2.2 Departamento de Práticas de Geração de Negócio e Desenvolvimento Empresarial (DPGNDE):</h5>
                    <p className="text-xs text-slate-500 italic">Responsável por: Mentoria de Negócios, Programas de Aceleração e Treino em Gestão de Microempresas.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Opera de forma ativa o menu de **Gestão de Incubação e Startups**, rastreando o progresso das startups no ecossistema (KPIs de vendas, faturamento, captação de clientes, etc.), registrando planos de negócios e agendando e controlando sessões de consultoria gerencial diretamente na plataforma.
                    </p>
                  </div>

                  {/* 3.2.3 DCPAF */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.2.3 Departamento de Consultoria, Estudos, Projetos e Angariação de Fundos (DCPAF):</h5>
                    <p className="text-xs text-slate-500 italic">Responsável por: Elaboração de Candidaturas a Fundos de Investigação, Prestação de Serviços Técnicos à Indústria e Estudos Aplicados.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Controla as ações no menu **Gestão de Projetos de Consultoria**, monitorando em tempo real as despesas correntes, as ordens de faturação de serviços de assessoria técnica prestados à indústria (ex: HCB, EDM, Vale), e gerenciando a captação de recursos científicos e submissões a editais internacionais de inovação.
                    </p>
                  </div>

                  {/* 3.2.4 DPONE */}
                  <div className="space-y-2 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm font-sans">3.2.4 Departamento de Prospecção de Oportunidades de Negócio (DPONE):</h5>
                    <p className="text-xs text-slate-500 italic">Responsável por: Mapeamento de Oportunidades Industriais na Província de Tete, Parcerias de Transferência de Tecnologia.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Utiliza o sistema para manter uma base de dados ativa de empresas e indústrias parceiras, registando memorandos de entendimento setoriais, avaliando demandas tecnológicas não atendidas no mercado moçambicano e identificando canais viáveis para novos produtos desenvolvidos no ISPS.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* Secção 4: Serviços Centrais (DICOSAFA & DICOSSER) */}
            <section id="sc_completo" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
                <Users className="text-blue-700" size={28} />
                <h3 className="text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
                  4. Serviços Centrais (DICOSAFA & DICOSSER)
                </h3>
              </div>
              <p className="indent-10 text-lg leading-loose">
                Os <strong>Serviços Centrais</strong> garantem a estabilidade diária de toda a engrenagem administrativa, financeira, logística e académica do ISPS. Dividem-se em dois grandes blocos de serviços integrados:
              </p>

              <div className="space-y-8 pl-4 border-l-2 border-blue-900">
                
                {/* 4.1 DICOSAFA */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-blue-950 font-sans border-b border-slate-200 pb-2">
                    4.1 DICOSAFA (Direção de coordenação de serviços administrativos e finanças)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Composição Humana Geral:</strong> Diretor da DICOSAFA, Chefes dos Departamentos de Recursos Humanos, Finanças, Património, TIC, Secretaria Geral, Cantina e Lar Estudantil.
                  </p>
                  
                  {/* 4.1.1 Diretor da DICOSAFA & Aceder */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.1.1 Diretor da DICOSAFA (Mandato e Acesso Activo):</h5>
                    <p className="text-xs text-slate-500 italic">Função Executiva: Dirigir, orientar e supervisionar toda a administração, gestão de pessoas e finanças do ISPS.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Ações e Funcionalidades no Sistema (Aceder):</em> O Diretor da DICOSAFA possui perfil administrativo-financeiro de alto nível. No sistema, ele utiliza o menu <strong>Aceder</strong> para entrar nos painéis de **Validação Orçamental**, onde emite pareceres favoráveis sobre despesas consolidadas antes de as submeter ao Gabinete do Diretor-Geral. Ele autoriza e valida eletronicamente as folhas de vencimento geradas pelo Departamento de Recursos Humanos, valida cabimentações orçamentais da Matriz de Actividades enviadas pelo Departamento de Finanças, homologa saídas de frota do Departamento de Património e assina digitalmente termos de conformidade de serviços de TI e relatórios de despesas alimentares da cantina e lar estudantil.
                    </p>
                  </div>

                  {/* 4.1.2 DRH */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.1.2 Departamento de Recursos Humanos (DRH):</h5>
                    <p className="text-xs text-slate-500 italic">Composto por: Repartição de Pessoal e Registo, Repartição de Carreiras e Remunerações (Salários) e Repartição de Formação e Desenvolvimento.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Opera o menu de **Registar Colaboradores** e o **Processo Individual Digital (PID)**. O DRH é responsável pelo cadastro completo de dados contratuais, dados bancários (NIB) e fiscais (NUIT) de todo o pessoal docente, técnico e administrativo. O setor utiliza o sistema para processar as folhas de salário mensais, gerir licenças, faltas, avaliações de desempenho individuais e registrar a atribuição e revogação de funções de chefia acadêmica ou administrativa, o que atualiza dinamicamente as permissões de assinatura digital no sistema.
                    </p>
                  </div>

                  {/* 4.1.3 DF */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.1.3 Departamento de Finanças (DF):</h5>
                    <p className="text-xs text-slate-500 italic">Composto por: Repartição de Contabilidade e Auditoria, Repartição de Tesouraria e Setor de Execução Orçamental.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Opera de forma integrada nos menus de **Parametrização Orçamental e Limites de Gastos**, e **Relatórios de Execução Financeira**. O DF é responsável por registrar no sistema todas as dotações financeiras, efetuar a cabimentação das atividades propostas na Matriz de Actividades antes de qualquer aquisição, processar as ordens de pagamento eletrónicas a fornecedores via Tesouraria e gerar mapas consolidados de despesas e reconciliações bancárias em tempo real.
                    </p>
                  </div>

                  {/* 4.1.4 DP */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.1.4 Departamento de Património (DP):</h5>
                    <p className="text-xs text-slate-500 italic">Composto por: Repartição de Inventário e Bens Patrimoniais, Repartição de Manutenção Predial e Repartição de Transportes.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Opera o menu de **Gestão de Ativos e Produtos (Inventariável)** para realizar a tombagem, codificação e inventariação eletrónica de todo o imobilizado (incluindo equipamentos científicos de ponta dos laboratórios da Divisão de Engenharia). O setor também utiliza o menu **Workflow de Logística e Combustíveis** para gerir os veículos institucionais, fiscalizar quilometragens, emitir vales eletrónicos de combustível e registrar agendamentos de manutenções preventivas dos edifícios do campus de Songo.
                    </p>
                  </div>

                  {/* 4.1.5 Secretaria Geral */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.1.5 Secretaria Geral (SG):</h5>
                    <p className="text-xs text-slate-500 italic">Composta por: Setor de Arquivo e Documentação Geral, Repartição de Expediente e Protocolo Administrativo.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Atua na espinha dorsal de comunicação escrita do ISPS. Utiliza ativamente o menu **Expedientes e Despachos** e as ferramentas de **Protocolo Central**, sendo encarregue de registrar as correspondências recebidas e expedidas pelo instituto, atribuir números sequenciais eletrónicos únicos de registo, controlar os prazos de resposta de requerimentos de estudantes ou parceiros externos e zelar pelo arquivo histórico digital do instituto.
                    </p>
                  </div>

                  {/* 4.1.6 Departamento TIC */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.1.6 Departamento de Tecnologias de Informação e Comunicação (TIC):</h5>
                    <p className="text-xs text-slate-500 italic">Composto por: Repartição de Infraestrutura de Redes, Repartição de Desenvolvimento de Software e Suporte Técnico.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> O departamento de TIC é o administrador supremo da infraestrutura computacional do SIGEP. No menu **CPanel Avançado**, os administradores gerem o ecossistema de dados: monitorizam conexões em tempo real no menu **Sessões Ativas**, configuram as permissões de segurança e papéis (roles) de utilizadores, gerem o agendamento de cópias de segurança (Backups automatizados na nuvem e em servidores locais) e ajustam parâmetros operacionais da base NoSQL para garantir que o sistema opere com latência mínima.
                    </p>
                  </div>

                  {/* 4.1.7 Departamento Lar de Estudantes */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.1.7 Departamento Lar de Estudantes (DLE):</h5>
                    <p className="text-xs text-slate-500 italic">Composto por: Repartição de Alojamento e Setor de Vigilância, Disciplina e Bem-Estar Residencial.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> O Lar de Estudantes utiliza o menu de **Alocação de Quartos e Dormitórios**. O departamento faz o cadastro das vagas disponíveis, realiza a triagem socioeconómica eletrónica de estudantes inscritos na residência universitária, faz a atribuição automatizada de quartos e camas e monitoriza os pagamentos mensais de taxas de habitação, gerando notificações eletrónicas para os residentes em atraso.
                    </p>
                  </div>

                  {/* 4.1.8 Departamento de Produção Alimentar */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.1.8 Departamento de Produção Alimentar (DPA):</h5>
                    <p className="text-xs text-slate-500 italic">Composto por: Repartição de Abastecimento e Logística da Cantina, e Repartição de Produção Agropecuária (Unidade Thaka).</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> O DPA gerencia as provisões de alimentos para a comunidade escolar de Songo. Utiliza o menu **Gestão de Provisões Agropecuárias (Thaka)** para registrar as colheitas agrícolas, controlar o estoque de sementes, rações e o gado da quinta pedagógica e produtiva do ISPS. Também opera no menu de inventário de alimentos da cantina escolar, registrando saídas diárias de refeições para estudantes residentes e faturando custos operacionais de aquisição de insumos de merenda.
                    </p>
                  </div>
                </div>

                {/* 4.2 DICOSSER */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-blue-950 font-sans border-b border-slate-200 pb-2">
                    4.2 DICOSSER (Direção de coordenação de serviços estudantis e registo)
                  </h4>
                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    <strong>Composição Humana Geral:</strong> Diretor da DICOSSER, Oficiais do Registo Académico, Técnicos de Mobilidade Estudantil, Assistentes Sociais do Setor de Bolsas e Técnicos Bibliotecários.
                  </p>

                  {/* 4.2.1 Diretor da DICOSSER & Aceder */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.2.1 Diretor da DICOSSER (Mandato e Acesso Activo):</h5>
                    <p className="text-xs text-slate-500 italic">Função Executiva: Dirigir e coordenar todos os processos de registo académico, biblioteca, apoio social e desporto do corpo discente.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Ações e Funcionalidades no Sistema (Aceder):</em> O Diretor da DICOSSER utiliza o menu **Aceder** para exercer a sua autoridade técnico-pedagógica digital. Ele valida e homologa relatórios de matrículas consolidadas no início de cada ano letivo, aprova a alocação de subsídios de alojamento e isenções de propinas para alunos vulneráveis do Departamento de Assuntos Estudantis, homologa termos de notas e pautas gerais de curso emitidos pelo Registo Académico, e valida propostas orçamentais da direção antes de as encaminhar para a Direção-Geral.
                    </p>
                  </div>

                  {/* 4.2.2 Departamento de Registo Académico */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.2.2 Departamento de Registo Académico (DRA):</h5>
                    <p className="text-xs text-slate-500 italic">Composto por: Repartição de Admissão e Matrículas (Graduação e Pós-Graduação), Repartição de Certificação e Emissão de Diplomas, Repartição de Exames e Pautas.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> Responsável por gerir a vida académica desde o ingresso até à colação de grau. Utiliza o menu de **Controlo de Matrículas e Certificados**, registrando novos estudantes, gerindo os históricos letivos, calculando médias aritméticas, controlando notas de exames normais, de recorrência e especiais, e emitindo declarações eletrónicas de frequência, certificados de conclusão de curso e termos de grau académico validados com assinaturas digitais da instituição.
                    </p>
                  </div>

                  {/* 4.2.3 Departamento de Assuntos Estudantis */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.2.3 Departamento de Assuntos Estudantis (DAE):</h5>
                    <p className="text-xs text-slate-500 italic">Composto por: Repartição de Bolsas de Estudo e Apoio Social, e Repartição de Desporto, Cultura e Atividades Extracurriculares.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> O DAE opera ativamente o menu de **Apoio Social e Bolsas**. É encarregue de realizar o mapeamento e acompanhamento de subsídios a estudantes de baixa renda, gerir o plano anual de isenções de propina, organizar ligas desportivas e eventos culturais do instituto, arquivar atestados médicos e mediar conflitos estudantis em estreita colaboração com a Direção da DICOSSER.
                    </p>
                  </div>

                  {/* 4.2.4 Departamento de Biblioteca */}
                  <div className="space-y-3 pl-4 border-l border-slate-200">
                    <h5 className="font-bold text-slate-900 text-sm">4.2.4 Departamento de Biblioteca (DB):</h5>
                    <p className="text-xs text-slate-500 italic">Composto por: Repartição de Documentação e Aquisição de Acervo, Setor de Sala de Leitura, Arquivo Físico e Catálogo Digital.</p>
                    <p className="text-md text-slate-700 leading-relaxed text-justify">
                      <em>Funcionalidades no Sistema:</em> O DB utiliza o menu de **Gestão de Visitas e Livros**. Este departamento mantém o catálogo online de livros acadêmicos, monografias de graduação e periódicos científicos atualizado. Controla empréstimos, devoluções, penalidades por atraso na entrega de obras de engenharia e gera estatísticas periódicas de frequência de salas de leitura e consultas do acervo pelos discentes do ISPS.
                    </p>
                  </div>
                </div>

              </div>
            </section>

            {/* Secção 5: O Sistema e as Tecnologias */}
            <section id="tecnologia_sistema" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
                <Cpu className="text-blue-700" size={28} />
                <h3 className="text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
                  5. Sistema: Arquitetura & Tecnologias
                </h3>
              </div>
              <p className="indent-10 text-lg leading-loose">
                A conceção da arquitetura de software do SIGEP foi guiada pelos mais rigorosos critérios de **resiliência, escalabilidade, segurança e adaptabilidade à infraestrutura local**. Projetar um sistema ERP de grande porte para uma instituição localizada em Songo exige que o software funcione sem sobressaltos, mesmo perante instabilidades frequentes de energia elétrica e largura de banda de internet reduzida.
              </p>
              <p className="indent-10 text-lg leading-loose">
                Abaixo, detalha-se a stack tecnológica escolhida para o desenvolvimento do SIGEP, juntamente com a fundamentação científica e as razões práticas para cada escolha:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 font-sans text-xs">
                
                {/* Tecnologia 1: React 18 & Vite */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm uppercase">
                    <Zap size={18} />
                    <span>React 18 & Vite (SPA)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-justify">
                    O frontend foi desenvolvido como uma Single Page Application (SPA) utilizando **React 18** compilado pelo **Vite**. O Vite assegura um tempo de build ultrarrápido e uma entrega de assets compactados ao navegador.
                  </p>
                  <p className="text-slate-700 font-medium italic">
                    <strong>Razão da Escolha para o ISPS:</strong> As SPAs descarregam todo o motor de renderização da aplicação no navegador do cliente de uma única vez. Ao navegar entre módulos e menus, o sistema não realiza novas requisições HTTP para buscar páginas HTML completas, consumindo o mínimo possível de largura de banda de internet em Songo e eliminando tempos de carregamento lentos.
                  </p>
                </div>

                {/* Tecnologia 2: Google Cloud Firestore */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm uppercase">
                    <Database size={18} />
                    <span>Cloud Firestore (NoSQL)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-justify">
                    A persistência de dados utiliza o banco de dados documental **Google Cloud Firestore**. Toda a comunicação com a base de dados ocorre de forma assíncrona por meio de queries otimizadas em tempo de execução.
                  </p>
                  <p className="text-slate-700 font-medium italic">
                    <strong>Razão da Escolha para o ISPS:</strong> O Firestore oferece suporte nativo e transparente para **Cache e Sincronização Offline**. Se a conectividade com a internet cair no campus do ISPS, a aplicação continua a operar de forma ininterrupta, salvando dados no repositório IndexedDB local do browser. Assim que a rede reestabelece, o Firestore sincroniza as coleções de forma atómica e transparente em segundo plano, garantindo zero perda de dados.
                  </p>
                </div>

                {/* Tecnologia 3: Tailwind CSS */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm uppercase">
                    <Layers size={18} />
                    <span>Tailwind CSS</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-justify">
                    Toda a estilização visual, espaçamentos e layouts responsivos foram concebidos utilizando o framework utilitário **Tailwind CSS**, permitindo criar um design de alto nível sem arquivos CSS redundantes.
                  </p>
                  <p className="text-slate-700 font-medium italic">
                    <strong>Razão da Escolha para o ISPS:</strong> O Tailwind compila apenas as classes utilitárias efetivamente utilizadas no projeto, gerando um pacote CSS final minificado extremamente reduzido. Isso traduz-se em carregamentos instantâneos mesmo sob redes móveis limitadas de dados (ex: 3G/4G das operadoras locais), mantendo a interface leve e responsiva em computadores e smartphones antigos.
                  </p>
                </div>

                {/* Tecnologia 4: Firebase Auth */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm uppercase">
                    <Lock size={18} />
                    <span>Firebase Authentication (RBAC)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-justify">
                    O fluxo de entrada e controle de sessões baseia-se no **Firebase Authentication**, integrado à lógica interna de segurança com políticas rigorosas de Controlo de Acesso Baseado em Funções (RBAC).
                  </p>
                  <p className="text-slate-700 font-medium italic">
                    <strong>Razão da Escolha para o ISPS:</strong> Reduz a necessidade de hospedar e gerir servidores dedicados de autenticação locais em Songo — que correriam riscos de falhas de hardware ou picos de energia. Toda a infraestrutura de segurança e segurança criptográfica das senhas fica a cargo da infraestrutura resiliente do Google, garantindo 100% de disponibilidade.
                  </p>
                </div>

              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-3 font-sans text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-extrabold uppercase">
                  <Sparkles size={16} />
                  <span>Porquê o SIGEP Não Necessita de Servidores Físicos Locais no ISPS?</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-justify">
                  Servidores locais exigem salas climatizadas com ar condicionado contínuo, geradores de emergência (UPS) para quedas constantes de energia e pessoal de suporte especializado de guarda para intervir em falhas de discos rígidos ou placas-mãe. Ao adotarmos uma **arquitetura Serverless (React + Vite + Cloud Firestore)**, eliminamos na totalidade o custo de manutenção física de servidores locais no ISPS. O sistema corre de forma distribuída diretamente nos navegadores dos computadores do pessoal administrativo, comunicando em segurança de ponta a ponta com a nuvem resiliente da Google Cloud, que garante estabilidade de nível industrial.
                </p>
              </div>
            </section>

            {/* Secção 6: Mapeamento de Menus */}
            <section id="menus_mapeados" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
                <Menu className="text-blue-700" size={28} />
                <h3 className="text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
                  6. Mapeamento de Menus do SIGEP
                </h3>
              </div>
              <p className="indent-10 text-lg leading-loose">
                Para consolidar o funcionamento prático, listamos abaixo a correspondência lógica entre as opções de menus exibidos no ecrã de navegação lateral do utilizador e as funcionalidades que ativam no sistema:
              </p>

              <div className="space-y-4 font-sans text-xs">
                
                {/* Menu 1 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-blue-900 block uppercase">MENU: Sobre o Sistema (Monografia)</span>
                  <p className="text-slate-600 mt-1 leading-relaxed text-justify">
                    Exibe a <strong>Monografia Institucional</strong> de forma interativa. É um menu consultivo acessível a todos os colaboradores do ISPS, descrevendo os departamentos e escolas que integram a estrutura. Permite edição apenas para perfis de Direção.
                  </p>
                </div>

                {/* Menu 2 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-blue-900 block uppercase">MENU: Matriz de Actividades</span>
                  <p className="text-slate-600 mt-1 leading-relaxed text-justify">
                    O centro operacional do planeamento financeiro. Permite propor novas atividades, decompor custos por rubrica, quantificar necessidades e monitorizar o fluxo de aprovação das mesmas. Está ligado à lógica relacional do teto orçamental.
                  </p>
                </div>

                {/* Menu 3 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-blue-900 block uppercase">MENU: Workflow de Requisição</span>
                  <p className="text-slate-600 mt-1 leading-relaxed text-justify">
                    Permite criar, acompanhar e assinar digitalmente requisições de passagens aéreas, alojamentos fora de Songo, adiantamentos de ajudas de custo e despesas gerais. Utiliza um motor de estados sequenciais (Pendente, Aprovado pelo Chefe, Cabimentado, Pago).
                  </p>
                </div>

                {/* Menu 4 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-blue-900 block uppercase">MENU: Gestão de Pessoal (RH)</span>
                  <p className="text-slate-600 mt-1 leading-relaxed text-justify">
                    Visível apenas para o Departamento de Recursos Humanos e a Direção-Geral. Permite realizar o cadastro laboral completo, gerir dados encriptados no Firestore, e atualizar o histórico de mandatos de chefias dos colaboradores.
                  </p>
                </div>

                {/* Menu 5 */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="font-bold text-blue-900 block uppercase">MENU: CPanel (Painel de Controlo)</span>
                  <p className="text-slate-600 mt-1 leading-relaxed text-justify">
                    Disponível apenas para os administradores de TIC e Direção-Geral. Permite resetar bases de dados, calibrar saldos orçamentais, analisar sessões de login ativas e rever logs de alteração e auditoria do banco NoSQL.
                  </p>
                </div>

              </div>
            </section>

            {/* Secção 7: Fluxos Lógicos de Trabalho */}
            <section id="fluxos_trabalho" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
                <TrendingUp className="text-blue-700" size={28} />
                <h3 className="text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
                  7. Fluxos Lógicos de Trabalho e Tomada de Decisão
                </h3>
              </div>
              <p className="indent-10 text-lg leading-loose">
                A engenharia de processos do SIGEP garante a máxima desmaterialização ao encadear os diferentes departamentos em fluxos lógicos ininterruptos. O exemplo mais claro é o de uma **Requisição de Combustível** para aulas práticas de campo:
              </p>
              <ol className="list-decimal ml-10 space-y-3 font-sans text-sm text-slate-700 italic">
                <li>
                  O <strong>Chefe do Departamento de Engenharia de Construção Civil</strong> cria a atividade de campo no menu <strong>Matriz de Actividades</strong>, detalhando a necessidade de combustível de uma viatura. O sistema verifica se há teto disponível na rubrica de Combustíveis e Lubrificantes para o setor.
                </li>
                <li>
                  O <strong>Diretor da Divisão de Engenharia</strong> recebe a atividade no seu menu de aprovações e assina digitalmente a autorização da mesma.
                </li>
                <li>
                  O motorista da <strong>DICOSAFA (Setor de Transportes)</strong> submete uma <strong>Requisição de Logística</strong> associada a essa atividade específica, indicando o veículo e a estimativa de litros de gasóleo.
                </li>
                <li>
                  A <strong>UGEA</strong> recebe o pedido, valida a especificação técnica do veículo e o preço por litro tabelado.
                </li>
                <li>
                  O <strong>Departamento de Finanças</strong> cabimenta o valor necessário da rubrica de combustíveis.
                </li>
                <li>
                  O <strong>Diretor-Geral</strong> visualiza o dossiê unificado com as assinaturas eletrônicas das divisões e emite o despacho final de autorização com um clique, atualizando o saldo do posto de abastecimento do ISPS.
                </li>
              </ol>
            </section>

            {/* Secção 8: Engenharia NoSQL & Firestore */}
            <section id="bloco10" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
                <Server className="text-blue-700" size={28} />
                <h3 className="text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
                  8. Engenharia NoSQL & Firestore
                </h3>
              </div>
              <p className="indent-10 text-lg leading-loose">
                A modelação documental do Cloud Firestore elimina tabelas relacionais pesadas e substitui-as por documentos JSON autossuficientes organizados em coleções dinâmicas. Esta decisão de design de engenharia de dados reduz as junções (joins) de consultas no banco, otimizando o processamento móvel e acelerando o carregamento de relatórios.
              </p>
              <p className="indent-10 text-lg leading-loose">
                A camada de **Resiliência do Bloco 10** entra em ação de forma reativa. Sempre que o Firestore detecta perda temporária de conectividade de rede com o gateway de Songo, o sistema desativa as chamadas remotas de bloqueio de formulários, mantendo as interfaces desbloqueadas para leitura e gravação local em cache, e realiza o envio seguro dos dados modificados assim que a internet estabiliza.
              </p>
            </section>

            {/* Secção 9: Dicionário de Campos NoSQL */}
            <section id="campos_nosql" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
                <FileSpreadsheet className="text-blue-700" size={28} />
                <h3 className="text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
                  9. Dicionário de Campos NoSQL
                </h3>
              </div>
              <p className="indent-10 text-lg leading-loose">
                Para assegurar a máxima clareza técnica neste projeto teórico, listam-se de seguida os esquemas NoSQL das coleções fundamentais operadas no Cloud Firestore:
              </p>

              <div className="space-y-6 font-sans text-xs">
                
                {/* Tabela de Colaboradores */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-sm text-blue-950 uppercase">Coleção NoSQL: colaboradores</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 font-bold bg-slate-100">
                          <th className="p-2">Nome do Campo</th>
                          <th className="p-2">Tipo de Dado</th>
                          <th className="p-2">Regras / Validação</th>
                          <th className="p-2">Descrição Funcional</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2 font-mono text-blue-800">id</td>
                          <td className="p-2">String</td>
                          <td className="p-2">Obrigatório, Único</td>
                          <td className="p-2">Chave primária do colaborador (NUIT).</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono text-blue-800">nome</td>
                          <td className="p-2">String</td>
                          <td className="p-2">Obrigatório</td>
                          <td className="p-2">Nome completo para efeitos de folha de pagamento e despachos.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono text-blue-800">nuit</td>
                          <td className="p-2">String</td>
                          <td className="p-2">Obrigatório, 9 Dígitos</td>
                          <td className="p-2">Número Único de Identificação Tributária.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono text-blue-800">nib</td>
                          <td className="p-2">String</td>
                          <td className="p-2">Obrigatório, 21 Dígitos</td>
                          <td className="p-2">Número de Identificação Bancária para salários.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono text-blue-800">cargo</td>
                          <td className="p-2">String</td>
                          <td className="p-2">Obrigatório</td>
                          <td className="p-2">Função principal desempenhada no ISPS.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono text-blue-800">tipoUsuario</td>
                          <td className="p-2">String</td>
                          <td className="p-2">"Chefia" | "Usuário Comum"</td>
                          <td className="p-2">Determina privilégios de controle automáticos.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono text-blue-800">mandatoStatus</td>
                          <td className="p-2">String</td>
                          <td className="p-2">"Ativo" | "Terminado"</td>
                          <td className="p-2">Validade do cargo com poder de assinatura eletrónica.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabela de Requisições */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-sm text-blue-950 uppercase">Coleção NoSQL: requisicoes</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-300 font-bold bg-slate-100">
                          <th className="p-2">Nome do Campo</th>
                          <th className="p-2">Tipo de Dado</th>
                          <th className="p-2">Regras / Validação</th>
                          <th className="p-2">Descrição Funcional</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2 font-mono text-blue-800">id</td>
                          <td className="p-2">String</td>
                          <td className="p-2">Automático, Único</td>
                          <td className="p-2">Identificador único do processo de requisição.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono text-blue-800">solicitanteId</td>
                          <td className="p-2">String</td>
                          <td className="p-2">Obrigatório</td>
                          <td className="p-2">Referência ao id do colaborador solicitante.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono text-blue-800">itens</td>
                          <td className="p-2">Array of Objects</td>
                          <td className="p-2">No mínimo 1 item</td>
                          <td className="p-2">Especificação de produtos e quantidades requeridas.</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono text-blue-800">estado</td>
                          <td className="p-2">String</td>
                          <td className="p-2">"Pendente" | "Aprovado" | "Pago"</td>
                          <td className="p-2">Fase atual de tramitação no workflow.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </section>

            {/* Secção 10: Conclusão */}
            <section id="conclusao" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-950 pb-3">
                <CheckCircle2 className="text-blue-700" size={28} />
                <h3 className="text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
                  10. Conclusão & Visão de Futuro
                </h3>
              </div>
              <p className="indent-10 text-lg leading-loose">
                Em suma, o **SIGEP** transcende o conceito de simples software de escritório para se afirmar como o **sistema nervoso digital do Instituto Superior Politécnico de Songo**. Através da desmaterialização de processos outrora lentos, burocráticos e suscetíveis a erros, o sistema confere ao ISPS uma eficiência de nível internacional na planificação orçamental e na gestão operacional.
              </p>
              <p className="indent-10 text-lg leading-loose">
                A estabilidade alcançada na versão 2.0.0, com a total transição da persistência local para as coleções descentralizadas do Cloud Firestore, assegura que o histórico e as configurações institucionais permanecem totalmente preservados perante atualizações ou remixes da plataforma. A expansão de novas metas prevê a incorporação de inteligência de suporte para facilitar a auditoria prévia de contratações públicas, mantendo o ISPS de Songo na vanguarda da governação digital e da excelência administrativa.
              </p>
            </section>

          </div>

          {/* Rodapé Académico */}
          <div className="text-center space-y-4 pb-20 no-print">
            <div className="flex items-center justify-center gap-4 text-slate-300">
              <div className="h-px bg-slate-200 w-24"></div>
              <ShieldCheck size={32} />
              <div className="h-px bg-slate-200 w-24"></div>
            </div>
            <p className="text-[11px] font-sans font-black tracking-widest text-slate-400 uppercase">
              DOCUMENTAÇÃO TÉCNICA E PROJETO TEÓRICO RESGUARDADO DE ACORDO COM AS DIRETRIZES DO ISPS &copy; 2026
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
