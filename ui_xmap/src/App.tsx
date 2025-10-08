import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import React, { useState, useEffect } from 'react';
import {
  createMacroProcesso,
  getMacroProcessos,
  associarProcesso,
  removerProcesso,
  getProcessos,
  MacroProcesso,
  Processo
} from './services/api'; // Ajuste o path se necessário

const queryClient = new QueryClient();

const App = () => {
  const [macroProcessos, setMacroProcessos] = useState<MacroProcesso[]>([]);
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMacroNome, setNewMacroNome] = useState('');
  const [selectedMacroId, setSelectedMacroId] = useState<number | null>(null);
  const [selectedProcessoId, setSelectedProcessoId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const macros = await getMacroProcessos();
      const procs = await getProcessos();
      setMacroProcessos(macros);
      setProcessos(procs);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const handleCreateMacro = async () => {
    if (!newMacroNome) return;
    try {
      await createMacroProcesso(newMacroNome);
      setShowCreateForm(false);
      setNewMacroNome('');
      loadData();
    } catch (err) {
      console.error('Erro ao criar macroprocesso:', err);
    }
  };

  const handleAssociar = async () => {
    if (selectedMacroId && selectedProcessoId) {
      try {
        await associarProcesso(selectedMacroId, selectedProcessoId);
        loadData();
      } catch (err) {
        console.error('Erro ao associar:', err);
      }
    }
  };

  const handleRemover = async (macroId: number, procId: number) => {
    try {
      await removerProcesso(macroId, procId);
      loadData();
    } catch (err) {
      console.error('Erro ao remover:', err);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>

      {/* Integração direta no App para demo; mova para Index se necessário */}
      <div className="dashboard">
        <button onClick={() => setShowCreateForm(true)}>Novo Macroprocesso</button>
        {/* Sua lista de processos existente */}

        {showCreateForm && (
          <div>
            <h2>Novo Macroprocesso</h2>
            <input 
              value={newMacroNome} 
              onChange={e => setNewMacroNome(e.target.value)} 
              placeholder="Nome"
            />
            <button onClick={handleCreateMacro}>Criar</button>
            <button onClick={() => setShowCreateForm(false)}>Cancelar</button>
          </div>
        )}

        <div className="macro-list">
          {macroProcessos.map(macro => (
            <div key={macro.id}>
              <h3>{macro.nome}</h3>
              <ul>
                {macro.processos.map(procId => {
                  const proc = processos.find(p => p.id === procId);
                  return proc ? (
                    <li key={procId}>
                      {proc.titulo}
                      <button onClick={() => handleRemover(macro.id, procId)}>Remover</button>
                    </li>
                  ) : null;
                })}
              </ul>
              <select onChange={e => setSelectedProcessoId(Number(e.target.value))}>
                <option>Selecione Processo</option>
                {processos.map(proc => (
                  <option key={proc.id} value={proc.id}>{proc.titulo}</option>
                ))}
              </select>
              <button onClick={() => { setSelectedMacroId(macro.id); handleAssociar(); }}>
                Associar
              </button>
            </div>
          ))}
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default App;