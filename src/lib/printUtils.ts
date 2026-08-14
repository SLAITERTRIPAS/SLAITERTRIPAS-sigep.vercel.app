/**
 * Utilitário de Impressão de Documentos do SIGEP - ISPS
 * Permite abrir qualquer documento (Plano de Atividades, Relatório, Balancete, Ficha)
 * ajustando e escolhendo o formato ideal (A4 / A3 em Orientação Vertical ou Horizontal)
 * conforme a ocupação da área com informações.
 */

export interface PrintDocumentOptions {
  title: string;
  subtitle?: string;
  orgao?: string;
  direcao?: string;
  divisao?: string;
  departamento?: string;
  reparticao?: string;
  setor?: string;
  headerHtml?: string;
  contentHtml: string;
  styles?: string;
  orientation?: "portrait" | "landscape" | "auto";
  pageSize?: "A3" | "A4" | "A5" | "letter" | "legal" | "auto";
  printType?: string;
  autoDetectFormat?: boolean;
}

export interface PrintFormatResult {
  pageSize: "A3" | "A4";
  orientation: "portrait" | "landscape";
  reason: string;
  maxCols: number;
}

/**
 * Análise inteligente da ocupação de área e densidade do documento
 * para determinar automaticamente se o formato ideal é A4/A3 e Retrato/Paisagem.
 */
export function detectIdealPrintFormat(options: {
  title?: string;
  subtitle?: string;
  contentHtml: string;
  pageSize?: "A3" | "A4" | "A5" | "letter" | "legal" | "auto";
  orientation?: "portrait" | "landscape" | "auto";
}): PrintFormatResult {
  const {
    title = "",
    subtitle = "",
    contentHtml,
    pageSize = "auto",
    orientation = "auto",
  } = options;

  let maxTableCols = 0;
  const colMatch = contentHtml.match(/<tr[\s\S]*?<\/tr>/gi);
  if (colMatch) {
    colMatch.forEach((rowStr) => {
      const cols = (rowStr.match(/<(td|th)[\s>]/gi) || []).length;
      if (cols > maxTableCols) maxTableCols = cols;
    });
  }

  const hasWideClasses =
    contentHtml.includes("min-w-[1900px]") ||
    contentHtml.includes("min-w-[1500px]") ||
    contentHtml.includes("min-w-[1200px]") ||
    contentHtml.includes("w-[1200px]") ||
    contentHtml.includes("w-[1500px]");

  const titleLower = (title + " " + (subtitle || "")).toLowerCase();
  const contentLength = contentHtml.length;

  let finalPageSize: "A3" | "A4" = "A4";
  let finalOrientation: "portrait" | "landscape" = "portrait";
  let reason = "Análise automática por área de ocupação de informação.";

  // 1. Matrizes muito largas ou tabelas com > 8 colunas -> A3 Paisagem (Horizontal)
  if (
    maxTableCols > 8 ||
    hasWideClasses ||
    (titleLower.includes("plano") && (maxTableCols >= 6 || contentLength > 4000)) ||
    titleLower.includes("matriz") ||
    titleLower.includes("quadro orçamental") ||
    titleLower.includes("mapa geral")
  ) {
    finalPageSize = "A3";
    finalOrientation = "landscape";
    reason = `Documento com matriz extensa (${maxTableCols} colunas). Formato A3 Horizontal selecionado para máxima legibilidade.`;
  }
  // 2. Relatórios de média largura (5 a 8 colunas) ou Balanços/Horários -> A4 Paisagem (Horizontal)
  else if (
    maxTableCols >= 5 ||
    titleLower.includes("balanço") ||
    titleLower.includes("balanco") ||
    titleLower.includes("balancete") ||
    titleLower.includes("horário") ||
    titleLower.includes("horario") ||
    titleLower.includes("exames") ||
    titleLower.includes("mapa de execução")
  ) {
    if (contentLength > 12000) {
      finalPageSize = "A3";
      finalOrientation = "portrait";
      reason = "Extenso volume vertical de dados. Formato A3 Vertical selecionado.";
    } else {
      finalPageSize = "A4";
      finalOrientation = "landscape";
      reason = `Documento com ${maxTableCols || 5} colunas. Formato A4 Horizontal otimiza a área de impressão.`;
    }
  }
  // 3. Documentos muito extensos em texto vertical -> A3 Retrato (Vertical)
  else if (contentLength > 15000 && maxTableCols <= 4) {
    finalPageSize = "A3";
    finalOrientation = "portrait";
    reason = "Documento muito extenso verticalmente. Formato A3 Vertical reduz o número de páginas.";
  }
  // 4. Formulários, Fichas, Despachos, Guias e Documentos Curtos -> A4 Retrato (Vertical)
  else {
    finalPageSize = "A4";
    finalOrientation = "portrait";
    reason = "Documento padrão de 1-4 colunas. Formato A4 Vertical é a opção ideal.";
  }

  // Respeita preferências do utilizador caso não sejam "auto"
  if (pageSize && pageSize !== "auto" && (pageSize === "A3" || pageSize === "A4")) {
    finalPageSize = pageSize;
  }
  if (orientation && orientation !== "auto") {
    finalOrientation = orientation;
  }

  return {
    pageSize: finalPageSize,
    orientation: finalOrientation,
    reason,
    maxCols: maxTableCols,
  };
}

