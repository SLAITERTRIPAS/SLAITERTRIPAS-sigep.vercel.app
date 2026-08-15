import React, { useState } from "react";
import { ArrowLeft, Building, Network, ChevronRight } from "lucide-react";

const getExplorerBlockLabel = (parentTitle: string, itemTitle: string) => {
  const pt = parentTitle.toUpperCase();
  const it = itemTitle.toUpperCase();

  // Bloco 3: Órgão de Direção e Gestão
  if (pt.includes("DIREÇÃO E GESTÃO") || pt.includes("DIRECAO E GESTAO")) {
    if (it.includes("REPRESENTANTES")) return "Sub-bloco 3.2";
    if (it.includes("GABINETE DO DIRETOR") || it.includes("GABINETE DO DIRECTOR")) return "Sub-bloco 3.1";
    if (it.includes("ADMINISTRATIVO")) return "Sub-bloco 3.3";
    if (it.includes("TÉCNICO") || it.includes("TECNICO")) return "Sub-bloco 3.4";
  }

  // Bloco 3.1: Gabinete do Diretor-Geral
  if (pt.includes("GABINETE DO DIRETOR") || pt.includes("GABINETE DO DIRECTOR") || pt.includes("DIRETOR-GERAL") || pt.includes("DIRECTOR-GERAL")) {
    if (it.includes("DIRETOR-GERAL") || it.includes("DIRECTOR-GERAL")) return "Sub-bloco 3.1.1";
    if (it.includes("CHEFE DO GDG") || it === "CHEFE GDG" || it.includes("CHEFE DO GABINETE")) return "Sub-bloco 3.1.2";
    if (it.includes("SECRETARIA EXECUTIVA") || it.includes("SECRETARIA")) return "Sub-bloco 3.1.3";
    if (it.includes("PLANIFICAÇÃO") || it.includes("PLANIFICACAO") || it.includes("ESTUDOS E PROJETOS")) return "Sub-bloco 3.1.4";
    if (it.includes("UGEA") || it.includes("AQUISIÇÕES") || it.includes("AQUISICOES") || it.includes("CONTRATAÇÃO")) return "Sub-bloco 3.1.5";
    if (it.includes("COOPERAÇÃO") || it.includes("COOPERACAO")) return "Sub-bloco 3.1.6";
    if (it.includes("CONTROLO TÉCNICO") || it.includes("CONTROLO TECNICO")) return "Sub-bloco 3.1.7";
    if (it.includes("JURÍDICO") || it.includes("JURIDICO")) return "Sub-bloco 3.1.8";
  }

  // Bloco 4: Unidade Orgânica
  if (pt.includes("UNIDADE ORGÂNICA") || pt.includes("UNIDADE ORGANICA")) {
    if (it.includes("DIVISÃO DE ENGENHARIA") || it.includes("DIVISAO DE ENGENHARIA") || it.includes("ENGENHARIA")) return "Sub-bloco 4.1";
    if (it.includes("INCUBAÇÃO") || it.includes("INCUBACAO") || it.includes("CIE")) return "Sub-bloco 4.2";
    if (it.includes("CENTROS")) return "Sub-bloco 4.3";
  }

  // Bloco 4.1: Divisão de Engenharia
  if (pt.includes("DIVISÃO DE ENGENHARIA") || pt.includes("DIVISAO DE ENGENHARIA") || pt.includes("ENGENHARIA")) {
    if (it.includes("DIRETOR DA DIVISÃO") || it.includes("DIRECTOR DA DIVISAO") || it.includes("DIREÇÃO DA DIVISÃO") || it.includes("DIRETOR DA DIVISAO") || it.includes("DIRECAO DA DIVISAO")) return "Sub-bloco 4.1.1";
    if (it.includes("PEDAGÓGICO") || it.includes("PEDAGOGICO") || it.includes("ADJUNTO")) return "Sub-bloco 4.1.2";
    if (it.includes("PESQUISA")) return "Sub-bloco 4.1.3";
    if (it.includes("ELETROTÉCNICA") || it.includes("ELETROTECNICA")) return "Sub-bloco 4.1.4";
    if (it.includes("CONSTRUÇÃO CIVIL") || it.includes("CONSTRUCO CIVIL")) return "Sub-bloco 4.1.5";
    if (it.includes("MECÂNICA") || it.includes("MECANICA") || it.includes("CONSTRUÇÃO MECÂNICA")) return "Sub-bloco 4.1.6";
    if (it.includes("DISCIPLINAS GERAIS")) return "Sub-bloco 4.1.7";
    if (it.includes("TÉCNICO E DE APOIO") || it.includes("TECNICO E DE APOIO") || it.includes("APOIO")) return "Sub-bloco 4.1.8";
  }

  // Bloco 4.2: Centro de Incubação de Empresas
  if (pt.includes("INCUBAÇÃO DE EMPRESAS") || pt.includes("INCUBACAO DE EMPRESAS") || pt.includes("CIE")) {
    if (it.includes("DIRETOR") || it.includes("DIRECTOR") || it === "DIRETOR DO CIE") return "Sub-bloco 4.2.1";
    if (it.includes("PRÁTICAS DE GERAÇÃO") || it.includes("PRATICAS DE GERACAO") || it.includes("DPGNDE")) return "Sub-bloco 4.2.2";
    if (it.includes("CONSULTORIA") || it.includes("DCPAF")) return "Sub-bloco 4.2.3";
    if (it.includes("PROSPECÇÃO") || it.includes("PROSPECCAO") || it.includes("DPONE")) return "Sub-bloco 4.2.4";
  }

  // Bloco 5: Serviços Centrais
  if (pt.includes("SERVIÇOS CENTRAIS") || pt.includes("SERVICOS CENTRAIS")) {
    if (it.includes("DICOSAFA")) return "Sub-bloco 5.1";
    if (it.includes("DICOSSER")) return "Sub-bloco 5.2";
  }

  // Bloco 5.1: DICOSAFA
  if (pt.includes("DICOSAFA") || pt.includes("DICOSSAFA")) {
    if (it.includes("DIRETOR DA DICOSAFA") || it.includes("DIRECTOR DA DICOSAFA") || it.includes("DIREÇÃO DA DICOSAFA") || it.includes("DIRECAO DA DICOSAFA")) return "Sub-bloco 5.1.1";
    if (it.includes("RECURSOS HUMANOS") || it.includes("RH")) return "Sub-bloco 5.1.2";
    if (it.includes("FINANÇAS") || it.includes("FINANCAS")) return "Sub-bloco 5.1.3";
    if (it.includes("PATRIMÓNIO") || it.includes("PATRIMONIO")) return "Sub-bloco 5.1.4";
    if (it.includes("SECRETARIA GERAL") || it.includes("SECRETARIA") || it === "SECRETARIA GERAL") return "Sub-bloco 5.1.5";
    if (it.includes("TIC") || it.includes("TECNOLOGIAS")) return "Sub-bloco 5.1.6";
    if (it.includes("LAR DE ESTUDANTES") || it.includes("ALOJAMENTO") || it.includes("LAR")) return "Sub-bloco 5.1.7";
    if (it.includes("PRODUÇÃO ALIMENTAR") || it.includes("PRODUCAO ALIMENTAR") || it.includes("ALIMENTAR")) return "Sub-bloco 5.1.8";
  }

  // Bloco 5.2: DICOSSER
  if (pt.includes("DICOSSER")) {
    if (it.includes("DIRETOR DA DICOSSER") || it.includes("DIRECTOR DA DICOSSER") || it.includes("DIREÇÃO DA DICOSSER") || it.includes("DIRECAO DA DICOSSER")) return "Sub-bloco 5.2.1";
    if (it.includes("REGISTO ACADÉMICO") || it.includes("REGISTO ACADEMICO") || it.includes("DRA")) return "Sub-bloco 5.2.2";
    if (it.includes("ASSUNTOS ESTUDANTIS") || it.includes("ESTUDANTIS")) return "Sub-bloco 5.2.3";
    if (it.includes("BIBLIOTECA") || it.includes("LIVROS")) return "Sub-bloco 5.2.4";
  }

  return "";
};

