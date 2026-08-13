#!/bin/bash
sed -i -e 's/Deseja excluir as ${selectedActivityIds.length} atividades selecionadas?/Tem a certeza que pretende excluir a atividade? Se sim, prossiga, se não aborta/g' src/blocos/bloco5_sistema/MatrixView.tsx
