const fs = require('fs');
let code = fs.readFileSync('src/components/AcaoOrcamentalView.tsx', 'utf-8');
code = code.replace(/if \(val > 0 \|\| qty > 0\) \{/g, 'if (val >= 0 || qty >= 0) {');
code = code.replace(/if \(val > 0\) \{\n\s*const rawRub = \(/g, 'if (val >= 0) {\n          const rawRub = (');
fs.writeFileSync('src/components/AcaoOrcamentalView.tsx', code);
