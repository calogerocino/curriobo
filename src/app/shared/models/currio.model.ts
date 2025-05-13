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
  // Altri dati inviati inizialmente, se ce ne sono
}

export interface Currio {
  id: string; // ID univoco, gestito da Firebase o altro backend
  nomePortfolio: string; // Es. "Curriò di Calogero"
  heroTitle: string;
  heroSubtitle: string;
  progetti?: CurrioProgetto[];
  esperienze?: CurrioEsperienza[];
  competenze?: CurrioCompetenza[];
  chiSonoFotoUrl?: string;
  chiSonoDescrizione1?: string;
  chiSonoDescrizione2?: string;
  contatti?: CurrioContatti; // Contatti pubblici del Curriò
  curriculumUrl?: string;
  linguaDefault?: 'it' | 'en'; // Esempio
  templateScelto?: string; // Se vuoi permettere diversi template

  // --- NUOVI CAMPI PER IL FLUSSO DI REGISTRAZIONE ---
  userId?: string; // UID dell'utente Firebase Auth dopo che si è registrato
  status?: 'nuova_richiesta' | 'invito_inviato' | 'attivo' | 'archiviato'; // Stato del currio/richiesta
  datiCliente?: DatiClienteCurrio; // Dati iniziali forniti dal cliente per la registrazione
  tokenRegistrazione?: string; // Token univoco per il link di registrazione
  tokenRegistrazioneScadenza?: number; // Timestamp (millisecondi Epoch) per la scadenza del token
}
