import { Component, ViewChild, ElementRef, HostListener, AfterViewInit, Inject, PLATFORM_ID, Renderer2, OnDestroy, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NgForm } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';
import { createCurrio } from 'src/app/views/currio/state/currio.action';
import Swal from 'sweetalert2';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { Currio, DatiClienteCurrio, CurrioContatti } from 'src/app/shared/models/currio.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-landingpage',
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.css'],
})
export class LandingpageComponent implements OnInit, AfterViewInit, OnDestroy {
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
  currentYear: number = new Date().getFullYear();

  // @ViewChild('header') headerRef!: ElementRef; // Potresti usarlo se aggiungi #header al tag header nell'HTML
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  private infoSections!: NodeListOf<HTMLElement>;

  constructor(
    private readonly store: Store<AppState>,
    private readonly storage: Storage,
    private renderer: Renderer2, // Renderer2 per manipolare classi
    private el: ElementRef,      // ElementRef per querySelector (alternativa a ViewChild per .header)
    @Inject(PLATFORM_ID) private platformId: Object,
    public translate: TranslateService
  ) {
    if (!this.translate.currentLang) {
      this.translate.setDefaultLang('it');
      this.translate.use('it');
    }
  }

  ngOnInit(): void {
    // Se hai bisogno di logica OnInit specifica, aggiungila qui.
    // Per esempio, se vuoi applicare 'no-scrollbar-landing' globalmente SOLO per questa pagina.
    // if (isPlatformBrowser(this.platformId)) {
    //   this.renderer.addClass(document.body, 'no-scrollbar-landing');
    // }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.infoSections = document.querySelectorAll('.info-section');
      this.checkVisibility(); // Controlla visibilità al caricamento
      // Applica stato iniziale header scrolled se la pagina è già scrollata (es. refresh)
      this.handleHeaderScrollEffect();
    }
  }

  ngOnDestroy(): void {
    // Se hai aggiunto classi globali in ngOnInit, rimuovile qui.
    // if (isPlatformBrowser(this.platformId)) {
    //   this.renderer.removeClass(document.body, 'no-scrollbar-landing');
    // }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.checkVisibility();
      this.handleHeaderScrollEffect();
    }
  }

  private handleHeaderScrollEffect(): void {
    const header = this.el.nativeElement.querySelector('.header');
    if (header) {
      if (window.pageYOffset > 50) { // Cambia 50 con l'offset desiderato
        this.renderer.addClass(header, 'scrolled');
      } else {
        this.renderer.removeClass(header, 'scrolled');
      }
    }
  }

  private checkVisibility(): void {
    if (!this.infoSections) return;
    const triggerBottom = window.innerHeight / 5 * 4;
    this.infoSections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop < triggerBottom) {
        section.classList.add('visible');
      } else {
        // section.classList.remove('visible'); // Opzionale
      }
    });
  }

  scrollToSection(sectionId: string): void {
    if (isPlatformBrowser(this.platformId)) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  openModal(): void {
    this.isModalOpen = true;
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.resetFileState();
    if (isPlatformBrowser(this.platformId)) {
      document.body.style.overflow = 'auto';
    }
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
      this.fileError = this.translate.instant('landingpage.modal.form.cvErrorType', {type: file.type || 'sconosciuto'});
      this.resetFileState();
      return;
    }

    if (file.size > maxSize) {
      this.fileError = this.translate.instant('landingpage.modal.form.cvErrorSize', {size: (file.size / 1024 / 1024).toFixed(2) });
      this.resetFileState();
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
  }


  async onSubmit(form: NgForm): Promise<void> {
    if (!form.valid) {
      Swal.fire({
        title: this.translate.instant('generale.errori.attenzione'),
        text: this.translate.instant('generale.errori.compilaCampi'),
        icon: 'error',
        confirmButtonText: this.translate.instant('generale.shared.ok')
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
        title: this.translate.instant('landingpage.modal.uploadingCVTitle'),
        text: this.translate.instant('landingpage.modal.uploadingCVText'),
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
        Swal.fire(
           this.translate.instant('landingpage.modal.uploadErrorTitle'),
           this.translate.instant('landingpage.modal.uploadErrorText'),
          'error');
        return;
      }
    }

    const datiClienteForm: DatiClienteCurrio = {
      nome: this.formData.nome,
      email: this.formData.email,
    };

    let langForCurrio: 'it' | 'en' = 'it';
    const currentActiveLang = this.translate.currentLang;
    if (currentActiveLang === 'en') {
      langForCurrio = 'en';
    } else if (currentActiveLang === 'it') {
      langForCurrio = 'it';
    }

    const newCurrioData: Omit<Currio, 'id'> = {
      nomePortfolio: `${this.translate.instant('landingpage.currioDefaultName')} ${this.formData.nome}`,
      heroTitle: `${this.translate.instant('landingpage.currioDefaultHeroTitle')} ${this.formData.nome}!`,
      heroSubtitle: this.formData.esperienze,
      contatti: {
        email: this.formData.email,
      } as CurrioContatti,
      progetti: [],
      esperienze: [],
      competenze: [],
      chiSonoDescrizione1: `${this.translate.instant('landingpage.currioDefaultAbout')} ${this.formData.nome}. ${this.translate.instant('landingpage.currioDefaultAboutPlaceholder')}`,
      linguaDefault: langForCurrio,
      curriculumUrl: curriculumUrl,
      datiCliente: datiClienteForm,
      status: 'nuova_richiesta',
      userId: undefined,
      tokenRegistrazione: undefined,
      tokenRegistrazioneScadenza: undefined,
    };

    this.store.dispatch(createCurrio({ currio: newCurrioData }));

    Swal.fire({
      title: this.translate.instant('landingpage.modal.requestSentTitle'),
      text: this.translate.instant('landingpage.modal.requestSentText'),
      icon: 'success',
      confirmButtonText: this.translate.instant('landingpage.modal.requestSentConfirm')
    });

    this.closeModal();
    form.resetForm();
    this.resetFileState();
  }
}
