export type ValidationType = 'ORDRE_IMPOSE' | 'SCORE_LIBRE' | 'NEUTRALISATION';

export type StatutEquipe = 'CLASSE' | 'NC' | 'ABANDON' | 'ABSENT';

export interface Raid {
  nom: string;
  categories: string[];
  heureZero: string; // Format: "HH:mm:ss"
}

export interface Epreuve {
  id: string;
  nom: string;
  baliseDebut: number;
  baliseFin: number;
  coefficient: number;
  typeValidation: ValidationType;
  postesTheoriques: number[];
  penaliteTemps: number; // en secondes
  penalitePoints: number;
}

export interface Etape {
  id: string;
  nom: string;
  barriereHoraire: number; // en secondes (temps max autorisé)
  epreuves: Epreuve[];
}

export interface Equipe {
  dossard: number;
  nom: string;
  categorie: string;
  puces: number[];
  statut: StatutEquipe;
}

export interface Punch {
  code: number;
  time: number; // timestamp absolu en ms ou secondes, ou relatif
}

/**
 * 3. Algorithme : Heure Zéro & Passage de minuit
 * Convertit l'heure de passage brute en secondes et l'heure zéro de la course en secondes.
 * Gère le passage de minuit sur 24h.
 * 
 * @param tBrut - L'heure de passage brute (secondes depuis minuit)
 * @param tZero - L'heure zéro de la course (secondes depuis minuit)
 * @returns Le temps relatif de course en secondes
 */
export function calageHeureZero(tBrut: number, tZero: number): number {
  if (tBrut < tZero) {
    return tBrut - tZero + 86400;
  }
  return tBrut - tZero;
}

/**
 * Helper : Convertit une chaîne "HH:mm:ss" en secondes depuis minuit.
 */
export function stringTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 3600 + m * 60 + s;
}

export interface ResultatEpreuve {
  tempsEpreuveSec: number;     // Temps de l'épreuve après coef
  tempsNeutraliseSec: number;  // Si l'épreuve est une neutralisation
  tempsPenalitesSec: number;
  pointsPenalites: number;
  postesManquants: number[];
}

/**
 * 4 & 5. Algorithme : Chronométrage de Section (Gating) & Vérification des Balises
 */
export function validerEpreuve(epreuve: Epreuve, punches: Punch[]): ResultatEpreuve {
  const indexDebut = punches.findIndex(p => p.code === epreuve.baliseDebut);
  // findLastIndex pour prendre le dernier passage à la balise de fin
  const indexFin = [...punches].reverse().findIndex(p => p.code === epreuve.baliseFin);
  const realIndexFin = indexFin !== -1 ? punches.length - 1 - indexFin : -1;

  if (indexDebut === -1 || realIndexFin === -1 || realIndexFin < indexDebut) {
    // Balises de gating manquantes ou incohérentes (fin avant début)
    return {
      tempsEpreuveSec: 0,
      tempsNeutraliseSec: 0,
      tempsPenalitesSec: 0,
      pointsPenalites: 0,
      postesManquants: epreuve.postesTheoriques, // Tout est manquant
    };
  }

  const timeDebut = punches[indexDebut].time;
  const timeFin = punches[realIndexFin].time;
  const deltaTemps = timeFin - timeDebut;

  let tempsEpreuveSec = deltaTemps * epreuve.coefficient;
  let tempsNeutraliseSec = 0;

  if (epreuve.typeValidation === 'NEUTRALISATION') {
    tempsNeutraliseSec = deltaTemps; // Ce temps devra être soustrait du temps total
    tempsEpreuveSec = 0; // L'épreuve elle-même ne compte pas dans le chrono
  }

  // Vérification des Balises (Postes Manquants)
  const sectionPunches = punches.slice(indexDebut, realIndexFin + 1);
  const sectionCodes = sectionPunches.map(p => p.code);
  const postesManquants: number[] = [];
  let tempsPenalitesSec = 0;
  let pointsPenalites = 0;

  if (epreuve.typeValidation === 'ORDRE_IMPOSE') {
    let searchIndex = 0;
    for (const posteTheorique of epreuve.postesTheoriques) {
      const foundIdx = sectionCodes.indexOf(posteTheorique, searchIndex);
      if (foundIdx !== -1) {
        searchIndex = foundIdx + 1;
      } else {
        postesManquants.push(posteTheorique);
        tempsPenalitesSec += epreuve.penaliteTemps;
        pointsPenalites += epreuve.penalitePoints;
      }
    }
  } else if (epreuve.typeValidation === 'SCORE_LIBRE' || epreuve.typeValidation === 'NEUTRALISATION') {
    const presentSet = new Set(sectionCodes);
    for (const posteTheorique of epreuve.postesTheoriques) {
      if (!presentSet.has(posteTheorique)) {
        postesManquants.push(posteTheorique);
        tempsPenalitesSec += epreuve.penaliteTemps;
        pointsPenalites += epreuve.penalitePoints;
      }
    }
  }

  return {
    tempsEpreuveSec,
    tempsNeutraliseSec,
    tempsPenalitesSec,
    pointsPenalites,
    postesManquants,
  };
}

/**
 * 6. Algorithme : Barrières Horaires
 * Si le temps total de course dépasse la barrière, applique une pénalité par tranche entamée.
 */
export function verifierBarriereHoraire(
  tempsTotalEquipeSec: number, 
  etape: Etape, 
  pasTrancheSec: number = 60, // ex: par minute
  penaliteParTrancheSec: number = 300 // ex: 5 min de pénalité par minute de retard
): number {
  if (tempsTotalEquipeSec > etape.barriereHoraire) {
    const retard = tempsTotalEquipeSec - etape.barriereHoraire;
    const tranches = Math.floor(retard / pasTrancheSec) + 1; // Toute tranche entamée est due
    return tranches * penaliteParTrancheSec;
  }
  return 0;
}
