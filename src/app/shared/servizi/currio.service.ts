// src/app/shared/servizi/currio.service.ts
import { Currio } from '../models/currio.model';
import { CurrioSubmission } from '../models/currio-submission.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Storage, ref as storageRefFn, deleteObject } from '@angular/fire/storage'; // Importa Storage v9

@Injectable({
  providedIn: 'root',
})
export class CurrioService {
  private currioDbPath = 'currios';

  constructor(
    private readonly http: HttpClient,
    private readonly storage: Storage // Inietta Storage v9
  ) {}

  getCurrios(): Observable<Currio[]> {
    return this.http
      .get<{ [key: string]: Omit<Currio, 'id'> }>(
        `${environment.firebase.databaseURL}/${this.currioDbPath}.json`
      )
      .pipe(
        map((data) => {
          const currios: Currio[] = [];
          if (data) {
            for (const key in data) {
              if (data.hasOwnProperty(key)) {
                currios.push({ ...(data[key] as any), id: key });
              }
            }
          }
          return currios;
        })
      );
  }

  getCurrioById(id: string): Observable<Currio | undefined> {
    return this.http
      .get<Omit<Currio, 'id'> | null>(`${environment.firebase.databaseURL}/${this.currioDbPath}/${id}.json`)
      .pipe(
        map(data => {
            if (data === null) {
              console.warn(`[CurrioService] Nessun dato trovato per l'ID Curriò: ${id}. Restituisco undefined.`);
              return undefined;
            }

            const currioFromDb = data as any;
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

  createCurrio(currioData: Omit<Currio, 'id'>): Observable<{ name: string }> {
    return this.http.post<{ name: string }>(
      `${environment.firebase.databaseURL}/${this.currioDbPath}.json`,
      currioData
    );
  }

  updateCurrio(currio: Currio): Observable<any> {
    const { id, ...currioDataFromModel } = currio;

    const dataForPatch: { [key: string]: any } = {};

    for (const key in currioDataFromModel) {
      if (currioDataFromModel.hasOwnProperty(key)) {
        const modelKey = key as keyof typeof currioDataFromModel;
        const value = currioDataFromModel[modelKey];
        dataForPatch[modelKey] = value === undefined ? null : value;
      }
    }

    if (currio.tokenRegistrazione === undefined) {
        dataForPatch['tokenRegistrazione'] = null;
    }
    if (currio.tokenRegistrazioneScadenza === undefined) {
        dataForPatch['tokenRegistrazioneScadenza'] = null;
    }

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

  /**
   * Elimina un file da Firebase Storage dato il suo URL completo.
   * @param fileUrl L'URL HTTPS del file in Firebase Storage.
   * @returns Promise che si risolve se l'eliminazione ha successo o se il file non esiste, altrimenti rigetta.
   */
  async deleteFileByUrl(fileUrl: string): Promise<void> {
    if (!fileUrl || !fileUrl.startsWith('https://firebasestorage.googleapis.com/')) {
      console.warn(`[CurrioService.deleteFileByUrl] URL non valido o non di Firebase Storage: ${fileUrl}`);
      return Promise.resolve(); // Non è un URL di storage valido, non fare nulla
    }
    try {
      const fileRef = storageRefFn(this.storage, fileUrl); // Crea il riferimento usando l'URL completo
      await deleteObject(fileRef);
      console.log(`[CurrioService.deleteFileByUrl] File eliminato con successo da Storage: ${fileUrl}`);
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        console.warn(`[CurrioService.deleteFileByUrl] File non trovato in Storage (potrebbe essere già stato eliminato): ${fileUrl}`);
        // Considera questo come un successo parziale, il file non c'è più.
      } else {
        console.error(`[CurrioService.deleteFileByUrl] Errore durante l'eliminazione del file ${fileUrl} da Firebase Storage:`, error);
        throw error; // Rilancia l'errore per essere gestito dall'effect
      }
    }
  }
}