export function openPrintDocumentWindow(options: PrintDocumentOptions) {
  const {
    title,
    subtitle,
    orgao,
    direcao,
    divisao,
    departamento,
    reparticao,
    setor,
    headerHtml,
    contentHtml,
    styles = "",
    orientation = "auto",
    pageSize = "auto",
    printType,
  } = options;

  // Análise de ocupação de área
  const detected = detectIdealPrintFormat({
    title,
    subtitle,
    contentHtml,
    pageSize,
    orientation,
  });

  const resolvedPageSize = detected.pageSize;
  const resolvedOrientation = detected.orientation;

  const printWindow = window.open(
    "",
    "_blank",
    "width=1280,height=920,scrollbars=yes,resizable=yes",
  );

  const hasEmbeddedHeader =
    contentHtml.includes("REPÚBLICA DE MOÇAMBIQUE") ||
    contentHtml.includes("República de Moçambique") ||
    contentHtml.includes("INSTITUTO SUPERIOR POLITÉCNICO") ||
    contentHtml.includes("Instituto Superior Politécnico") ||
    contentHtml.includes("lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad");

  const resolvedOrgao = (() => {
    if (orgao && orgao.trim() && orgao.toUpperCase() !== "UNIDADE ORGÂNICA") {
      const u = orgao.toUpperCase();
      if (u.includes("SERVIÇO") || u.includes("SERVICO")) return "SERVIÇOS CENTRAIS";
      if (u.includes("DIREÇÃO E GESTÃO") || u.includes("DIRECAO E GESTAO")) return "ÓRGÃO DE DIREÇÃO E GESTÃO";
      return u;
    }
    if (direcao) {
      const d = direcao.toUpperCase();
      if (d.includes("DICOSAFA") || d.includes("DICOSSER") || d.includes("SERVIÇO")) return "SERVIÇOS CENTRAIS";
      if (d.includes("GABINETE") || d.includes("DIRETOR-GERAL") || d.includes("CONSELHO") || d.includes("GDG")) return "ÓRGÃO DE DIREÇÃO E GESTÃO";
      if (d.includes("ENGENHARIA") || d.includes("CIE") || d.includes("CENTRO") || d.includes("INCUBACAO")) return "UNIDADE ORGÂNICA";
    }
    return (orgao || "UNIDADE ORGÂNICA").toUpperCase();
  })();

  const lowestLevelName = [setor, reparticao, departamento, divisao, direcao].filter(Boolean)[0] || resolvedOrgao;
  let resolvedTitle = (title || "PLANO DE ATIVIDADE").toUpperCase().trim();
  if (resolvedTitle === "PLANO DE ATIVIDADE" || resolvedTitle === "PLANO DE ATIVIDADES") {
    resolvedTitle = `PLANO DE ATIVIDADE DE ${lowestLevelName.toUpperCase()}`;
  }

  const defaultHeader =
    headerHtml !== undefined
      ? headerHtml
      : hasEmbeddedHeader
        ? ""
        : `
    <div style="text-align: center; border-bottom: 4px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; font-family: 'Times New Roman', serif;">
      <!-- Identificação do Orgão e Direção -->
      <div style="background-color: #f1f5f9; padding: 10px; margin-bottom: 15px; border: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #1e293b; text-transform: uppercase; display: flex; justify-content: center; gap: 20px;">
        <span>ÓRGÃO: ${resolvedOrgao}</span>
        ${direcao ? `<span>DIREÇÃO: ${direcao}</span>` : ""}
      </div>

      <div style="margin-bottom: 15px; display: flex; justify-content: center; align-items: center;">
        <img 
          src="https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad" 
          alt="Logo ISPS" 
          style="height: 100px; max-width: 140px; object-fit: contain;" 
          onerror="this.style.display='none'; document.getElementById('isps-print-svg-fallback').style.display='block';"
        />
        <div id="isps-print-svg-fallback" style="display: none;">
          <svg viewBox="0 0 160 160" width="100" height="100" style="display: block; margin: 0 auto;">
            <circle cx="80" cy="80" r="74" fill="#0f2b5c" stroke="#d97706" stroke-width="4"/>
            <circle cx="80" cy="80" r="58" fill="#ffffff"/>
            <polygon points="80,30 95,65 130,68 103,92 112,128 80,108 48,128 57,92 30,68 65,65" fill="#d97706" opacity="0.9"/>
            <path d="M 50 80 Q 80 120 110 80" stroke="#0f2b5c" stroke-width="6" fill="none" stroke-linecap="round"/>
            <text x="80" y="78" font-family="'Bookman Old Style', Georgia, serif" font-size="22" font-weight="bold" fill="#0f2b5c" text-anchor="middle">ISPS</text>
            <text x="80" y="96" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#1e3a8a" text-anchor="middle" letter-spacing="1">SONGO</text>
          </svg>
        </div>
      </div>
      <h2 style="font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 4px 0; color: #0f172a; letter-spacing: -0.5px;">
        INSTITUTO SUPERIOR POLITÉCNICO DE SONGO
      </h2>
      <h3 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 2px 0; color: #334155; letter-spacing: 1px;">
        PROVÍNCIA DE TETE
      </h3>
      <h3 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 2px 0; color: #334155; letter-spacing: 1px;">
        DISTRITO DE CAHORA-BASSA
      </h3>
      
      <div style="margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
        ${divisao ? `<h4 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 2px 0; color: #1e3a8a;">${divisao}</h4>` : ""}
        ${departamento ? `<h4 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 2px 0; color: #1e3a8a;">${departamento}</h4>` : ""}
        ${reparticao || setor ? `<h4 style="font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 2px 0; color: #1e3a8a;">${[reparticao, setor].filter(Boolean).join(" - ")}</h4>` : ""}
      </div>

      <h5 style="font-size: 18px; font-weight: 900; text-transform: uppercase; margin: 20px auto 0; color: #0f172a; border-top: 3px solid #0f172a; border-bottom: 3px solid #0f172a; padding: 10px 0; width: 90%;">
        ${resolvedTitle}
      </h5>
      ${subtitle ? `<p style="font-size: 12px; margin: 8px 0 0 0; color: #64748b; font-style: italic;">${subtitle}</p>` : ""}
    </div>
  `;

  const initialMargin = resolvedOrientation === "landscape" ? "5mm" : "10mm";

  const docHtml = `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ISPS SIGEP</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style id="dynamic-page-style">
        @page {
          size: ${resolvedPageSize} ${resolvedOrientation};
          margin: ${initialMargin};
        }
      </style>
      <style id="dynamic-zoom-style">
        @media print {
          .a4-container, #print-container {
            zoom: ${resolvedPageSize === "A3" ? "0.8" : "0.7"};
            transform-origin: top left;
          }
        }
      </style>
      <style>
        @media print {
          html, body {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .a4-container, #print-container {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          div, section, article, table, tbody, tr, td, th {
            overflow: visible !important;
            max-height: none !important;
          }
          table {
            page-break-inside: auto;
            width: 100% !important;
            max-width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
            white-space: normal !important;
            font-size: 8.5px !important;
            padding: 3px 4px !important;
            line-height: 1.15 !important;
          }
          .whitespace-nowrap {
            white-space: normal !important;
          }
          [class*="min-w-"], .min-w-\[1900px\], .min-w-\[1200px\] {
            min-width: 0 !important;
            width: 100% !important;
          }
          .print-page-break {
            page-break-after: always;
            break-after: page;
          }
        }
        body {
          font-family: 'Times New Roman', Times, serif, system-ui, sans-serif;
          background-color: #0f172a;
          margin: 0;
          padding: 16px;
          color: #0f172a;
        }
        .a4-container, #print-container {
          background: white;
          width: 100%;
          max-width: ${resolvedPageSize === "A3" ? (resolvedOrientation === "landscape" ? "420mm" : "297mm") : (resolvedOrientation === "landscape" ? "297mm" : "210mm")};
          min-height: ${resolvedPageSize === "A3" ? (resolvedOrientation === "landscape" ? "297mm" : "420mm") : (resolvedOrientation === "landscape" ? "210mm" : "297mm")};
          margin: 0 auto;
          padding: 10mm;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
          box-sizing: border-box;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
          margin-top: 8px;
        }
        th, td {
          border: 1px solid #475569;
          padding: 4px 6px;
          text-align: left;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #0f172a;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }

        /* Barra de controlo de formato interativa */
        .btn-format {
          background: #1e293b;
          color: #cbd5e1;
          border: 1px solid #334155;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-format:hover {
          background: #334155;
          color: white;
        }
        .btn-format.active {
          background: #2563eb;
          color: white;
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(37,99,235,0.4);
        }
        ${styles}
      </style>
    </head>
    <body>
      <!-- Painel de Controlo da Área de Impressão -->
      <div class="no-print" style="position: sticky; top: 0; background: #090d16; color: white; padding: 14px 20px; border-radius: 14px; z-index: 1000; box-shadow: 0 8px 24px rgba(0,0,0,0.4); margin-bottom: 24px; border: 1px solid #1e293b;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #1e293b; padding-bottom: 10px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 22px;">🖨️</span>
            <div>
              <h3 style="margin: 0; font-size: 14px; font-weight: bold; color: white;">${title}</h3>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;" id="status-text">
                Ajuste Recomendado: <strong style="color: #60a5fa;" id="current-format-label">${resolvedPageSize} ${resolvedOrientation.toUpperCase()}</strong> — ${detected.reason}
              </p>
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 9px 22px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; box-shadow: 0 4px 12px rgba(37,99,235,0.4);">
              🖨️ Imprimir / Salvar PDF
            </button>
            <button onclick="window.close()" style="background: #334155; color: white; border: none; padding: 9px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px;">
              Fechar
            </button>
          </div>
        </div>

        <!-- Opções de Seleção de Formato A4/A3 e Orientação -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; font-size: 11px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #94a3b8; font-weight: 600;">Formato do Papel:</span>
            <button id="btn-size-a4" onclick="applyFormat('A4', currentOrientation)" class="btn-format ${resolvedPageSize === "A4" ? "active" : ""}">A4 (210 × 297mm)</button>
            <button id="btn-size-a3" onclick="applyFormat('A3', currentOrientation)" class="btn-format ${resolvedPageSize === "A3" ? "active" : ""}">A3 (297 × 420mm)</button>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #94a3b8; font-weight: 600;">Orientação da Folha:</span>
            <button id="btn-ori-portrait" onclick="applyFormat(currentPageSize, 'portrait')" class="btn-format ${resolvedOrientation === "portrait" ? "active" : ""}"> Vertical / Retrato</button>
            <button id="btn-ori-landscape" onclick="applyFormat(currentPageSize, 'landscape')" class="btn-format ${resolvedOrientation === "landscape" ? "active" : ""}"> Horizontal / Paisagem</button>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #94a3b8; font-weight: 600;">Escala / Zoom:</span>
            <button id="btn-zoom-auto" onclick="applyZoom('auto')" class="btn-format active">Auto Fit</button>
            <button id="btn-zoom-100" onclick="applyZoom('1.0')" class="btn-format">100%</button>
            <button id="btn-zoom-85" onclick="applyZoom('0.85')" class="btn-format">85%</button>
            <button id="btn-zoom-70" onclick="applyZoom('0.70')" class="btn-format">70%</button>
          </div>
        </div>
      </div>

      <div class="a4-container" id="print-container" ${printType ? `data-print-type="${printType}"` : ""}>
        ${defaultHeader}
        ${contentHtml}
        
        <!-- Rodapé do Documento -->
        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-family: 'Times New Roman', serif;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="text-align: center; width: 40%;">
              <div style="border-top: 1px solid #0f172a; padding-top: 5px; font-size: 11px; font-weight: bold; text-transform: uppercase;">
                Assinatura/Carimbo
              </div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
              Documento descarregado em: ${new Date().toLocaleDateString('pt-MZ')} às ${new Date().toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      <script>
        var currentPageSize = '${resolvedPageSize}';
        var currentOrientation = '${resolvedOrientation}';
        var currentZoom = 'auto';

        function applyFormat(size, orientation) {
          currentPageSize = size;
          currentOrientation = orientation;

          var pageMargin = orientation === 'landscape' ? '5mm' : '10mm';
          
          // Atualiza CSS da Impressora
          document.getElementById('dynamic-page-style').innerHTML =
            '@page { size: ' + size + ' ' + orientation + '; margin: ' + pageMargin + '; }';

          // Atualiza Dimensões da Folha na Pré-visualização
          var container = document.getElementById('print-container');
          var maxWidths = {
            'A4-portrait': '210mm',
            'A4-landscape': '297mm',
            'A3-portrait': '297mm',
            'A3-landscape': '420mm'
          };
          var minHeights = {
            'A4-portrait': '297mm',
            'A4-landscape': '210mm',
            'A3-portrait': '420mm',
            'A3-landscape': '297mm'
          };

          var key = size + '-' + orientation;
          if (container) {
            container.style.maxWidth = maxWidths[key] || '210mm';
            container.style.minHeight = minHeights[key] || '297mm';
          }

          // Atualiza botões ativos
          document.querySelectorAll('[id^="btn-size-"]').forEach(function(b) { b.classList.remove('active'); });
          document.querySelectorAll('[id^="btn-ori-"]').forEach(function(b) { b.classList.remove('active'); });
          
          var sizeBtn = document.getElementById('btn-size-' + size.toLowerCase());
          var oriBtn = document.getElementById('btn-ori-' + orientation);
          if (sizeBtn) sizeBtn.classList.add('active');
          if (oriBtn) oriBtn.classList.add('active');

          document.getElementById('current-format-label').innerText = size + ' ' + orientation.toUpperCase();
          applyZoom(currentZoom);
        }

        function applyZoom(zoomVal) {
          currentZoom = zoomVal;
          var zoomScale = zoomVal;
          if (zoomVal === 'auto') {
            zoomScale = currentPageSize === 'A3' ? '0.85' : '0.75';
          }
          
          document.getElementById('dynamic-zoom-style').innerHTML =
            '@media print { .a4-container, #print-container { zoom: ' + zoomScale + '; transform-origin: top left; } }';

          document.querySelectorAll('[id^="btn-zoom-"]').forEach(function(b) { b.classList.remove('active'); });
          var zBtn = document.getElementById('btn-zoom-' + (zoomVal === '1.0' ? '100' : zoomVal === '0.85' ? '85' : zoomVal === '0.70' ? '70' : 'auto'));
          if (zBtn) zBtn.classList.add('active');
        }

        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(docHtml);
    printWindow.document.close();
    printWindow.focus();
  } else {
    window.print();
  }
}

export function printElementById(
  elementId: string,
  title: string = "Documento ISPS",
  orientation: "portrait" | "landscape" | "auto" = "auto",
  pageSize?: "A3" | "A4" | "A5" | "auto",
) {
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }
  openPrintDocumentWindow({
    title,
    contentHtml: el.innerHTML,
    orientation,
    pageSize,
    printType: el.getAttribute("data-print-type") || undefined,
  });
}

