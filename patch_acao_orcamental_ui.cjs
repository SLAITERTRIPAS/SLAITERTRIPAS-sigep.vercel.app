const fs = require('fs');
let content = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf8');

const oldBranch = `                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedLevel("direcao");
                        setSelectedUnit(userDirecao);
                      }}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "direcao"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      🏢 Por Direção: {userDirecao}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLevel("departamento");
                        setSelectedUnit(userDepartamento);
                      }}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "departamento"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      📂 Por Departamento: {userDepartamento}
                    </button>
                  </>
                )}`;

const newBranch = `                ) : isCentralDirector ? (
                  <>
                    <button
                      onClick={() => {
                        setSelectedLevel("direcao");
                        setSelectedUnit(userDirecao);
                      }}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "direcao"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      🏢 Órgão de Direção Central: {userDirecao}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLevel("departamento");
                        setSelectedUnit(userDepartamento);
                      }}
                      className={\`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 \${
                        selectedLevel === "departamento"
                          ? "bg-sky-700 text-white shadow-md"
                          : "bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200"
                      }\`}
                    >
                      📂 Departamento: {userDepartamento}
                    </button>
                  </>
                ) : (
                  <button
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-sky-800 text-white shadow-md whitespace-nowrap shrink-0 cursor-default"
                  >
                    📂 Orçamento Mantido no Setor Planificado: {user?.setor || user?.reparticao || userDepartamento}
                  </button>
                )}`;

if (content.includes(oldBranch)) {
  content = content.replace(oldBranch, newBranch);
  console.log("Patched level buttons UI successfully!");
} else {
  console.log("Could not find oldBranch in AcaoOrcamentalView.tsx");
}

// Update select visibility condition: only show select if isPlanificacaoOrDPEP or isCentralDirector
const oldSelectCond = `{selectedLevel !== "institucional" && (isPlanificacaoOrDPEP || selectedLevel === "departamento" || (DEPARTAMENTOS[userDirecao] || []).length > 1) && (`;
const newSelectCond = `{selectedLevel !== "institucional" && (isPlanificacaoOrDPEP || isCentralDirector) && (`;

if (content.includes(oldSelectCond)) {
  content = content.replace(oldSelectCond, newSelectCond);
  console.log("Patched select condition UI successfully!");
} else {
  console.log("Could not find oldSelectCond in AcaoOrcamentalView.tsx");
}

fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', content);
