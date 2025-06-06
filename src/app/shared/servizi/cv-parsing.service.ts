import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CurrioCompetenza, CurrioEsperienza, CurrioProgetto } from '../models/currio.model';
import { environment } from 'src/environments/environment';

declare const pdfjsLib: any;

export interface ParsedCvData {
  esperienze: CurrioEsperienza[];
  competenze: CurrioCompetenza[];
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
        if (!extractedText) {
          throw new Error('Estrazione del testo dal CV fallita o il CV è vuoto.');
        }
        return this.getParsedDataFromGemini(extractedText);
      }),
      catchError(error => {
        console.error("Errore nel processo di parsing del CV:", error);
        throw error;
      })
    );
  }

  private extractTextFromPdf(url: string): Observable<string> {
    if (typeof pdfjsLib === 'undefined') {
        return from(Promise.reject('La libreria pdf.js non è stata caricata.'));
    }

    // Fetch the PDF as an ArrayBuffer using HttpClient to bypass CORS issues.
    return this.http.get(url, { responseType: 'arraybuffer' }).pipe(
      switchMap(data => {
        const promise = new Promise<string>((resolve, reject) => {
          // Pass the ArrayBuffer to pdf.js
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
      - Per le 'esperienze', distingui tra 'lavoro' e 'formazione'.
      - Per le 'competenze', cerca di identificare il livello di padronanza se menzionato.
      - Per i 'progetti', includi le tecnologie o i tag se sono elencati.
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
