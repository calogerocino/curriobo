export interface CurrioProgetto {
  id?: string;
  immagineUrl?: string;
  titolo: string;
  descrizione: string;
  tags?: string[];
  linkProgetto?: string;
}

export interface CurrioEsperienza {
  id?: string;
  titolo: string;
  tipo: 'lavoro' | 'formazione';
  aziendaScuola: string;
  date: string;
  descrizioneBreve: string;
  dettagli?: string[];
  competenzeAcquisite?: string[];
  expanded?: boolean;
}

export interface CurrioCompetenza {
  id?: string;
  nome: string;
  livello?: string;
  icona?: string;
}

export interface CurrioLingua {
  id?: string;
  nome: string;
  livello: string;
  certificazione: boolean;
}

export interface AltreCompetenze {
  softSkills?: string[];
  lingue?: CurrioLingua[];
}

export interface CurrioContatti {
  email?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
}
export interface DatiClienteCurrio {
  nome: string;
  email: string;
}

export interface Currio {
  id: string;
  nomePortfolio: string;
  heroTitle: string;
  heroSubtitle: string;
  progetti?: CurrioProgetto[];
  esperienze?: CurrioEsperienza[];
  competenze?: CurrioCompetenza[];
  altreCompetenze?: AltreCompetenze;
  chiSonoFotoUrl?: string;
  chiSonoDescrizione1?: string;
  chiSonoDescrizione2?: string;
  contatti?: CurrioContatti;
  curriculumUrl?: string;
  linguaDefault?: 'it' | 'en';
  templateScelto?: 'modern' | 'vintage' | 'classic';
  userId?: string;
  status?: 'nuova_richiesta' | 'invito_spedito' | 'attivo' | 'archiviato';
  datiCliente?: DatiClienteCurrio;
  tokenRegistrazione?: string;
  tokenRegistrazioneScadenza?: number;
}
