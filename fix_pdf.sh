#!/bin/bash
sed -i -e '/{Object.values(row.itemsMap).map((item: any, iIdx) => (/,/<\/React.Fragment>/c\
                      {Object.values(row.necessidadesMap || {}).map((nec: any, nIdx) => (\
                        <React.Fragment key={`nec-${nIdx}`}>\
                          <tr className="border-b border-slate-200 text-slate-700 bg-white">\
                            <td className="p-1.5 pl-8 border border-slate-300 font-bold text-slate-800 text-[11px]" style={{ letterSpacing: '0.3px' }}>\
                              └─ {nec.label}\
                            </td>\
                            <td className="p-1.5 text-right border border-slate-300 font-mono text-slate-800 text-[11px]" style={{ letterSpacing: '0.3px' }}>\
                              {nec.totalValor.toLocaleString("pt-MZ", {\
                                minimumFractionDigits: 2,\
                                maximumFractionDigits: 2,\
                              })}\
                            </td>\
                          </tr>\
                          {Object.values(nec.bensMap || {}).map((bem: any, bIdx) => (\
                            <tr key={`bem-${nIdx}-${bIdx}`} className="border-b border-slate-100 text-slate-600 bg-slate-50">\
                              <td className="p-1.5 pl-12 border border-slate-300 font-normal text-slate-600 text-[10px]" style={{ letterSpacing: '0.2px' }}>\
                                └─ {bem.nomeProduto}\
                                {bem.quant > 0 && ` (${bem.quant} un/L${bem.precoUnitario ? ` × ${bem.precoUnitario} MT` : ""})`}\
                                {bem.especificacao && ` - ${bem.especificacao}`}\
                              </td>\
                              <td className="p-1.5 text-right border border-slate-300 font-mono text-slate-600 text-[10px]">\
                                {bem.valor.toLocaleString("pt-MZ", {\
                                  minimumFractionDigits: 2,\
                                  maximumFractionDigits: 2,\
                                })}\
                              </td>\
                            </tr>\
                          ))}\
                        </React.Fragment>\
                      ))}\
                    </React.Fragment>' src/components/AcaoOrcamentalView.tsx
