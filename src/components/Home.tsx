import React from 'react';
import { Settings, Camera, BookOpen } from 'lucide-react';

export function Home({ onSelectMode }: { onSelectMode: (mode: 'admin' | 'teacher') => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 text-white rounded-2xl mb-6 shadow-lg shadow-blue-200">
          <BookOpen className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Gabarito<span className="text-blue-600">Fácil</span></h1>
        <p className="text-lg text-gray-600">Crie gabaritos e corrija provas instantaneamente com a câmera do seu celular.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          onClick={() => onSelectMode('admin')}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Settings className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 w-full text-center">Administração</h2>
          <p className="text-gray-500 text-center text-sm">Crie gabaritos, defina as respostas corretas e imprima as folhas para os alunos.</p>
        </button>

        <button
          onClick={() => onSelectMode('teacher')}
          className="group flex flex-col items-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-green-500 hover:shadow-md transition-all text-left"
        >
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 w-full text-center">Professor</h2>
          <p className="text-gray-500 text-center text-sm">Escaneie os gabaritos preenchidos e obtenha a nota do aluno na hora.</p>
        </button>
      </div>
    </div>
  );
}
