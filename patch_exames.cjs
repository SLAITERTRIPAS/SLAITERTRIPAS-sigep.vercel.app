const fs = require('fs');
let content = fs.readFileSync('src/blocos/bloco3_unidades_organicas/ExamesView.tsx', 'utf8');

const oldBlock = `                    let count = 0;
                    for (const disc of disciplinasComExame) {
                      // Check if already has normal exam
                      const existsNormal = examesGerados.find(e => e.disciplina === disc.id && e.tipo === "Normal");
                      if (!existsNormal) {
                        await firestoreService.exames.add({
                          tipo: "Normal",
                          disciplina: disc.id,
                          disciplinaNome: disc.nome,
                          data: new Date(Date.now() + count * 86400000 * 2).toISOString().split('T')[0],
                          sala: defaultSala,
                          vigilante: defaultVigilante,
                          createdAt: new Date().toISOString(),
                        });
                        count++;
                      }
                      // Check if already has recorrência exam
                      const existsRec = examesGerados.find(e => e.disciplina === disc.id && e.tipo === "Recorrência");
                      if (!existsRec) {
                        await firestoreService.exames.add({
                          tipo: "Recorrência",
                          disciplina: disc.id,
                          disciplinaNome: disc.nome,
                          data: new Date(Date.now() + (count + 5) * 86400000 * 2).toISOString().split('T')[0],
                          sala: defaultSala,
                          vigilante: defaultVigilante,
                          createdAt: new Date().toISOString(),
                        });
                        count++;
                      }
                    }`;

const newBlock = `                    // Função para calcular próxima data útil (Segunda a Sexta)
                    const getBusinessDate = (startOffsetDays, index) => {
                      const d = new Date();
                      d.setDate(d.getDate() + startOffsetDays);
                      // Ajustar para próxima Segunda-feira se for fim de semana
                      while (d.getDay() === 0 || d.getDay() === 6) {
                        d.setDate(d.getDate() + 1);
                      }
                      // Adicionar 'index' dias úteis
                      let added = 0;
                      while (added < index) {
                        d.setDate(d.getDate() + 1);
                        if (d.getDay() !== 0 && d.getDay() !== 6) {
                          added++;
                        }
                      }
                      return d;
                    };

                    const formatISO = (d) => d.toISOString().split('T')[0];

                    let discIdx = 0;
                    for (const disc of disciplinasComExame) {
                      // Data para o Exame Normal (Segunda a Sexta)
                      const normalDateObj = getBusinessDate(3, discIdx);
                      const normalDateStr = formatISO(normalDateObj);

                      // Data para Exame de Recorrência (1 semana / 7 dias depois, Segunda a Sexta)
                      const recDateObj = new Date(normalDateObj);
                      recDateObj.setDate(recDateObj.getDate() + 7);
                      while (recDateObj.getDay() === 0 || recDateObj.getDay() === 6) {
                        recDateObj.setDate(recDateObj.getDate() + 1);
                      }
                      const recDateStr = formatISO(recDateObj);

                      // Check if already has normal exam
                      const existsNormal = examesGerados.find(e => e.disciplina === disc.id && e.tipo === "Normal");
                      if (!existsNormal) {
                        await firestoreService.exames.add({
                          tipo: "Normal",
                          disciplina: disc.id,
                          disciplinaNome: disc.nome,
                          data: normalDateStr,
                          sala: defaultSala,
                          vigilante: defaultVigilante,
                          createdAt: new Date().toISOString(),
                        });
                      }

                      // Check if already has recorrência exam
                      const existsRec = examesGerados.find(e => e.disciplina === disc.id && e.tipo === "Recorrência");
                      if (!existsRec) {
                        await firestoreService.exames.add({
                          tipo: "Recorrência",
                          disciplina: disc.id,
                          disciplinaNome: disc.nome,
                          data: recDateStr,
                          sala: defaultSala,
                          vigilante: defaultVigilante,
                          createdAt: new Date().toISOString(),
                        });
                      }

                      discIdx++;
                    }`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync('src/blocos/bloco3_unidades_organicas/ExamesView.tsx', content);
  console.log("Patched ExamesView.tsx successfully!");
} else {
  console.log("Could not match oldBlock in ExamesView.tsx");
}
