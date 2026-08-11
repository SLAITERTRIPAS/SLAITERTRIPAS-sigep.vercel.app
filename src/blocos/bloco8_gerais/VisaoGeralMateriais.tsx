import React from "react";
import { Package, Search, Plus } from "lucide-react";

const mockMaterials = [
  {
    id: "INV-001",
    name: "Microscópio",
    type: "Laboratorial",
    marca: "Zeiss",
    modelo: "Primo Star",
    serial: "SN-12345",
    qtd: 2,
    estado: "Bom",
  },
  {
    id: "INV-002",
    name: "Computador",
    type: "Informático",
    marca: "HP",
    modelo: "EliteBook 840",
    serial: "SN-67890",
    qtd: 5,
    estado: "Bom",
  },
  {
    id: "INV-003",
    name: "Bancada de Trabalho",
    type: "Mobiliário",
    marca: "Local",
    modelo: "Padrão",
    serial: "N/A",
    qtd: 10,
    estado: "Regular",
  },
];

export default function VisaoGeralMateriais({
  local,
  onRegistar,
}: {
  local: string;
  onRegistar: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-blue-900 text-white p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Materiais Existentes: {local}</h2>
          <p className="text-blue-100 text-sm">Gestão de inventário e bens.</p>
        </div>
        <button
          onClick={onRegistar}
          className="bg-white text-blue-900 px-4 py-2 rounded-lg font-bold hover:bg-blue-50 flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Registar Novo
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Pesquisar material..."
            className="w-full bg-transparent outline-none text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 border-b border-gray-200">
              <tr>
                <th className="pb-3 font-bold">Código</th>
                <th className="pb-3 font-bold">Material</th>
                <th className="pb-3 font-bold">Tipo</th>
                <th className="pb-3 font-bold">Marca/Modelo</th>
                <th className="pb-3 font-bold">Qtd</th>
                <th className="pb-3 font-bold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockMaterials.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="py-4 font-bold text-blue-900">{m.id}</td>
                  <td className="py-4">{m.name}</td>
                  <td className="py-4 text-gray-600">{m.type}</td>
                  <td className="py-4 text-gray-600">
                    {m.marca} / {m.modelo}
                  </td>
                  <td className="py-4 font-bold">{m.qtd}</td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${m.estado === "Bom" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                    >
                      {m.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
