import React from 'react';
import { RepublicEmblem } from './InstitutionAssets';

export const PESOEHeader = ({ year }: { year: number | string }) => {
  return (
    <div className="text-center mb-6 flex flex-col items-center w-full bg-white pt-6 pb-2">
      {/* 1. Emblema Oficial da República de Moçambique */}
      <div className="mb-4 flex items-center justify-center">
        <RepublicEmblem
          className="w-24 md:w-28 h-auto object-contain drop-shadow-sm"
          alt="Emblema da República de Moçambique"
        />
      </div>

      {/* 2. Cabeçalho Oficial do Estado */}
      <div className="space-y-1 mb-3 text-center">
        <h2 className="text-xl md:text-2xl font-serif font-black text-slate-900 uppercase tracking-widest leading-none">
          REPÚBLICA DE MOÇAMBIQUE
        </h2>
        <h3 className="text-xs md:text-sm font-sans font-bold text-slate-900 uppercase tracking-wider leading-none pt-1">
          MINISTÉRIO DE EDUCAÇÃO E CULTURA
        </h3>
      </div>

      {/* 3. Nome do Instituto */}
      <h1 className="text-2xl md:text-3xl font-serif font-black text-slate-900 uppercase tracking-wide mb-4 leading-tight mt-1">
        INSTITUTO SUPERIOR POLITÉCNICO DE SONGO
      </h1>

      {/* 4. Título Oficial do PESOE */}
      <div className="mt-1 mb-3">
        <h4 className="text-base md:text-lg font-serif font-black text-slate-900 uppercase tracking-wide border-b-2 border-slate-900 pb-0.5 inline-block">
          PROGRAMA ECONÓMICO E SOCIAL E ORÇAMENTO DO ESTADO (PESOE) {year}
        </h4>
      </div>

      {/* Linha Divisória Horizontal */}
      <div className="w-full h-[2.5px] bg-slate-900 mt-2 mb-4"></div>
    </div>
  );
};

