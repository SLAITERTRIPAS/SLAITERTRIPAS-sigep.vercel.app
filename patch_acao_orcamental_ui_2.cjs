const fs = require('fs');
let content = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf8');

const targetRegex = /\)\s*:\s*\(\s*<>\s*<button\s+onClick=\{\(\) => \{\s*setSelectedLevel\("direcao"\);[\s\S]*?Por Departamento: \{userDepartamento\}\s*<\/button>\s*<\/>\s*\)/;

const replacement = `) : isCentralDirector ? (
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
                )`;

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', content);
  console.log("Patched level buttons UI successfully via regex!");
} else {
  console.log("Regex did not match AcaoOrcamentalView.tsx");
}
