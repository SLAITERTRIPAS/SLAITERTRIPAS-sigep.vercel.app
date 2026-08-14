import React from "react";
import { getDirectionAbbreviation } from "../../../lib/utils";

export const PESOETableRow = React.memo(function PESOETableRow({
  activity,
  index,
  getActivityTotal,
}: {
  activity: any;
  index: number;
  getActivityTotal: (act: any) => number;
}) {
  if (!activity) return null;

  const totalValue = getActivityTotal(activity);
  const valueInThousands = totalValue / 1000;

  // Quarterly goals logic
  const trims = Array.isArray(activity.trimestres) ? activity.trimestres : [activity.trimestre].filter(Boolean);
  const isTrim1 = trims.some((t: any) => String(t).includes("1") || String(t).toUpperCase().includes("I") && !String(t).toUpperCase().includes("II") && !String(t).toUpperCase().includes("IV"));
  const isTrim2 = trims.some((t: any) => String(t).includes("2") || String(t).toUpperCase().includes("II") && !String(t).toUpperCase().includes("III"));
  const isTrim3 = trims.some((t: any) => String(t).includes("3") || String(t).toUpperCase().includes("III"));
  const isTrim4 = trims.some((t: any) => String(t).includes("4") || String(t).toUpperCase().includes("IV"));

  // Fonte OE vs Externo
  const isOE = !activity.fonteReceita || activity.fonteReceita.toUpperCase().includes("OE") || activity.fonteReceita.toUpperCase().includes("ESTADO");
  const isExterno = !isOE;

  return (
    <tr className="border-b border-slate-900 bg-white hover:bg-slate-50 transition-colors text-slate-800 font-medium">
      <td className="p-2 border-r border-slate-900 text-center font-bold">
        {index + 1}
      </td>
      <td className="p-2 border-r border-slate-900 text-sm font-bold leading-tight">
        {activity.title || activity.designacao}
      </td>
      <td className="p-2 border-r border-slate-900 text-xs italic">
        {activity.indicador || activity.objetivo || "-"}
      </td>
      <td className="p-2 border-r border-slate-900 text-center font-black">
        {activity.metaAnual || "1"}
      </td>
      
      {/* Metas Trimestrais */}
      <td className="p-1 border-r border-slate-900 text-center font-black text-blue-600">
        {isTrim1 ? "X" : ""}
      </td>
      <td className="p-1 border-r border-slate-900 text-center font-black text-blue-600">
        {isTrim2 ? "X" : ""}
      </td>
      <td className="p-1 border-r border-slate-900 text-center font-black text-blue-600">
        {isTrim3 ? "X" : ""}
      </td>
      <td className="p-1 border-r border-slate-900 text-center font-black text-blue-600">
        {isTrim4 ? "X" : ""}
      </td>

      <td className="p-2 border-r border-slate-900 text-xs text-center font-semibold">
        {activity.localizacao || "Songo"}
      </td>

      {/* Beneficiários */}
      <td className="p-1 border-r border-slate-900 text-center font-bold">
        {activity.numeroPessoas || activity.beneficiariosTotal || "-"}
      </td>
      <td className="p-1 border-r border-slate-900 text-center">
        {activity.beneficiariosHomens || "-"}
      </td>
      <td className="p-1 border-r border-slate-900 text-center">
        {activity.beneficiariosMulheres || "-"}
      </td>

      <td className="p-2 border-r border-slate-900 text-right font-black font-mono">
        {valueInThousands.toLocaleString("pt-MZ", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}
      </td>

      {/* Fonte */}
      <td className="p-1 border-r border-slate-900 text-center font-black text-emerald-700">
        {isOE ? "X" : ""}
      </td>
      <td className="p-1 border-r border-slate-900 text-center font-black text-amber-700">
        {isExterno ? "X" : ""}
      </td>

      <td className="p-2 border-r border-slate-900 text-[10px] italic">
        {activity.observacoes || "-"}
      </td>
      <td className="p-2 border-r border-slate-900 text-[10px] text-center font-semibold">
        {activity.financiador || (isOE ? "Tesouro" : "-")}
      </td>
      <td className="p-2 text-[10px] text-center font-bold uppercase text-slate-600">
        {getDirectionAbbreviation(activity.direcao || "Geral")}
      </td>
    </tr>
  );
});
