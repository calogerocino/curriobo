import { Component, ViewChild, ElementRef } from '@angular/core';
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
  isDraggingOver = false;
  fileError: string | null = null;

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
  }

  private resetFileState(): void {
    this.selectedFile = null;
    this.selectedFileName = null;
    this.isDraggingOver = false;
    this.fileError = null;
    if (this.fileInputRef && this.fileInputRef.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOver = true;
    this.fileError = null;
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    this.fileError = null;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      this.fileError = `Formato file non supportato. Accettati: PDF, JPG, PNG. (Fornito: ${file.type || 'sconosciuto'})`;
      this.resetFileState();
      return;
    }

    if (file.size > maxSize) {
      this.fileError = `File troppo grande (max 5MB). Dimensione attuale: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      this.resetFileState();
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
        Swal.close(); // Chiudi lo Swal di caricamento
      } catch (error) {
        Swal.close();
        console.error("Errore durante l'upload del curriculum:", error);
        Swal.fire('Errore Upload', 'Non è stato possibile caricare il curriculum. Riprova.', 'error');
        return; // Interrompi l'esecuzione se l'upload fallisce
      }
    }

    const datiClienteForm: DatiClienteCurrio = {
      nome: this.formData.nome,
      email: this.formData.email,
    };

    const newCurrioData: Omit<Currio, 'id'> = {
      nomePortfolio: `Curriò per ${this.formData.nome}`,
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

    this.closeModal();
    form.resetForm();
    this.resetFileState();
  }
}
