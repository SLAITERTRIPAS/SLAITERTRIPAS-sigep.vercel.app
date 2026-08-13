#!/bin/bash
sed -i -e 's/Deseja realmente excluir as ${selectedActivityIds.length} atividades selecionadas?/Tem a certeza que pretende excluir a atividade? Se sim, prossiga, se não aborta/g' src/blocos/bloco5_sistema/PlanoWorkflowView.tsx
sed -i -e 's/onShowAlert("Atividades excluídas com sucesso");/onShowAlert("excluiu as atividades selecionadas com sucesso");/g' src/blocos/bloco5_sistema/PlanoWorkflowView.tsx
sed -i -e 's/onShowAlert("Dados excluídos com sucesso");/onShowAlert("excluiu as atividades selecionadas com sucesso");/g' src/blocos/bloco5_sistema/PlanoWorkflowView.tsx
