// landingpage.component.ts

import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database'; // Import Firebase Realtime Database service
import { NgForm } from '@angular/forms'; // Import NgForm for template-driven forms

@Component({
  selector: 'app-landingpage', // Assicurati che questo selettore sia corretto per il tuo progetto
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.css'],
})
export class LandingpageComponent {
  // Property to control modal visibility
  isModalOpen = false;

  // Object to hold form data using ngModel
  formData = {
    nome: '',
    email: '',
    esperienze: '',
    // Aggiungi qui altri campi se necessario
  };

  // Inject AngularFireDatabase
  constructor(private db: AngularFireDatabase) {}

  // Method to open the modal
  openModal(): void {
    this.isModalOpen = true;
    // Optional: disable body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  // Method to close the modal
  closeModal(): void {
    this.isModalOpen = false;
    // Optional: restore body scroll when modal is closed
    document.body.style.overflow = 'auto';
  }

  // Method to handle form submission
  onSubmit(form: NgForm): void {
    // Check if the form is valid
    if (form.valid) {
      console.log('Dati del form raccolti:', this.formData);

      // --- Firebase Integration ---
      // Get a reference to the Firebase Realtime Database list/node where you want to store the data
      // Sostituisci 'currioSubmissions' con il nome desiderato per il nodo nel tuo database
      const itemsRef = this.db.list('currioSubmissions');

      // Push the form data to Firebase
      itemsRef
        .push(this.formData)
        .then((response) => {
          // Success handling
          console.log('Dati inviati a Firebase con successo!', response);
          alert('Dati inviati con successo! Grazie.'); // User feedback
          this.closeModal(); // Close the modal
          form.resetForm(); // Reset the form fields
        })
        .catch((error) => {
          // Error handling
          console.error("Errore durante l'invio dei dati a Firebase:", error);
          alert(
            "Si è verificato un errore durante l'invio dei dati. Riprova più tardi."
          ); // User feedback
        });
      // --- End of Firebase Integration ---
    } else {
      // Form is invalid, show an error or highlight fields
      console.error('Il form non è valido.');
      alert('Per favore, compila tutti i campi obbligatori.');
    }
  }
}
