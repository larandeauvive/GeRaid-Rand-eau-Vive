import React, { useState } from 'react';
import { useEpreuves, useCompetitors, useFrameLogs } from '../firestoreHooks';
import { Epreuve, Competitor } from '../types';
import { Clock, Play, Save } from 'lucide-react';
import { format } from 'date-fns';

export function RaceTab() {
  const { epreuves, updateEpreuve } = useEpreuves();
  const { competitors } = useCompetitors();
  const { logs } = useFrameLogs();
  
  const [selectedEpreuveId, setSelectedEpreuveId] = useState<string>('');
  
  const selectedEpreuve = epreuves.find(e => e.id === selectedEpreuveId);

  const handleUpdateStartTime = async (timeStr: string) => {
    if (!selectedEpreuve) return;
    await updateEpreuve({ ...selectedEpreuve, startTime: timeStr });
  };

  const handleSetCurrentTime = async () => {
    if (!selectedEpreuve) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    await updateEpreuve({ ...selectedEpreuve, startTime: timeStr });
  };

  const formatTimeDiff = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    if(totalSeconds < 0) return '???';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if(h > 0) return `${h}h ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const getCompetitorChrono = (comp: Competitor, ep: Epreuve) => {
    if (!ep || !ep.startStation || !ep.endStation) return { totalChronoMs: 0, totalChronoStr: '-', frozenStr: null, status: 'En attente' };
    
    let startTimeMs: number | null = null;
    
    // Si heure de départ globale (ex: départ groupé général)
    if (ep.startTime) {
      const [hours, minutes, seconds] = ep.startTime.split(':').map(Number);
      const today = new Date();
      today.setHours(hours, minutes, seconds || 0, 0);
      startTimeMs = today.getTime();
    } else {
      const startLog = logs.find(l => l.chipNumber === comp.chipNumber && l.stationNumber === ep.startStation);
      if (startLog && startLog.punchTime) {
        startTimeMs = startLog.punchTime.getTime();
      }
    }
    
    const endLog = logs.find(l => l.chipNumber === comp.chipNumber && l.stationNumber === ep.endStation);
    
    if (startTimeMs && endLog && endLog.punchTime) {
      let diff = endLog.punchTime.getTime() - startTimeMs;
      let frozenMs = 0;
      
      if (ep.neutralizations) {
         ep.neutralizations.forEach(neut => {
            const nStartLog = logs.find(l => l.chipNumber === comp.chipNumber && l.stationNumber === neut.startStation);
            const nEndLog = logs.find(l => l.chipNumber === comp.chipNumber && l.stationNumber === neut.endStation);
            if (nStartLog && nEndLog && nStartLog.punchTime && nEndLog.punchTime) {
                if (nStartLog.punchTime.getTime() >= startTimeMs! && nEndLog.punchTime.getTime() <= endLog.punchTime!.getTime()) {
                    const nDiff = nEndLog.punchTime.getTime() - nStartLog.punchTime.getTime();
                    if (nDiff > 0) {
                        diff -= nDiff;
                        frozenMs += nDiff;
                    }
                }
            }
         });
      }
      return { 
        totalChronoMs: diff,
        totalChronoStr: formatTimeDiff(diff), 
        frozenStr: frozenMs > 0 ? formatTimeDiff(frozenMs) : null,
        status: 'Terminé'
      };
    }
    
    if (startTimeMs) {
      const nowMs = new Date().getTime();
      return { 
          totalChronoMs: nowMs - startTimeMs,
          totalChronoStr: formatTimeDiff(nowMs - startTimeMs) + ' (En cours)', 
          frozenStr: null,
          status: 'En course'
      };
    }
    
    return { totalChronoMs: 0, totalChronoStr: 'En attente', frozenStr: null, status: 'En attente' };
  };

  const getCompetitorSegments = (comp: Competitor, ep: Epreuve) => {
    if (!ep) return [];
    
    const segmentsList: {name: string, chrono: string}[] = [];
    ep.disciplines.forEach(d => {
       // Chrono de la discipline entière (section)
       let discStartTimeMs: number | null = null;
       
       if (d.isMassStart && d.startTime) {
         const [hours, minutes, seconds] = d.startTime.split(':').map(Number);
         const today = new Date();
         today.setHours(hours, minutes, seconds || 0, 0);
         discStartTimeMs = today.getTime();
       } else if (d.startStation) {
         const startLog = logs.find(l => l.chipNumber === comp.chipNumber && l.stationNumber === d.startStation);
         if (startLog && startLog.punchTime) {
             discStartTimeMs = startLog.punchTime.getTime();
         }
       }

       if (d.endStation) {
           const endLog = logs.find(l => l.chipNumber === comp.chipNumber && l.stationNumber === d.endStation);
           if (discStartTimeMs && endLog && endLog.punchTime) {
               const diff = endLog.punchTime.getTime() - discStartTimeMs;
               segmentsList.push({ name: d.name, chrono: formatTimeDiff(diff) });
           } else if (discStartTimeMs) {
               segmentsList.push({ name: d.name, chrono: 'En cours...' });
           }
       }

       // Chrono des sous-segments spécifiques
       if (d.segments) {
         d.segments.forEach(seg => {
           const startLog = logs.find(l => l.chipNumber === comp.chipNumber && l.stationNumber === seg.startStation);
           const endLog = logs.find(l => l.chipNumber === comp.chipNumber && l.stationNumber === seg.endStation);
           if (startLog && endLog && startLog.punchTime && endLog.punchTime) {
               const diff = endLog.punchTime.getTime() - startLog.punchTime.getTime();
               segmentsList.push({ name: seg.name, chrono: formatTimeDiff(diff) });
           } else if (startLog) {
               segmentsList.push({ name: seg.name, chrono: 'En cours...' });
           }
         });
       }
    });
    return segmentsList;
  };

  const getCompetitorCheckpoints = (comp: Competitor, ep: Epreuve) => {
    if (!ep || !ep.checkpoints) return [];
    
    const cps = ep.checkpoints.split(',').map(s => s.trim()).filter(s => s);
    const cpList: {station: string, time: string}[] = [];
    
    cps.forEach(cp => {
       const log = logs.find(l => l.chipNumber === comp.chipNumber && l.stationNumber === cp);
       if (log && log.punchTime) {
           cpList.push({ station: cp, time: format(log.punchTime, 'HH:mm:ss') });
       }
    });
    
    return cpList;
  };

  // Filter competitors by selected Epreuve
  const filteredCompetitors = selectedEpreuve 
    ? competitors.filter(c => c.epreuve === selectedEpreuve.name)
    : [];

  // Sort competitors (Finished first, then by time, then In Progress, then Waiting)
  const rankedCompetitors = [...filteredCompetitors].sort((a, b) => {
      const chronoA = getCompetitorChrono(a, selectedEpreuve!);
      const chronoB = getCompetitorChrono(b, selectedEpreuve!);
      
      if (chronoA.status === 'Terminé' && chronoB.status === 'Terminé') {
          return chronoA.totalChronoMs - chronoB.totalChronoMs;
      }
      if (chronoA.status === 'Terminé') return -1;
      if (chronoB.status === 'Terminé') return 1;
      
      if (chronoA.status === 'En course' && chronoB.status === 'En course') {
          return chronoB.totalChronoMs - chronoA.totalChronoMs; // longest in course first
      }
      if (chronoA.status === 'En course') return -1;
      if (chronoB.status === 'En course') return 1;
      
      return 0;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <div className="w-full sm:w-1/3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Sélectionner une course</label>
            <select
                value={selectedEpreuveId}
                onChange={(e) => setSelectedEpreuveId(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold text-slate-700 shadow-sm transition-all"
            >
                <option value="" disabled>Choisir un parcours...</option>
                {epreuves.map(ep => (
                    <option key={ep.id} value={ep.id}>{ep.name}</option>
                ))}
            </select>
        </div>
        
        {selectedEpreuve && (
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 w-full sm:w-auto p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm">
            <div>
              <label className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-2">Heure de départ globale</label>
              <input 
                type="time" 
                step="1"
                value={selectedEpreuve.startTime || ''} 
                onChange={(e) => handleUpdateStartTime(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 text-sm bg-emerald-50 border border-emerald-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold text-emerald-900"
              />
            </div>
            <button 
              onClick={handleSetCurrentTime}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <Play className="h-4 w-4" /> Top Départ
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-0">
        {!selectedEpreuveId ? (
            <div className="flex items-center justify-center h-full text-slate-400 p-8 font-medium">
                Veuillez sélectionner un parcours pour voir la course.
            </div>
        ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                <tr className="text-[10px] text-slate-500 uppercase">
                  <th className="py-4 px-4 font-bold">Cls.</th>
                  <th className="py-4 px-4 font-bold">Dos.</th>
                  <th className="py-4 px-4 font-bold">Concurrent</th>
                  <th className="py-4 px-4 font-bold text-right">Chrono Global</th>
                  <th className="py-4 px-4 font-bold">Segments (Sections)</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {rankedCompetitors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-medium border-t border-slate-50">
                      Aucun concurrent inscrit à cette épreuve.
                    </td>
                  </tr>
                ) : (
                  rankedCompetitors.map((comp, idx) => {
                    const chrono = getCompetitorChrono(comp, selectedEpreuve);
                    const segments = getCompetitorSegments(comp, selectedEpreuve);
                    
                    return (
                      <tr key={comp.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors group">
                        <td className="px-4 py-4 font-bold text-slate-800">
                          {chrono.status === 'Terminé' ? `#${idx + 1}` : '-'}
                        </td>
                        <td className="px-4 py-4 font-mono text-slate-500">{comp.bib}</td>
                        <td className="px-4 py-4">
                            <div className="font-bold text-slate-800">{comp.lastName?.toUpperCase()} {comp.firstName}</div>
                            <div className="text-xs text-slate-500 font-mono flex items-center gap-2">Puce: {comp.chipNumber}</div>
                        </td>
                        <td className="px-4 py-4 text-right">
                           <div className={`font-mono font-black text-lg ${chrono.status === 'Terminé' ? 'text-emerald-600' : chrono.status === 'En course' ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`}>
                             {chrono.totalChronoStr}
                           </div>
                           {chrono.frozenStr && (
                             <div className="text-[10px] text-orange-500 font-bold mt-1">
                               (- {chrono.frozenStr} arrêt)
                             </div>
                           )}
                           <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">{chrono.status}</div>
                        </td>
                        <td className="px-4 py-4">
                           {segments.length > 0 ? (
                             <div className="flex flex-wrap gap-2 mb-2">
                               {segments.map((seg, sIdx) => (
                                 <div key={sIdx} className="flex flex-col bg-white border border-slate-200 px-2 py-1.5 rounded-lg shadow-sm">
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{seg.name}</span>
                                   <span className="font-mono text-xs font-bold text-slate-700">{seg.chrono}</span>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="text-xs text-slate-400 italic mb-2">Aucun segment</div>
                           )}
                           
                           {getCompetitorCheckpoints(comp, selectedEpreuve).length > 0 && (
                             <div className="flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                               {getCompetitorCheckpoints(comp, selectedEpreuve).map((cp, cpIdx) => (
                                  <div key={cpIdx} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-1.5 py-1 rounded text-[10px]">
                                      <span className="font-bold text-indigo-400 uppercase">CP {cp.station}</span>
                                      <span className="font-mono text-indigo-700 font-bold">{cp.time}</span>
                                  </div>
                               ))}
                             </div>
                           )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
}
