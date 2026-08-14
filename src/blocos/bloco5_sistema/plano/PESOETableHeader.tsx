import React from "react";

export const PESOETableHeader = React.memo(function PESOETableHeader() {
  return (
    <thead className="bg-[#dbe5f1] text-slate-900 text-[11px] font-black tracking-tight text-center align-middle border-slate-900 border-2">
      <tr className="border-b border-slate-900">
        <th className="p-2 border-r border-slate-900 w-16" rowSpan={2}>
          Nº de Ordem
        </th>
        <th className="p-2 border-r border-slate-900 min-w-[250px]" rowSpan={2}>
          Acção
        </th>
        <th className="p-2 border-r border-slate-900 min-w-[200px]" rowSpan={2}>
          Indicador de Produto
        </th>
        <th className="p-2 border-r border-slate-900 w-20" rowSpan={2}>
          Meta Anual
        </th>
        <th className="p-2 border-r border-slate-900" colSpan={4}>
          Metas: Inserir metas trimestrais
        </th>
        <th className="p-2 border-r border-slate-900 w-28" rowSpan={2}>
          Localização
        </th>
        <th className="p-2 border-r border-slate-900" colSpan={3}>
          Beneficiários (desagregados por sexo, quando aplicável)
        </th>
        <th className="p-2 border-r border-slate-900 w-32" rowSpan={2}>
          Orçamento por actividade (10^3 MT)
        </th>
        <th className="p-2 border-r border-slate-900" colSpan={2}>
          Fonte de Financiamento
        </th>
        <th className="p-2 border-r border-slate-900 w-28" rowSpan={2}>
          Observacao
        </th>
        <th className="p-2 border-r border-slate-900 w-28" rowSpan={2}>
          Financiador
        </th>
        <th className="p-2 border-slate-900 w-24" rowSpan={2}>
          Resp.
        </th>
      </tr>
      <tr>
        {/* Metas Trimestrais */}
        <th className="p-1 border-r border-slate-900 w-10">I</th>
        <th className="p-1 border-r border-slate-900 w-10">II</th>
        <th className="p-1 border-r border-slate-900 w-10">III</th>
        <th className="p-1 border-r border-slate-900 w-10">IV</th>
        
        {/* Beneficiários */}
        <th className="p-1 border-r border-slate-900 w-16">Total</th>
        <th className="p-1 border-r border-slate-900 w-16">Homens</th>
        <th className="p-1 border-r border-slate-900 w-16">Mulheres</th>
        
        {/* Fonte de Financiamento */}
        <th className="p-1 border-r border-slate-900 w-16">OE</th>
        <th className="p-1 border-slate-900 w-20">O. Externo</th>
      </tr>
    </thead>
  );
});
