#!/bin/bash
head -n 1140 src/components/AcaoOrcamentalView.tsx > temp.tsx
cat << 'INNER' >> temp.tsx
  const [expandedPivotRows, setExpandedPivotRows] = useState<Record<string, boolean>>({});
  const [showOnlyNonZeroPivot, setShowOnlyNonZeroPivot] = useState<boolean>(true);

  const sistafePivotData = useMemo(() => {
    const map: Record<
      string,
      {
        code: string;
        label: string;
        totalQuant: number;
        totalValor: number;
        necessidadesMap: Record<
          string,
          {
            label: string;
            totalQuant: number;
            totalValor: number;
            bensMap: Record<
              string,
              {
                nomeProduto: string;
                quant: number;
                valor: number;
                precoUnitario: number;
                especificacao?: string;
              }
            >
          }
        >;
      }
    > = {};

    if (!showOnlyNonZeroPivot) {
      OFFICIAL_SISTAFE_RUBRICAS.forEach((item) => {
        const fullLabel = `${item.code} - ${item.name}`;
        map[fullLabel] = {
          code: item.code,
          label: fullLabel,
          totalQuant: 0,
          totalValor: 0,
          necessidadesMap: {},
        };
      });
      map["(em branco)"] = {
        code: "999999",
        label: "(em branco)",
        totalQuant: 0,
        totalValor: 0,
        necessidadesMap: {},
      };
    }

    sectorActivities.forEach((act) => {
      let hasRubrica = false;

      if (Array.isArray(act.rubricas) && act.rubricas.length > 0) {
        act.rubricas.forEach((r: any) => {
          const rubStr = String(r.rubrica || r.nomeRubrica || r.code || "").trim();
          const necStr = String(r.necessidade || r.descricao || r.nomeProduto || r.item || act.designacao || act.title || "").trim();
          const prodName = String(r.nomeProduto || r.especificacao || r.produto || r.item || "").trim();
          const qty = Number(r.quantidade || r.qtd || 1);
          const val = Number(r.valorTotal || r.total || r.valor || r.precoTotal || 0);
          const pUnit = Number(r.precoUnitario || r.preco || (qty > 0 ? val / qty : 0));

          if (val >= 0 || qty >= 0) {
            hasRubrica = true;
            const targetLabel = getOfficialRubricaLabel(rubStr, necStr);

            if (!map[targetLabel]) {
              map[targetLabel] = {
                code: targetLabel.substring(0, 6),
                label: targetLabel,
                totalQuant: 0,
                totalValor: 0,
                necessidadesMap: {},
              };
            }
            map[targetLabel].totalQuant += qty;
            map[targetLabel].totalValor += val;

            const nLabel = necStr || "Sem Necessidade";
            if (!map[targetLabel].necessidadesMap[nLabel]) {
              map[targetLabel].necessidadesMap[nLabel] = {
                label: nLabel,
                totalQuant: 0,
                totalValor: 0,
                bensMap: {},
              };
            }
            map[targetLabel].necessidadesMap[nLabel].totalQuant += qty;
            map[targetLabel].necessidadesMap[nLabel].totalValor += val;

            const bLabel = prodName || "Sem Produto";
            const bemKey = `${bLabel}_${r.especificacao || ""}`;

            if (!map[targetLabel].necessidadesMap[nLabel].bensMap[bemKey]) {
              map[targetLabel].necessidadesMap[nLabel].bensMap[bemKey] = {
                nomeProduto: bLabel,
                quant: 0,
                valor: 0,
                precoUnitario: pUnit,
                especificacao: r.especificacao || "",
              };
            }
            map[targetLabel].necessidadesMap[nLabel].bensMap[bemKey].quant += qty;
            map[targetLabel].necessidadesMap[nLabel].bensMap[bemKey].valor += val;
          }
        });
      }

      if (!hasRubrica) {
        const val = Number(act.valor || act.orcamentoTotal || act.valorTotal || act.orcamento || act.custoTotal || 0);
        const qty = Number(act.quantidade || act.qtd || 1);
        const rubStr = String(act.rubrica || act.categoria || "").trim();
        const necStr = String(act.necessidade || act.designacao || act.title || "").trim();

        if (val >= 0 || qty >= 0) {
          const targetLabel = getOfficialRubricaLabel(rubStr, necStr);
          if (!map[targetLabel]) {
            map[targetLabel] = {
              code: targetLabel.substring(0, 6),
              label: targetLabel,
              totalQuant: 0,
              totalValor: 0,
              necessidadesMap: {},
            };
          }

          map[targetLabel].totalQuant += qty;
          map[targetLabel].totalValor += val;

          const nLabel = necStr || "Atividade Planificada";
          if (!map[targetLabel].necessidadesMap[nLabel]) {
            map[targetLabel].necessidadesMap[nLabel] = {
              label: nLabel,
              totalQuant: 0,
              totalValor: 0,
              bensMap: {},
            };
          }
          map[targetLabel].necessidadesMap[nLabel].totalQuant += qty;
          map[targetLabel].necessidadesMap[nLabel].totalValor += val;
          
          const bemKey = "Sem Produto_";
          if (!map[targetLabel].necessidadesMap[nLabel].bensMap[bemKey]) {
            map[targetLabel].necessidadesMap[nLabel].bensMap[bemKey] = {
              nomeProduto: "Sem Produto",
              quant: 0,
              valor: 0,
              precoUnitario: (qty > 0 ? val / qty : 0),
            };
          }
          map[targetLabel].necessidadesMap[nLabel].bensMap[bemKey].quant += qty;
          map[targetLabel].necessidadesMap[nLabel].bensMap[bemKey].valor += val;
        }
      }
    });

    return Object.values(map)
      .filter((row) => !showOnlyNonZeroPivot || row.totalValor > 0 || row.totalQuant > 0)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [sectorActivities, showOnlyNonZeroPivot]);
INNER
tail -n +1302 src/components/AcaoOrcamentalView.tsx >> temp.tsx
mv temp.tsx src/components/AcaoOrcamentalView.tsx
