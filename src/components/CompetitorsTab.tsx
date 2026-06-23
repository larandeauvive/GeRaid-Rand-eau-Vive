import { useState, useEffect } from 'react';
import { Competitor } from '../types';
import { useCompetitors, useEpreuves } from '../firestoreHooks';
import { Upload, Plus, Check, X, Edit2, Trash2, Usb } from 'lucide-react';

import { generateId } from '../utils';

interface CompetitorsTabProps {
  onTriggerImport: () => void;
  lastReadChipNumber: string | null;
  setLastReadChipNumber: (chip: string | null) => void;
}

export function CompetitorsTab({ onTriggerImport, lastReadChipNumber, setLastReadChipNumber }: CompetitorsTabProps) {
  const { competitors, addCompetitor, updateCompetitor, deleteCompetitor } = useCompetitors();
  const { epreuves } = useEpreuves();

  const [editingCompetitorId, setEditingCompetitorId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Competitor>>({});

  useEffect(() => {
    if (editingCompetitorId && lastReadChipNumber) {
      setEditForm(prev => ({ ...prev, chipNumber: lastReadChipNumber }));
      setLastReadChipNumber(null);
    }
  }, [lastReadChipNumber, editingCompetitorId, setLastReadChipNumber]);

  const handleEditClick = (comp: Competitor) => {
    setLastReadChipNumber(null);
    setEditingCompetitorId(comp.id);
    setEditForm(comp);
  };

  const handleSaveCompetitor = async () => {
    if (!editingCompetitorId) return;
    const existing = competitors.find(c => c.id === editingCompetitorId);
    if (existing) {
        await updateCompetitor({ ...existing, ...editForm } as Competitor);
    } else {
        await addCompetitor({ ...editForm, id: editingCompetitorId } as Competitor);
    }
    setEditingCompetitorId(null);
  };

  const handleDeleteCompetitor = async (id: string) => {
    await deleteCompetitor(id);
  };

  const handleAddCompetitor = () => {
    setLastReadChipNumber(null);
    const newCompId = generateId();
    setEditingCompetitorId(newCompId);
    setEditForm({
      id: newCompId,
      bib: '', chipNumber: '', firstName: '', lastName: '', category: '', epreuve: '', club: ''
    });
  };

  return (
    <div className="h-full flex flex-col">
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
                {editingCompetitorId && !competitors.find(c => c.id === editingCompetitorId) && (
                   <tr className="bg-indigo-50/30">
                        <td className="px-2 py-2 align-top">
                          <input 
                            value={editForm.bib || ''} 
                            onChange={e => setEditForm({...editForm, bib: e.target.value})}
                            className="w-full min-w-[3rem] px-2 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono shadow-sm" placeholder="102" 
                          />
                        </td>
                        <td className="px-2 py-2 align-top relative">
                          <input 
                            value={editForm.chipNumber || ''} 
                            onChange={e => setEditForm({...editForm, chipNumber: e.target.value})}
                            className="w-full min-w-[5rem] px-2 py-1.5 pr-6 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono shadow-sm font-bold text-indigo-700" placeholder="SI-Card" 
                          />
                          <Usb className="h-3 w-3 text-indigo-300 absolute right-4 top-4" title="Bippez une puce pour l'affecter" />
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
                        <td className="px-2 py-2 align-top relative">
                          <input 
                            value={editForm.chipNumber || ''} 
                            onChange={e => setEditForm({...editForm, chipNumber: e.target.value})}
                            className="w-full min-w-[5rem] px-2 py-1.5 pr-6 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono shadow-sm font-bold text-indigo-700" placeholder="SI-Card" 
                          />
                          <Usb className="h-3 w-3 text-indigo-300 absolute right-4 top-4" title="Bippez une puce pour l'affecter" />
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
  );
}
