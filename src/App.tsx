/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Admin } from './components/Admin';
import { Teacher } from './components/Teacher';
import { LogIn, LogOut, User as UserIcon, Lock, User as UserCircle } from 'lucide-react';
import { testConnection } from './lib/firebaseService';

type UserRole = 'coord' | 'prof';

interface LocalUser {
  username: string;
  role: UserRole;
}

export default function App() {
  const [mode, setMode] = useState<'home' | 'admin' | 'teacher'>('home');
  const [user, setUser] = useState<LocalUser | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    testConnection();
    // Check local storage for session
    const savedUser = localStorage.getItem('omr_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (username === 'Coord' && password === '123456') {
      const newUser: LocalUser = { username: 'Coord', role: 'coord' };
      setUser(newUser);
      localStorage.setItem('omr_user', JSON.stringify(newUser));
    } else if (username === 'Prof' && password === '123456') {
      const newUser: LocalUser = { username: 'Prof', role: 'prof' };
      setUser(newUser);
      localStorage.setItem('omr_user', JSON.stringify(newUser));
    } else {
      setLoginError('Usuário ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('omr_user');
    setMode('home');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600 flex items-center">
            <span className="mr-2">📝</span> OMR AI
          </h1>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center text-sm text-gray-600">
                  <UserIcon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">{user.username} ({user.role === 'coord' ? 'Coordenação' : 'Professor'})</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Sair
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {!user ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[80vh]">
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 w-full max-w-md">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <Lock className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
                <p className="text-gray-500 mt-2">Entre com suas credenciais para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Coord ou Prof"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="******"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {loginError && (
                  <p className="text-sm text-red-600 font-medium">{loginError}</p>
                )}

                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl mt-2"
                >
                  Entrar
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  Coord: 123456 | Prof: 123456
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {mode === 'home' && <Home onSelectMode={setMode} />}
            {mode === 'admin' && <Admin onBack={() => setMode('home')} />}
            {mode === 'teacher' && <Teacher onBack={() => setMode('home')} />}
          </>
        )}
      </main>
    </div>
  );
}
