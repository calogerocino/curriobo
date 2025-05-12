import { addEvent } from '../state/catalogo.action';
import { Event } from 'src/app/shared/models/event.model';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from 'src/app/shared/app.state';

@Component({
  selector: 'app-add-event',
  templateUrl: './evento-new.component.html',
  styleUrls: ['./evento-new.component.scss'],
})
export class EventoNewComponent implements OnInit {
  productForm: FormGroup;

  constructor(private readonly store: Store<AppState>) {}

  ngOnInit(): void {
    this.productForm = new FormGroup({
      title: new FormControl(null, [
        Validators.required,
        Validators.minLength(6),
      ]),
      description: new FormControl(null, [
        Validators.required,
        Validators.minLength(10),
      ]),
    });
  }

  showDescriptionErrors() {
    // const descriptionForm = this.productForm.get('description');
    // if (descriptionForm.touched && !descriptionForm.valid) {
    //   if (descriptionForm.errors['required']) {
    //     return 'Description is required';
    //   }

    //   if (descriptionForm.errors['minlength']) {
    //     return 'Description should be of minimum 10 characters length';
    //   }
    // }
    // return true;
  }

  onAddEvent() {
    if (!this.productForm.valid) {
      return;
    }

    const event: Event = {
      title: this.productForm.value.title,
      description: this.productForm.value.description,
    };

    this.store.dispatch(addEvent({ event }));
  }
}
