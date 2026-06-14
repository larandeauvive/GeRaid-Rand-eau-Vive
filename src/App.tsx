/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { Activity, Usb, Save, Upload, Trash2, Users, Clock, ArrowRightLeft, Settings, LogOut, CheckCircle2 } from 'lucide-react';
import { useSportIdent } from './hooks/useSportIdent';
import { Competitor } from './types';
import { ConfigurationTab } from './components/ConfigurationTab';
import { ImportMapper } from './components/ImportMapper';
import { useAuth } from './AuthProvider';
import { useCompetitors } from './firestoreHooks';

export default function App() {
  const { user, signIn, logOut } = useAuth();
  
  const { isConnected, connect, disconnect, logs, clearLogs } = useSportIdent();
  const { competitors, addCompetitorsBatch } = useCompetitors();
  
  const [activeTab, setActiveTab] = useState<'logs' | 'competitors' | 'settings'>('settings');
  const [importState, setImportState] = useState<{headers: string[], data: any[]}|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordInput, setPasswordInput] = useState('');
  
  if (!user) {
    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordInput === 'RV26') {
        signIn();
      } else {
        alert("Mot de passe incorrect.");
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-sm w-full text-center">
          <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Activity className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Chrono-Raid Web</h1>
          <p className="text-slate-500 mb-8">Veuillez renseigner le mot de passe pour accéder à l'interface.</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password"
              placeholder="Mot de passe"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Se Connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImportState({
          headers: results.meta.fields || [],
          data: results.data
        });
        setActiveTab('settings');
      },
      error: (error) => {
        console.error("Erreur de parsing CSV:", error);
        alert("Erreur lors de la lecture du fichier CSV.");
      }
    });
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async (newCompetitors: Competitor[]) => {
    await addCompetitorsBatch(newCompetitors);
    setImportState(null);
  };

  const handleCancelImport = () => {
    setImportState(null);
  };

  const handleKlikegoClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 sm:p-6 flex flex-col max-w-[1400px] mx-auto w-full">
      {/* Header Section */}
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white shrink-0">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              Chrono-Raid <span className="text-emerald-600">Web</span>
              <span className="hidden sm:flex bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full items-center gap-1">
                 <CheckCircle2 className="h-3 w-3" /> Cloud Sync
              </span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'}`}></span>
            <span className="text-sm font-semibold text-slate-600 hidden sm:block">
              SportIdent: {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
           <button onClick={logOut} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200" title="Déconnexion">
              <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Bento Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow min-h-0">
        
        {/* Sidebar / Controls */}
        <div className="md:col-span-4 lg:col-span-3 space-y-4 flex flex-col min-h-0">
          
          {/* Hardware Connection Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col shrink-0">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Hardware Link</h3>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded">USB SERIAL</span>
            </div>
            
            <div className="py-2 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500">Connexion</span>
                <div className="flex items-center gap-2">
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  <span className="text-sm font-mono font-bold text-slate-700">
                    {isConnected ? 'Connecté' : 'Déconnecté'}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Baud Rate</span>
                <span className="text-sm font-mono font-bold text-slate-700">38400 bps</span>
              </div>
            </div>

            <button
              onClick={isConnected ? disconnect : connect}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                isConnected
                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Usb className="h-4 w-4" />
              {isConnected ? 'Déconnecter Boîtier' : 'Connecter SportIdent'}
            </button>
          </div>

          {/* Klikego Import Card */}
          <div className="bg-emerald-50 rounded-3xl p-5 border-2 border-dashed border-emerald-200 flex flex-col items-center justify-center text-center flex-1 min-h-[220px]">
            <div className="bg-white p-3 rounded-full shadow-sm mb-3 mt-auto">
              <Upload className="h-6 w-6 text-emerald-600" />
            </div>
            <h4 className="text-sm font-bold text-emerald-900">Import Klikego</h4>
            <p className="text-[11px] text-emerald-700 mt-1 mb-4">Téléchargez le listing (CSV)</p>
            
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button 
              onClick={handleKlikegoClick}
              className="mt-auto px-4 py-2 w-full bg-white border border-emerald-200 text-emerald-800 rounded-xl font-bold text-sm hover:border-emerald-400 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
            >
              <Users className="h-4 w-4" />
              Importer Liste
            </button>

            {competitors.length > 0 && (
              <div className="mt-4 text-[10px] font-mono bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg w-full text-center font-bold flex justify-center gap-1.5">
                 <CheckCircle2 className="h-3 w-3" /> {competitors.length} Cloud Entries
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-4 min-h-0">
          
          {/* Tabs header card */}
          <div className="bg-white rounded-3xl p-2 border border-slate-200 shadow-sm flex shrink-0">
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-3 px-4 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'logs' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Live Serial Feed</span> ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('competitors')}
              className={`flex-1 py-3 px-4 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'competitors' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Listing Concurrents</span> ({competitors.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-3 px-4 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'settings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Course & Paramètres</span>
            </button>
          </div>

          {/* Tab Content: Logs (Live Hex Stream style) */}
          {activeTab === 'logs' && (
            <div className="bg-slate-900 rounded-3xl p-6 shadow-inner border border-slate-800 flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Serial Feed
                </h3>
                <button
                  onClick={clearLogs}
                  disabled={logs.length === 0}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Effacer Cloud Logs
                </button>
              </div>
              
              <div className="font-mono text-xs text-emerald-400/80 overflow-y-auto flex-1 leading-relaxed rounded-xl space-y-1">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3">
                    <Usb className="h-8 w-8 opacity-50" />
                    <p>&gt; WAITING FOR DATA...</p>
                  </div>
                ) : (
                  <ul className="space-y-1 pb-4">
                    {logs.map((log) => (
                      <li key={log.id} className="flex gap-4">
                        <span className="text-emerald-500 shrink-0 select-none">
                          &gt; [{format(log.timestamp, 'HH:mm:ss.SSS')}]
                        </span>
                        <span className="text-emerald-300 break-all font-bold">
                          {log.hexData}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Competitors (Recent History Style) */}
          {activeTab === 'competitors' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Competitors List</h3>
              </div>
              
              <div className="flex-1 overflow-auto -mx-2 px-2">
                <table className="w-full text-left">
                  <thead className="bg-white sticky top-0 z-10 border-b border-slate-100">
                    <tr className="text-[10px] text-slate-400 uppercase">
                      <th className="pb-3 px-2 font-bold bg-white">Dos.</th>
                      <th className="pb-3 px-2 font-bold bg-white">SI-Card</th>
                      <th className="pb-3 px-2 font-bold bg-white">Name</th>
                      <th className="pb-3 px-2 font-bold bg-white">Race</th>
                      <th className="pb-3 px-2 font-bold bg-white hidden sm:table-cell">Cat.</th>
                      <th className="pb-3 px-2 font-bold bg-white hidden md:table-cell">Club</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {competitors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-12 text-center text-slate-400 font-medium border-t border-slate-50">
                          Aucun concurrent chargé. Importez un fichier CSV.
                        </td>
                      </tr>
                    ) : (
                      competitors.map((comp) => (
                        <tr key={comp.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-2 py-3 font-mono text-slate-500">{comp.bib}</td>
                          <td className="px-2 py-3 font-mono font-bold text-emerald-600">{comp.chipNumber}</td>
                          <td className="px-2 py-3 font-semibold text-slate-800">{comp.lastName?.toUpperCase()} {comp.firstName}</td>
                          <td className="px-2 py-3 text-slate-500">{comp.epreuve}</td>
                          <td className="px-2 py-3 text-slate-500 hidden sm:table-cell">{comp.category}</td>
                          <td className="px-2 py-3 text-slate-500 max-w-[150px] truncate hidden md:table-cell" title={comp.club}>{comp.club}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: Settings */}
          {activeTab === 'settings' && (
            importState ? (
              <ImportMapper 
                headers={importState.headers} 
                data={importState.data} 
                onConfirm={handleConfirmImport} 
                onCancel={handleCancelImport} 
              />
            ) : (
              <ConfigurationTab 
                onTriggerImport={handleKlikegoClick} 
              />
            )
          )}

        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="mt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] font-medium text-slate-400 shrink-0">
        <div className="flex gap-4">
          <span>Version 1.2.0-stable</span>
          <span className="text-emerald-500">Web Serial API Active</span>
        </div>
        <div className="flex gap-4 mt-2 sm:mt-0">
          <span className="text-indigo-400">Cloud Sync: Active</span>
          <span>Workspace Environment</span>
        </div>
      </footer>
    </div>
  );
}
