import { Component, OnInit, OnDestroy } from "@angular/core";
import { Observable, Subject, Subscription } from "rxjs";
import { map, takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { Currio } from "src/app/shared/models/currio.model";
import { CurrioSubmission } from "src/app/shared/models/currio-submission.model";
import { Store } from "@ngrx/store";
import { AppState } from "src/app/shared/app.state";
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute
import { getCurrios, getCurrioSubmissions } from "../state/currio.selector";
import { loadCurrios, loadCurrioSubmissions, deleteCurrio } from "../state/currio.action";
import Swal from 'sweetalert2';

type CurrioStatusType = 'nuova_richiesta' | 'invito_spedito' | 'attivo' | 'archiviato';

@Component({
  selector: "app-listacurrio",
  templateUrl: "./listacurrio.component.html",
  styleUrls: ["./listacurrio.component.scss"],
})
export class ListaCurrioComponent implements OnInit, OnDestroy {
  currios$: Observable<Currio[]>;
  filteredCurrios$: Observable<Currio[]>;

  selectedStatusFilter: CurrioStatusType | "" = "";

  private allCurrios: Currio[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private readonly store: Store<AppState>,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {
    this.currios$ = this.store.select(getCurrios);
  }

  ngOnInit(): void {
    this.store.dispatch(loadCurrios());
    this.activatedRoute.queryParamMap.pipe(
      takeUntil(this.destroy$),
      map(params => params.get('statusFilter') as CurrioStatusType | "" | null),
      distinctUntilChanged()
    ).subscribe(statusFilterParam => {
      if (statusFilterParam && ['nuova_richiesta', 'invito_spedito', 'attivo', 'archiviato'].includes(statusFilterParam)) {
        this.selectedStatusFilter = statusFilterParam;
      } else {
        this.selectedStatusFilter = "";
      }
      this.applyFilter();
    });

    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredCurrios$ = this.currios$.pipe(
        map(currios => this.filterCurrios(currios, this.selectedStatusFilter)),
        takeUntil(this.destroy$)
    );
  }

  private filterCurrios(currios: Currio[], statusFilter: CurrioStatusType | ""): Currio[] {
    if (!statusFilter) {
      return currios;
    }
    return currios.filter(currio => currio.status === statusFilter);
  }


  navigateToEdit(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/admin/currio/edit', id]);
    } else {
      console.warn('Tentativo di navigare alla modifica senza ID Curriò.');
    }
  }


  navigateToPreview(id: string | undefined): void {
    if (id) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree(['/', id])
      );
      window.open(url, '_blank');
    } else {
      console.warn('Tentativo di navigare all\'anteprima senza ID Curriò.');
      Swal.fire('Errore', 'ID del Curriò non disponibile per l\'anteprima.', 'error');
    }
  }

  onDeleteCurrio(id: string | undefined): void {
    if (id) {
      Swal.fire({
        title: 'Sei sicuro?',
        text: "Non potrai annullare questa operazione!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sì, eliminalo!',
        cancelButtonText: 'Annulla'
      }).then((result) => {
        if (result.isConfirmed) {
          this.store.dispatch(deleteCurrio({ id }));
        }
      });
    } else {
        console.warn('Tentativo di eliminare senza ID Curriò.');
    }
  }

  getStatusBadgeClass(status: CurrioStatusType | undefined): string {
    switch (status) {
      case 'nuova_richiesta':
        return 'bg-warning text-dark';
      case 'invito_spedito':
        return 'bg-info text-dark';
      case 'attivo':
        return 'bg-success text-white';
      case 'archiviato':
        return 'bg-secondary text-white';
      default:
        return 'bg-light text-dark';
    }
  }

  formatStatus(status: CurrioStatusType | undefined): string {
    if (!status) {
      return 'status.sconosciuto';
    }
    return `status.${status.replace(/_/g, '')}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
