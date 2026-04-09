import React from 'react';
import QRCode from 'react-qr-code';
import { Exam, Turma } from '../types';
import { Button } from './ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

interface Props {
  exam: Exam;
  turma: Turma;
  onBack: () => void;
}

export function PrintableSheet({ exam, turma, onBack }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const choices = Array.from({ length: exam.choicesCount }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir Cartões
        </Button>
      </div>

      <div className="bg-white p-8 shadow-sm border rounded-xl max-w-[210mm] mx-auto print:p-0 print:shadow-none print:border-none print:rounded-none">
        <div className="relative w-full aspect-[1/1.414] bg-white p-12 flex flex-col border-[1px] border-slate-100 print:border-none">
          {/* Fiducials (Corner Markers for Vision Alignment) */}
          <div className="absolute top-4 left-4 w-6 h-6 bg-black"></div>
          <div className="absolute top-4 right-4 w-6 h-6 bg-black"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 bg-black"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 bg-black"></div>

          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center font-bold text-xs text-slate-400">LOGO</div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tighter">Cartão Resposta</h1>
                  <p className="text-xs font-bold text-slate-500 uppercase">GabaritoFácil • Sistema de Correção Automática</p>
                </div>
              </div>
              
              <div className="space-y-4 mt-6">
                <div className="border-b border-black pb-1 flex items-end">
                  <span className="text-[10px] font-bold uppercase mr-2">Estudante:</span>
                  <div className="flex-1 h-5"></div>
                </div>
                <div className="flex gap-8">
                  <div className="border-b border-black pb-1 flex items-end w-1/2">
                    <span className="text-[10px] font-bold uppercase mr-2">Turma:</span>
                    <span className="text-sm font-bold">{turma.name}</span>
                  </div>
                  <div className="border-b border-black pb-1 flex items-end w-1/2">
                    <span className="text-[10px] font-bold uppercase mr-2">Data:</span>
                    <div className="flex-1 h-5"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 ml-8">
              <div className="p-2 border-2 border-black bg-white">
                <QRCode 
                  value={JSON.stringify({ id: exam.id, type: 'OMR_SHEET' })} 
                  size={80} 
                  level="H" 
                />
              </div>
              <span className="text-[8px] font-mono font-bold uppercase">ID: {exam.id.slice(0, 8)}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="text-center mb-8">
              <h2 className="text-lg font-black uppercase tracking-widest border-2 border-black inline-block px-6 py-1">
                {exam.title}
              </h2>
            </div>

            {/* Answer Bubbles Grid */}
            <div className="grid grid-cols-4 gap-x-8 gap-y-2 flex-1">
              {Array.from({ length: exam.numQuestions }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <span className="text-[10px] font-black w-6">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex gap-1.5">
                    {choices.map(c => (
                      <div key={c} className="flex flex-col items-center gap-0.5">
                        <span className="text-[6px] font-bold text-slate-400">{c}</span>
                        <div className="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full border border-slate-100"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Instructions */}
          <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <h4 className="text-[10px] font-black uppercase">Instruções de Preenchimento:</h4>
              <ul className="text-[8px] font-bold space-y-1 list-disc pl-4">
                <li>Use caneta esferográfica azul ou preta.</li>
                <li>Preencha totalmente o círculo da resposta escolhida.</li>
                <li>Não rasure, não use corretivo e não dobre esta folha.</li>
                <li>Marcações duplas ou rasuradas anularão a questão.</li>
              </ul>
            </div>
            <div className="flex flex-col items-center justify-center border-2 border-black p-2">
              <span className="text-[8px] font-black uppercase mb-2">Exemplo Correto:</span>
              <div className="w-6 h-6 rounded-full bg-black"></div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print-sheet, .print-sheet * { visibility: visible; }
          .print-sheet { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 210mm; 
            height: 297mm; 
            margin: 0;
            padding: 0;
          }
          @page { size: A4; margin: 0; }
        }
      `}} />
    </div>
  );
}
