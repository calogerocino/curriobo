// Rinomina il file in currio.service.ts e la classe in CurrioService
// src/app/shared/servizi/currio.service.ts
import { Currio } from '../models/currio.model'; // Usa il modello corretto
import { CurrioSubmission } from '../models/currio-submission.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CurrioService { // Rinomina da EventsService
  private currioDbPath = 'currios'; // Path in Firebase per i Currio

  constructor(private readonly http: HttpClient) {}

  // Metodi CRUD per i Currio
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
                currios.push({ ...data[key], id: key } as Currio); // Cast a Currio
              }
            }
          }
          return currios;
        })
      );
  }

  getCurrioById(id: string): Observable<Currio> { // Nuovo metodo
    return this.http
      .get<Omit<Currio, 'id'>>(`${environment.firebase.databaseURL}/${this.currioDbPath}/${id}.json`)
      .pipe(
        map(data => ({ ...data, id } as Currio))
      );
  }

  createCurrio(currioData: Omit<Currio, 'id'>): Observable<{ name: string }> { // Per Firebase che restituisce l'ID in 'name'
    return this.http.post<{ name: string }>(
      `${environment.firebase.databaseURL}/${this.currioDbPath}.json`,
      currioData
    );
  }

  updateCurrio(currio: Currio): Observable<any> { // Firebase patch non restituisce il corpo
    const { id, ...currioData } = currio; // Separa l'ID dal resto dei dati
    return this.http.patch(
      `${environment.firebase.databaseURL}/${this.currioDbPath}/${id}.json`,
      currioData
    );
  }

  deleteCurrio(id: string): Observable<any> {
    return this.http.delete(
      `${environment.firebase.databaseURL}/${this.currioDbPath}/${id}.json`
    );
  }

  // Metodo per CurrioSubmissions (esistente, verifica path se necessario)
  getCurrioSubmissions(): Observable<CurrioSubmission[]> {
    return this.http
      .get<{ [key: string]: Omit<CurrioSubmission, 'id'> }>(
        `${environment.firebase.databaseURL}/currioSubmissions.json` // Path corretto
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
