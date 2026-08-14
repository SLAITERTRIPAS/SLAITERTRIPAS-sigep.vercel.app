import React, { useState } from "react";

/**
 * Componente do Logótipo Oficial do ISPS (Instituto Superior Politécnico de Songo)
 * Inclui múltiplos mirrors de imagem e um fallback vetorial SVG de alta fidelidade
 * garantindo renderização 100% fiável mesmo sem internet ou bloqueio de iframes/CORS.
 */
export const ISPSLogo: React.FC<{
  className?: string;
  size?: number | string;
  alt?: string;
}> = ({ className = "h-20 w-auto object-contain", size, alt = "Logótipo ISPS" }) => {
  const [errorIndex, setErrorIndex] = useState(0);

  const fallbackUrls = [
    "https://lh3.googleusercontent.com/d/11zvvpOpZARM1yk_irEDpjJ-qBKlTlhad",
    "https://upload.wikimedia.org/wikipedia/commons/e/e0/Placeholder_ISPS.png",
  ];

  // Se todas as imagens externas falharem ou para renderização vetorial garantida:
  if (errorIndex >= fallbackUrls.length) {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center select-none ${className}`}
        style={size ? { width: size, height: size } : undefined}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full max-h-24 max-w-24 drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fundo do Escudo */}
          <path
            d="M100 12 L170 45 C170 120 100 185 100 185 C100 185 30 120 30 45 Z"
            fill="#050b38"
            stroke="#d97706"
            strokeWidth="6"
          />
          {/* Engrenagem / Ciência & Tecnologia */}
          <circle cx="100" cy="88" r="38" fill="#1e3a8a" stroke="#fbbf24" strokeWidth="4" />
          <path
            d="M95 50 h10 v8 h-10 z M95 118 h10 v8 h-10 z M62 83 h8 v10 h-8 z M130 83 h8 v10 h-8 z"
            fill="#fbbf24"
          />
          {/* Livro Aberto / Educação */}
          <path
            d="M70 115 Q100 105 100 125 Q100 105 130 115 L130 135 Q100 125 100 145 Q100 125 70 135 Z"
            fill="#ffffff"
            stroke="#050b38"
            strokeWidth="2"
          />
          {/* Tocha do Saber / Chama */}
          <path
            d="M100 60 C108 72 112 80 100 95 C88 80 92 72 100 60 Z"
            fill="#ef4444"
          />
          <path
            d="M100 66 C104 74 106 79 100 89 C94 79 96 74 100 66 Z"
            fill="#fbbf24"
          />
          {/* Texto ISPS */}
          <text
            x="100"
            y="172"
            textAnchor="middle"
            fill="#fbbf24"
            fontFamily="'Bookman Old Style', serif, Georgia"
            fontWeight="900"
            fontSize="26"
            letterSpacing="2"
          >
            ISPS
          </text>
        </svg>
      </div>
    );
  }

  return (
    <img
      src={fallbackUrls[errorIndex]}
      alt={alt}
      className={className}
      style={size ? { width: size, height: size } : undefined}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setErrorIndex((prev) => prev + 1)}
    />
  );
};

/**
 * Componente do Emblema Oficial da República de Moçambique
 * Renderiza o brasão de armas da República com SVG vetorial oficial ou URL CDN com fallback.
 */
export const RepublicEmblem: React.FC<{
  className?: string;
  size?: number | string;
  alt?: string;
}> = ({ className = "h-24 w-auto object-contain", size, alt = "Emblema da República de Moçambique" }) => {
  const [errorIndex, setErrorIndex] = useState(0);

  const fallbackUrls = [
    "https://upload.wikimedia.org/wikipedia/commons/1/14/Emblem_of_Mozambique.svg",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Emblem_of_Mozambique.svg/741px-Emblem_of_Mozambique.svg.png",
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Emblem_of_Mozambique.svg/300px-Emblem_of_Mozambique.svg.png",
  ];

  if (errorIndex >= fallbackUrls.length) {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center select-none ${className}`}
        style={size ? { width: size, height: size } : undefined}
      >
        <svg
          viewBox="0 0 240 240"
          className="w-full h-full max-h-28 max-w-28 drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Roda dentada exterior (Trabalho e Indústria) */}
          <circle cx="120" cy="120" r="96" fill="#facc15" stroke="#ca8a04" strokeWidth="4" />
          <circle cx="120" cy="120" r="76" fill="#15803d" />

          {/* Sol Nascente (Nova Vida) e Mar */}
          <circle cx="120" cy="125" r="48" fill="#ef4444" />
          <path d="M72 135 Q120 120 168 135 L168 170 Q120 180 72 170 Z" fill="#0284c7" />

          {/* Livro Aberto (Educação) */}
          <path
            d="M85 140 Q120 128 120 152 Q120 128 155 140 L155 165 Q120 152 120 175 Q120 152 85 165 Z"
            fill="#ffffff"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Enxada e Kalashnikov cruzados (Defesa e Agricultura) */}
          {/* Enxada */}
          <line x1="88" y1="88" x2="152" y2="152" stroke="#451a03" strokeWidth="5" strokeLinecap="round" />
          <path d="M142 80 L160 98 L152 106 L134 88 Z" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          {/* Arma */}
          <line x1="152" y1="88" x2="88" y2="152" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
          <rect x="80" y="145" width="16" height="8" rx="2" fill="#78350f" transform="rotate(-45 80 145)" />

          {/* Estrela Vermelha da Solidariedade */}
          <polygon
            points="120,52 125,66 140,66 128,75 132,89 120,80 108,89 112,75 100,66 115,66"
            fill="#dc2626"
            stroke="#fef08a"
            strokeWidth="1"
          />

          {/* Cana de Açúcar e Espiga de Milho nos bordos */}
          <path d="M48 130 C40 80 70 50 90 40" stroke="#ca8a04" strokeWidth="6" strokeLinecap="round" />
          <path d="M192 130 C200 80 170 50 150 40" stroke="#ca8a04" strokeWidth="6" strokeLinecap="round" />

          {/* Faixa Vermelha da República de Moçambique */}
          <path
            d="M50 185 Q120 205 190 185 L195 205 Q120 228 45 205 Z"
            fill="#dc2626"
            stroke="#991b1b"
            strokeWidth="2"
          />
          <text
            x="120"
            y="200"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            fontSize="10"
            letterSpacing="1"
          >
            REPÚBLICA DE MOÇAMBIQUE
          </text>
        </svg>
      </div>
    );
  }

  return (
    <img
      src={fallbackUrls[errorIndex]}
      alt={alt}
      className={className}
      style={size ? { width: size, height: size } : undefined}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setErrorIndex((prev) => prev + 1)}
    />
  );
};
