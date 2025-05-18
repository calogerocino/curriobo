import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CurrioIdCheckGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const id = route.paramMap.get('id');

    // Se l'ID è nullo o vuoto, non è valido per l'anteprima.
    if (!id) {
      console.warn(
        "CurrioIdCheckGuard: ID mancante nel percorso. Reindirizzamento alla pagina di errore."
      );
      return this.router.createUrlTree(['/error'], {
        queryParams: { type: '404', message: 'missing_id_for_preview' },
      });
    }

    // Elenco di segmenti di percorso riservati che NON devono essere trattati come ID Curriò.
    // Aggiungi qui tutti i percorsi principali della tua applicazione (es. 'admin', 'cliente', 'auth', 'error', ecc.)
    // per evitare che vengano interpretati erroneamente come ID di Curriò.
    const reservedPaths: string[] = [
      'admin',
      'auth',
      'cliente',
      'error',
      'assets', // Tipicamente non un ID, ma per sicurezza
      'favicon.ico', // Richieste comuni del browser
      // Aggiungi altri percorsi radice della tua applicazione se necessario
    ];

    if (reservedPaths.includes(id.toLowerCase())) {
      console.warn(
        `CurrioIdCheckGuard: L'ID '${id}' corrisponde a un percorso riservato. Reindirizzamento alla pagina di errore (o lasciato al gestore wildcard '**').`
      );
      // In questo caso, potresti voler lasciare che il router gestisca questo come un normale 404
      // tramite la rotta wildcard '**', oppure reindirizzare esplicitamente.
      // Per coerenza con il reindirizzamento a /error:
      return this.router.createUrlTree(['/error'], {
        queryParams: { type: '404', message: `path_is_reserved_${id}` },
      });
    }

    // Esempio di controllo del formato dell'ID:
    // Supponiamo che gli ID dei Curriò debbano essere, ad esempio, stringhe alfanumeriche
    // di una certa lunghezza o seguire un pattern specifico.
    // Questo è un ESEMPIO SEMPLICE - ADATTALO ALLA TUA LOGICA REALE.
    // Ad esempio, se i tuoi ID sono UUID, usa un regex per UUID.
    // Se sono stringhe generate casualmente, potresti verificare la lunghezza o l'assenza di caratteri speciali non permessi.
    // Se i tuoi ID possono contenere solo lettere minuscole e numeri e trattini (come uno slug):
    const isValidFormat = /^[a-z0-9-]+$/.test(id); // Esempio: solo minuscole, numeri, trattini

    if (!isValidFormat) {
      // Se l'ID non ha il formato atteso, reindirizza alla pagina di errore.
      console.warn(
        `CurrioIdCheckGuard: Formato ID '${id}' non valido. Reindirizzamento alla pagina di errore.`
      );
      return this.router.createUrlTree(['/error'], {
        queryParams: { type: '404', message: 'invalid_currio_id_format' },
      });
    }

    // Se l'ID supera i controlli preliminari (non è un percorso riservato e ha un formato accettabile),
    // allora permette l'attivazione della rotta.
    // Sarà poi CurrioPreviewComponent a verificare l'esistenza effettiva dell'ID.
    return true;
  }
}
