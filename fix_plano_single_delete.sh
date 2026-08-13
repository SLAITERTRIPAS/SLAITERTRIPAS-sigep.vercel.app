#!/bin/bash
sed -i -e 's/`Tem a certeza que pretende excluir a  Se sim, prossiga, se não aborta`/`(Tem a certeza que pretende excluir a atividade? Se sim, prossiga, se não aborta)`/g' src/blocos/bloco5_sistema/PlanoWorkflowView.tsx
sed -i -e 's/Tem a certeza que pretende excluir a  Se sim, prossiga, se não aborta/(Tem a certeza que pretende excluir a atividade? Se sim, prossiga, se não aborta)/g' src/blocos/bloco5_sistema/PlanoWorkflowView.tsx
