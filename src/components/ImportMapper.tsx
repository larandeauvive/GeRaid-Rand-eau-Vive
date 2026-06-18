import { useState, useEffect } from 'react';
import { Target, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { Competitor } from '../types';
import { generateId } from '../utils';

interface ImportMapperProps {
  headers: string[];
  data: any[];
  onConfirm: (competitors: Competitor[]) => void;
  onCancel: () => void;
}

const TARGET_FIELDS = [
  { key: 'bib', label: 'Dossard', required: true, guesses: ['dossard', 'bib', 'n°', 'num', 'numero'] },
  { key: 'chipNumber', label: 'Puce SI', required: true, guesses: ['puce', 'si', 'chip', 'sicard'] },
  { key: 'lastName', label: 'Nom', required: true, guesses: ['nom', 'lastname', 'name'] },
  { key: 'firstName', label: 'Prénom', required: false, guesses: ['prenom', 'prénom', 'firstname'] },
  { key: 'epreuve', label: 'Épreuve', required: false, guesses: ['epreuve', 'course', 'race', 'circuit'] },
  { key: 'category', label: 'Catégorie', required: false, guesses: ['categorie', 'catégorie', 'cat'] },
  { key: 'club', label: 'Club / Équipe', required: false, guesses: ['club', 'equipe', 'team'] },
];

export function ImportMapper({ headers, data, onConfirm, onCancel }: ImportMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialMapping: Record<string, string> = {};
    const normalizedHeaders = headers.map(h => ({ original: h, normalized: h.toLowerCase().trim() }));

    TARGET_FIELDS.forEach(field => {
      const match = normalizedHeaders.find(h => field.guesses.some(g => h.normalized.includes(g)));
      if (match) {
        initialMapping[field.key] = match.original;
      }
    });
    setMapping(initialMapping);
  }, [headers]);

  const handleSelectChange = (key: string, value: string) => {
    setMapping(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    const newCompetitors: Competitor[] = data
      .filter(row => Object.keys(row).length > 0 && row[mapping['bib']] && row[mapping['lastName']])
      .map(row => ({
        id: generateId(),
        bib: row[mapping['bib']] || '',
        chipNumber: row[mapping['chipNumber']] || '',
        lastName: row[mapping['lastName']] || '',
        firstName: row[mapping['firstName']] || '',
        epreuve: row[mapping['epreuve']] || '',
        category: row[mapping['category']] || '',
        club: row[mapping['club']] || '',
      }));
    onConfirm(newCompetitors);
  };

  const sampleRow = data.length > 0 ? data[0] : null;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            Vérification de l'import : Mapping des Colonnes
          </h3>
          <p className="text-sm text-slate-500 mt-1">Associez les colonnes de votre fichier CSV aux champs de la course.</p>
        </div>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-sm border border-emerald-100">
          {data.length} lignes détectées
        </div>
      </div>

      <div className="flex-1 overflow-auto -mx-2 px-2">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 rounded-t-xl">
            <tr>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tl-xl border-b border-slate-100">Champ Système</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Statut</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Colonne CSV</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase tracking-wider rounded-tr-xl border-b border-slate-100">Valeur (Ligne 1)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TARGET_FIELDS.map(field => {
              const mappedColumn = mapping[field.key];
              const isMapped = !!mappedColumn;
              const hasError = field.required && !isMapped;
              
              return (
                <tr key={field.key} className={hasError ? "bg-red-50/50" : "bg-white hover:bg-slate-50"}>
                  <td className="p-3">
                    <span className="font-semibold text-slate-700">{field.label}</span>
                    {field.required && <span className="text-red-500 ml-1" title="Requis">*</span>}
                  </td>
                  <td className="p-3">
                    {hasError ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : isMapped ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <span className="text-xs text-slate-400 font-medium border border-slate-200 px-2 py-0.5 rounded">Optionnel</span>
                    )}
                  </td>
                  <td className="p-3">
                    <select
                      value={mappedColumn || ''}
                      onChange={(e) => handleSelectChange(field.key, e.target.value)}
                      className={`w-full max-w-xs p-2 text-sm bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${hasError ? 'border-red-300 bg-white' : 'border-slate-200'}`}
                    >
                      <option value="">Sélectionnez une colonne...</option>
                      {headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 font-mono text-sm text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]" title={sampleRow && mappedColumn ? sampleRow[mappedColumn] : ''}>
                    {sampleRow && mappedColumn ? sampleRow[mappedColumn] : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
        <button
          onClick={onCancel}
          className="px-4 py-2 font-bold text-sm bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleConfirm}
          disabled={TARGET_FIELDS.filter(f => f.required).some(f => !mapping[f.key])}
          className="px-6 py-2 font-bold text-sm bg-slate-900 text-white rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          Valider et Importer
        </button>
      </div>
    </div>
  );
}
