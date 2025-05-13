// src/app/views/landingpage/landingpage.component.ts

import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { createCurrio } from 'src/app/views/currio/state/currio.action';
import Swal from 'sweetalert2';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Currio, DatiClienteCurrio, CurrioContatti } from 'src/app/shared/models/currio.model';

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
  selectedFile: File | null = null;
  selectedFileName: string | null = null;

  constructor(
    private readonly store: Store<AppState>,
    private readonly storage: Storage
  ) {}

  openModal(): void {
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedFile = null;
    this.selectedFileName = null;
    document.body.style.overflow = 'auto';
    // Potresti voler resettare il form qui se non lo fai già
    // this.currioForm.resetForm(); // Se hai un riferimento al NgForm
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (allowedTypes.includes(file.type) && file.size <= maxSize) {
        this.selectedFile = file;
        this.selectedFileName = file.name;
      } else {
        this.selectedFile = null;
        this.selectedFileName = null;
        let errorMessage = 'Formato file non supportato o file troppo grande (max 5MB).';
        if (!allowedTypes.includes(file.type)) {
            errorMessage = `Formato file non supportato. Accettati: PDF, JPG, PNG. Hai fornito: ${file.type}`;
        } else if (file.size > maxSize) {
            errorMessage = `File troppo grande (max 5MB). Dimensione attuale: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
        }
        Swal.fire('Errore File', errorMessage, 'error');
        input.value = ''; // Resetta l'input file
      }
    }
  }

  async onSubmit(form: NgForm): Promise<void> {
    if (!form.valid) {
      Swal.fire({
        title: 'Errore!',
        text: 'Per favore, compila tutti i campi obbligatori.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      // Evidenzia i campi non validi se necessario
      Object.keys(form.controls).forEach(field => {
        const control = form.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
      return;
    }

    let curriculumUrl: string | undefined = undefined;

    if (this.selectedFile) {
      Swal.fire({
        title: 'Caricamento curriculum...',
        text: 'Attendere prego.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      try {
        const safeEmailForPath = this.formData.email.replace(/[^a-zA-Z0-9]/g, '_');
        const filePath = `curriculums/${safeEmailForPath}_${Date.now()}/${this.selectedFile.name}`;
        const storageRef = ref(this.storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, this.selectedFile);

        await uploadTask;
        curriculumUrl = await getDownloadURL(storageRef);
        Swal.close(); // Chiudi il popup di caricamento solo se l'upload ha successo
      } catch (error) {
        Swal.close();
        console.error("Errore durante l'upload del curriculum:", error);
        Swal.fire('Errore Upload', 'Non è stato possibile caricare il curriculum. Riprova.', 'error');
        return;
      }
    }

    const datiClienteForm: DatiClienteCurrio = {
      nome: this.formData.nome,
      email: this.formData.email,
    };

    const newCurrioData: Omit<Currio, 'id'> = {
      nomePortfolio: `Curriò Iniziale per ${this.formData.nome}`, // Sarà modificabile dall'admin/utente
      heroTitle: `Benvenuto ${this.formData.nome}!`,
      heroSubtitle: this.formData.esperienze,
      contatti: {
        email: this.formData.email, // Email pubblica del Curriò
      } as CurrioContatti,
      progetti: [],
      esperienze: [],
      competenze: [],
      chiSonoDescrizione1: `Profilo di ${this.formData.nome}. Inserisci qui una tua descrizione.`,
      linguaDefault: 'it',
      curriculumUrl: curriculumUrl,
      // --- CAMPI PER FLUSSO REGISTRAZIONE ---
      datiCliente: datiClienteForm, // Dati usati per l'invito alla registrazione
      status: 'nuova_richiesta',
      userId: undefined,
      tokenRegistrazione: undefined,
      tokenRegistrazioneScadenza: undefined,
    };

    this.store.dispatch(createCurrio({ currio: newCurrioData }));

    Swal.fire({
      title: 'Richiesta Inviata!',
      text: 'I tuoi dati sono stati inviati con successo. Verrai ricontattato a breve dal nostro team.',
      icon: 'success',
      confirmButtonText: 'Fantastico!'
    });

    this.closeModal();
    form.resetForm(); // Resetta i valori del form
    this.selectedFile = null; // Resetta anche i file selezionati
    this.selectedFileName = null;
  }
}
