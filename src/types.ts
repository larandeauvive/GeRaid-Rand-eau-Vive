export interface Competitor {
  id: string;
  bib: string; // Dossard
  firstName: string;
  lastName: string;
  category: string;
  epreuve: string;
  chipNumber: string; // Numéro de puce SportIdent
  club: string;
}

export interface FrameLog {
  id: string;
  timestamp: Date;
  hexData: string;
  rawData: Uint8Array;
}
