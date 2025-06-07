import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AltreCompetenze, CurrioCompetenza, CurrioEsperienza, CurrioProgetto } from '../models/currio.model';
import { environment } from 'src/environments/environment';

declare const pdfjsLib: any;

export interface ParsedCvData {
  esperienze: CurrioEsperienza[];
  competenze: CurrioCompetenza[];
  altreCompetenze: AltreCompetenze;
  progetti: CurrioProgetto[];
}

@Injectable({
  providedIn: 'root'
})
export class CvParsingService {

  private readonly geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${environment.geminiApiKey}`;

  constructor(private http: HttpClient) {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.mjs`;
    }
  }

  parseCvFromUrl(cvUrl: string): Observable<ParsedCvData> {
    return this.extractTextFromPdf(cvUrl).pipe(
      switchMap(extractedText => {
        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error('Estrazione del testo dal CV fallita. Il file potrebbe essere un\'immagine o vuoto.');
        }
        return this.getParsedDataFromGemini(extractedText);
      }),
      catchError(error => {
        console.error("Errore dettagliato nel processo di parsing del CV:", error);
        throw new Error(error.message || "Si è verificato un errore sconosciuto durante l'analisi.");
      })
    );
  }

  private extractTextFromPdf(url: string): Observable<string> {
    if (typeof pdfjsLib === 'undefined') {
        return from(Promise.reject(new Error('La libreria di analisi PDF (pdf.js) non è stata caricata correttamente.')));
    }
    
    return this.http.get(url, { responseType: 'arraybuffer' }).pipe(
      switchMap(data => {
        const promise = new Promise<string>((resolve, reject) => {
          const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(data) });
          loadingTask.promise.then((pdf: any) => {
            const numPages = pdf.numPages;
            const pagePromises = [];

            for (let i = 1; i <= numPages; i++) {
              pagePromises.push(pdf.getPage(i).then((page: any) => page.getTextContent()));
            }

            Promise.all(pagePromises).then(textContents => {
              let fullText = '';
              textContents.forEach((textContent: any) => {
                textContent.items.forEach((item: any) => {
                  fullText += item.str + ' ';
                });
                fullText += '\n\n';
              });
              resolve(fullText);
            }).catch(reject);
          }).catch(reject);
        });
        return from(promise);
      }),
      catchError(error => {
        console.error('Errore durante il download o il parsing del PDF:', error);
        throw new Error('Impossibile scaricare o leggere il file del CV. Verificare le autorizzazioni del file in Firebase Storage (CORS).');
      })
    );
  }

  private getParsedDataFromGemini(cvText: string): Observable<ParsedCvData> {
    const prompt = `
      Analizza il seguente testo estratto da un curriculum vitae e restituisci le informazioni in un formato JSON strutturato secondo lo schema fornito.
      Interpreta le sezioni e compila i campi nel modo più accurato possibile.
      - 'competenze' si riferisce solo a competenze tecniche/hard skills (es. 'JavaScript', 'SQL', 'Photoshop').
      - 'altreCompetenze.softSkills' si riferisce a competenze trasversali (es. 'Teamwork', 'Problem Solving').
      - 'altreCompetenze.lingue' elenca le lingue conosciute, specificando il livello (es. 'Madrelingua', 'B2', 'Fluente') e se c'è una certificazione.
      - Per le 'esperienze', distingui tra 'lavoro' e 'formazione'.
      - Se un'informazione non è presente, lascia il campo come stringa vuota o array vuoto.

      Testo del CV:
      ---
      ${cvText}
      ---
    `;

    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            "esperienze": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "titolo": { "type": "STRING" },
                  "tipo": { "type": "STRING", "enum": ["lavoro", "formazione"] },
                  "aziendaScuola": { "type": "STRING" },
                  "date": { "type": "STRING" },
                  "descrizioneBreve": { "type": "STRING" },
                  "dettagli": { "type": "ARRAY", "items": { "type": "STRING" } },
                  "competenzeAcquisite": { "type": "ARRAY", "items": { "type": "STRING" } }
                }
              }
            },
            "competenze": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "nome": { "type": "STRING" },
                  "livello": { "type": "STRING" }
                }
              }
            },
            "altreCompetenze": {
                type: "OBJECT",
                properties: {
                    "softSkills": { "type": "ARRAY", "items": { "type": "STRING" } },
                    "lingue": {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                "nome": { "type": "STRING" },
                                "livello": { "type": "STRING" },
                                "certificazione": { "type": "BOOLEAN" }
                            }
                        }
                    }
                }
            },
            "progetti": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "titolo": { "type": "STRING" },
                  "descrizione": { "type": "STRING" },
                  "tags": { "type": "ARRAY", "items": { "type": "STRING" } },
                  "linkProgetto": { "type": "STRING" }
                }
              }
            }
          }
        }
      }
    };

    return this.http.post<any>(this.geminiApiUrl, payload).pipe(
      map(response => {
        const responseText = response.candidates[0].content.parts[0].text;
        try {
          const parsedJson = JSON.parse(responseText);
          return parsedJson as ParsedCvData;
        } catch (e) {
          console.error("Errore nel parsing della risposta JSON da Gemini:", e);
          throw new Error("La risposta dell'AI non è un JSON valido.");
        }
      })
    );
  }
}
