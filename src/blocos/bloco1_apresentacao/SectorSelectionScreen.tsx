import React, { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { getUserWorkspace } from "../../lib/auth";

export default function SectorSelectionScreen({
  user,
  onSelectSector,
}: {
  user: any;
  onSelectSector: (sector: string) => void;
}) {
  const primaryWorkspace = getUserWorkspace(user);
  
  // Collect all unique available sectors assigned to this technician
  const rawSectors = [
    primaryWorkspace,
    user?.reparticao,
    user?.setor,
    ...(Array.isArray(user?.setoresAtribuidos) ? user.setoresAtribuidos : [])
  ];

  const availableSectors = Array.from(new Set(rawSectors))
    .filter((s): s is string => typeof s === "string" && s.trim() !== "" && s !== "Nenhum" && s !== "-");

  const [selectedSector, setSelectedSector] = useState(availableSectors[0] || primaryWorkspace || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSector) {
      onSelectSector(selectedSector);
    }
  };

  return (
    <div className="flex-grow w-full h-full flex flex-col items-center justify-center bg-slate-100/70 p-4 min-h-[500px]">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm relative"
      >
        {/* Top Header Pill */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 w-full max-w-[240px]">
          <div className="bg-[#2D323E] rounded-full py-2.5 px-6 shadow-md border border-slate-700/40 text-center">
            <h2 className="text-xs font-black tracking-widest text-[#FF8C00] uppercase">
              MENU SETORIAL
            </h2>
          </div>
        </div>
        
        {/* Main Selection Card */}
        <div className="bg-white rounded-[2rem] pt-12 pb-8 px-7 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-slate-100/80 space-y-5">
          <label className="block text-[11px] font-black text-[#2B3B52] tracking-widest uppercase">
            SELECIONE A SUA ÁREA DE TRABALHO
          </label>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#FF8C00] appearance-none cursor-pointer pr-10"
              >
                {availableSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
            </div>
            
            <button
              type="submit"
              disabled={!selectedSector}
              className="w-full bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md active:scale-[0.99] disabled:opacity-50 text-sm tracking-wide"
            >
              Acessar Área
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
