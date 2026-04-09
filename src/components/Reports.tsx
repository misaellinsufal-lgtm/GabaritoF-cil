import React, { useState, useEffect } from 'react';
import { Exam, Result } from '../types';
import { subscribeToResults } from '../lib/firebaseService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { ArrowLeft, Download, FileSpreadsheet, FileText, TrendingUp, Users, Target } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

interface Props {
  exam: Exam;
  onBack: () => void;
}

export function Reports({ exam, onBack }: Props) {
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState({
    average: 0,
    totalScanned: 0,
    questionStats: [] as { question: number, correctPct: number }[]
  });

  useEffect(() => {
    const unsubscribe = subscribeToResults(exam.id, (data) => {
      setResults(data);
      calculateStats(data);
    });
    return () => unsubscribe();
  }, [exam.id]);

  const calculateStats = (data: Result[]) => {
    if (data.length === 0) return;

    const totalScore = data.reduce((acc, r) => acc + r.score, 0);
    const average = totalScore / data.length;

    const qStats = Array(exam.numQuestions).fill(0).map((_, i) => {
      const correctCount = data.filter(r => r.answers[i] === exam.answerKey[i]).length;
      return {
        question: i + 1,
        correctPct: (correctCount / data.length) * 100
      };
    });

    setStats({
      average: parseFloat(average.toFixed(1)),
      totalScanned: data.length,
      questionStats: qStats
    });
  };

  const exportToExcel = () => {
    const wsData = results.map(r => ({
      'Estudante': r.studentName,
      'Código': r.studentCode || '',
      'Nota': r.score,
      'Data': r.scannedAt.toDate().toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
    XLSX.writeFile(wb, `Resultados_${exam.title}.xlsx`);
    toast.success('Excel exportado com sucesso!');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Relatório: ${exam.title}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Média da Turma: ${stats.average}`, 20, 30);
    doc.text(`Total de Alunos: ${stats.totalScanned}`, 20, 40);

    let y = 60;
    doc.text('Estudante', 20, y);
    doc.text('Nota', 150, y);
    doc.line(20, y + 2, 190, y + 2);

    results.forEach((r, i) => {
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(r.studentName, 20, y);
      doc.text(r.score.toString(), 150, y);
    });

    doc.save(`Relatorio_${exam.title}.pdf`);
    toast.success('PDF exportado com sucesso!');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <h2 className="text-2xl font-bold">Resultados: {exam.title}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <FileText className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Média Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.average}</div>
            <p className="text-xs opacity-60 mt-1">Pontuação de 0 a 10</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Corrigido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Users className="text-primary w-6 h-6" />
              {stats.totalScanned}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cartões processados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Questão Mais Difícil</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.questionStats.length > 0 ? (
              <div className="text-3xl font-bold flex items-center gap-2">
                <Target className="text-destructive w-6 h-6" />
                Q{stats.questionStats.reduce((prev, curr) => prev.correctPct < curr.correctPct ? prev : curr).question}
              </div>
            ) : (
              <div className="text-xl font-bold">---</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Menor índice de acerto</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudante</TableHead>
                  <TableHead className="text-right">Nota</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.studentName}</TableCell>
                    <TableCell className="text-right font-bold">{r.score}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={r.score >= 6 ? 'default' : 'destructive'}>
                        {r.score >= 6 ? 'Aprovado' : 'Reprovado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {results.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                      Nenhum resultado disponível ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise por Questão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.questionStats.map((q) => (
                <div key={q.question} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Questão {q.question}</span>
                    <span>{q.correctPct.toFixed(0)}% de acerto</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${q.correctPct > 70 ? 'bg-green-500' : q.correctPct > 40 ? 'bg-amber-500' : 'bg-destructive'}`}
                      style={{ width: `${q.correctPct}%` }}
                    />
                  </div>
                </div>
              ))}
              {stats.questionStats.length === 0 && (
                <div className="py-8 text-center text-muted-foreground italic">
                  Aguardando dados para análise...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
