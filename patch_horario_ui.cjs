const fs = require('fs');
let content = fs.readFileSync('src/blocos/bloco3_unidades_organicas/HorarioView.tsx', 'utf8');

const targetStr = `<p className="text-[10px] text-slate-700 font-bold mb-2 italic">
                                        Docente: {viewType !== "DOCENTE" ? assignment.docente : assignment.turma}
                                      </p>
                                      <div className="mt-auto pt-2 border-t border-slate-200 flex items-center justify-between">
                                        <span className={\`text-[9px] font-bold px-2 py-0.5 rounded \${assignment.isComum ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}\`}>
                                          {assignment.isComum ? 'Sala Comum (1º/2º)' : 'Sala Fixa'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-800">{assignment.sala}</span>
                                      </div>`;

const replacementStr = `<p className="text-[10px] text-slate-700 font-bold mb-1 italic">
                                        Docente: {viewType !== "DOCENTE" ? assignment.docente : assignment.turma}
                                      </p>
                                      <div className="mb-2 flex flex-wrap gap-1">
                                        <span className={\`text-[8px] font-bold px-1.5 py-0.5 rounded \${assignment.isDupla ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}\`}>
                                          {assignment.isDupla ? 'Dupla (100 min)' : 'Simples (50 min)'}
                                        </span>
                                      </div>
                                      <div className="mt-auto pt-1.5 border-t border-slate-200 flex items-center justify-between">
                                        <span className={\`text-[9px] font-bold px-2 py-0.5 rounded \${assignment.isComum ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}\`}>
                                          {assignment.isComum ? 'Sala Comum (1º/2º)' : 'Sala Fixa'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-800">{assignment.sala}</span>
                                      </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync('src/blocos/bloco3_unidades_organicas/HorarioView.tsx', content);
  console.log("Patched HorarioView UI badges successfully!");
} else {
  console.log("Could not find targetStr in HorarioView UI");
}
