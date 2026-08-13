#!/bin/bash
sed -i -e '/setSelectedActivityIds(\[\]);/a\
      if (typeof (window as any).onShowAlert === "function") {\
         (window as any).onShowAlert("excluiu as atividades selecionadas com sucesso");\
      } else {\
         alert("excluiu as atividades selecionadas com sucesso");\
      }' src/blocos/bloco5_sistema/MatrixView.tsx
