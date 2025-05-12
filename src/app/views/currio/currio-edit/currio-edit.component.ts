// import { updateEvent } from '../state/catalogo.action';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Event } from 'src/app/shared/models/currio.model';
import { getEventById } from '../state/catalogo.selector';
import { AppState } from 'src/app/shared/app.state';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-currio-edit',
  templateUrl: './currio-edit.component.html',
  styleUrls: ['./currio-edit.component.scss'],
})
export class CurrioEditComponent implements OnInit, OnDestroy {
  event: Event;
  productForm: FormGroup;
  productSubscription: Subscription;
  constructor(
    private readonly route: ActivatedRoute,
    private readonly store: Store<AppState>,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.productSubscription = this.store
        .select(getEventById, { id })
        .subscribe((data) => {
          this.event = data;
          this.createForm();
        });
    });
  }

  createForm() {
    this.productForm = new FormGroup({
      title: new FormControl(this.event.title, [
        Validators.required,
        Validators.minLength(6),
      ]),
      description: new FormControl(this.event.description, [
        Validators.required,
        Validators.minLength(10),
      ]),
    });
  }

  onSubmit() {
    if (!this.productForm.valid) {
      return;
    }

    const title = this.productForm.value.title;
    const description = this.productForm.value.description;

    const event: Event = {
      id: this.event.id,
      title,
      description,
    };

    //dispatch the action
    // this.store.dispatch(updateEvent({ event }));
    this.router.navigate(['catalogo/Currio']);
  }

  ngOnDestroy() {
    if (this.productSubscription) {
      this.productSubscription.unsubscribe();
    }
  }
}
