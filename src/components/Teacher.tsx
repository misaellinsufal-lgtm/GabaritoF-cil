import React, { useState } from 'react';
import { Camera } from './Camera';
import { AnswerKey, GradingResult } from '../types';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export function Teacher({ onBack }: { onBack: () => void }) {
  const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null);
  const [isScanningQR, setIsScanningQR] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQRCodeFound = (data: string) => {
    try {
      const parsed = JSON.parse(data) as AnswerKey;
      if (parsed.t && parsed.a && parsed.c) {
        setAnswerKey(parsed);
        setIsScanningQR(false);
      }
    } catch (e) {
      // Ignore invalid QR codes
    }
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
The correct answer key is:
${answerKey.a.map((ans, i) => `${i + 1}: ${ans}`).join('\n')}

The number of choices per question is ${answerKey.c} (A, B, C, D, E).

Please analyze the image and grade the student's answers.
Look carefully at the filled bubbles. A filled bubble is the student's answer.
If a question has multiple bubbles filled, or no bubbles filled, mark it as 'INVALID' or 'BLANK' and it is incorrect.

Return ONLY a valid JSON object with the following structure, and nothing else:
{
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
    setIsScanningQR(true);
    setAnswerKey(null);
  };

  const scanAnother = () => {
    setResult(null);
    setError(null);
    // Keep the answer key, just scan another sheet
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="p-4 max-w-3xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </button>
          
          {answerKey && !result && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              {answerKey.t} ({answerKey.a.length} questões)
            </div>
          )}
        </div>

        {!result ? (
          <div className="flex-1 flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex-1 flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {isScanningQR ? "1. Escanear Gabarito (QR Code)" : "2. Capturar Prova do Aluno"}
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
    </div>
  );
}
