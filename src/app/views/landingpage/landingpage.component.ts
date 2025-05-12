// src/app/views/landingpage/landingpage.component.ts
import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
// Importa il servizio CurrioService e il modello Currio
import { CurrioService } from 'src/app/shared/servizi/currio.service'; // Aggiorna il path se necessario
import { Currio, CurrioContatti } from 'src/app/shared/models/currio.model'; // Aggiorna il path se necessario
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { createCurrio } from 'src/app/views/currio/state/currio.action'; // Importa l'azione NGRX
import Swal from 'sweetalert2'; // Per notifiche più carine

@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.css'],
})
export class LandingpageComponent {
  isModalOpen = false;
  formData = {
    nome: '',
    email: '',
    esperienze: '', // Questo campo verrà usato per heroSubtitle o una descrizione iniziale
  };

  // Inietta CurrioService e Store
  constructor(
    private readonly currioService: CurrioService,
    private readonly store: Store<AppState>
    ) {}

  openModal(): void {
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  onSubmit(form: NgForm): void {
    if (form.valid) {
      console.log('Dati del form raccolti:', this.formData);

      // Trasforma formData in un oggetto Currio (parziale, omettendo l'id)
      const newCurrioData: Omit<Currio, 'id'> = {
        nomePortfolio: `Curriò di ${this.formData.nome}`,
        heroTitle: `Ciao, sono ${this.formData.nome}!`,
        heroSubtitle: this.formData.esperienze, // Usiamo 'esperienze' come sottotitolo iniziale
        contatti: {
          email: this.formData.email,
        } as CurrioContatti,
        // Inizializza gli altri campi array/oggetti come vuoti o con valori di default
        progetti: [],
        esperienze: [], // Potresti voler aggiungere this.formData.esperienze qui come prima esperienza testuale
        competenze: [],
        chiSonoDescrizione1: `Una breve introduzione su ${this.formData.nome}.`, // Placeholder
        linguaDefault: 'it', // Default
        // userId: '', // Se hai un sistema di autenticazione per chi sottomette, potresti volerlo associare
      };

      // Dispatch dell'azione NGRX per creare il Currio
      this.store.dispatch(createCurrio({ currio: newCurrioData }));

      // Gestione del feedback all'utente (puoi iscriverti agli effetti NGRX per success/failure)
      // Per semplicità, mostriamo un alert di successo immediato,
      // ma in un'app reale, aspetteresti la conferma dall'effetto.
      Swal.fire({
        title: 'Richiesta Inviata!',
        text: 'I tuoi dati sono stati inviati. Verrai contattato a breve o potrai modificare il tuo Curriò dopo il login.',
        icon: 'success',
        confirmButtonText: 'Ok'
      });

      this.closeModal();
      form.resetForm();

      // COMMENTATO: Vecchio metodo di salvataggio diretto con AngularFireDatabase
      // const itemsRef = this.db.list('currioSubmissions'); // Nodo originale
      // itemsRef
      //   .push(this.formData) // Salvataggio dei dati grezzi del form
      //   .then((response) => {
      //     console.log('Dati inviati a Firebase (currioSubmissions) con successo!', response);
      //     alert('Dati inviati con successo! Grazie.');
      //     this.closeModal();
      //     form.resetForm();
      //   })
      //   .catch((error) => {
      //     console.error("Errore durante l'invio dei dati a Firebase (currioSubmissions):", error);
      //     alert("Si è verificato un errore durante l'invio dei dati. Riprova più tardi.");
      //   });

    } else {
      console.error('Il form non è valido.');
      Swal.fire({
        title: 'Errore!',
        text: 'Per favore, compila tutti i campi obbligatori.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
    }
  }
}