export const EstruturaExplorer = () => {
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const estrutura = [
    {
      title: "Órgão de Direção e Gestão",
      type: "Unidade Estrutural Principal",
      direcoes: [
        {
          title: "Conselho de Representantes",
          departamentos: [],
        },
        {
          title: "Gabinete do Diretor-Geral",
          departamentos: [
            {
              title: "Diretor-Geral",
              reparticoes: ["Chefe do GDG", "Secretaria Executiva"],
            },
            {
              title: "Departamento de Planificação Estudos e Projetos",
              reparticoes: [
                "Chefe do Departamento de Planificação Estudos e Projetos",
                "Repartição de Planificação",
                "Repartição de Estatística",
                "Setor de Relatório",
                "Setor de Monitoria",
              ],
            },
            {
              title: "Unidade Gestora e Executora de Aquisições",
              reparticoes: [
                "Gestão de Produtos e Preços",
                "Gestão de Fornecedores",
                "Plano de Aquisição",
                "Plano de Contratação",
              ],
            },
            {
              title: "Departamento de Cooperação e Relações Exteriores",
              reparticoes: [
                "Chefe do DCRE",
                "Setor de Imagem Institucional",
              ],
            },
            {
              title: "Departamento de Controlo Técnico e de Qualidade",
              reparticoes: [
                "Chefe do DCTQ",
                "Sector de Controlo Técnico",
              ],
            },
            {
              title: "Departamento Jurídico",
              reparticoes: [
                "Chefe do DJ",
                "Sector de Pareceres",
              ],
            },
          ],
        },
        {
          title: "Conselho Administrativo e de Gestão",
          departamentos: [],
        },
        {
          title: "Conselho Técnico e de Qualidade",
          departamentos: [],
        },
      ],
    },
    {
      title: "Unidade Orgânica",
      type: "Unidade Estrutural",
      direcoes: [
        {
          title: "Divisão de Engenharia",
          departamentos: [
            {
              title: "Direção da Divisão de Engenharia",
              reparticoes: [
                "Diretor da Divisão de Engenharia",
                "Diretor Adjunto Pedagógico",
              ],
            },
            {
              title: "Departamento de Pesquisa e Extensão",
              reparticoes: ["Repartição de Pesquisa", "Repartição de Extensão"],
            },
            {
              title: "Departamento de Engenharia Eletrotécnica",
              reparticoes: [
                "Chefe do DEE",
                "Diretor do Curso de Engenharia Elétrica",
                "Diretor do Curso de Engenharia Eletrónica e de Telecomunicações",
                "Diretor do Curso de Engenharia de Energias Renováveis",
              ],
            },
            {
              title: "Departamento de Engenharia de Construção Civil",
              reparticoes: [
                "Chefe do DECC",
                "Diretor do Curso de Engenharia de Construção Civil",
                "Diretor do Curso de Engenharia Hidráulica",
              ],
            },
            {
              title: "Departamento de Engenharia de Construção Mecânica",
              reparticoes: [
                "Chefe do DECM",
                "Diretor do Curso de Engenharia de Construção Mecânica",
                "Diretor do Curso de Engenharia Termotécnica",
              ],
            },
            {
              title: "Departamento de Disciplinas Gerais",
              reparticoes: ["Chefe do DDG"],
            },
            {
              title: "Departamento Técnico e de Apoio",
              reparticoes: ["Chefe do DTA"],
            },
          ],
        },
        {
          title: "Centro de Incubação de Empresas",
          departamentos: [
            {
              title: "Departamento de práticas de geração de negócio e desenvolvimento empresarial (DPGNDE)",
              reparticoes: [],
            },
            {
              title: "Departamento de consultoria, estudos, projetos e angariação de fundos (DCPAF)",
              reparticoes: [],
            },
            {
              title: "Departamento de prospecção de oportunidade de negócio (DPONE)",
              reparticoes: [],
            },
          ],
        },
      ],
    },
    {
      title: "Serviços Centrais",
      type: "Unidade Estrutural Auxiliar",
      direcoes: [
        {
          title: "DICOSAFA",
          departamentos: [
            {
              title: "Direção da DICOSAFA",
              reparticoes: ["Diretor da DICOSAFA"],
            },
            {
              title: "Departamento de Recursos Humanos",
              reparticoes: ["Chefe do RH", "Repartição de Pessoal", "Repartição de Formação", "Repartição de Apoio Social"],
            },
            {
              title: "Departamento de Finanças",
              reparticoes: ["Chefe de Finanças", "Repartição de Plano e Orçamento", "Repartição de Tesouraria", "Setor de Estatística"],
            },
            {
              title: "Departamento de Património",
              reparticoes: ["Chefe de DP", "Repartição de E-Património", "Repartição de Infraestrutura e Manutenção", "Repartição de Transporte"],
            },
            {
              title: "Secretaria Geral",
              reparticoes: ["Chefe da SG", "Secretaria", "SIC"],
            },
            {
              title: "Departamento TIC",
              reparticoes: ["Chefe de DTIC", "Setor de Rede de Computadores", "Setor de Manutenção", "Reprografia", "Oficina de TIC"],
            },
            {
              title: "Departamento Lar de Estudantes",
              reparticoes: ["Chefe de DLE", "Repartição de Alojamento", "Repartição de Eventos", "Economato"],
            },
            {
              title: "Departamento de Produção Alimentar",
              reparticoes: ["Chefe de DPA", "Repartição de Produção Animal", "Repartição de Produção Vegetal", "Armazém de Thaka"],
            },
          ],
        },
        {
          title: "DICOSSER",
          departamentos: [
            {
              title: "Direção da DICOSSER",
              reparticoes: ["Diretor da DICOSSER"],
            },
            {
              title: "Departamento de Registo Académico",
              reparticoes: ["Chefe do DRA", "Atendimento Estudantil", "Repartição de Certificação", "Repartição de Exames de Admissão", "Repartição de Matrículas"],
            },
            {
              title: "Departamento de Assuntos Estudantis",
              reparticoes: ["Chefe do DAE", "Repartição de Bolsa de Estudos", "Repartição de Desporto e Recreação"],
            },
            {
              title: "Departamento de Biblioteca",
              reparticoes: ["Chefe de DBA", "Biblioteca", "Repartição de Documentos", "Repartição de Arquivo"],
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {!selectedUnit ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {estrutura.map((dir, idx) => {
            const blockNum = dir.title.includes("Direção") || dir.title.includes("Direcao")
              ? "Bloco 3"
              : dir.title.includes("Serviços") || dir.title.includes("Servicos") || dir.title.includes("DICOSAFA")
                ? "Bloco 5"
                : "Bloco 4";
            return (
              <button
                key={idx}
                onClick={() => setSelectedUnit(dir)}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 text-center transition-all flex flex-col items-center relative group min-h-[160px] justify-center cursor-pointer"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 mt-2">
                  <Building size={24} />
                </div>
                <h3 className="font-bold text-blue-900 text-lg leading-tight">
                  {dir.title}
                </h3>
                <p className="text-xs text-gray-400 font-medium tracking-widest mt-2">
                  {dir.type}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
          <button
            onClick={() => setSelectedUnit(null)}
            className="text-blue-600 font-bold flex items-center gap-2 mb-4 hover:text-blue-800 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Voltar à Estrutura
          </button>
          <div>
            <h3 className="text-3xl font-black text-blue-900">
              {selectedUnit.title}
            </h3>
            <p className="text-sm font-bold text-blue-400 tracking-widest mt-1">
              {selectedUnit.type}
            </p>
          </div>

          <div className="space-y-6 mt-8">
            <h4 className="font-black text-gray-800 text-lg border-b border-gray-100 pb-2">
              Estrutura Interna (Direções / Comissões)
            </h4>
            {selectedUnit.direcoes.length === 0 && (
              <p className="text-gray-400 italic">
                Nenhuma direcção cadastrada.
              </p>
            )}

            {selectedUnit.direcoes.map((dir: any, idx: number) => {
              const subBlockLabel = getExplorerBlockLabel(selectedUnit.title, dir.title);
              return (
                <div
                  key={idx}
                  className="bg-gray-50/50 border border-gray-100 p-6 rounded-[1.5rem]"
                >
                  <h5 className="font-black text-blue-900 text-xl mb-6 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-md font-bold">
                        {idx + 1}
                      </div>
                      <span>{dir.title}</span>
                    </div>
                    {subBlockLabel && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-black tracking-wider px-3 py-1 rounded-full border border-blue-200 uppercase">
                        {subBlockLabel}
                      </span>
                    )}
                  </h5>

                  <div className="space-y-4 md:pl-14">
                    <h6 className="font-bold text-gray-500 text-xs tracking-widest flex items-center gap-2">
                      <Network size={14} />
                      Departamentos / Órgãos Subordinados ({dir.departamentos.length})
                    </h6>
                    {dir.departamentos.length === 0 && (
                      <p className="text-gray-400 italic text-sm">
                        Nenhum departamento cadastrado neste órgão.
                      </p>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {dir.departamentos.map((dept: any, deptIdx: number) => {
                        const deptLabel = getExplorerBlockLabel(dir.title, dept.title);
                        return (
                          <div
                            key={deptIdx}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative pt-12"
                          >
                            {deptLabel && (
                              <div className="absolute top-3 right-3">
                                <span className="bg-amber-550 text-amber-700 bg-amber-50 text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full border border-amber-100 uppercase">
                                  {deptLabel}
                                </span>
                              </div>
                            )}
                            <p className="font-bold text-gray-800 mb-4 text-base border-b border-gray-50 pb-2">
                              {dept.title}
                            </p>
                            <div className="space-y-3">
                              <p className="text-[10px] text-blue-400 font-bold tracking-widest flex items-center gap-1.5">
                                <ChevronRight size={12} />
                                Repartições / Setores ({dept.reparticoes?.length || 0})
                              </p>
                              {dept.reparticoes && dept.reparticoes.length > 0 ? (
                                <ul className="space-y-2">
                                  {dept.reparticoes.map(
                                    (rep: string, repIdx: number) => (
                                      <li
                                        key={repIdx}
                                        className="text-sm text-gray-600 flex items-start gap-2.5"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-300 mt-1.5 shrink-0"></div>
                                        <span className="leading-tight">{rep}</span>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              ) : (
                                <p className="text-xs text-gray-400 italic">Sem repartições específicas.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
