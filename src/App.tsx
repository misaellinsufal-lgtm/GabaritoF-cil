/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Home } from './components/Home';
import { Admin } from './components/Admin';
import { Teacher } from './components/Teacher';

export default function App() {
  const [mode, setMode] = useState<'home' | 'admin' | 'teacher'>('home');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {mode === 'home' && <Home onSelectMode={setMode} />}
      {mode === 'admin' && <Admin onBack={() => setMode('home')} />}
      {mode === 'teacher' && <Teacher onBack={() => setMode('home')} />}
    </div>
  );
}
