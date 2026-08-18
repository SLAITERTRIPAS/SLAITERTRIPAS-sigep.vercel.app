import React, { useState } from "react";
import RgbSidebarToggle from "../../components/ui/RgbSidebarToggle";
import { Users, Clock, BookOpen, Building, FlaskConical, Wrench, GraduationCap, ClipboardList, BookMarked, PanelLeftClose, PanelLeftOpen, UserCheck } from "lucide-react";
import GestaoAcademicaView from "./GestaoAcademicaView";
import HorarioView from "./HorarioView";
import GestaoEstudantilView from "./GestaoEstudantilView";
import GraduadosView from "./GraduadosView";
import DisciplinasEspacosFisicosView from "./DisciplinasEspacosFisicosView";
import ExamesView from "./ExamesView";

export default function GestaoAcademicaMainView({
  title,
  user,
  onBack,
  onShowAlert,
  hideSidebar = false,
}: {
  title: string;
  user: any;
  onBack: () => void;
  onShowAlert: (msg: string) => void;
  hideSidebar?: boolean;
}) {
  const [activeSubMenu, setActiveSubMenu] = useState("Docentes");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const subMenuItems = [
    { title: "Docentes", icon: Users },
    { title: "Alocação", icon: ClipboardList },
    { title: "Gestão Estudantil", icon: UserCheck },
    { title: "Horário", icon: Clock },
    { title: "Calendário de Exame", icon: BookMarked },
    { title: "Graduados", icon: GraduationCap },
    { title: "Disciplina", icon: BookOpen },
    { title: "Blocos e Sala de Aula", icon: Building },
    { title: "Laboratório", icon: FlaskConical },
    { title: "Oficinas", icon: Wrench },
  ];

  const renderSubView = () => {
    switch (activeSubMenu) {
      case "Docentes":
        return <GestaoAcademicaView title={title} user={user} onBack={onBack} initialShowList={true} />;
      case "Alocação":
        return <GestaoAcademicaView title={title} user={user} onBack={onBack} />;
      case "Gestão Estudantil":
        return <GestaoEstudantilView user={user} onBack={onBack} title="Gestão Estudantil" />;
      case "Horário":
        return <HorarioView title={title} user={user} />;
      case "Calendário de Exame":
        return <ExamesView user={user} onShowAlert={onShowAlert} />;
      case "Graduados":
        return <GraduadosView />;
      case "Disciplina":
        return <DisciplinasEspacosFisicosView user={user} onShowAlert={onShowAlert} categoria="Disciplinas" />;
      case "Blocos e Sala de Aula":
        return <DisciplinasEspacosFisicosView user={user} onShowAlert={onShowAlert} categoria="Blocos e Sala de Aula" />;
      case "Laboratório":
        return <DisciplinasEspacosFisicosView user={user} onShowAlert={onShowAlert} categoria="Laboratórios" />;
      case "Oficinas":
        return <DisciplinasEspacosFisicosView user={user} onShowAlert={onShowAlert} categoria="Oficinas" />;
      default:
        return <div>Selecione uma opção</div>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-4 p-2 relative">
      {!hideSidebar && (
        <>
          <RgbSidebarToggle
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-1/2 -translate-y-1/2 left-0.5 z-[100] hidden md:flex"
            title={isSidebarOpen ? "Ocultar Menu Lateral" : "Mostrar Menu Lateral"}
          />
          <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-64 p-6' : 'w-0 p-0 overflow-hidden opacity-0 border-none md:hidden'} bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2 shrink-0 overflow-y-auto`}>
            {subMenuItems.map((item) => (
              <button
                key={item.title}
                onClick={() => setActiveSubMenu(item.title)}
                className={`flex items-center gap-3 p-4 rounded-xl font-bold text-sm transition-all ${activeSubMenu === item.title ? "bg-blue-600 text-white" : "hover:bg-gray-50 text-gray-700"}`}
              >
                <item.icon size={20} />
                {item.title}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="flex-grow bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col min-w-0">
        {hideSidebar && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 border-b border-gray-100 no-scrollbar">
            {subMenuItems.map((item) => (
              <button
                key={item.title}
                onClick={() => setActiveSubMenu(item.title)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                  activeSubMenu === item.title
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <item.icon size={16} />
                {item.title}
              </button>
            ))}
          </div>
        )}
        <div className="flex-grow overflow-y-auto">
          {renderSubView()}
        </div>
      </div>
    </div>
  );
}
