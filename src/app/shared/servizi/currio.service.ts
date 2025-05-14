// src/app/shared/servizi/currio.service.ts
import { Currio } from '../models/currio.model';
import { CurrioSubmission } from '../models/currio-submission.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CurrioService {
  private currioDbPath = 'currios'; // Path in Firebase per i Currio

  constructor(private readonly http: HttpClient) {}

  getCurrios(): Observable<Currio[]> {
    return this.http
      .get<{ [key: string]: Omit<Currio, 'id'> }>( // Tipizzazione per la risposta da RTDB
        `${environment.firebase.databaseURL}/${this.currioDbPath}.json`
      )
      .pipe(
        map((data) => {
          const currios: Currio[] = [];
          if (data) {
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                currios.push({ ...(data[key] as any), id: key }); // Aggiunge l'ID (chiave) all'oggetto
              }
            }
          }
          return currios;
        })
      );
  }

    getCurrioById(id: string): Observable<Currio | undefined> { // Modifica il tipo restituito
    return this.http
      .get<Omit<Currio, 'id'> | null>(`${environment.firebase.databaseURL}/${this.currioDbPath}/${id}.json`)
      .pipe(
        map(data => {
            if (data === null) { // Gestisci esplicitamente il caso null da Firebase
              console.warn(`[CurrioService] Nessun dato trovato per l'ID Curriò: ${id}. Restituisco undefined.`);
              return undefined; // Restituisci undefined se nessun dato viene trovato
            }
            // Se data non è null, procedi a mappare i dati come prima
            const currioFromDb = data as any; // Cast ad any per flessibilità con i dati parziali
            return {
                id: id,
                nomePortfolio: currioFromDb.nomePortfolio || '',
                heroTitle: currioFromDb.heroTitle || '',
                heroSubtitle: currioFromDb.heroSubtitle || '',
                contatti: currioFromDb.contatti || {},
                progetti: currioFromDb.progetti || [],
                esperienze: currioFromDb.esperienze || [],
                competenze: currioFromDb.competenze || [],
                chiSonoFotoUrl: currioFromDb.chiSonoFotoUrl || '',
                chiSonoDescrizione1: currioFromDb.chiSonoDescrizione1 || '',
                chiSonoDescrizione2: currioFromDb.chiSonoDescrizione2 || '',
                curriculumUrl: currioFromDb.curriculumUrl || undefined,
                linguaDefault: currioFromDb.linguaDefault || 'it',
                templateScelto: currioFromDb.templateScelto || undefined,
                userId: currioFromDb.userId || undefined,
                status: currioFromDb.status || 'nuova_richiesta',
                datiCliente: currioFromDb.datiCliente || undefined,
                tokenRegistrazione: currioFromDb.tokenRegistrazione || undefined,
                tokenRegistrazioneScadenza: currioFromDb.tokenRegistrazioneScadenza || undefined,
            } as Currio;
        })
      );
  }

  createCurrio(currioData: Omit<Currio, 'id'>): Observable<{ name: string }> { // Firebase RTDB restituisce un oggetto con la chiave 'name' (l'ID generato)
    return this.http.post<{ name: string }>(
      `${environment.firebase.databaseURL}/${this.currioDbPath}.json`, // Aggiungi .json per RTDB
      currioData
    );
  }

  updateCurrio(currio: Currio): Observable<any> {
    const { id, ...currioDataFromModel } = currio;

    // Creiamo un oggetto pulito per il PATCH, convertendo undefined in null
    // per i campi che vogliamo esplicitamente rimuovere o resettare in RTDB.
    const dataForPatch: { [key: string]: any } = {};

    // Itera sulle proprietà del modello Currio passato
    for (const key in currioDataFromModel) {
      if (currioDataFromModel.hasOwnProperty(key)) {
        const modelKey = key as keyof typeof currioDataFromModel;
        const value = currioDataFromModel[modelKey];
        // Se il valore è undefined, lo impostiamo a null per RTDB (per cancellare il campo)
        // Altrimenti, usiamo il valore così com'è.
        dataForPatch[modelKey] = value === undefined ? null : value;
      }
    }

    // Assicurati che i campi specifici da nullificare siano gestiti correttamente
    // se erano undefined nel modello `currio` originale.
    // La logica sopra dovrebbe già coprire questo, ma per chiarezza:
    if (currio.tokenRegistrazione === undefined) {
        dataForPatch['tokenRegistrazione'] = null;
    }
    if (currio.tokenRegistrazioneScadenza === undefined) {
        dataForPatch['tokenRegistrazioneScadenza'] = null;
    }

    // Se alcuni campi non devono MAI essere null e hanno un default, assicurati che siano presenti
    // Esempio: se status non è in currioDataFromModel, ma deve essere inviato
    if (dataForPatch['status'] === undefined && currio.status) {
        dataForPatch['status'] = currio.status;
    }
    if (dataForPatch['userId'] === undefined && currio.userId) {
        dataForPatch['userId'] = currio.userId;
    }


    console.log(`[CurrioService] Aggiornamento RTDB per currio ID: ${id} con payload:`, JSON.parse(JSON.stringify(dataForPatch)));

    return this.http.patch(
      `${environment.firebase.databaseURL}/${this.currioDbPath}/${id}.json`,
      dataForPatch
    );
  }

  deleteCurrio(id: string): Observable<any> {
    return this.http.delete(
      `${environment.firebase.databaseURL}/${this.currioDbPath}/${id}.json`
    );
  }

  getCurrioSubmissions(): Observable<CurrioSubmission[]> {
    return this.http
      .get<{ [key: string]: Omit<CurrioSubmission, 'id'> }>(
        `${environment.firebase.databaseURL}/currioSubmissions.json`
      )
      .pipe(
        map((data) => {
          const submissions: CurrioSubmission[] = [];
          if (data) {
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                submissions.push({ ...data[key], id: key });
              }
            }
          }
          return submissions;
        })
      );
  }
}
