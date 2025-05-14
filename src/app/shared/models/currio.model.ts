// src/app/shared/models/currio.model.ts

// Importa Timestamp se decidi di usarlo per la scadenza
// import firebase from 'firebase/compat/app'; // Per versioni più vecchie o
// import { Timestamp } from '@angular/fire/firestore'; // Per la nuova API modulare se usi Firestore direttamente

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

// Struttura per i dati del cliente inviati dalla landing page
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
  chiSonoFotoUrl?: string;
  chiSonoDescrizione1?: string;
  chiSonoDescrizione2?: string;
  contatti?: CurrioContatti;
  curriculumUrl?: string;
  linguaDefault?: 'it' | 'en';
  templateScelto?: string;
  userId?: string; // UID dell'utente Firebase Auth
  status?: 'nuova_richiesta' | 'invito_spedito' | 'attivo' | 'archiviato'; // Stato
  datiCliente?: DatiClienteCurrio; // Dati iniziali per la registrazione
  tokenRegistrazione?: string; // Token per il link di registrazione
  tokenRegistrazioneScadenza?: number; // Timestamp di scadenza del token
}
