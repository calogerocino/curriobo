import { Component, ViewChild, ElementRef } from '@angular/core'; // Aggiungi ViewChild, ElementRef
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
  styleUrls: ['./landingpage.component.css'], // Assicurati che il CSS sia linkato
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
  isDraggingOver = false; // Nuovo stato per l'effetto drag over
  fileError: string | null = null; // Per messaggi di errore relativi al file

  // Riferimento all'input file nascosto
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;


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
    this.resetFileState();
    document.body.style.overflow = 'auto';
    // Considera di resettare il form se necessario
    // if (this.currioForm) { this.currioForm.resetForm(); }
  }

  private resetFileState(): void {
    this.selectedFile = null;
    this.selectedFileName = null;
    this.isDraggingOver = false;
    this.fileError = null;
    if (this.fileInputRef && this.fileInputRef.nativeElement) {
      this.fileInputRef.nativeElement.value = ''; // Resetta l'input file
    }
  }

  // --- Metodi per Drag & Drop ---
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = true;
    this.fileError = null; // Pulisce errori precedenti
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length) {
      this.handleFile(files[0]);
    }
  }

  // Chiamato sia dal change dell'input che dal drop
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.fileError = null; // Resetta l'errore
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      this.fileError = `Formato file non supportato. Accettati: PDF, JPG, PNG. (Fornito: ${file.type || 'sconosciuto'})`;
      this.resetFileState(); // Resetta lo stato del file
      return;
    }

    if (file.size > maxSize) {
      this.fileError = `File troppo grande (max 5MB). Dimensione attuale: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      this.resetFileState(); // Resetta lo stato del file
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
  }


  async onSubmit(form: NgForm): Promise<void> {
    if (!form.valid) {
      Swal.fire({
        title: 'Errore!',
        text: 'Per favore, compila tutti i campi obbligatori.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      Object.keys(form.controls).forEach(field => {
        const control = form.controls[field];
        control.markAsTouched({ onlySelf: true });
      });
      return;
    }

    // Opzionale: verifica se il file è obbligatorio
    // if (!this.selectedFile) {
    //   this.fileError = 'Il caricamento del curriculum è obbligatorio.';
    //   Swal.fire('Attenzione', 'Per favore, allega il tuo curriculum.', 'warning');
    //   return;
    // }

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
        Swal.close();
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
      nomePortfolio: `Curriò Iniziale per ${this.formData.nome}`,
      heroTitle: `Benvenuto ${this.formData.nome}!`,
      heroSubtitle: this.formData.esperienze,
      contatti: {
        email: this.formData.email,
      } as CurrioContatti,
      progetti: [],
      esperienze: [],
      competenze: [],
      chiSonoDescrizione1: `Profilo di ${this.formData.nome}. Inserisci qui una tua descrizione.`,
      linguaDefault: 'it',
      curriculumUrl: curriculumUrl,
      datiCliente: datiClienteForm,
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

    this.closeModal(); // Chiude il modal
    form.resetForm(); // Resetta i campi del form
    this.resetFileState(); // Resetta lo stato del file
  }
}
