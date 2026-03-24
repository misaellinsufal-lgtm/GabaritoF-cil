import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { AnswerKey } from '../types';
import { Plus, Minus, Printer, ArrowLeft } from 'lucide-react';

export function Admin({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState('Prova de Matemática');
  const [numQuestions, setNumQuestions] = useState(10);
  const [numChoices, setNumChoices] = useState(5); // A, B, C, D, E
  const [answers, setAnswers] = useState<string[]>(Array(10).fill('A'));

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

  const choices = Array.from({ length: numChoices }, (_, i) => String.fromCharCode(65 + i));

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const answerKey: AnswerKey = {
    t: title,
    a: answers,
    c: numChoices,
  };

  const qrData = JSON.stringify(answerKey);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Non-printable controls */}
      <div className="print:hidden p-4 max-w-3xl mx-auto w-full flex-1">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Criar Gabarito</h2>
          
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título da Prova</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alternativas</label>
                <select
                  value={numChoices}
                  onChange={(e) => setNumChoices(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            onClick={() => window.print()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center transition-colors"
          >
            <Printer className="w-5 h-5 mr-2" /> Imprimir Gabarito
          </button>
        </div>
      </div>

      {/* Printable View */}
      <div className="hidden print:block p-8 bg-white text-black w-full max-w-[210mm] mx-auto">
        <div className="border-2 border-black p-8 rounded-xl relative">
          {/* Corner markers for alignment (optional, but good for visual framing) */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-black"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-black"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-black"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-black"></div>

          <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-6">
            <div className="flex-1 pr-8">
              <h1 className="text-3xl font-bold mb-4 uppercase tracking-wider">{title}</h1>
              <div className="space-y-4">
                <div className="flex border-b border-black pb-1">
                  <span className="font-semibold mr-2">Nome:</span>
                  <div className="flex-1"></div>
                </div>
                <div className="flex border-b border-black pb-1">
                  <span className="font-semibold mr-2">Data:</span>
                  <div className="w-32"></div>
                  <span className="font-semibold mx-2">Turma:</span>
                  <div className="flex-1"></div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 italic">
                Preencha completamente a bolinha correspondente à alternativa correta com caneta azul ou preta.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2 border-2 border-black bg-white">
                <QRCode value={qrData} size={120} level="L" />
              </div>
              <span className="text-xs mt-2 font-mono text-gray-500">NÃO RASURE O QR CODE</span>
            </div>
          </div>

          <div className="columns-2 md:columns-3 gap-8">
            {Array.from({ length: numQuestions }).map((_, i) => (
              <div key={i} className="flex items-center mb-4 break-inside-avoid">
                <span className="font-bold w-8 text-right mr-4">{i + 1}.</span>
                <div className="flex space-x-3">
                  {choices.map((c) => (
                    <div key={c} className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-xs font-medium text-gray-400">
                        {c}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
