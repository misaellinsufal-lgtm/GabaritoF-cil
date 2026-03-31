import React, { useState, useEffect } from 'react';
import { Camera } from './Camera';
import { AnswerKey, GradingResult, Turma, Gabarito } from '../types';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, RefreshCw, FileText, Users, ChevronRight, QrCode } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { subscribeToTurmas, subscribeToGabaritos } from '../lib/firebaseService';

export function Teacher({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<'select-turma' | 'select-gabarito' | 'scan'>('select-turma');
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [gabaritos, setGabaritos] = useState<Gabarito[]>([]);
  
  const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null);
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleQRCodeFound = (data: string) => {
    try {
      const parsed = JSON.parse(data) as AnswerKey;
      if (parsed.t && parsed.a && parsed.c) {
        setAnswerKey(parsed);
        setIsScanningQR(false);
        setView('scan');
      }
    } catch (e) {
      // Ignore invalid QR codes
    }
  };

  const handleSelectGabarito = (g: Gabarito) => {
    setAnswerKey({
      t: g.name,
      a: g.answers,
      c: g.choicesCount
    });
    setView('scan');
  };

  const handleCapture = async (imageDataUrl: string) => {
    if (!answerKey) return;
    setIsGrading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const base64Data = imageDataUrl.split(',')[1];
      const mimeType = imageDataUrl.split(';')[0].split(':')[1];

      const prompt = `
You are an expert Optical Mark Recognition (OMR) system.
I am providing an image of a filled multiple-choice answer sheet.
This sheet has 4 black squares at the corners for alignment and a QR code in the middle-top.

The correct answer key for this exam is:
${answerKey.a.map((ans, i) => `${i + 1}: ${ans}`).join('\n')}

The number of choices per question is ${answerKey.c} (A, B, C, D, E).

Please analyze the image and:
1. Identify the student's name if written in the "Aluno(a):" field.
2. Grade the student's answers by looking carefully at the filled bubbles. A filled bubble is the student's answer.
3. If a question has multiple bubbles filled, or no bubbles filled, mark it as 'BLANK' or 'INVALID' and it is incorrect.

Return ONLY a valid JSON object with the following structure, and nothing else:
{
  "studentName": "NAME DETECTED OR UNKNOWN",
  "score": <number of correct answers>,
  "total": ${answerKey.a.length},
  "details": [
    {
      "question": 1,
      "marked": "A", // The letter the student marked, or 'BLANK', or 'INVALID'
      "correct": true // true if marked matches the correct answer key
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            }
          ]
        },
        config: {
          responseMimeType: 'application/json',
        }
      });

      const resultText = response.text;
      if (resultText) {
        const parsedResult = JSON.parse(resultText) as GradingResult;
        setResult(parsedResult);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (err) {
      console.error("Grading error:", err);
      setError("Falha ao corrigir a prova. Tente novamente com uma foto mais nítida.");
    } finally {
      setIsGrading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setAnswerKey(null);
    setView('select-turma');
    setIsScanningQR(false);
  };

  const scanAnother = () => {
    setResult(null);
    setError(null);
  };

  const renderSelectTurma = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" /> Selecione a Turma
        </h2>
        
        <div className="grid gap-3">
          {turmas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 italic mb-4">Nenhuma turma encontrada.</p>
              <p className="text-sm text-gray-400">Crie turmas no modo Administrador primeiro.</p>
            </div>
          ) : (
            turmas.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTurma(t); setView('select-gabarito'); }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <span className="font-semibold text-gray-800">{t.name}</span>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
              </button>
            ))
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <button 
            onClick={() => { setIsScanningQR(true); setView('scan'); }}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <QrCode className="w-5 h-5 mr-2" /> Escanear QR Code de Gabarito
          </button>
        </div>
      </div>
    </div>
  );

  const renderSelectGabarito = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => setView('select-turma')} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </button>
        <h2 className="text-xl font-bold text-gray-900">{selectedTurma?.name}</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-blue-600" /> Selecione o Gabarito
        </h3>

        <div className="grid gap-3">
          {gabaritos.length === 0 ? (
            <p className="text-center py-8 text-gray-500 italic">Nenhum gabarito para esta turma.</p>
          ) : (
            gabaritos.map(g => (
              <button
                key={g.id}
                onClick={() => handleSelectGabarito(g)}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group text-left"
              >
                <div>
                  <span className="font-semibold text-gray-800 block">{g.name}</span>
                  <span className="text-xs text-gray-500">{g.answers.length} questões</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="p-4 max-w-3xl mx-auto w-full flex-1 flex flex-col">
        {view === 'select-turma' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </button>
            </div>
            {renderSelectTurma()}
          </>
        )}

        {view === 'select-gabarito' && renderSelectGabarito()}

        {view === 'scan' && (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setView(selectedTurma ? 'select-gabarito' : 'select-turma')} className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </button>
              
              {answerKey && !result && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  {answerKey.t}
                </div>
              )}
            </div>

            {!result ? (
              <div className="flex-1 flex flex-col">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {isScanningQR ? "Escanear QR Code" : "Capturar Prova"}
                  </h2>
                  
                  <div className="flex-1 relative rounded-lg overflow-hidden flex flex-col justify-center">
                    {isGrading ? (
                      <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center">
                        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <p className="text-lg font-medium text-gray-900">Corrigindo prova...</p>
                        <p className="text-sm text-gray-500 mt-2">A IA está analisando as marcações</p>
                      </div>
                    ) : null}
                    
                    <Camera
                      isScanningQR={isScanningQR}
                      onQRCodeFound={handleQRCodeFound}
                      onCapture={handleCapture}
                    />
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                    <span className="text-3xl font-bold text-green-600">{result.score}/{result.total}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Correção Concluída</h2>
                  {result.studentName && result.studentName !== 'UNKNOWN' && (
                    <p className="text-blue-600 font-bold uppercase mt-1">{result.studentName}</p>
                  )}
                  <p className="text-gray-500 mt-1">Prova: {answerKey?.t}</p>
                </div>

                <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                  {result.details.map((detail, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${detail.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center">
                        <span className="font-medium w-8">{detail.question}.</span>
                        <span className="text-gray-600 text-sm mr-2">Marcou:</span>
                        <span className={`font-bold ${detail.correct ? 'text-green-700' : 'text-red-700'}`}>
                          {detail.marked}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {!detail.correct && (
                          <span className="text-sm text-gray-500 mr-3">
                            Correta: <span className="font-bold text-gray-900">{answerKey?.a[i]}</span>
                          </span>
                        )}
                        {detail.correct ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={scanAnother}
                    className="py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Escanear Outra
                  </button>
                  <button
                    onClick={reset}
                    className="py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Trocar Gabarito
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
