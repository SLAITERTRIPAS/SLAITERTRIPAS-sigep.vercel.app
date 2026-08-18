import React from "react";

interface RgbSidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  title?: string;
}

export const RgbSidebarToggle: React.FC<RgbSidebarToggleProps> = ({
  isOpen,
  onToggle,
  className = "",
  title,
}) => {
  const defaultTitle = isOpen ? "Ocultar Menu Lateral" : "Mostrar Menu Lateral";

  return (
    <button
      onClick={onToggle}
      type="button"
      title={title || defaultTitle}
      className={`group relative z-[100] p-1 bg-transparent border-none outline-none transition-all duration-300 transform hover:scale-125 active:scale-90 cursor-pointer focus:outline-none flex items-center justify-center ${className}`}
    >
      <svg
        className="w-7 h-7 sm:w-8 sm:h-8 filter drop-shadow-[0_0_8px_rgba(0,229,255,0.8)] group-hover:drop-shadow-[0_0_14px_rgba(255,0,128,1)] transition-all duration-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="url(#rgbArrowGrad)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <linearGradient id="rgbArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%">
              <animate
                attributeName="stop-color"
                values="#ff0055;#00e5ff;#00ff66;#ffaa00;#ff0055"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%">
              <animate
                attributeName="stop-color"
                values="#00e5ff;#00ff66;#ffaa00;#ff0055;#00e5ff"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%">
              <animate
                attributeName="stop-color"
                values="#ff00ff;#ff0055;#00e5ff;#00ff66;#ff00ff"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>

        {isOpen ? (
          /* Seta para ocultar menu (aponta para a esquerda) */
          <path d="M15 19l-7-7 7-7" className="transform group-hover:-translate-x-1 transition-transform duration-200" />
        ) : (
          /* Seta para mostrar menu (aponta para a direita) */
          <path d="M9 19l7-7-7-7" className="transform group-hover:translate-x-1 transition-transform duration-200 animate-pulse" />
        )}
      </svg>

      {/* Floating Tooltip Badge on Hover */}
      <span className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-950/95 backdrop-blur text-white text-[10px] font-bold tracking-wider uppercase rounded-md shadow-2xl border border-white/20 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-[110] hidden md:block">
        {isOpen ? "Ocultar Menu Lateral" : "Mostrar Menu Lateral"}
      </span>
    </button>
  );
};

export default RgbSidebarToggle;
