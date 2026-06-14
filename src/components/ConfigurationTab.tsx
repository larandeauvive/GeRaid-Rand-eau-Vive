import { useState } from 'react';
import { Epreuve, Competitor } from '../types';
import { Plus, X, Trash2, Edit2, Save, Upload, Activity, Check } from 'lucide-react';

import { useEpreuves, useCompetitors } from '../firestoreHooks';

interface ConfigurationTabProps {
  onTriggerImport: () => void;
}

export function ConfigurationTab({ onTriggerImport }: ConfigurationTabProps) {
  const { epreuves, addEpreuve, updateEpreuve, deleteEpreuve } = useEpreuves();
  const { competitors, addCompetitor, updateCompetitor, deleteCompetitor } = useCompetitors();

  const [newEpreuveName, setNewEpreuveName] = useState('');
  const [newDisciplineInputs, setNewDisciplineInputs] = useState<Record<string, string>>({});
  
  // Competitor editing state
  const [editingCompetitorId, setEditingCompetitorId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Competitor>>({});

  const handleAddEpreuve = async () => {
    if (!newEpreuveName.trim()) return;
    await addEpreuve({ id: crypto.randomUUID(), name: newEpreuveName.trim(), disciplines: [] });
    setNewEpreuveName('');
  };

  const handleDeleteEpreuve = async (id: string) => {
    await deleteEpreuve(id);
  };

  const handleAddDiscipline = async (epreuveId: string) => {
    const val = newDisciplineInputs[epreuveId];
    if (!val || !val.trim()) return;
    
    const ep = epreuves.find(e => e.id === epreuveId);
    if (ep) {
        await updateEpreuve({
          ...ep,
          disciplines: [...ep.disciplines, { id: crypto.randomUUID(), name: val.trim() }]
        });
    }
    setNewDisciplineInputs({ ...newDisciplineInputs, [epreuveId]: '' });
  };

  const handleDeleteDiscipline = async (epreuveId: string, discId: string) => {
    const ep = epreuves.find(e => e.id === epreuveId);
    if (ep) {
        await updateEpreuve({
          ...ep,
          disciplines: ep.disciplines.filter(d => d.id !== discId)
        });
    }
  };

  // --- Competitor Handlers ---
  const handleEditClick = (comp: Competitor) => {
    setEditingCompetitorId(comp.id);
    setEditForm(comp);
  };

  const handleSaveCompetitor = async () => {
    if (!editingCompetitorId) return;
    const existing = competitors.find(c => c.id === editingCompetitorId);
    if (existing) {
        await updateCompetitor({ ...existing, ...editForm } as Competitor);
    } else {
        // new
        await addCompetitor({ ...editForm, id: editingCompetitorId } as Competitor);
    }
    setEditingCompetitorId(null);
  };

  const handleDeleteCompetitor = async (id: string) => {
    await deleteCompetitor(id);
  };

  const handleAddCompetitor = () => {
    const newCompId = crypto.randomUUID();
    setEditingCompetitorId(newCompId);
    setEditForm({
      id: newCompId,
      bib: '', chipNumber: '', firstName: '', lastName: '', category: '', epreuve: '', club: ''
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
      
      {/* Left Column: Epreuves & Disciplines */}
      <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col shrink-0">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            Épreuves & Disciplines
          </h3>

          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newEpreuveName}
              onChange={(e) => setNewEpreuveName(e.target.value)}
              placeholder="Nom de la course..."
              className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleAddEpreuve()}
            />
            <button 
              onClick={handleAddEpreuve}
              className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Ajouter une épreuve"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {epreuves.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Aucune épreuve configurée.<br/>Ajoutez votre première course (ex: Raid 50km).
              </p>
            ) : (
              epreuves.map(epreuve => (
                <div key={epreuve.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50 group shadow-sm transition-all hover:border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis">{epreuve.name}</h4>
                    <button onClick={() => handleDeleteEpreuve(epreuve.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {epreuve.disciplines.map(d => (
                      <span key={d.id} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {d.name}
                        <button onClick={() => handleDeleteDiscipline(epreuve.id, d.id)} className="hover:bg-emerald-200 p-0.5 rounded-md transition-colors text-emerald-600 hover:text-emerald-900">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Ajouter discipline (VTT, Trail...)"
                      value={newDisciplineInputs[epreuve.id] || ''}
                      onChange={(e) => setNewDisciplineInputs({...newDisciplineInputs, [epreuve.id]: e.target.value})}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDiscipline(epreuve.id)}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                    <button 
                      onClick={() => handleAddDiscipline(epreuve.id)}
                      className="px-3 py-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 text-xs font-bold transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Concurrents Editor */}
      <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 shrink-0">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Base de Données Concurrents</h3>
          <div className="flex gap-2 w-full sm:w-auto">
             <button 
              onClick={onTriggerImport}
              className="flex-1 sm:flex-none px-4 py-2 font-bold text-sm bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Importer (CSV)
            </button>
            <button 
              onClick={handleAddCompetitor}
              className="flex-1 sm:flex-none px-4 py-2 font-bold text-sm bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau</span> Concurrent
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto -mx-2 px-2">
          <table className="w-full text-left">
            <thead className="bg-white sticky top-0 z-10 border-b border-slate-100">
              <tr className="text-[10px] text-slate-400 uppercase">
                <th className="pb-3 px-2 font-bold bg-white">Dos.</th>
                <th className="pb-3 px-2 font-bold bg-white">Puce SI</th>
                <th className="pb-3 px-2 font-bold bg-white">Identité</th>
                <th className="pb-3 px-2 font-bold bg-white">Épreuve & Cat</th>
                <th className="pb-3 px-2 font-bold bg-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {competitors.length === 0 && !editingCompetitorId ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                    Aucun concurrent configuré. Importez un listing ou ajoutez des participants manuellement.
                  </td>
                </tr>
              ) : (
                <>
                {/* Render new unsaved competitor row at the top */}
                {editingCompetitorId && !competitors.find(c => c.id === editingCompetitorId) && (
                   <tr className="bg-indigo-50/30">
                        <td className="px-2 py-2 align-top">
                          <input 
                            value={editForm.bib || ''} 
                            onChange={e => setEditForm({...editForm, bib: e.target.value})}
                            className="w-full min-w-[3rem] px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono shadow-sm" placeholder="102" 
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input 
                            value={editForm.chipNumber || ''} 
                            onChange={e => setEditForm({...editForm, chipNumber: e.target.value})}
                            className="w-full min-w-[5rem] px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono shadow-sm font-bold text-indigo-700" placeholder="SI-Card" 
                          />
                        </td>
                        <td className="px-2 py-2 align-top flex flex-col gap-1.5 min-w-[10rem]">
                          <input 
                            value={editForm.lastName || ''} 
                            onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase shadow-sm" placeholder="NOM" 
                          />
                          <input 
                            value={editForm.firstName || ''} 
                            onChange={e => setEditForm({...editForm, firstName: e.target.value})}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm" placeholder="Prénom" 
                          />
                        </td>
                        <td className="px-2 py-2 align-top min-w-[8rem]">
                          <select 
                            value={editForm.epreuve || ''} 
                            onChange={e => setEditForm({...editForm, epreuve: e.target.value})}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-1.5 shadow-sm"
                          >
                            <option value="">Sélectionner une épreuve...</option>
                            {epreuves.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                            <option value={editForm.epreuve || ''}>{(editForm.epreuve && !epreuves.find(ep => ep.name === editForm.epreuve)) ? editForm.epreuve : 'Autre...'} </option>
                          </select>
                          <input 
                            value={editForm.category || ''} 
                            onChange={e => setEditForm({...editForm, category: e.target.value})}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm" placeholder="Catégorie (ex: SE M)" 
                          />
                        </td>
                        <td className="px-2 py-2 text-right align-top">
                          <div className="flex justify-end gap-2 mt-1">
                            <button onClick={handleSaveCompetitor} className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-sm hover:bg-emerald-600 transition-colors" title="Enregistrer">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditingCompetitorId(null)} className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors" title="Annuler">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                )}
                {competitors.map((comp) => {
                  const isEditing = editingCompetitorId === comp.id;
                  
                  if (isEditing) {
                    return (
                      <tr key={comp.id} className="bg-indigo-50/30">
                        <td className="px-2 py-2 align-top">
                          <input 
                            value={editForm.bib || ''} 
                            onChange={e => setEditForm({...editForm, bib: e.target.value})}
                            className="w-full min-w-[3rem] px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono shadow-sm" placeholder="102" 
                          />
                        </td>
                        <td className="px-2 py-2 align-top">
                          <input 
                            value={editForm.chipNumber || ''} 
                            onChange={e => setEditForm({...editForm, chipNumber: e.target.value})}
                            className="w-full min-w-[5rem] px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono shadow-sm font-bold text-indigo-700" placeholder="SI-Card" 
                          />
                        </td>
                        <td className="px-2 py-2 align-top flex flex-col gap-1.5 min-w-[10rem]">
                          <input 
                            value={editForm.lastName || ''} 
                            onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase shadow-sm" placeholder="NOM" 
                          />
                          <input 
                            value={editForm.firstName || ''} 
                            onChange={e => setEditForm({...editForm, firstName: e.target.value})}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm" placeholder="Prénom" 
                          />
                        </td>
                        <td className="px-2 py-2 align-top min-w-[8rem]">
                          <select 
                            value={editForm.epreuve || ''} 
                            onChange={e => setEditForm({...editForm, epreuve: e.target.value})}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-1.5 shadow-sm"
                          >
                            <option value="">Sélectionner une épreuve...</option>
                            {epreuves.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                            <option value={editForm.epreuve || ''}>{(editForm.epreuve && !epreuves.find(ep => ep.name === editForm.epreuve)) ? editForm.epreuve : 'Autre...'} </option>
                          </select>
                          <input 
                            value={editForm.category || ''} 
                            onChange={e => setEditForm({...editForm, category: e.target.value})}
                            className="w-full px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm" placeholder="Catégorie (ex: SE M)" 
                          />
                        </td>
                        <td className="px-2 py-2 text-right align-top">
                          <div className="flex justify-end gap-2 mt-1">
                            <button onClick={handleSaveCompetitor} className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-sm hover:bg-emerald-600 transition-colors" title="Enregistrer">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => {
                                // If it was a truly new empty row that we cancel, we might want to delete it.
                                // For simplicity, just close edit mode.
                                setEditingCompetitorId(null)
                            }} className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors" title="Annuler">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={comp.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-2 py-3 font-mono text-slate-500 text-xs w-16">{comp.bib || '-'}</td>
                      <td className="px-2 py-3 font-mono font-bold text-indigo-600 text-xs w-28">{comp.chipNumber || '---'}</td>
                      <td className="px-2 py-3">
                        <div className="font-semibold text-slate-800">{comp.lastName.toUpperCase()} {comp.firstName}</div>
                        {comp.club && <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{comp.club}</div>}
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-xs text-slate-700 font-medium">{comp.epreuve || 'Non assigné'}</div>
                        <div className="text-[10px] text-slate-400">{comp.category || '-'}</div>
                      </td>
                      <td className="px-2 py-3 text-right">
                         <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditClick(comp)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors" title="Modifier">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteCompetitor(comp.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors" title="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                      </td>
                    </tr>
                  )
                })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
