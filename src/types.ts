export interface Discipline {
  id: string;
  name: string;
}

export interface Epreuve {
  id: string;
  name: string;
  disciplines: Discipline[];
}

export interface Competitor {
  id: string;
  bib: string; // Dossard
  firstName: string;
  lastName: string;
  category: string;
  epreuve: string;
  epreuveId?: string; // Opt
  chipNumber: string; // Numéro de puce SportIdent
  club: string;
}

export interface FrameLog {
  id: string;
  timestamp: Date;
  hexData: string;
  rawData: Uint8Array;
}
