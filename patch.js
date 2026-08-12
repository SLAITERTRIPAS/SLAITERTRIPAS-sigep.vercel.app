const fs = require('fs');
const content = fs.readFileSync('src/blocos/bloco3_unidades_organicas/HorarioView.tsx', 'utf8');

const targetStr = `          const allGenerated: any[] = [];

          entities.forEach((entityName) => {
            const schedules: PeriodSchedule[] = [];
            const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

            if (selectedPeriod === "Laboral") {
              schedules.push({
                name: "MANHÃ (07:00 - 12:25)",
                slots: generateSlots("07:00", 6),
              });
              schedules.push({
                name: "TARDE (13:00 - 18:25)",
                slots: generateSlots("13:00", 6),
              });
            } else {
              schedules.push({
                name: "NOITE (18:50 - 23:25)",
                slots: generateSlots("18:50", 5),
              });
            }

            const assignments: any = {};

            schedules.forEach((period, pIdx) => {
              period.slots.forEach((slot, sIdx) => {
                dias.forEach((dia) => {
                  const key = \`\${pIdx}-\${sIdx}-\${dia}\`;
                  const isVaga = Math.random() < 0.2; // 20% chance of being vacant
                  const disc = disciplinas[Math.floor(Math.random() * disciplinas.length)];
                  const doc = docentes[Math.floor(Math.random() * docentes.length)];
                  const sala = activeSalas[Math.floor(Math.random() * activeSalas.length)];

                  if (isVaga) {
                    assignments[key] = {
                      isVaga: true,
                      disciplina: "SALA VAGA",
                      codigo: "-",
                      docente: "Disponível",
                      sala: sala.name || "Sala 101",
                      tipoSala: sala.type || "Sala de Aula",
                      isComum: sala.isComum || entityName.includes("1º") || entityName.includes("2º"),
                      turma: viewType === "TURMA" ? entityName : activeTurmas[0],
                      curso: title,
                      nivel: entityName,
                    };
                  } else {
                    assignments[key] = {
                      isVaga: false,
                      disciplina: disc ? disc.nome : "Matemática Geral",
                      codigo: disc ? disc.codigo : "MAT-01",
                      docente: doc ? doc.nome : "Docente ISPS",
                      sala: sala.name || "Sala 101",
                      tipoSala: sala.type || "Sala de Aula",
                      isComum: sala.isComum || entityName.includes("1º") || entityName.includes("2º"),
                      turma: viewType === "TURMA" ? entityName : activeTurmas[0],
                      curso: title,
                      nivel: entityName,
                    };
                  }
                });
              });
            });

            allGenerated.push({
              entityName,
              curso: title,
              periodo: selectedPeriod,
              ano: new Date().getFullYear() + 1,
              dias,
              schedules,
              assignments,
            });
          });`;

const replacementStr = `          const allGenerated: any[] = [];

          entities.forEach((entityName) => {
            const schedules: PeriodSchedule[] = [];
            const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

            if (selectedPeriod === "Laboral") {
              const isMorningTurma = viewType === "TURMA" && /1|3/.test(entityName);
              const isAfternoonTurma = viewType === "TURMA" && /2|4/.test(entityName);

              if (viewType !== "TURMA" || isMorningTurma || (!isMorningTurma && !isAfternoonTurma)) {
                schedules.push({
                  name: "MANHÃ (07:00 - 12:25)",
                  slots: generateSlots("07:00", 6),
                });
              }

              if (viewType !== "TURMA" || isAfternoonTurma || (!isMorningTurma && !isAfternoonTurma)) {
                schedules.push({
                  name: "TARDE (13:00 - 18:25)",
                  slots: generateSlots("13:00", 6),
                });
              }
            } else {
              schedules.push({
                name: "NOITE (18:50 - 23:25)",
                slots: generateSlots("18:50", 5),
              });
            }

            const assignments: any = {};

            schedules.forEach((period, pIdx) => {
              period.slots.forEach((slot, sIdx) => {
                dias.forEach((dia) => {
                  const key = \`\${pIdx}-\${sIdx}-\${dia}\`;
                  const isVaga = Math.random() < 0.2; // 20% chance of being vacant
                  const disc = disciplinas[Math.floor(Math.random() * disciplinas.length)];
                  const doc = docentes[Math.floor(Math.random() * docentes.length)];
                  const sala = activeSalas[Math.floor(Math.random() * activeSalas.length)];

                  let assignedTurma = entityName;
                  if (viewType !== "TURMA") {
                    if (period.name.startsWith("MANHÃ")) {
                      const morningTurmas = activeTurmas.filter(t => /1|3/.test(t));
                      assignedTurma = morningTurmas.length > 0 ? morningTurmas[Math.floor(Math.random() * morningTurmas.length)] : activeTurmas[0];
                    } else if (period.name.startsWith("TARDE")) {
                      const afternoonTurmas = activeTurmas.filter(t => /2|4/.test(t));
                      assignedTurma = afternoonTurmas.length > 0 ? afternoonTurmas[Math.floor(Math.random() * afternoonTurmas.length)] : activeTurmas[0];
                    } else {
                      assignedTurma = activeTurmas[Math.floor(Math.random() * activeTurmas.length)];
                    }
                  }

                  if (isVaga) {
                    assignments[key] = {
                      isVaga: true,
                      disciplina: "SALA VAGA",
                      codigo: "-",
                      docente: "Disponível",
                      sala: sala.name || "Sala 101",
                      tipoSala: sala.type || "Sala de Aula",
                      isComum: sala.isComum || assignedTurma.includes("1º") || assignedTurma.includes("2º"),
                      turma: assignedTurma,
                      curso: title,
                      nivel: assignedTurma,
                    };
                  } else {
                    assignments[key] = {
                      isVaga: false,
                      disciplina: disc ? disc.nome : "Matemática Geral",
                      codigo: disc ? disc.codigo : "MAT-01",
                      docente: doc ? doc.nome : "Docente ISPS",
                      sala: sala.name || "Sala 101",
                      tipoSala: sala.type || "Sala de Aula",
                      isComum: sala.isComum || assignedTurma.includes("1º") || assignedTurma.includes("2º"),
                      turma: assignedTurma,
                      curso: title,
                      nivel: assignedTurma,
                    };
                  }
                });
              });
            });

            allGenerated.push({
              entityName,
              curso: title,
              periodo: selectedPeriod,
              ano: new Date().getFullYear() + 1,
              dias,
              schedules,
              assignments,
            });
          });`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/blocos/bloco3_unidades_organicas/HorarioView.tsx', content.replace(targetStr, replacementStr));
  console.log("Success");
} else {
  console.log("Target not found");
}
