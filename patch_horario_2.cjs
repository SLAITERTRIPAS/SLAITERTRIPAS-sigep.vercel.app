const fs = require('fs');
let content = fs.readFileSync('src/blocos/bloco3_unidades_organicas/HorarioView.tsx', 'utf8');

const regex = /const gerarHorario = \(\) => \{[\s\S]*?  const handlePrint = \(\) => \{/;

const replacement = `const gerarHorario = () => {
    setLoading(true);
    setLogs([]);
    setHorarios([]);
    setStatus("Iniciando motor de otimização de horários sem furos...");
    
    setTimeout(() => {
      setStatus("Verificando disciplinas e docentes...");
      addLog(\`INFO: \${disciplinas.length} disciplinas e \${docentes.length} docentes carregados.\`);
      
      setTimeout(() => {
        setStatus("Processando blocos contínuos de Segunda a Quarta-feira (Preferencial)...");
        addLog("INFO: Aplicando regras: Dupla (100 min) e Simples (50 min). Minimizando tempo de espera (sem furos).");
        
        setTimeout(() => {
          setStatus("Finalizando consolidação global...");
          addLog("SUCESSO: Horário Master gerado e otimizado sem furos para os docentes.");

          // 1. Definições Iniciais
          const activeTurmas = turmas.length > 0 ? turmas : ["1º Ano", "2º Ano", "3º Ano", "4º Ano"];
          const activeSalas = salas.length > 0 ? salas : [{ id: "101", name: "Sala 101", type: "Sala de Aula", isComum: true }, { id: "102", name: "Sala 102", type: "Laboratório", isComum: false }];
          const activeDocentes = docentes.length > 0 ? docentes : [{ id: "d1", nome: "Prof. Convidado" }];
          const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

          // Filtrar disciplinas relevantes (do curso atual ou fallback)
          let relDisc = disciplinas.filter(d => (d.curso === title) || (!d.curso));
          if (relDisc.length === 0) {
            relDisc = [
              { codigo: "MAT-1", nome: "Matemática 1", nivel: "1º ano", cargaSemanal: "4h", tipoAula: "Dupla (100 min)", docenteId: activeDocentes[0]?.id },
              { codigo: "ALG-1", nome: "Álgebra Linear", nivel: "1º ano", cargaSemanal: "4h", tipoAula: "Dupla (100 min)", docenteId: activeDocentes[0]?.id }
            ];
          }

          // Construir estrutura de slots globais
          // periods: 0=Manhã (6 slots), 1=Tarde (6 slots), 2=Noite (5 slots)
          const globalSchedule: any = {}; 
          // Ocupações para evitar choques
          const occupied = {
            docente: new Set<string>(), // \`\${docenteId}-\${dia}-\${period}-\${slot}\`
            turma: new Set<string>(),   // \`\${turma}-\${dia}-\${period}-\${slot}\`
            sala: new Set<string>()     // \`\${salaId}-\${dia}-\${period}-\${slot}\`
          };

          // Preparar tarefas a alocar (blocos de aula)
          const tasks: any[] = [];
          relDisc.forEach(disc => {
            const horasStr = String(disc.cargaSemanal || "4h").replace(/[^0-9]/g, "");
            const totalSlots = parseInt(horasStr) || 4; 
            const isDupla = (disc.tipoAula === "Dupla (100 min)");
            const blockSize = isDupla ? 2 : 1;
            const numBlocks = Math.ceil(totalSlots / blockSize);
            
            const docNome = (activeDocentes.find(d => d.id === disc.docenteId) || activeDocentes[0])?.nome || "Docente Atribuído";
            const turmaNome = disc.turma || disc.nivel || activeTurmas[0];
            
            for (let i = 0; i < numBlocks; i++) {
              tasks.push({
                ...disc,
                docNome,
                turmaNome,
                blockSize
              });
            }
          });

          // Ordenar tarefas por Docente para podermos alocá-las de forma compactada (sem furos)
          tasks.sort((a, b) => a.docNome.localeCompare(b.docNome));

          // Lógica de alocação compactada
          // Tentamos alocar todas as aulas do mesmo docente de forma seguida, dando preferência a Seg, Ter, Qua.
          const findFreeConsecutiveSlots = (docNome: string, turmaNome: string, blockSize: number, startDiaIdx: number = 0) => {
            for (let diaIdx = startDiaIdx; diaIdx < dias.length; diaIdx++) {
              const dia = dias[diaIdx];
              const availablePeriods = selectedPeriod === "Laboral" ? [0, 1] : [2]; // 0=Manhã, 1=Tarde, 2=Noite
              
              for (const pIdx of availablePeriods) {
                // Se for laboral, restringir Manhã para anos ímpares (1º, 3º) e Tarde para pares (2º, 4º) para evitar espalhar
                const isImpar = /1|3/.test(turmaNome);
                if (selectedPeriod === "Laboral") {
                   if (isImpar && pIdx === 1) continue;
                   if (!isImpar && pIdx === 0) continue;
                }

                const slotsMax = pIdx === 2 ? 5 : 6;
                for (let sIdx = 0; sIdx <= slotsMax - blockSize; sIdx++) {
                  // Verificar se estes slots estão livres para o docente e para a turma
                  let canFit = true;
                  for (let offset = 0; offset < blockSize; offset++) {
                    if (occupied.docente.has(\`\${docNome}-\${dia}-\${pIdx}-\${sIdx + offset}\`)) canFit = false;
                    if (occupied.turma.has(\`\${turmaNome}-\${dia}-\${pIdx}-\${sIdx + offset}\`)) canFit = false;
                  }
                  
                  if (canFit) {
                    // Encontrar uma sala livre
                    let salaSelecionada = activeSalas[0];
                    for (const sala of activeSalas) {
                      let salaLivre = true;
                      for (let offset = 0; offset < blockSize; offset++) {
                         if (occupied.sala.has(\`\${sala.name}-\${dia}-\${pIdx}-\${sIdx + offset}\`)) salaLivre = false;
                      }
                      if (salaLivre) {
                        salaSelecionada = sala;
                        break;
                      }
                    }
                    
                    return { dia, pIdx, sIdx, salaSelecionada };
                  }
                }
              }
            }
            return null;
          };

          // Agrupar tarefas por docente para garantir que ficam "juntos" (sem furos na medida do possível)
          const tasksByDocente: Record<string, any[]> = {};
          tasks.forEach(t => {
            if (!tasksByDocente[t.docNome]) tasksByDocente[t.docNome] = [];
            tasksByDocente[t.docNome].push(t);
          });

          // Alocação real
          Object.keys(tasksByDocente).forEach(docName => {
             const docTasks = tasksByDocente[docName];
             // Tentar colocar o docente compactado num dia
             let currentDiaIdx = 0; // Começa segunda-feira
             
             docTasks.forEach(task => {
                let slotEncontrado = findFreeConsecutiveSlots(docName, task.turmaNome, task.blockSize, currentDiaIdx);
                // Se não couber no dia atual, a função tenta nos próximos dias e devolve onde encaixou
                if (slotEncontrado) {
                   const { dia, pIdx, sIdx, salaSelecionada } = slotEncontrado;
                   currentDiaIdx = dias.indexOf(dia); // Atualiza o dia preferido para o atual (mantém as aulas no mesmo dia se possível)

                   // Registar ocupação e na grelha global
                   for (let offset = 0; offset < task.blockSize; offset++) {
                      occupied.docente.add(\`\${docName}-\${dia}-\${pIdx}-\${sIdx + offset}\`);
                      occupied.turma.add(\`\${task.turmaNome}-\${dia}-\${pIdx}-\${sIdx + offset}\`);
                      occupied.sala.add(\`\${salaSelecionada.name}-\${dia}-\${pIdx}-\${sIdx + offset}\`);
                      
                      const gKey = \`\${dia}-\${pIdx}-\${sIdx + offset}\`;
                      if (!globalSchedule[gKey]) globalSchedule[gKey] = [];
                      globalSchedule[gKey].push({
                         disciplina: task.nome,
                         codigo: task.codigo,
                         docente: docName,
                         turma: task.turmaNome,
                         sala: salaSelecionada.name,
                         isComum: salaSelecionada.isComum,
                         isFirstBlock: offset === 0,
                         isDupla: task.blockSize === 2
                      });
                   }
                }
             });
          });

          // 2. Extrair visualização (View) baseada na Global Schedule
          let entities: string[] = [];
          if (viewType === "TURMA") entities = activeTurmas;
          else if (viewType === "SALA") entities = activeSalas.map(s => s.name);
          else entities = activeDocentes.map(d => d.nome);

          const allGenerated: any[] = [];
          
          entities.forEach((entityName) => {
            const schedules: PeriodSchedule[] = [];
            
            if (selectedPeriod === "Laboral") {
              const isMorningTurma = viewType === "TURMA" && /1|3/.test(entityName);
              const isAfternoonTurma = viewType === "TURMA" && /2|4/.test(entityName);

              if (viewType !== "TURMA" || isMorningTurma || (!isMorningTurma && !isAfternoonTurma)) {
                schedules.push({ name: "MANHÃ (07:00 - 12:25)", slots: generateSlots("07:00", 6) });
              }
              if (viewType !== "TURMA" || isAfternoonTurma || (!isMorningTurma && !isAfternoonTurma)) {
                schedules.push({ name: "TARDE (13:00 - 18:25)", slots: generateSlots("13:00", 6) });
              }
            } else {
              schedules.push({ name: "NOITE (18:50 - 23:25)", slots: generateSlots("18:50", 5) });
            }

            const assignments: any = {};

            schedules.forEach((period, pIdxLocal) => {
              // PIdx original: Se Laboral, manhã=0, tarde=1. Se Pós, noite=2.
              const pIdxGlobal = selectedPeriod === "Laboral" ? (period.name.includes("MANHÃ") ? 0 : 1) : 2;

              period.slots.forEach((slot, sIdx) => {
                dias.forEach((dia) => {
                  const key = \`\${pIdxLocal}-\${sIdx}-\${dia}\`;
                  const gKey = \`\${dia}-\${pIdxGlobal}-\${sIdx}\`;
                  
                  // Procurar alocação global que corresponda a esta entidade
                  const allocs = globalSchedule[gKey] || [];
                  let myAlloc = null;
                  
                  if (viewType === "TURMA") myAlloc = allocs.find((a: any) => a.turma === entityName);
                  else if (viewType === "SALA") myAlloc = allocs.find((a: any) => a.sala === entityName);
                  else myAlloc = allocs.find((a: any) => a.docente === entityName);

                  if (myAlloc) {
                    assignments[key] = {
                      isVaga: false,
                      disciplina: myAlloc.disciplina,
                      codigo: myAlloc.codigo,
                      docente: myAlloc.docente,
                      sala: myAlloc.sala,
                      isComum: myAlloc.isComum,
                      turma: myAlloc.turma,
                      curso: title,
                      isFirstBlock: myAlloc.isFirstBlock,
                      isDupla: myAlloc.isDupla
                    };
                  } else {
                    assignments[key] = {
                      isVaga: true,
                      disciplina: "SALA VAGA",
                      codigo: "-",
                      docente: "-",
                      sala: viewType === "SALA" ? entityName : "Livre",
                      isComum: false,
                      turma: "-",
                      curso: title
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
          });

          setHorarios(allGenerated);
          setLoading(false);
          setStatus("");
        }, 800);
      }, 800);
    }, 800);
  };

  const handlePrint = () => {`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  console.log("Regex matched! Replaced.");
} else {
  console.log("Regex did not match.");
}

fs.writeFileSync('src/blocos/bloco3_unidades_organicas/HorarioView.tsx', content);
