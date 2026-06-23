export interface SpecialSegment {
  id: string;
  name: string;
  startStation: string;
  endStation: string;
}

export interface Discipline {
  id: string;
  name: string;
  startStation?: string;
  endStation?: string;
  isMassStart?: boolean;
  startTime?: string;
  activityType?: string;
  modality?: string;
  isCO?: boolean; // if true, exposes CO specific configuration
  coCount?: number; // nombre de balises
  coOrderMode?: 'imposed' | 'free' | 'grouped';
  coStations?: string; // used to store station configuration, ex: "31, 32, 33" or groups like "31>32>33 | 41>42>43"
  segments?: SpecialSegment[]; // Custom segments/traces
}

export interface Epreuve {
  id: string;
  name: string;
  isMassStart?: boolean;
  startStation?: string;
  endStation?: string;
  startTime?: string;
  checkpoints?: string; // Liste des points de passage (CSV)
  disciplines: Discipline[];
  neutralizations?: SpecialSegment[];
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
  stationNumber?: string;
  chipNumber?: string;
  punchTime?: Date;
}
