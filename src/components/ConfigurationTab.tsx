import React, { useState, useEffect, useCallback } from 'react';
import { Epreuve, Discipline, SpecialSegment } from '../types';
import { Plus, Trash2, Map, Clock, ArrowRight, Settings2, Target, MoveVertical, Activity, CheckCircle2, GripVertical } from 'lucide-react';
import { useEpreuves } from '../firestoreHooks';
import { generateId } from '../utils';
import debounce from 'lodash/debounce';

const ACTIVITIES = [
  { id: 'trail', name: 'Trail', modalities: ['Jalonné', 'Orientation', 'Road Book'] },
  { id: 'vtt', name: 'VTT', modalities: ['Jalonné', 'Orientation', 'Road Book'] },
  { id: 'kayak', name: 'Kayak', modalities: ['Jalonné', 'Orientation'] },
  { id: 'precision', name: 'Précision', modalities: ['Laser', 'Palets', 'Arcs', 'Sarbacane'] },
  { id: 'autre', name: 'Autre...', modalities: [] }
];

interface ConfigurationTabProps {
  onTriggerImport: () => void;
}

export function ConfigurationTab({ onTriggerImport }: ConfigurationTabProps) {
  const { epreuves, addEpreuve, updateEpreuve, deleteEpreuve } = useEpreuves();
  const [selectedEpreuveId, setSelectedEpreuveId] = useState<string | null>(null);
  
  // Local state for fast typing without lag
  const [draft, setDraft] = useState<Epreuve | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync from DB to Draft ONLY when switching epreuves or initial load
  useEffect(() => {
    const ep = epreuves.find(e => e.id === selectedEpreuveId);
    if (!ep) {
        setDraft(null);
    } else if (!draft || draft.id !== ep.id) {
        setDraft(ep);
    }
  }, [selectedEpreuveId, epreuves]);

  // Debounced save
  const saveDraft = useCallback(
    debounce(async (epToSave: Epreuve) => {
      setIsSaving(true);
      try {
          await updateEpreuve(epToSave);
      } finally {
          setTimeout(() => setIsSaving(false), 500); // Visual feedback duration
      }
    }, 800),
    [updateEpreuve]
  );

  const updateDraft = (updates: Partial<Epreuve>) => {
    if (!draft) return;
    const newDraft = { ...draft, ...updates };
    setDraft(newDraft);
    saveDraft(newDraft);
  };

  const handleCreateEpreuve = async () => {
    const newId = generateId();
    await addEpreuve({ id: newId, name: 'Nouvelle course', disciplines: [] });
    setSelectedEpreuveId(newId);
  };

  const handleDeleteEpreuve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Êtes-vous sûr de vouloir supprimer cette épreuve ?")) {
        if (selectedEpreuveId === id) {
            setSelectedEpreuveId(null);
            setDraft(null);
        }
        await deleteEpreuve(id);
    }
  };

  // Section Handlers
  const handleAddDiscipline = () => {
    if (!draft) return;
    const newDisc: Discipline = { id: generateId(), name: `Section ${draft.disciplines.length + 1}` };
    updateDraft({ disciplines: [...draft.disciplines, newDisc] });
  };

  const handleUpdateDiscipline = (discId: string, updates: Partial<Discipline>) => {
    if (!draft) return;
    const newDisciplines = draft.disciplines.map(d => d.id === discId ? { ...d, ...updates } : d);
    updateDraft({ disciplines: newDisciplines });
  };

  const handleDeleteDiscipline = (discId: string) => {
    if (!draft) return;
    if (confirm("Supprimer cette section ?")) {
        const newDisciplines = draft.disciplines.filter(d => d.id !== discId);
        updateDraft({ disciplines: newDisciplines });
    }
  };

  return (
    <div className="flex h-full min-h-0 bg-slate-50 border border-slate-200 shadow-sm rounded-3xl overflow-hidden relative">
      
      {/* Sidebar - Liste des épreuves */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 relative z-20">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                <Map className="h-5 w-5 text-emerald-500" />
                Vos Parcours
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Gérez les différentes courses</p>
          </div>
          <button 
            onClick={handleCreateEpreuve}
            className="text-white bg-emerald-500 hover:bg-emerald-600 transition-colors p-2 rounded-xl shadow-sm hover:shadow active:scale-95"
            title="Créer une épreuve"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {epreuves.length === 0 ? (
            <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
              <Activity className="h-8 w-8 mx-auto mb-3 text-slate-300" />
              Aucun parcours. Créez votre première épreuve pour commencer.
            </div>
          ) : (
            epreuves.map(epreuve => (
              <div 
                key={epreuve.id}
                onClick={() => setSelectedEpreuveId(epreuve.id)}
                className={`group relative flex flex-col p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                  selectedEpreuveId === epreuve.id 
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50 shadow-sm hover:shadow'
                }`}
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h4 className={`font-black text-base line-clamp-1 ${selectedEpreuveId === epreuve.id ? 'text-emerald-900' : 'text-slate-800'}`}>
                    {epreuve.name}
                  </h4>
                  <button 
                    onClick={(e) => handleDeleteEpreuve(epreuve.id, e)} 
                    className={`p-1.5 rounded-lg transition-all shrink-0 ${
                        selectedEpreuveId === epreuve.id 
                            ? 'text-emerald-400 hover:text-red-500 hover:bg-white'
                            : 'text-slate-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                        {epreuve.disciplines?.length || 0} section(s)
                    </span>
                    {(epreuve.startStation || epreuve.endStation) && (
                        <span className="text-[10px] text-slate-400 font-mono">
                            {epreuve.startStation || '?'} → {epreuve.endStation || '?'}
                        </span>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Area - Éditeur de parcours */}
      <div className="flex-[2] flex flex-col min-w-0 bg-slate-100/50 relative overflow-hidden">
        {/* Save Status Bar (Absolute top right) */}
        {draft && (
            <div className="absolute top-6 right-8 z-50 flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 shadow-sm
                    ${isSaving ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}
                >
                    {isSaving ? (
                        <>
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Sauvegarde en cours...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-3 w-3" />
                            Modifications enregistrées
                        </>
                    )}
                </span>
            </div>
        )}

        {!draft ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-sm w-full">
                 <Settings2 className="h-16 w-16 text-emerald-100 mx-auto mb-4" />
                 <p className="text-xl font-bold text-slate-700 mb-2">Sélectionnez un parcours</p>
                 <p className="text-sm text-slate-500">ou créez-en un nouveau depuis la barre latérale.</p>
             </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 w-full">
            <div className="max-w-4xl mx-auto space-y-8 pb-32">
              
              {/* Header de l'épreuve */}
              <div className="flex flex-col bg-white p-6 md:p-8 border border-slate-200 rounded-3xl shadow-sm">
                <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2 block">Nom du parcours</label>
                <input 
                  type="text" 
                  value={draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  placeholder="Ex: Raid Aventure 30km"
                  className="w-full text-3xl md:text-4xl font-black text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-300 p-0 truncate"
                />
              </div>

              {/* Paramètres Globaux */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/80 p-5 px-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                      <Target className="h-5 w-5" />
                  </div>
                  <div>
                      <h3 className="font-black text-slate-800 text-lg">Configuration Globale</h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Paramètrez les balises qui encadrent toute l'épreuve.</p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Le grand départ (Balise)</label>
                    <input 
                      type="text" 
                      value={draft.startStation || ''} 
                      onChange={(e) => updateDraft({ startStation: e.target.value })}
                      className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold text-slate-700"
                      placeholder="Ex: 31"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">L'arrivée finale (Balise)</label>
                    <input 
                      type="text" 
                      value={draft.endStation || ''} 
                      onChange={(e) => updateDraft({ endStation: e.target.value })}
                      className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold text-slate-700"
                      placeholder="Ex: 99"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Points de passage (Checkpoints)</label>
                    <input 
                      type="text" 
                      value={draft.checkpoints || ''} 
                      onChange={(e) => updateDraft({ checkpoints: e.target.value })}
                      className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono font-bold text-slate-700"
                      placeholder="Ex: 40,41,45"
                    />
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Séparez les balises par des virgules.</p>
                  </div>
                </div>
              </div>

              {/* Gels du temps */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                 <div className="bg-slate-50/80 p-5 px-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-lg">Neutralisations (Temps mort)</h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Sections où le chronomètre est désactivé (route, portage).</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newNeut = { id: generateId(), name: '', startStation: '', endStation: '' };
                      updateDraft({ neutralizations: [...(draft.neutralizations || []), newNeut] });
                    }}
                    className="shrink-0 text-sm font-bold bg-orange-50 text-orange-700 border border-orange-200 py-2 px-4 rounded-xl hover:bg-orange-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Ajouter un gel
                  </button>
                </div>
                <div className="p-6">
                  {(draft.neutralizations || []).length === 0 ? (
                    <div className="text-sm font-medium text-slate-400 bg-slate-50 p-6 rounded-2xl border border-slate-200 border-dashed text-center">
                      Aucune zone de neutralisation du temps n'a été ajoutée.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(draft.neutralizations || []).map(neut => (
                        <div key={neut.id} className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 p-4 rounded-2xl shadow-sm">
                          <div className="flex-[2]">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nom du gel</label>
                              <input 
                                placeholder="Ex: Traversée de route"
                                value={neut.name}
                                onChange={(e) => {
                                  const newNeuts = draft.neutralizations!.map(n => n.id === neut.id ? {...n, name: e.target.value} : n);
                                  updateDraft({ neutralizations: newNeuts });
                                }}
                                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-bold text-slate-700"
                              />
                          </div>
                          <div className="flex items-center gap-2 flex-grow">
                            <div className="flex-1 min-w-[70px]">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 text-center">Début</label>
                                <input 
                                  placeholder="Balise"
                                  value={neut.startStation}
                                  onChange={(e) => {
                                    const newNeuts = draft.neutralizations!.map(n => n.id === neut.id ? {...n, startStation: e.target.value} : n);
                                    updateDraft({ neutralizations: newNeuts });
                                  }}
                                  className="w-full px-2 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-center font-mono font-bold text-slate-700 placeholder:font-sans"
                                />
                            </div>
                            <ArrowRight className="h-5 w-5 text-slate-300 mt-4 shrink-0" />
                            <div className="flex-1 min-w-[70px]">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 text-center">Fin</label>
                                <input 
                                  placeholder="Balise"
                                  value={neut.endStation}
                                  onChange={(e) => {
                                    const newNeuts = draft.neutralizations!.map(n => n.id === neut.id ? {...n, endStation: e.target.value} : n);
                                    updateDraft({ neutralizations: newNeuts });
                                  }}
                                  className="w-full px-2 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-center font-mono font-bold text-slate-700 placeholder:font-sans"
                                />
                            </div>
                            <div className="pt-4 ml-2">
                                <button 
                                  onClick={() => {
                                    const newNeuts = draft.neutralizations!.filter(n => n.id !== neut.id);
                                    updateDraft({ neutralizations: newNeuts });
                                  }}
                                  className="p-2.5 text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all rounded-xl shadow-sm shrink-0"
                                  title="Supprimer la neutralisation"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Déroulé de l'épreuve */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 mt-12 bg-emerald-500 text-white p-6 rounded-3xl shadow-sm gap-4">
                  <div>
                      <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                        <MoveVertical className="h-8 w-8 opacity-80" />
                        Composition du Parcours
                      </h2>
                      <p className="text-emerald-100 font-medium mt-1 text-sm">Créez l'enchaînement des activités dans l'ordre chronologique</p>
                  </div>
                  <button 
                      onClick={handleAddDiscipline}
                      className="px-5 py-3 bg-white text-emerald-700 font-black rounded-xl shadow-sm hover:shadow transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
                  >
                      <Plus className="h-5 w-5" /> Ajouter une section
                  </button>
                </div>

                <div className="relative space-y-8 pl-0 lg:pl-[42px] max-w-full">
                  {/* Ligne verticale de liaison */}
                  <div className="absolute left-[20px] top-6 bottom-6 w-1 bg-emerald-200 rounded-full hidden lg:block"></div>

                  {draft.disciplines.length === 0 ? (
                    <div className="text-center py-16 bg-white border-2 border-slate-200 border-dashed rounded-3xl text-slate-500 font-medium">
                        <Map className="h-12 w-12 mx-auto mb-4 text-emerald-200" />
                        Le parcours est vide.<br/> Ajoutez des sections pour commencer votre tracé.
                        <button 
                            onClick={handleAddDiscipline}
                            className="mt-6 mx-auto px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-600 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" /> Créer la 1ère section
                        </button>
                    </div>
                  ) : (
                    draft.disciplines.map((disc, index) => (
                      <div key={disc.id} className="relative z-10 flex flex-col lg:flex-row gap-4 group">
                        
                        {/* Numéro de section (Badge) */}
                        <div className="hidden lg:flex flex-col items-center pt-6 relative shrink-0 absolute -left-[42px]">
                          <div className="w-12 h-12 rounded-2xl bg-white border-4 border-emerald-500 flex items-center justify-center font-black text-xl text-emerald-600 shadow-md relative z-10">
                            {index + 1}
                          </div>
                        </div>

                        {/* Carte de la section */}
                        <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden transition-all focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 max-w-full">
                          
                          {/* En-tête de section */}
                          <div className="bg-slate-50/80 p-5 px-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full">
                              <span className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-black shrink-0">{index + 1}</span>
                              <input
                                value={disc.name}
                                onChange={(e) => handleUpdateDiscipline(disc.id, { name: e.target.value })}
                                placeholder="Nom de la section..."
                                className="flex-1 font-black text-xl text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-300 p-0 w-full"
                              />
                            </div>
                            <button
                              onClick={() => handleDeleteDiscipline(disc.id)}
                              className="text-slate-400 hover:text-red-600 p-2.5 rounded-xl hover:bg-red-50 hover:border-red-200 border border-transparent transition-all shrink-0 sm:ml-4 bg-white sm:bg-transparent shadow-sm sm:shadow-none"
                              title="Supprimer la section"
                            >
                              <Trash2 className="h-5 w-5" />
                              <span className="sm:hidden font-bold ml-2">Supprimer section</span>
                            </button>
                          </div>

                          {/* Configuration body */}
                          <div className="p-4 sm:p-6 md:p-8 space-y-8">
                            
                            {/* Type & Modality */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-100">
                              <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Activité</label>
                                <select
                                  value={disc.activityType || ''}
                                  onChange={(e) => {
                                    handleUpdateDiscipline(disc.id, {
                                      activityType: e.target.value, 
                                      modality: ''
                                    });
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base font-bold text-slate-800 transition-colors shadow-sm"
                                >
                                  <option value="" disabled>Sélectionner une activité...</option>
                                  {ACTIVITIES.map(act => (
                                    <option key={act.id} value={act.id}>{act.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Modalité</label>
                                <select
                                  value={disc.modality || ''}
                                  onChange={(e) => {
                                    const newModality = e.target.value;
                                    handleUpdateDiscipline(disc.id, { modality: newModality });
                                  }}
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-base font-bold text-slate-800 transition-colors disabled:opacity-50 disabled:bg-slate-50 shadow-sm"
                                  disabled={!disc.activityType}
                                >
                                  <option value="" disabled>Sélectionner une modalité...</option>
                                  {disc.activityType && ACTIVITIES.find(a => a.id === disc.activityType)?.modalities.map(mod => (
                                    <option key={mod} value={mod}>{mod}</option>
                                  ))}
                                  <option value="Autre">Autre modalité...</option>
                                </select>
                              </div>
                            </div>

                            {/* Configuration Course d'Orientation (CO) */}
                            <div className="border border-orange-200 bg-orange-50/50 rounded-2xl overflow-hidden relative shadow-sm">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-400"></div>
                                
                                <label className="p-5 sm:p-6 border-b border-orange-100 flex items-start sm:items-center gap-4 cursor-pointer hover:bg-orange-50 transition-colors">
                                  <input 
                                      type="checkbox" 
                                      checked={!!disc.isCO} 
                                      onChange={(e) => handleUpdateDiscipline(disc.id, { isCO: e.target.checked })}
                                      className="w-6 h-6 mt-1 sm:mt-0 text-orange-500 rounded-lg border-orange-300 focus:ring-orange-500 focus:ring-2 transition-all cursor-pointer"
                                  />
                                  <div className="flex-1 select-none">
                                      <span className="font-black text-slate-800 text-lg block">Course d'Orientation (CO)</span>
                                      <span className="text-sm text-slate-600 font-medium">Activer cette option pour accéder aux paramètres avancés (ordre, balises...).</span>
                                  </div>
                                </label>

                                {disc.isCO && (
                                  <div className="p-5 sm:p-6 bg-white space-y-6">
                                    <div>
                                      <label className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-2">Mode de circuit</label>
                                      <select 
                                        value={disc.coOrderMode || 'free'}
                                        onChange={(e) => handleUpdateDiscipline(disc.id, { coOrderMode: e.target.value as any })}
                                        className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-base font-bold text-slate-800 shadow-sm"
                                      >
                                        <option value="free">Ordre Libre (ordre au choix)</option>
                                        <option value="imposed">Ordre Imposé (chemin strict balise par balise)</option>
                                        <option value="grouped">Par Groupes (blocs imposés, parcours libre entre les blocs)</option>
                                      </select>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                      <div className="md:col-span-1">
                                        <label className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-2" title="Peut être différent du nombre saisi si des balises sont optionnelles">Nb total visé</label>
                                        <input 
                                          type="number" 
                                          value={disc.coCount || ''}
                                          onChange={(e) => handleUpdateDiscipline(disc.id, { coCount: parseInt(e.target.value, 10) || undefined })}
                                          placeholder="Ex: 5"
                                          min="0"
                                          className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono font-bold text-lg text-slate-700 shadow-sm"
                                        />
                                      </div>
                                      <div className="md:col-span-3">
                                        <label className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-2">
                                          {disc.coOrderMode === 'grouped' 
                                            ? 'Découpage des Blocs' 
                                            : 'Liste des Balises'}
                                        </label>
                                        <input 
                                          type="text" 
                                          value={disc.coStations || ''}
                                          onChange={(e) => handleUpdateDiscipline(disc.id, { coStations: e.target.value })}
                                          placeholder={disc.coOrderMode === 'grouped' ? '31>32>33 | 41>42' : '31, 32, 33, 34'}
                                          className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono font-bold text-lg text-slate-700 shadow-sm"
                                        />
                                        {disc.coOrderMode === 'grouped' ? (
                                          <p className="text-xs font-semibold text-orange-600/70 mt-2">
                                            Séparez les balises d'un bloc par <code className="bg-orange-100 text-orange-800 px-1 py-0.5 rounded">&gt;</code> et les blocs par <code className="bg-orange-100 text-orange-800 px-1 py-0.5 rounded">|</code>
                                          </p>
                                        ) : (
                                          <p className="text-xs font-semibold text-orange-600/70 mt-2">
                                            Séparez par des virgules (,).
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>

                            {/* Sous-segments (Classement spécifique) */}
                            <div>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-t border-slate-100 pt-8 gap-4">
                                <div>
                                  <h4 className="font-black text-slate-800 text-lg">Segments chronométrés</h4>
                                  <p className="text-xs text-slate-500 font-medium mt-0.5">Extraire un classement spécifique (Ex: sprint montagne).</p>
                                </div>
                                <button
                                  onClick={() => {
                                    const newSeg = { id: generateId(), name: '', startStation: '', endStation: '' };
                                    handleUpdateDiscipline(disc.id, { segments: [...(disc.segments || []), newSeg] });
                                  }}
                                  className="shrink-0 text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2"
                                >
                                  <Plus className="h-4 w-4" /> Ajouter
                                </button>
                              </div>

                              <div className="space-y-4">
                                {(disc.segments || []).length === 0 ? (
                                  <div className="bg-slate-50 rounded-xl border border-slate-200 border-dashed p-6 text-center text-sm font-medium text-slate-400">
                                    Aucun segment défini pour cette section.
                                  </div>
                                ) : (
                                  (disc.segments || []).map(seg => (
                                    <div key={seg.id} className="flex flex-col lg:flex-row lg:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative lg:pl-10">
                                      <GripVertical className="h-5 w-5 text-slate-300 absolute left-3 top-6 lg:top-1/2 lg:-translate-y-1/2 hidden lg:block" />
                                      
                                      <div className="flex-[2]">
                                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nom du segment</label>
                                          <input 
                                            placeholder="Ex: Ascension du col"
                                            value={seg.name}
                                            onChange={(e) => {
                                              const newSegs = disc.segments!.map(s => s.id === seg.id ? {...s, name: e.target.value} : s);
                                              handleUpdateDiscipline(disc.id, { segments: newSegs });
                                            }}
                                            className="w-full px-3 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                          />
                                      </div>
                                      <div className="flex items-center gap-2 flex-grow">
                                        <div className="flex-1 min-w-[70px]">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 text-center">Départ</label>
                                            <input 
                                              placeholder="Balise"
                                              value={seg.startStation}
                                              onChange={(e) => {
                                                const newSegs = disc.segments!.map(s => s.id === seg.id ? {...s, startStation: e.target.value} : s);
                                                handleUpdateDiscipline(disc.id, { segments: newSegs });
                                              }}
                                              className="w-full px-2 py-2.5 text-sm font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-center focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-slate-300 mt-4 shrink-0" />
                                        <div className="flex-1 min-w-[70px]">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 text-center">Arrivée</label>
                                            <input 
                                              placeholder="Balise"
                                              value={seg.endStation}
                                              onChange={(e) => {
                                                const newSegs = disc.segments!.map(s => s.id === seg.id ? {...s, endStation: e.target.value} : s);
                                                handleUpdateDiscipline(disc.id, { segments: newSegs });
                                              }}
                                              className="w-full px-2 py-2.5 text-sm font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl text-center focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                        <div className="pt-4 ml-2">
                                            <button 
                                              onClick={() => {
                                                const newSegs = disc.segments!.filter(s => s.id !== seg.id);
                                                handleUpdateDiscipline(disc.id, { segments: newSegs });
                                              }}
                                              className="p-3 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 transition-colors rounded-xl border border-slate-200 hover:border-red-200 shadow-sm shrink-0"
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Bouton Ajouter Section Principal (Seulement si des sections existent déjà) */}
                  {draft.disciplines.length > 0 && (
                      <div className="relative z-10 flex lg:ml-2 pt-2">
                        <button 
                          onClick={handleAddDiscipline}
                          className="w-full lg:w-auto px-8 py-5 bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-black text-lg rounded-2xl shadow-sm transition-all focus:ring-4 focus:ring-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                          <Plus className="h-6 w-6" />
                          Ajouter la section {draft.disciplines.length + 1}
                        </button>
                      </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
