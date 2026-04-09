import React, { useState } from 'react';
import { Turma, Exam } from '../types';
import { createExam } from '../lib/firebaseService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Save, ArrowLeft, Plus, Minus } from 'lucide-react';

interface Props {
  turma: Turma;
  onCancel: () => void;
  onComplete: () => void;
}

export function ExamCreator({ turma, onCancel, onComplete }: Props) {
  const [title, setTitle] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [choicesCount, setChoicesCount] = useState(5);
  const [answerKey, setAnswerKey] = useState<string[]>(Array(10).fill('A'));
  const [loading, setLoading] = useState(false);

  const handleNumQuestionsChange = (val: number) => {
    const newCount = Math.max(1, Math.min(100, val));
    setNumQuestions(newCount);
    setAnswerKey(prev => {
      const next = [...prev];
      if (newCount > prev.length) {
        return [...next, ...Array(newCount - prev.length).fill('A')];
      }
      return next.slice(0, newCount);
    });
  };

  const handleAnswerChange = (idx: number, val: string) => {
    const next = [...answerKey];
    next[idx] = val;
    setAnswerKey(next);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Dê um título para a prova');
      return;
    }
    setLoading(true);
    try {
      await createExam({
        title,
        turmaId: turma.id,
        numQuestions,
        choicesCount,
        answerKey
      });
      toast.success('Prova criada com sucesso!');
      onComplete();
    } catch (error) {
      toast.error('Erro ao salvar prova');
    } finally {
      setLoading(false);
    }
  };

  const choices = Array.from({ length: choicesCount }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h2 className="text-2xl font-bold">Configurar Nova Prova</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Defina os parâmetros da prova para {turma.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Título da Prova</Label>
              <Input 
                placeholder="Ex: Simulado de Matemática - 1º Bimestre" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nº de Questões</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleNumQuestionsChange(numQuestions - 1)}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input 
                    type="number" 
                    value={numQuestions} 
                    onChange={(e) => handleNumQuestionsChange(parseInt(e.target.value) || 1)}
                    className="text-center"
                  />
                  <Button variant="outline" size="icon" onClick={() => handleNumQuestionsChange(numQuestions + 1)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Alternativas</Label>
                <Select value={choicesCount.toString()} onValueChange={(v) => setChoicesCount(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 (A-B)</SelectItem>
                    <SelectItem value="3">3 (A-C)</SelectItem>
                    <SelectItem value="4">4 (A-D)</SelectItem>
                    <SelectItem value="5">5 (A-E)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-bold">Gabarito Oficial</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {answerKey.map((ans, i) => (
                <div key={i} className="flex flex-col gap-1 p-2 bg-slate-50 rounded-lg border">
                  <span className="text-xs font-bold text-muted-foreground">Q{i + 1}</span>
                  <div className="flex flex-wrap gap-1">
                    {choices.map(c => (
                      <button
                        key={c}
                        onClick={() => handleAnswerChange(i, c)}
                        className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
                          ans === c ? 'bg-primary text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'
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
        </CardContent>
        <div className="p-6 border-t flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Prova'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
