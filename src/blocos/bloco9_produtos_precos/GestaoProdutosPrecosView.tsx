import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Table,
  FolderTree,
  Search,
  Filter,
  Edit3,
  Check,
  DollarSign,
  X,
} from "lucide-react";
import {
  getUnifiedProducts,
  saveUnifiedProduct,
  deleteUnifiedProduct,
  deduplicateDatabaseProducts,
  getCategoryForRubricaOrNecessidade,
  UnifiedProduct,
} from "../../lib/unifiedManager";
import {
  RUBRICAS,
  getNecessidadesOptions,
  formatNecessidadeWithCode,
  PRODUTOS_POR_NECESSIDADE,
} from "../../constants/formOptions";

const CATEGORIAS_LIST = [
  "TODAS",
  "121 - Bens de Consumo e Materiais",
  "122 - Serviços de Terceiros e Encargos",
  "112 - Despesas com Pessoal e Diárias",
  "1434 - Transferências e Bolsas",
  "12 - Exercícios Findos",
];

export default function GestaoProdutosPrecosView() {
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [viewMode, setViewMode] = useState<"planilha" | "agrupado">("planilha");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("TODAS");
  const [filterRubrica, setFilterRubrica] = useState("TODAS");
  const [filterNecessidade, setFilterNecessidade] = useState("TODAS");

  // Modals & Forms
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProduct, setNewProduct] = useState({
    nome: "",
    preco: 0,
    unidade: "Unidade",
    especificacao: "",
    rubrica: RUBRICAS[0] || "Bens - 121",
    necessidade: "Combustíveis e lubrificantes",
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load products and deduplicate on mount
  const refreshProducts = async () => {
    setIsLoading(true);
    try {
      const prods = await getUnifiedProducts();
      setProducts(prods);
    } catch (e) {
      console.error("Erro ao carregar produtos:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  // Handle explicit database deduplication
  const handleDeduplicate = async () => {
    setIsDeduplicating(true);
    try {
      const res = await deduplicateDatabaseProducts();
      await refreshProducts();
      setSuccessMsg(
        `Verificação concluída! A base de dados contém ${res.totalUnique} produtos únicos. ${
          res.duplicatesRemoved > 0
            ? `${res.duplicatesRemoved} produtos repetidos foram eliminados/consolidados.`
            : "Nenhum produto duplicado foi encontrado."
        }`
      );
    } catch (e) {
      console.error("Erro na deduplicação:", e);
    } finally {
      setIsDeduplicating(false);
      setTimeout(() => setSuccessMsg(null), 6000);
    }
  };

  // Compute available necessity options for dropdown based on Rubrica filter
  const rawFilterNecessidades: string[] =
    filterRubrica === "TODAS"
      ? Array.from(
          new Set(
            products
              .map((p) => p.necessidade)
              .filter((n): n is string => Boolean(n))
          )
        )
      : getNecessidadesOptions(filterRubrica);

  const availableFilterNecessidades = rawFilterNecessidades
    .map((nec) => formatNecessidadeWithCode(nec, filterRubrica))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a.localeCompare(b, "pt-MZ", { sensitivity: "base" }));

  // Main Filtering Logic
  const filteredProducts = products.filter((p) => {
    // 1. Categoria
    const pCat = p.categoria || getCategoryForRubricaOrNecessidade(p.rubrica, p.necessidade);
    if (filterCategoria !== "TODAS" && pCat !== filterCategoria) {
      return false;
    }

    // 2. Rubrica
    if (
      filterRubrica !== "TODAS" &&
      (p.rubrica || "").trim().toLowerCase() !== filterRubrica.trim().toLowerCase()
    ) {
      return false;
    }

    // 3. Necessidade
    if (filterNecessidade !== "TODAS") {
      const pCodeNec = formatNecessidadeWithCode(p.necessidade || "", p.rubrica);
      const matchNec =
        (p.necessidade || "").trim().toLowerCase() === filterNecessidade.trim().toLowerCase() ||
        pCodeNec.trim().toLowerCase() === filterNecessidade.trim().toLowerCase();
      if (!matchNec) return false;
    }

    // 4. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const pCodeNec = formatNecessidadeWithCode(p.necessidade || "", p.rubrica);
      const match =
        p.nome.toLowerCase().includes(q) ||
        (p.especificacao || "").toLowerCase().includes(q) ||
        (p.unidade || "").toLowerCase().includes(q) ||
        (p.rubrica || "").toLowerCase().includes(q) ||
        pCat.toLowerCase().includes(q) ||
        pCodeNec.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleDeleteProduct = async (nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o produto "${nome}" da base de dados?`)) {
      await deleteUnifiedProduct(nome);
      await refreshProducts();
      setSuccessMsg(`Produto "${nome}" excluído com sucesso da base de dados.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.nome) return;
    if (editingProduct._originalNome && editingProduct._originalNome !== editingProduct.nome) {
      await deleteUnifiedProduct(editingProduct._originalNome);
    }
    const cat = getCategoryForRubricaOrNecessidade(editingProduct.rubrica, editingProduct.necessidade);
    await saveUnifiedProduct({
      nome: editingProduct.nome,
      preco: Number(editingProduct.preco) || 0,
      unidade: editingProduct.unidade || "Unidade",
      especificacao: editingProduct.especificacao || "",
      rubrica: editingProduct.rubrica,
      necessidade: editingProduct.necessidade,
      categoria: cat,
    });
    await refreshProducts();
    setSuccessMsg(`Produto "${editingProduct.nome}" atualizado e substituído com sucesso na base de dados!`);
    setEditingProduct(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.nome || !newProduct.nome.trim()) return;
    const cat = getCategoryForRubricaOrNecessidade(newProduct.rubrica, newProduct.necessidade);
    await saveUnifiedProduct({
      nome: newProduct.nome.trim(),
      preco: Number(newProduct.preco) || 0,
      unidade: newProduct.unidade || "Unidade",
      especificacao: newProduct.especificacao || "",
      rubrica: newProduct.rubrica,
      necessidade: newProduct.necessidade,
      categoria: cat,
    });
    await refreshProducts();
    setSuccessMsg(`Novo produto "${newProduct.nome}" registado de forma única na base de dados!`);
    setIsAddingNew(false);
    setNewProduct({
      nome: "",
      preco: 0,
      unidade: "Unidade",
      especificacao: "",
      rubrica: RUBRICAS[0] || "Bens - 121",
      necessidade: "Combustíveis e lubrificantes",
    });
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const availableNecessidadesForNew = getNecessidadesOptions(newProduct.rubrica);

  return (
    <div className="space-y-8 max-w-full mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-800/40">
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/30 text-blue-200 px-3.5 py-1 rounded-full border border-blue-400/30 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Bloco 9 — Gestão de Produtos & Preços
          </span>
          <h2 className="text-2xl font-black tracking-tight font-serif text-white">
            Planilha Gestão de Produtos e Preços
          </h2>
          <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
            Consolidação de todos os produtos do sistema. Produtos com o mesmo nome são automaticamente identificados e mantidos como itens únicos, organizados rigorosamente por Categoria, Rúbrica e Necessidade Específica.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            onClick={handleDeduplicate}
            disabled={isDeduplicating}
            className="px-4 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black rounded-2xl text-xs tracking-wider transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2 border border-amber-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isDeduplicating ? "animate-spin" : ""}`} />
            <span>{isDeduplicating ? "A verificar..." : "⚡ Verificador de Duplicados"}</span>
          </button>

          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs tracking-wider transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2 border border-emerald-400/30"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Novo Produto Único</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="leading-snug">{successMsg}</span>
        </div>
      )}

      {/* Metrics Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Produtos Únicos</span>
          <span className="text-2xl font-black text-blue-900 mt-1 font-mono">{products.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Produtos Filtrados</span>
          <span className="text-2xl font-black text-indigo-900 mt-1 font-mono">{filteredProducts.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categorias Cobertas</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 font-mono">5 Categorias</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coerência na Base</span>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-fit mt-2 border border-emerald-200 inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> 100% Únicos
          </span>
        </div>
      </div>

      {/* View Tabs & Filters Container */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        {/* View Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setViewMode("planilha")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                viewMode === "planilha"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Table className="w-4 h-4" />
              <span>📊 Planilha Geral de Produtos</span>
            </button>
            <button
              onClick={() => setViewMode("agrupado")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                viewMode === "agrupado"
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>📂 Visão Agrupada por Rúbrica & Necessidade</span>
            </button>
          </div>

          <span className="text-xs font-bold text-gray-500">
            {filteredProducts.length} produtos apresentados
          </span>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Search className="w-3 h-3" /> Pesquisar Produto
            </label>
            <input
              type="text"
              placeholder="Nome, especificação, unidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Categoria
            </label>
            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
            >
              {CATEGORIAS_LIST.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Rubrica */}
          <div>
            <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">
              Rúbrica Orçamental
            </label>
            <select
              value={filterRubrica}
              onChange={(e) => {
                setFilterRubrica(e.target.value);
                setFilterNecessidade("TODAS");
              }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
            >
              <option value="TODAS">Todas as Rúbricas</option>
              {[...RUBRICAS].sort((a, b) => a.localeCompare(b, "pt-MZ")).map((r, i) => (
                <option key={i} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Necessidade */}
          <div>
            <label className="block text-[10px] font-black text-blue-900 uppercase tracking-widest mb-1">
              Necessidade Específica
            </label>
            <select
              value={filterNecessidade}
              onChange={(e) => setFilterNecessidade(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
            >
              <option value="TODAS">Todas as Necessidades</option>
              {availableFilterNecessidades.map((nec, i) => (
                <option key={i} value={nec}>
                  {nec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Content */}
        {isLoading ? (
          <div className="text-center py-16 space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-500">A carregar a planilha unificada de produtos...</p>
          </div>
        ) : viewMode === "planilha" ? (
          /* PLANILHA GERAL TABLE */
          <div className="space-y-4">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                <p className="text-xs font-bold text-gray-500">Nenhum produto encontrado com os filtros selecionados.</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterCategoria("TODAS");
                    setFilterRubrica("TODAS");
                    setFilterNecessidade("TODAS");
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black hover:bg-blue-100"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                      <th className="px-4 py-3.5 w-12 text-center">#</th>
                      <th className="px-4 py-3.5">Categoria</th>
                      <th className="px-4 py-3.5">Rúbrica Orçamental</th>
                      <th className="px-4 py-3.5">Necessidade Específica</th>
                      <th className="px-4 py-3.5">Nome do Produto (Único)</th>
                      <th className="px-4 py-3.5 text-right">Preço Unificado (MZN)</th>
                      <th className="px-4 py-3.5">Unidade</th>
                      <th className="px-4 py-3.5">Especificação Técnica</th>
                      <th className="px-4 py-3.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-xs">
                    {filteredProducts.map((p, idx) => {
                      const catName = p.categoria || getCategoryForRubricaOrNecessidade(p.rubrica, p.necessidade);
                      return (
                        <tr
                          key={p.id || idx}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="px-4 py-3 text-center text-gray-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                              {catName}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-800">
                            {p.rubrica || "Bens - 121"}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-600">
                            {formatNecessidadeWithCode(p.necessidade || "Geral", p.rubrica)}
                          </td>
                          <td className="px-4 py-3 font-black text-blue-950 font-serif">
                            {p.nome}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-black text-blue-700 whitespace-nowrap bg-blue-50/30">
                            {Number(p.preco || 0).toLocaleString("pt-MZ", {
                              minimumFractionDigits: 2,
                            })}{" "}
                            MZN
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-600">
                            {p.unidade || "Unidade"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={p.especificacao}>
                            {p.especificacao || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100">
                              <button
                                onClick={() => setEditingProduct({ ...p, _originalNome: p.nome })}
                                className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg transition-all border border-blue-200"
                                title="Editar Preço e Dados do Produto"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.nome)}
                                className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-lg transition-all border border-rose-200"
                                title="Excluir Produto Único"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* AGRUPADO POR RÚBRICA & NECESSIDADE */
          <div className="space-y-6">
            {RUBRICAS.filter((r) => filterRubrica === "TODAS" || r === filterRubrica).map((rubricaName) => {
              const necessidadesList = getNecessidadesOptions(rubricaName);
              const rubricaProducts = filteredProducts.filter(
                (p) => (p.rubrica || "").trim().toLowerCase() === rubricaName.trim().toLowerCase()
              );

              if (rubricaProducts.length === 0 && filterRubrica !== "TODAS") return null;

              return (
                <div key={rubricaName} className="border border-gray-200 rounded-3xl p-6 space-y-4 bg-gray-50/50">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h3 className="text-sm font-black text-blue-950 font-serif flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                      Rúbrica Orçamental: {rubricaName}
                    </h3>
                    <span className="text-xs font-black text-blue-800 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
                      {rubricaProducts.length} Produtos
                    </span>
                  </div>

                  <div className="space-y-4">
                    {necessidadesList.map((necName) => {
                      const necProds = rubricaProducts.filter((p) => {
                        const pCodeNec = formatNecessidadeWithCode(p.necessidade || "", p.rubrica);
                        const formattedNec = formatNecessidadeWithCode(necName, rubricaName);
                        return (
                          (p.necessidade || "").trim().toLowerCase() === necName.trim().toLowerCase() ||
                          pCodeNec.trim().toLowerCase() === formattedNec.trim().toLowerCase()
                        );
                      });

                      return (
                        <div key={necName} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-gray-900">
                              {formatNecessidadeWithCode(necName, rubricaName)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setNewProduct({
                                  nome: "",
                                  preco: 0,
                                  unidade: "Unidade",
                                  especificacao: "",
                                  rubrica: rubricaName,
                                  necessidade: necName,
                                });
                                setIsAddingNew(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" /> Adicionar Produto
                            </button>
                          </div>

                          {necProds.length === 0 ? (
                            <p className="text-[11px] text-gray-400 italic">Sem produtos nesta necessidade ainda.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="text-[10px] font-black text-gray-400 border-b border-gray-100 uppercase">
                                    <th className="py-2">Nome do Produto</th>
                                    <th className="py-2 text-right">Preço (MZN)</th>
                                    <th className="py-2">Unidade</th>
                                    <th className="py-2 text-right">Ações</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                  {necProds.map((p, i) => (
                                    <tr key={i} className="hover:bg-blue-50/20">
                                      <td className="py-2 font-bold text-gray-900">{p.nome}</td>
                                      <td className="py-2 text-right font-mono font-black text-blue-700">
                                        {Number(p.preco || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN
                                      </td>
                                      <td className="py-2 text-gray-600 font-bold">{p.unidade}</td>
                                      <td className="py-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <button
                                            onClick={() => setEditingProduct({ ...p, _originalNome: p.nome })}
                                            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold"
                                          >
                                            Editar
                                          </button>
                                          <button
                                            onClick={() => handleDeleteProduct(p.nome)}
                                            className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold border border-rose-200"
                                          >
                                            Excluir
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT MODAL - Passo VII Layout */}
      {editingProduct && (
        <ProductFormPassoVIIModal
          title="Atualizar & Substituir Produto na Base de Dados"
          submitLabel="Substituir na Base de Dados"
          productState={editingProduct}
          setProductState={setEditingProduct}
          onSubmit={handleSaveEdit}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {/* NEW PRODUCT MODAL - Passo VII Layout */}
      {isAddingNew && (
        <ProductFormPassoVIIModal
          title="Registar Novo Produto Único na Gestão de Preços"
          submitLabel="Registar na Base de Dados"
          productState={newProduct}
          setProductState={setNewProduct}
          onSubmit={handleAddNew}
          onCancel={() => setIsAddingNew(false)}
        />
      )}
    </div>
  );
}

interface ProductFormPassoVIIProps {
  title: string;
  submitLabel: string;
  productState: any;
  setProductState: (val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

function ProductFormPassoVIIModal({
  title,
  submitLabel,
  productState,
  setProductState,
  onSubmit,
  onCancel,
}: ProductFormPassoVIIProps) {
  const cleanKey = (productState.necessidade || "").replace(/^\d+\s*-\s*/, "").trim();
  const catalogProducts = PRODUTOS_POR_NECESSIDADE[cleanKey] || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-full w-full p-6 md:p-8 space-y-6 border border-gray-100 my-8">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600"></span>
            <h3 className="text-base font-black text-blue-950 font-serif">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Section 1: RÚBRICA & NECESSIDADE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/70 p-5 rounded-2xl border border-gray-200/80">
            <div>
              <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-1.5">
                RÚBRICA ORÇAMENTAL
              </label>
              <select
                value={productState.rubrica || RUBRICAS[0]}
                onChange={(e) => {
                  const r = e.target.value;
                  const necs = getNecessidadesOptions(r);
                  setProductState({
                    ...productState,
                    rubrica: r,
                    necessidade: necs[0] || "",
                  });
                }}
                className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
              >
                {RUBRICAS.map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-1.5">
                NECESSIDADE ESPECÍFICA
              </label>
              <select
                value={productState.necessidade || ""}
                onChange={(e) =>
                  setProductState({
                    ...productState,
                    necessidade: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
              >
                {getNecessidadesOptions(productState.rubrica).map((nec, i) => (
                  <option key={i} value={nec}>
                    {formatNecessidadeWithCode(nec, productState.rubrica)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: BLOCO AZUL DE SELEÇÃO DE PRODUTO - EXATO DO PASSO VII */}
          <div className="bg-[#f8fafc]/90 p-6 rounded-[28px] border border-slate-200/60 shadow-sm backdrop-blur-sm">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Coluna 1: SELEÇÃO DE PRODUTO/SERVIÇO (GESTÃO DE PREÇOS) */}
              <div className="xl:col-span-3 space-y-2.5">
                <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  $ SELEÇÃO DE PRODUTO/SERVIÇO (GESTÃO DE PREÇOS)
                </label>
                <div className="space-y-2.5">
                  <select
                    value={
                      catalogProducts.some((p) => p.nome === productState.nome)
                        ? productState.nome
                        : productState.nome
                        ? "__custom__"
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") return;
                      const selected = catalogProducts.find((p) => p.nome === val);
                      if (selected) {
                        setProductState({
                          ...productState,
                          nome: selected.nome,
                          preco: Number(selected.preco) || 0,
                          unidade: selected.unidade || "Unidade",
                          especificacao: selected.especificacao || "",
                        });
                      }
                    }}
                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 transition-all shadow-sm appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 1rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1em 1em",
                    }}
                  >
                    <option value="">Selecione o produto...</option>
                    {catalogProducts.map((p, idx) => (
                      <option key={idx} value={p.nome}>
                        {p.nome} — {Number(p.preco || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN ({p.unidade})
                      </option>
                    ))}
                    <option value="__custom__">
                      Outro produto personalizado (Digitar abaixo)
                    </option>
                  </select>

                  <input
                    type="text"
                    value={productState.nome || ""}
                    placeholder="Ou digite o nome do produto..."
                    onChange={(e) =>
                      setProductState({ ...productState, nome: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 transition-all shadow-sm"
                  />
                </div>
                <p className="text-[9px] text-blue-800/60 italic leading-tight mt-1.5 flex items-center gap-1">
                  💡 Apenas produtos registados na Gestão de Produtos são listados aqui.
                </p>
              </div>

              {/* Coluna 2: DETALHES / UNIDADE */}
              <div className="xl:col-span-1 space-y-2.5">
                <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-1.5">
                  DETALHES / UNIDADE
                </label>
                <select
                  value={productState.unidade || "Unidade"}
                  onChange={(e) =>
                    setProductState({ ...productState, unidade: e.target.value })
                  }
                  className="w-full px-3 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:border-blue-900 transition-all shadow-sm appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231e3a8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.8rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "0.9em 0.9em",
                  }}
                >
                  {[
                    "Unidade",
                    "Lote",
                    "Global",
                    "Kit",
                    "Mês",
                    "Trimestre",
                    "Ano",
                    "Kg",
                    "Litro",
                    "Metro",
                    "Resma",
                    "Caixa",
                    "Pacote",
                  ].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Coluna 3: DESCRIÇÃO / ESPECIFICAÇÃO */}
              <div className="xl:col-span-4 space-y-2.5">
                <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-1.5">
                  DESCRIÇÃO / ESPECIFICAÇÃO
                </label>
                <textarea
                  value={productState.especificacao || ""}
                  placeholder="Descrição detalhada..."
                  onChange={(e) =>
                    setProductState({
                      ...productState,
                      especificacao: e.target.value,
                    })
                  }
                  className="w-full p-4 bg-white border border-blue-900/10 rounded-2xl min-h-[110px] text-[12px] font-bold text-slate-700 leading-relaxed shadow-sm outline-none focus:border-blue-900 transition-all"
                />
              </div>

              {/* Coluna 4: NOME DO PRODUTO & QUANTIDADE */}
              <div className="xl:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-1">
                    NOME DO PRODUTO
                  </label>
                  <input
                    type="text"
                    required
                    value={productState.nome || ""}
                    onChange={(e) =>
                      setProductState({ ...productState, nome: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-1">
                    QUANTIDADE
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productState.quantidade || 1}
                    onChange={(e) =>
                      setProductState({
                        ...productState,
                        quantidade: Math.max(1, Number(e.target.value)),
                      })
                    }
                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm"
                  />
                </div>
              </div>

              {/* Coluna 5: PREÇO UNITARIO & TOTAL EM MZN */}
              <div className="xl:col-span-2 grid grid-cols-1 gap-4 bg-white/60 p-5 rounded-[24px] border border-blue-900/10 items-end shadow-sm">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-1">
                    PREÇO UNITARIO (MZN)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productState.preco ?? ""}
                    onChange={(e) =>
                      setProductState({
                        ...productState,
                        preco: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-3 bg-white border border-blue-900/15 rounded-2xl text-[13px] font-bold text-slate-800 outline-none focus:border-blue-900 shadow-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-[#1e3a8a] uppercase tracking-widest mb-1">
                    TOTAL EM MZN
                  </label>
                  <div className="bg-[#edf5ff] p-3 rounded-2xl text-center border border-blue-100 font-mono font-black text-blue-900 text-sm shadow-inner">
                    {(
                      (productState.quantidade || 1) *
                      (Number(productState.preco) || 0)
                    ).toLocaleString("pt-MZ", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    MZN
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Submit Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-black tracking-widest transition-all shadow-lg shadow-blue-900/20"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
