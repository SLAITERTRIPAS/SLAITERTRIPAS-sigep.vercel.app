#!/bin/bash
sed -i -e '/const isExpanded = !!expandedPivotRows\[row.label\];/,/<\/React.Fragment>/c\
                      const isExpanded = !!expandedPivotRows[row.label];\
                      const necessidades = Object.values(row.necessidadesMap || {});\
                      const hasItems = necessidades.length > 0;\
\
                      return (\
                        <React.Fragment key={idx}>\
                          {/* Linha da Rúbrica */}\
                          <tr className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${row.totalValor > 0 ? "font-bold text-slate-900" : "text-slate-500"}`}>\
                            <td className="p-3 border border-slate-200 font-mono text-xs">\
                              {String(idx + 1).padStart(2, "0")}\
                            </td>\
                            <td className="p-3 border border-slate-200 font-bold">\
                              <div className="flex items-center gap-2">\
                                <button\
                                  type="button"\
                                  onClick={() => toggleExpandPivotRow(row.label)}\
                                  className="w-4 h-4 rounded border border-slate-400 bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-700 hover:bg-slate-200 cursor-pointer shrink-0"\
                                >\
                                  {isExpanded ? "−" : "+"}\
                                </button>\
                                <span>{row.label}</span>\
                              </div>\
                            </td>\
                            <td className="p-3 border border-slate-200 text-slate-600">—</td>\
                            <td className="p-3 border border-slate-200 text-slate-600">—</td>\
                            <td className="p-3 text-center border border-slate-200 font-mono font-bold text-blue-900">\
                              {row.totalQuant > 0 ? row.totalQuant.toLocaleString("pt-MZ") : "—"}\
                            </td>\
                            <td className="p-3 text-right border border-slate-200 font-mono font-bold text-blue-950">\
                              {row.totalValor > 0\
                                ? row.totalValor.toLocaleString("pt-MZ", {\
                                    minimumFractionDigits: 2,\
                                    maximumFractionDigits: 2,\
                                  }) + " MZN"\
                                : "0,00 MZN"}\
                            </td>\
                          </tr>\
\
                          {/* Sub-itens Expandidos (Necessidades & Produtos) */}\
                          {isExpanded && hasItems &&\
                            necessidades.map((nec: any, nIdx) => {\
                              const necExpandedKey = `${row.label}|${nec.label}`;\
                              const isNecExpanded = !!expandedPivotRows[necExpandedKey];\
                              const bens = Object.values(nec.bensMap || {});\
                              const hasBens = bens.length > 0;\
\
                              return (\
                                <React.Fragment key={nIdx}>\
                                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-700">\
                                    <td className="p-3 border border-slate-200 font-mono text-[10px] text-slate-400">\
                                      {String(idx + 1).padStart(2, "0")}.{nIdx + 1}\
                                    </td>\
                                    <td className="p-3 border border-slate-200 font-medium text-slate-600">\
                                      ↳ {row.label}\
                                    </td>\
                                    <td className="p-3 border border-slate-200 font-semibold text-slate-800">\
                                      <div className="flex items-center gap-2">\
                                        {hasBens && (\
                                            <button\
                                            type="button"\
                                            onClick={() => toggleExpandPivotRow(necExpandedKey)}\
                                            className="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center text-[10px] font-black text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"\
                                            >\
                                            {isNecExpanded ? "−" : "+"}\
                                            </button>\
                                        )}\
                                        <span>{nec.label}</span>\
                                      </div>\
                                    </td>\
                                    <td className="p-3 border border-slate-200 font-medium text-slate-700">—</td>\
                                    <td className="p-3 text-center border border-slate-200 font-mono font-bold text-blue-900 bg-blue-50/40">\
                                      {nec.totalQuant > 0 ? nec.totalQuant.toLocaleString("pt-MZ") : "—"}\
                                    </td>\
                                    <td className="p-3 text-right border border-slate-200 font-mono font-semibold text-slate-800">\
                                      {nec.totalValor.toLocaleString("pt-MZ", {\
                                        minimumFractionDigits: 2,\
                                        maximumFractionDigits: 2,\
                                      }) + " MZN"}\
                                    </td>\
                                  </tr>\
                                  {isNecExpanded && hasBens &&\
                                    bens.map((bem: any, bIdx) => (\
                                      <tr key={`bem-${bIdx}`} className="border-b border-slate-50 bg-white text-slate-600">\
                                        <td className="p-3 border border-slate-200 font-mono text-[10px] text-slate-300 text-right pr-4">\
                                          {bIdx + 1}\
                                        </td>\
                                        <td className="p-3 border border-slate-200 font-medium text-slate-400">—</td>\
                                        <td className="p-3 border border-slate-200 font-medium text-slate-500 pl-8">\
                                          ↳ {nec.label}\
                                        </td>\
                                        <td className="p-3 border border-slate-200 font-medium text-slate-700">\
                                          {bem.nomeProduto}\
                                          {bem.especificacao && <div className="text-[10px] text-slate-500 italic">{bem.especificacao}</div>}\
                                        </td>\
                                        <td className="p-3 text-center border border-slate-200 font-mono text-slate-600">\
                                          {bem.quant > 0 ? bem.quant.toLocaleString("pt-MZ") : "—"}\
                                        </td>\
                                        <td className="p-3 text-right border border-slate-200 font-mono text-slate-600">\
                                          {bem.valor.toLocaleString("pt-MZ", {\
                                            minimumFractionDigits: 2,\
                                            maximumFractionDigits: 2,\
                                          }) + " MZN"}\
                                        </td>\
                                      </tr>\
                                    ))\
                                  }\
                                </React.Fragment>\
                              );\
                            })\
                          }\
                        </React.Fragment>' src/components/AcaoOrcamentalView.tsx
