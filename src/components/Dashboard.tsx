import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  subscribeToTurmas, 
  createTurma, 
  deleteTurma,
  subscribeToExams,
  deleteExam
} from '../lib/firebaseService';
import { Turma, Exam } from '../types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { 
  Plus, 
  LogOut, 
  Users, 
  BookOpen, 
  Trash2, 
  ChevronRight, 
  Printer, 
  Camera, 
  BarChart3,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import { ExamCreator } from './ExamCreator';
import { PrintableSheet } from './PrintableSheet';
import { Scanner } from './Scanner';
import { Reports } from './Reports';

export function Dashboard() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  const [newTurmaName, setNewTurmaName] = useState('');
  const [view, setView] = useState<'turmas' | 'exams' | 'create-exam' | 'print' | 'scan' | 'reports'>('turmas');

  useEffect(() => {
    const unsubscribe = subscribeToTurmas(setTurmas);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedTurma) {
      const unsubscribe = subscribeToExams(selectedTurma.id, setExams);
      return () => unsubscribe();
    }
  }, [selectedTurma]);

  const handleCreateTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTurmaName.trim()) return;
    try {
      await createTurma(newTurmaName);
      setNewTurmaName('');
      toast.success('Turma criada!');
    } catch (error) {
      toast.error('Erro ao criar turma');
    }
  };

  const handleDeleteTurma = async (id: string) => {
    if (!confirm('Excluir esta turma e todos os seus dados?')) return;
    try {
      await deleteTurma(id);
      toast.success('Turma excluída');
    } catch (error) {
      toast.error('Erro ao excluir turma');
    }
  };

  const handleLogout = () => signOut(auth);

  const renderTurmas = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="text-primary" /> Minhas Turmas
        </h2>
        <form onSubmit={handleCreateTurma} className="flex gap-2">
          <Input 
            placeholder="Nome da Turma" 
            value={newTurmaName} 
            onChange={(e) => setNewTurmaName(e.target.value)}
            className="w-48"
          />
          <Button type="submit" size="icon"><Plus className="w-4 h-4" /></Button>
        </form>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {turmas.map(t => (
          <Card key={t.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setSelectedTurma(t); setView('exams'); }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold">{t.name}</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={(e) => { e.stopPropagation(); handleDeleteTurma(t.id); }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Clique para ver as provas</p>
            </CardContent>
          </Card>
        ))}
        {turmas.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground">
            Nenhuma turma cadastrada. Comece criando uma acima.
          </div>
        )}
      </div>
    </div>
  );

  const renderExams = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setView('turmas')}>Voltar</Button>
          <h2 className="text-2xl font-bold">{selectedTurma?.name} - Provas</h2>
        </div>
        <Button onClick={() => setView('create-exam')}>
          <Plus className="w-4 h-4 mr-2" /> Nova Prova
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {exams.map(e => (
          <Card key={e.id} className="hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{e.title}</CardTitle>
                <CardDescription>{e.numQuestions} questões • {e.choicesCount} alternativas</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setSelectedExam(e); setView('print'); }}>
                  <Printer className="w-4 h-4 mr-2" /> Cartões
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedExam(e); setView('scan'); }}>
                  <Camera className="w-4 h-4 mr-2" /> Corrigir
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedExam(e); setView('reports'); }}>
                  <BarChart3 className="w-4 h-4 mr-2" /> Resultados
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteExam(e.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
        {exams.length === 0 && (
          <div className="py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground">
            Nenhuma prova cadastrada para esta turma.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">GabaritoFácil</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">{auth.currentUser?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {view === 'turmas' && renderTurmas()}
        {view === 'exams' && renderExams()}
        {view === 'create-exam' && selectedTurma && (
          <ExamCreator 
            turma={selectedTurma} 
            onCancel={() => setView('exams')} 
            onComplete={() => setView('exams')} 
          />
        )}
        {view === 'print' && selectedExam && (
          <PrintableSheet 
            exam={selectedExam} 
            turma={selectedTurma!} 
            onBack={() => setView('exams')} 
          />
        )}
        {view === 'scan' && selectedExam && (
          <Scanner 
            exam={selectedExam} 
            onBack={() => setView('exams')} 
          />
        )}
        {view === 'reports' && selectedExam && (
          <Reports 
            exam={selectedExam} 
            onBack={() => setView('exams')} 
          />
        )}
      </main>
    </div>
  );
}
