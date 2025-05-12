import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CurrioService } from 'src/app/shared/servizi/currio.service';
import { Currio, CurrioContatti } from 'src/app/shared/models/currio.model';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { createCurrio } from 'src/app/views/currio/state/currio.action';
import Swal from 'sweetalert2';

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
    esperienze: '',
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

          const newCurrioData: Omit<Currio, 'id'> = {
        nomePortfolio: `Curriò di ${this.formData.nome}`,
        heroTitle: `Ciao, sono ${this.formData.nome}!`,
        heroSubtitle: this.formData.esperienze,
        contatti: {
          email: this.formData.email,
        } as CurrioContatti,
        progetti: [],
        esperienze: [], // aggiungere this.formData.esperienze qui come prima esperienza testuale
        competenze: [],
        chiSonoDescrizione1: `Una breve introduzione su ${this.formData.nome}.`,
        linguaDefault: 'it',
        // userId: '', // con un sistema di autenticazione per chi sottomette associandolo
      };

           this.store.dispatch(createCurrio({ currio: newCurrioData }));


      // in un'app reale, aspettare la conferma dall'effetto.
      Swal.fire({
        title: 'Richiesta Inviata!',
        text: 'I tuoi dati sono stati inviati. Verrai contattato a breve o potrai modificare il tuo Curriò dopo il login.',
        icon: 'success',
        confirmButtonText: 'Ok'
      });

      this.closeModal();
      form.resetForm();

      
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
