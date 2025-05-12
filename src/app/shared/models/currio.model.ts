// Sostituisci il contenuto di src/app/shared/models/currio.model.ts (che attualmente definisce 'Event')
// con la seguente struttura per 'Currio'.

export interface CurrioProgetto {
  id?: string;
  immagineUrl?: string;
  titolo: string;
  descrizione: string;
  tags?: string[];
  linkProgetto?: string; // Link al repository o demo
}

export interface CurrioEsperienza {
  id?: string;
  titolo: string;
  tipo: 'lavoro' | 'formazione'; // Per distinguere tra esperienza lavorativa e formativa
  aziendaScuola: string;
  date: string; // Es. "Marzo 2022 - Oggi"
  descrizioneBreve: string;
  dettagli?: string[]; // Per i punti elenco espandibili
  competenzeAcquisite?: string[];
}

export interface CurrioCompetenza {
  id?: string;
  nome: string;
  livello?: string; // Es. "Avanzato", "Intermedio" (opzionale)
  icona?: string; // Opzionale, per rappresentazione grafica
}

export interface CurrioContatti {
  email?: string;
  github?: string;
  linkedin?: string;
  instagram?: string; // E altri social
}

export interface Currio {
  id: string; // ID univoco, gestito da Firebase o altro backend
  userId?: string; // ID dell'utente che ha creato il Currio
  nomePortfolio: string; // Es. "Curriò di Calogero"
  heroTitle: string;
  heroSubtitle: string;
  progetti?: CurrioProgetto[];
  esperienze?: CurrioEsperienza[];
  competenze?: CurrioCompetenza[];
  chiSonoFotoUrl?: string;
  chiSonoDescrizione1?: string;
  chiSonoDescrizione2?: string;
  contatti?: CurrioContatti;
  // Aggiungi qui altri campi necessari, come dataCreazione, dataUltimaModifica, linguaDefault etc.
  linguaDefault?: 'it' | 'en'; // Esempio
  templateScelto?: string; // Se vuoi permettere diversi template
}
