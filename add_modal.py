import sys

with open("src/blocos/bloco5_sistema/PlanoWorkflowView.tsx", "r") as f:
    content = f.read()

modal = """
      {showBatchDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col animate-scale-up">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Confirmar Exclusão
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                (Tem a certeza que pretende excluir a atividade? Se sim, prossiga, se não aborta)
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBatchDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-white text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmBatchDelete}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
"""

content = content.replace("      </div>\n    </ActivitySelectionContext.Provider>", modal + "      </div>\n    </ActivitySelectionContext.Provider>")

with open("src/blocos/bloco5_sistema/PlanoWorkflowView.tsx", "w") as f:
    f.write(content)
