import React, { useRef, useState, useEffect } from 'react';
import { Exam, OMRCorrection } from '../types';
import { correctOMRSheet } from '../lib/gemini';
import { saveResult } from '../lib/firebaseService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
  exam: Exam;
  onBack: () => void;
}

export function Scanner({ exam, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<OMRCorrection | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraReady(true);
      }
    } catch (err) {
      toast.error('Erro ao acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndCorrect = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    setIsScanning(true);
    setLastResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const correction = await correctOMRSheet(base64Image, exam.numQuestions, exam.choicesCount);
      
      // Calculate score
      let correctCount = 0;
      correction.answers.forEach((ans, i) => {
        if (ans === exam.answerKey[i]) correctCount++;
      });

      const score = (correctCount / exam.numQuestions) * 10;

      await saveResult({
        examId: exam.id,
        studentName: correction.studentName,
        studentCode: correction.studentCode,
        answers: correction.answers,
        score: parseFloat(score.toFixed(1)),
        totalQuestions: exam.numQuestions,
        imageUrl: base64Image // In a real app, upload to storage first
      });

      setLastResult(correction);
      toast.success(`Correção concluída: ${correction.studentName}`);
    } catch (error) {
      toast.error('Erro na correção. Tente alinhar melhor o cartão.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h2 className="text-2xl font-bold">Scanner de Cartões</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden border-none shadow-xl bg-black relative aspect-[3/4]">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay Guides */}
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
            <div className="w-full h-full border-2 border-dashed border-white/50 rounded-lg relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
            </div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center px-6">
            <Button 
              size="lg" 
              className="w-full h-16 rounded-full text-lg font-bold shadow-2xl"
              onClick={captureAndCorrect}
              disabled={!isCameraReady || isScanning}
            >
              {isScanning ? (
                <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Corrigindo...</>
              ) : (
                <><Camera className="w-6 h-6 mr-2" /> Capturar Cartão</>
              )}
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instruções</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4 text-muted-foreground">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">1</div>
                <p>Alinhe os 4 quadrados pretos do cartão com as marcas na tela.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">2</div>
                <p>Mantenha a câmera estável e com boa iluminação.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">3</div>
                <p>Clique no botão azul para capturar e corrigir instantaneamente.</p>
              </div>
            </CardContent>
          </Card>

          {lastResult && (
            <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Último Resultado</CardTitle>
                  <CheckCircle2 className="text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold">Estudante:</span>
                  <span>{lastResult.studentName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-bold">Código:</span>
                  <span>{lastResult.studentCode || 'N/A'}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-bold">Confiança:</span>
                  <span className={lastResult.confidence > 0.8 ? 'text-green-600' : 'text-amber-600'}>
                    {(lastResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
