import React, { useState } from 'react';
import { Epreuve, Discipline } from '../types';
import { Plus, X, Trash2, Activity, Settings2, Map, Clock } from 'lucide-react';
import { useEpreuves } from '../firestoreHooks';

const ACTIVITIES = [
  { id: 'trail', name: 'Trail', modalities: ['Jalonné', 'Orientation', 'Road Book'] },
  { id: 'vtt', name: 'VTT', modalities: ['Jalonné', 'Orientation', 'Road Book'] },
  { id: 'kayak', name: 'Kayak', modalities: ['Jalonné', 'Orientation'] },
  { id: 'precision', name: 'Activité de Précision', modalities: ['Laser', 'Palets', 'Arcs', 'Sarbacane'] },
  { id: 'autre', name: 'Autre...', modalities: [] }
];

interface ConfigurationTabProps {
  onTriggerImport: () => void;
}

export function ConfigurationTab({ onTriggerImport }: ConfigurationTabProps) {
  const { epreuves, addEpreuve, updateEpreuve, deleteEpreuve } = useEpreuves();

  const [newEpreuveName, setNewEpreuveName] = useState('');
  const [newDisciplineInputs, setNewDisciplineInputs] = useState<Record<string, string>>({});
  
  const [selectedEpreuveId, setSelectedEpreuveId] = useState<string | null>(null);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string | null>(null);

  const handleAddEpreuve = async () => {
    if (!newEpreuveName.trim()) return;
    const newId = crypto.randomUUID();
    await addEpreuve({ id: newId, name: newEpreuveName.trim(), disciplines: [] });
    setNewEpreuveName('');
    setSelectedEpreuveId(newId);
    setSelectedDisciplineId(null);
  };

  const handleDeleteEpreuve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(selectedEpreuveId === id) {
       setSelectedEpreuveId(null);
       setSelectedDisciplineId(null);
    }
    await deleteEpreuve(id);
  };

  const handleAddDiscipline = async (epreuveId: string, e: React.FormEvent) => {
    e.preventDefault();
    const val = newDisciplineInputs[epreuveId];
    if (!val || !val.trim()) return;
    
    const ep = epreuves.find(e => e.id === epreuveId);
    if (ep) {
        const newDiscId = crypto.randomUUID();
        await updateEpreuve({
          ...ep,
          disciplines: [...ep.disciplines, { id: newDiscId, name: val.trim() }]
        });
        setSelectedEpreuveId(epreuveId);
        setSelectedDisciplineId(newDiscId);
    }
    setNewDisciplineInputs({ ...newDisciplineInputs, [epreuveId]: '' });
  };

  const handleDeleteDiscipline = async (epreuveId: string, discId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ep = epreuves.find(e => e.id === epreuveId);
    if (ep) {
        if(selectedDisciplineId === discId) setSelectedDisciplineId(null);
        await updateEpreuve({
          ...ep,
          disciplines: ep.disciplines.filter(d => d.id !== discId)
        });
    }
  };

  const handleUpdateDiscipline = async (epreuveId: string, updatedDisc: any) => {
    const ep = epreuves.find(e => e.id === epreuveId);
    if (ep) {
        await updateEpreuve({
          ...ep,
          disciplines: ep.disciplines.map(d => d.id === updatedDisc.id ? updatedDisc : d)
        });
    }
  };

  const selectedEpreuve = epreuves.find(e => e.id === selectedEpreuveId);
  const selectedDiscipline = selectedEpreuve?.disciplines.find(d => d.id === selectedDisciplineId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Left Column: Explorer */}
      <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-4 border-r border-slate-100">
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Map className="h-4 w-4 text-emerald-500" />
          Construction de la course
        </h3>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={newEpreuveName}
            onChange={(e) => setNewEpreuveName(e.target.value)}
            placeholder="Nouvelle épreuve..."
            className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleAddEpreuve()}
          />
          <button 
            onClick={handleAddEpreuve}
            className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Ajouter"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 mt-2">
          {epreuves.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Aucune épreuve configurée.<br/>Ajoutez votre première course.
            </p>
          ) : (
            epreuves.map(epreuve => (
              <div key={epreuve.id} className="flex flex-col">
                <div 
                  onClick={() => { setSelectedEpreuveId(epreuve.id); setSelectedDisciplineId(null); }}
                  className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-colors border ${
                     selectedEpreuveId === epreuve.id && !selectedDisciplineId 
                       ? 'bg-emerald-50 border-emerald-200' 
                       : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-slate-800 text-sm">{epreuve.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => handleDeleteEpreuve(epreuve.id, e)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col pl-4 mt-1 space-y-1">
                  {epreuve.disciplines.map(d => (
                    <div 
                      key={d.id}
                      onClick={() => { setSelectedEpreuveId(epreuve.id); setSelectedDisciplineId(d.id); }}
                      className={`flex justify-between items-center p-2 rounded-lg cursor-pointer text-xs transition-colors border-l-2 ${
                        selectedDisciplineId === d.id
                          ? 'bg-slate-100 border-indigo-400 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                         <div className="flex items-center gap-2">
                           <span>{d.name}</span>
                           {d.isCO && <span className="bg-orange-100 text-orange-700 px-1 py-0.5 rounded-[4px] text-[9px] uppercase font-bold tracking-wider">CO</span>}
                         </div>
                         {(d.activityType || d.modality) && (
                            <span className="text-[10px] text-slate-400">
                              {ACTIVITIES.find(a => a.id === d.activityType)?.name || d.activityType}
                              {d.modality && ` - ${d.modality}`}
                            </span>
                         )}
                      </div>
                      <button onClick={(e) => handleDeleteDiscipline(epreuve.id, d.id, e)} className="text-slate-300 hover:text-red-500 p-0.5" title="Supprimer discipline">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  <form onSubmit={(e) => handleAddDiscipline(epreuve.id, e)} className="flex items-center gap-2 mt-1">
                     <span className="text-slate-300 ml-1">↳</span>
                     <input 
                       type="text"
                       placeholder="Ajouter discipline..."
                       value={newDisciplineInputs[epreuve.id] || ''}
                       onChange={(e) => setNewDisciplineInputs({...newDisciplineInputs, [epreuve.id]: e.target.value})}
                       className="flex-1 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-emerald-500"
                     />
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: Configuration Area */}
      <div className="lg:col-span-8 h-full overflow-y-auto pl-2">
        {!selectedEpreuveId && !selectedDisciplineId ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <Settings2 className="h-12 w-12 text-slate-200 mb-4" />
             <p>Sélectionnez une épreuve ou une discipline pour la configurer.</p>
          </div>
        ) : selectedDiscipline ? (
          /* Discipline Configuration */
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              Configuration: <span className="text-emerald-700">{selectedDiscipline.name}</span>
            </h3>

            <div className="space-y-6">
              {/* Type de discipline */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Activité</label>
                    <select
                      value={selectedDiscipline.activityType || ''}
                      onChange={(e) => {
                        const newActivity = e.target.value;
                        handleUpdateDiscipline(selectedEpreuveId, {
                          ...selectedDiscipline, 
                          activityType: newActivity, 
                          modality: '' // reset modality when activity changes
                        });
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-700"
                    >
                      <option value="">Sélectionner...</option>
                      {ACTIVITIES.map(act => (
                        <option key={act.id} value={act.id}>{act.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Modalité</label>
                    <select
                      value={selectedDiscipline.modality || ''}
                      onChange={(e) => {
                        const newModality = e.target.value;
                        const autoIsCO = newModality === 'Orientation' ? true : selectedDiscipline.isCO;
                        handleUpdateDiscipline(selectedEpreuveId, {...selectedDiscipline, modality: newModality, isCO: autoIsCO});
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-slate-700 disabled:opacity-50"
                      disabled={!selectedDiscipline.activityType}
                    >
                      <option value="">Sélectionner...</option>
                      {selectedDiscipline.activityType && ACTIVITIES.find(a => a.id === selectedDiscipline.activityType)?.modalities.map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                      <option value="Autre">Autre...</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <input 
                    type="checkbox" 
                    id={`co-${selectedDiscipline.id}`}
                    checked={!!selectedDiscipline.isCO} 
                    onChange={(e) => handleUpdateDiscipline(selectedEpreuveId, {...selectedDiscipline, isCO: e.target.checked})}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600 focus:ring-2"
                  />
                  <label htmlFor={`co-${selectedDiscipline.id}`} className="font-bold text-slate-700 cursor-pointer text-sm">
                    Cette discipline comporte une course d'orientation (CO)
                  </label>
                </div>
              </div>

              {selectedDiscipline.isCO && (
                <div className="bg-orange-50/50 p-5 rounded-xl border border-orange-100 shadow-sm space-y-4">
                  <h4 className="font-bold text-orange-800 text-sm">Mode de validation des balises</h4>
                  
                  <div className="space-y-2">
                     <select 
                       value={selectedDiscipline.coOrderMode || 'free'}
                       onChange={(e) => handleUpdateDiscipline(selectedEpreuveId, {...selectedDiscipline, coOrderMode: e.target.value})}
                       className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-sm font-semibold text-slate-700"
                     >
                       <option value="free">Ordre Libre (N'importe quel ordre pour toutes les balises)</option>
                       <option value="imposed">Ordre Imposé (Suivi strict du parcours)</option>
                       <option value="grouped">Par Groupes (Blocs imposés, choix libre entre blocs)</option>
                     </select>
                     
                     <div className="pt-2">
                       <label className="text-xs font-bold text-orange-600 block mb-1">
                         {selectedDiscipline.coOrderMode === 'grouped' 
                            ? 'Configuration des blocs (ex: 31>32>33 | 41>42)' 
                            : 'Liste des balises attendues (séparées par virgule, ex: 31, 32, 33)'}
                       </label>
                       <input 
                         type="text" 
                         value={selectedDiscipline.coStations || ''}
                         onChange={(e) => handleUpdateDiscipline(selectedEpreuveId, {...selectedDiscipline, coStations: e.target.value})}
                         placeholder={selectedDiscipline.coOrderMode === 'grouped' ? '31>32>33 | 41>42' : '31, 32, 33'}
                         className="w-full px-3 py-2 bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono text-sm"
                       />
                     </div>
                  </div>
                </div>
              )}

              {/* Segments configuration */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-700 text-sm">Traces / Segments (Classements spécifiques)</h4>
                    <button
                       onClick={() => {
                          const newSeg = { id: crypto.randomUUID(), name: '', startStation: '', endStation: '' };
                          handleUpdateDiscipline(selectedEpreuveId, {...selectedDiscipline, segments: [...(selectedDiscipline.segments || []), newSeg]});
                       }}
                       className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      + Ajouter Segment
                    </button>
                 </div>

                 <div className="space-y-3">
                   {(selectedDiscipline.segments || []).length === 0 ? (
                     <div className="text-xs text-slate-400 italic">Aucun segment configuré pour cette discipline.</div>
                   ) : (
                     (selectedDiscipline.segments || []).map(seg => (
                       <div key={seg.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                         <input 
                           placeholder="Nom (ex: Segment Strava)"
                           value={seg.name}
                           onChange={(e) => {
                             const newSegs = selectedDiscipline.segments!.map(s => s.id === seg.id ? {...s, name: e.target.value} : s);
                             handleUpdateDiscipline(selectedEpreuveId, {...selectedDiscipline, segments: newSegs});
                           }}
                           className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500"
                         />
                         <div className="flex items-center gap-2">
                           <input 
                             placeholder="Départ"
                             value={seg.startStation}
                             onChange={(e) => {
                               const newSegs = selectedDiscipline.segments!.map(s => s.id === seg.id ? {...s, startStation: e.target.value} : s);
                               handleUpdateDiscipline(selectedEpreuveId, {...selectedDiscipline, segments: newSegs});
                             }}
                             className="w-20 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none text-center font-mono placeholder:font-sans"
                           />
                           <span className="text-slate-400">→</span>
                           <input 
                             placeholder="Arrivée"
                             value={seg.endStation}
                             onChange={(e) => {
                               const newSegs = selectedDiscipline.segments!.map(s => s.id === seg.id ? {...s, endStation: e.target.value} : s);
                               handleUpdateDiscipline(selectedEpreuveId, {...selectedDiscipline, segments: newSegs});
                             }}
                             className="w-20 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none text-center font-mono placeholder:font-sans"
                           />
                           <button 
                             onClick={() => {
                               const newSegs = selectedDiscipline.segments!.filter(s => s.id !== seg.id);
                               handleUpdateDiscipline(selectedEpreuveId, {...selectedDiscipline, segments: newSegs});
                             }}
                             className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-md hover:bg-slate-100"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
              </div>

            </div>
          </div>
        ) : selectedEpreuve ? (
          /* Epreuve Configuration */
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              Épreuve: <span className="text-emerald-700">{selectedEpreuve.name}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Station de Départ Global</label>
                <input 
                  type="text" 
                  value={selectedEpreuve.startStation || ''} 
                  onChange={(e) => updateEpreuve({...selectedEpreuve, startStation: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  placeholder="Ex: 31"
                />
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Station d'Arrivée Globale</label>
                <input 
                  type="text" 
                  value={selectedEpreuve.endStation || ''} 
                  onChange={(e) => updateEpreuve({...selectedEpreuve, endStation: e.target.value})}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  placeholder="Ex: 99"
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <h4 className="font-bold text-sm tracking-wide">Gels du Temps (Neutralisations)</h4>
                </div>
                <button
                  onClick={() => {
                    const newNeut = { id: crypto.randomUUID(), name: '', startStation: '', endStation: '' };
                    updateEpreuve({ ...selectedEpreuve, neutralizations: [...(selectedEpreuve.neutralizations || []), newNeut] });
                  }}
                  className="text-xs font-bold bg-orange-100 text-orange-800 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors"
                >
                  + Ajouter un gel
                </button>
              </div>
              
              <div className="space-y-3">
                {(selectedEpreuve.neutralizations || []).length === 0 ? (
                  <div className="text-xs text-slate-400 italic">Aucune période de gel du chronométrage.</div>
                ) : (
                  (selectedEpreuve.neutralizations || []).map(neut => (
                    <div key={neut.id} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-orange-50/30 p-2.5 rounded-lg border border-orange-100">
                      <input 
                        placeholder="Ex: Traversée route"
                        value={neut.name}
                        onChange={(e) => {
                          const newNeuts = selectedEpreuve.neutralizations!.map(n => n.id === neut.id ? {...n, name: e.target.value} : n);
                          updateEpreuve({...selectedEpreuve, neutralizations: newNeuts});
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-white border border-orange-200 rounded-md focus:outline-none focus:border-orange-500 font-medium text-slate-700"
                      />
                      <div className="flex items-center gap-2">
                        <input 
                          placeholder="Début"
                          value={neut.startStation}
                          onChange={(e) => {
                            const newNeuts = selectedEpreuve.neutralizations!.map(n => n.id === neut.id ? {...n, startStation: e.target.value} : n);
                            updateEpreuve({...selectedEpreuve, neutralizations: newNeuts});
                          }}
                          className="w-20 px-3 py-1.5 text-sm bg-white border border-orange-200 rounded-md focus:outline-none text-center font-mono"
                        />
                        <span className="text-orange-300 font-bold">→</span>
                        <input 
                          placeholder="Fin"
                          value={neut.endStation}
                          onChange={(e) => {
                            const newNeuts = selectedEpreuve.neutralizations!.map(n => n.id === neut.id ? {...n, endStation: e.target.value} : n);
                            updateEpreuve({...selectedEpreuve, neutralizations: newNeuts});
                          }}
                          className="w-20 px-3 py-1.5 text-sm bg-white border border-orange-200 rounded-md focus:outline-none text-center font-mono"
                        />
                        <button 
                          onClick={() => {
                            const newNeuts = selectedEpreuve.neutralizations!.filter(n => n.id !== neut.id);
                            updateEpreuve({...selectedEpreuve, neutralizations: newNeuts});
                          }}
                          className="p-1.5 text-orange-400 hover:text-red-500 transition-colors rounded-md hover:bg-orange-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
