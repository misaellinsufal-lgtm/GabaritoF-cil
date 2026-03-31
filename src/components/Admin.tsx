import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { AnswerKey, Turma, Gabarito } from '../types';
import { Plus, Minus, Printer, ArrowLeft, Users, FileText, Save, Trash2, ChevronRight } from 'lucide-react';
import { createTurma, createGabarito, subscribeToTurmas, subscribeToGabaritos } from '../lib/firebaseService';

export function Admin({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<'turmas' | 'gabaritos' | 'create'>('turmas');
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [gabaritos, setGabaritos] = useState<Gabarito[]>([]);
  
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
      await createGabarito(selectedTurma.id, title, answers, numChoices);
      setView('gabaritos');
    } catch (error) {
      console.error("Error saving gabarito:", error);
    } finally {
      setIsSaving(false);
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
      <button onClick={() => setView('gabaritos')} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Novo Gabarito para {selectedTurma?.name}</h2>
        
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
          <Save className="w-5 h-5 mr-2" /> {isSaving ? 'Salvando...' : 'Salvar Gabarito'}
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
          <div className="p-10 min-h-screen relative border-[1px] border-gray-200">
            {/* Corner Markers (Fiducials) */}
            <div className="absolute top-8 left-8 w-6 h-6 bg-black"></div>
            <div className="absolute top-8 right-8 w-6 h-6 bg-black"></div>
            <div className="absolute bottom-8 left-8 w-6 h-6 bg-black"></div>
            <div className="absolute bottom-8 right-8 w-6 h-6 bg-black"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-[10px] font-bold text-center leading-tight">LOGO<br/>GOV</div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-tight">Secretaria de Estado da Educação</h2>
                  <h3 className="text-xs font-semibold text-gray-700">AVALIAÇÃO DIAGNÓSTICA AL/2026</h3>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-bold uppercase">{printingGabarito.name}</h2>
                <p className="text-[10px] text-gray-500">Turma: {selectedTurma?.name}</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="grid grid-cols-2 gap-8 mb-8 text-xs">
              <div className="space-y-3">
                <div className="border-b border-black pb-1 flex items-end">
                  <span className="font-bold mr-2 uppercase">Aluno(a):</span>
                  <div className="flex-1 h-4"></div>
                </div>
                <div className="border-b border-black pb-1 flex items-end">
                  <span className="font-bold mr-2 uppercase">Código:</span>
                  <div className="flex-1 h-4"></div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <h4 className="font-bold mb-1 uppercase text-[10px]">Instruções:</h4>
                <ul className="text-[9px] list-disc pl-3 space-y-1">
                  <li>Use caneta esferográfica azul ou preta.</li>
                  <li>Preencha completamente o círculo da resposta.</li>
                  <li>Não rasure e não use corretivo.</li>
                </ul>
              </div>
            </div>

            {/* QR Code and Main Title */}
            <div className="flex flex-col items-center mb-10">
              <h2 className="text-2xl font-black mb-4 tracking-[0.2em] uppercase">NÃO RASURE</h2>
              <div className="p-4 border-2 border-black bg-white shadow-sm">
                <QRCode 
                  value={JSON.stringify({
                    id: printingGabarito.id,
                    t: printingGabarito.name,
                    a: printingGabarito.answers,
                    c: printingGabarito.choicesCount
                  } as AnswerKey)} 
                  size={140} 
                  level="M" 
                />
              </div>
              <p className="text-[10px] mt-2 font-mono font-bold">*{printingGabarito.id.slice(0, 12).toUpperCase()}*</p>
            </div>

            {/* Answer Bubbles Grid */}
            <div className={`grid ${printingGabarito.answers.length > 40 ? 'grid-cols-3 gap-x-10' : 'grid-cols-2 gap-x-20'} gap-y-2 max-w-4xl mx-auto`}>
              {printingGabarito.answers.map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-1">
                  <span className="font-bold text-[11px] w-5 text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex gap-2 sm:gap-3">
                    {Array.from({ length: printingGabarito.choicesCount }).map((_, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-0.5">
                        <span className="text-[7px] font-bold text-gray-400">{String.fromCharCode(65 + idx)}</span>
                        <div className={`${printingGabarito.answers.length > 40 ? 'w-5 h-5' : 'w-6 h-6'} rounded-full border-2 border-black flex items-center justify-center`}>
                          {/* Inner circle for visual guide */}
                          <div className={`${printingGabarito.answers.length > 40 ? 'w-3 h-3' : 'w-4 h-4'} rounded-full border border-gray-100`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="absolute bottom-12 left-0 right-0 text-center">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest">Plataforma GabaritoFácil • Sistema de Correção Instantânea</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
