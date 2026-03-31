import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { AnswerKey, Turma, Gabarito } from '../types';
import { Plus, Minus, Printer, ArrowLeft, Users, FileText, Save, Trash2, ChevronRight, Edit } from 'lucide-react';
import { createTurma, createGabarito, updateGabarito, deleteGabarito, subscribeToTurmas, subscribeToGabaritos } from '../lib/firebaseService';

export function Admin({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<'turmas' | 'gabaritos' | 'create'>('turmas');
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [gabaritos, setGabaritos] = useState<Gabarito[]>([]);
  const [editingGabarito, setEditingGabarito] = useState<Gabarito | null>(null);
  
  // Create Gabarito State
  const [title, setTitle] = useState('Prova de Matemática');
  const [numQuestions, setNumQuestions] = useState(20);
  const [numChoices, setNumChoices] = useState(5); // A, B, C, D, E
  const [answers, setAnswers] = useState<string[]>(Array(20).fill('A'));
  const [isSaving, setIsSaving] = useState(false);

  // Turma Creation State
  const [newTurmaName, setNewTurmaName] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToTurmas(setTurmas);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedTurma) {
      const unsubscribe = subscribeToGabaritos(selectedTurma.id, setGabaritos);
      return () => unsubscribe();
    }
  }, [selectedTurma]);

  useEffect(() => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      if (newAnswers.length < numQuestions) {
        return [...newAnswers, ...Array(numQuestions - newAnswers.length).fill('A')];
      } else if (newAnswers.length > numQuestions) {
        return newAnswers.slice(0, numQuestions);
      }
      return newAnswers;
    });
  }, [numQuestions]);

  const handleCreateTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTurmaName.trim()) return;
    try {
      await createTurma(newTurmaName);
      setNewTurmaName('');
    } catch (error) {
      console.error("Error creating turma:", error);
    }
  };

  const handleSaveGabarito = async () => {
    if (!selectedTurma) return;
    setIsSaving(true);
    try {
      if (editingGabarito) {
        await updateGabarito(editingGabarito.id, title, answers, numChoices);
      } else {
        await createGabarito(selectedTurma.id, title, answers, numChoices);
      }
      setView('gabaritos');
      setEditingGabarito(null);
      // Reset form
      setTitle('Prova de Matemática');
      setNumQuestions(20);
      setNumChoices(5);
      setAnswers(Array(20).fill('A'));
    } catch (error) {
      console.error("Error saving gabarito:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditGabarito = (g: Gabarito) => {
    setEditingGabarito(g);
    setTitle(g.name);
    setNumQuestions(g.answers.length);
    setNumChoices(g.choicesCount);
    setAnswers(g.answers);
    setView('create');
  };

  const handleDeleteGabarito = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este gabarito?')) return;
    try {
      await deleteGabarito(id);
    } catch (error) {
      console.error("Error deleting gabarito:", error);
    }
  };

  const choices = Array.from({ length: numChoices }, (_, i) => String.fromCharCode(65 + i));

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const [printingGabarito, setPrintingGabarito] = useState<Gabarito | null>(null);

  const handlePrint = (g: Gabarito) => {
    setPrintingGabarito(g);
    setTimeout(() => {
      window.print();
      setPrintingGabarito(null);
    }, 100);
  };

  const renderTurmas = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" /> Minhas Turmas
        </h2>
        <form onSubmit={handleCreateTurma} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Nome da nova turma (ex: 3º Ano A)"
            value={newTurmaName}
            onChange={(e) => setNewTurmaName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Criar
          </button>
        </form>

        <div className="grid gap-3">
          {turmas.length === 0 ? (
            <p className="text-center py-8 text-gray-500 italic">Nenhuma turma criada ainda.</p>
          ) : (
            turmas.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTurma(t); setView('gabaritos'); }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <span className="font-semibold text-gray-800">{t.name}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderGabaritos = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setView('turmas')} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Turmas
        </button>
        <h2 className="text-xl font-bold text-gray-900">{selectedTurma?.name}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" /> Gabaritos Armazenados
          </h3>
          <button 
            onClick={() => setView('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Novo Gabarito
          </button>
        </div>

        <div className="grid gap-4">
          {gabaritos.length === 0 ? (
            <p className="text-center py-8 text-gray-500 italic">Nenhum gabarito para esta turma.</p>
          ) : (
            gabaritos.map(g => (
              <div key={g.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">{g.name}</h4>
                  <p className="text-sm text-gray-500">{g.answers.length} questões • {g.choicesCount} alternativas</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditGabarito(g)}
                    className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteGabarito(g.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handlePrint(g)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Imprimir"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderCreateGabarito = () => (
    <div className="space-y-6">
      <button 
        onClick={() => {
          setView('gabaritos');
          setEditingGabarito(null);
        }} 
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {editingGabarito ? 'Editar Gabarito' : `Novo Gabarito para ${selectedTurma?.name}`}
        </h2>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título da Prova</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Questões</label>
              <div className="flex items-center">
                <button onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))} className="p-2 border border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100">
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border-y border-gray-300 text-center focus:ring-0 focus:outline-none"
                />
                <button onClick={() => setNumQuestions(Math.min(100, numQuestions + 1))} className="p-2 border border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => setNumQuestions(50)}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${numQuestions === 50 ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                >
                  Padrão 50
                </button>
                <button 
                  onClick={() => setNumQuestions(60)}
                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${numQuestions === 60 ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                >
                  Padrão 60
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alternativas</label>
              <select
                value={numChoices}
                onChange={(e) => setNumChoices(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={3}>3 (A, B, C)</option>
                <option value={4}>4 (A, B, C, D)</option>
                <option value={5}>5 (A, B, C, D, E)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Respostas Corretas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {answers.map((ans, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-700 w-8">{i + 1}.</span>
                <div className="flex space-x-1">
                  {choices.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleAnswerChange(i, c)}
                      className={`w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-colors ${
                        ans === c
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveGabarito}
          disabled={isSaving}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" /> {isSaving ? 'Salvando...' : editingGabarito ? 'Atualizar Gabarito' : 'Salvar Gabarito'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="print:hidden p-4 max-w-4xl mx-auto w-full flex-1">
        {view === 'turmas' && (
          <>
            <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </button>
            {renderTurmas()}
          </>
        )}
        {view === 'gabaritos' && renderGabaritos()}
        {view === 'create' && renderCreateGabarito()}
      </div>

      {/* Printable View */}
      {printingGabarito && (
        <div className="hidden print:block p-0 bg-white text-black w-full font-sans print-sheet">
          <div className="p-6 h-[297mm] w-[210mm] relative bg-white overflow-hidden flex flex-col">
            {/* Corner Markers (Fiducials) */}
            <div className="absolute top-4 left-4 w-4 h-4 bg-black"></div>
            <div className="absolute top-4 right-4 w-4 h-4 bg-black"></div>
            <div className="absolute bottom-4 left-4 w-4 h-4 bg-black"></div>
            <div className="absolute bottom-4 right-4 w-4 h-4 bg-black"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-[7px] font-bold text-center leading-tight">LOGO<br/>GOV</div>
                <div>
                  <h2 className="text-[10px] font-bold uppercase tracking-tight">Secretaria de Estado da Educação</h2>
                  <h3 className="text-[8px] font-semibold text-gray-700 leading-none">AVALIAÇÃO DIAGNÓSTICA AL/2026</h3>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-[10px] font-bold uppercase leading-none mb-0.5">{printingGabarito.name}</h2>
                <p className="text-[8px] text-gray-500">Turma: {selectedTurma?.name}</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-2 gap-4 mb-3 text-[9px]">
              <div className="space-y-1.5">
                <div className="border-b border-black pb-0 flex items-end">
                  <span className="font-bold mr-1 uppercase">Aluno(a):</span>
                  <div className="flex-1 h-3"></div>
                </div>
                <div className="border-b border-black pb-0 flex items-end">
                  <span className="font-bold mr-1 uppercase">Código:</span>
                  <div className="flex-1 h-3"></div>
                </div>
              </div>
              <div className="bg-gray-50 p-1.5 rounded border border-gray-200">
                <h4 className="font-bold mb-0 uppercase text-[8px]">Instruções:</h4>
                <ul className="text-[7px] list-disc pl-3 flex flex-wrap gap-x-4">
                  <li>Use caneta azul/preta.</li>
                  <li>Preencha o círculo.</li>
                  <li>Não rasure.</li>
                </ul>
              </div>
            </div>

            {/* QR Code and Main Title */}
            <div className="flex flex-col items-center mb-4">
              <h2 className="text-sm font-black mb-1 tracking-[0.2em] uppercase">NÃO RASURE</h2>
              <div className="p-2 border border-black bg-white">
                <QRCode 
                  value={JSON.stringify({
                    id: printingGabarito.id,
                    t: printingGabarito.name,
                    a: printingGabarito.answers,
                    c: printingGabarito.choicesCount
                  } as AnswerKey)} 
                  size={80} 
                  level="M" 
                />
              </div>
              <p className="text-[7px] mt-0.5 font-mono font-bold">*{printingGabarito.id.slice(0, 12).toUpperCase()}*</p>
            </div>

            {/* Answer Bubbles Grid */}
            <div className={`grid ${printingGabarito.answers.length > 40 ? 'grid-cols-4 gap-x-4' : 'grid-cols-2 gap-x-12'} gap-y-1 max-w-4xl mx-auto flex-1`}>
              {printingGabarito.answers.map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-0.5">
                  <span className="font-bold text-[9px] w-4 text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: printingGabarito.choicesCount }).map((_, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-0">
                        <span className="text-[5px] font-bold text-gray-400">{String.fromCharCode(65 + idx)}</span>
                        <div className={`${printingGabarito.answers.length > 40 ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} rounded-full border-[1.5px] border-black flex items-center justify-center`}>
                          <div className={`${printingGabarito.answers.length > 40 ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full border border-gray-50`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-2 text-center">
              <p className="text-[7px] text-gray-400 uppercase tracking-widest">GabaritoFácil por Misael Lins • Sistema de Correção Instantânea</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
