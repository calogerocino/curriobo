import { Event } from '../models/event.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class EventsService {
 constructor(private readonly http: HttpClient) {}

  getEvents(): Observable<Event[]> {
    return this.http
      .get<Event[]>(
        `${environment.firebase.databaseURL}/eventi.json`
      )
      .pipe(
        map((data) => {
          const events: Event[] = [];
          for (let key in data) {
            events.push({ ...data[key], id: key });
          }
          return events;
        })
      );
  }

  addEvent(event: Event): Observable<{ name: string }> {
    return this.http.post<{ name: string }>(
      `${environment.firebase.databaseURL}/eventi.json`,
      event
    );
  }

  updateEvent(event: Event) {
    const postData = {
      [event.id]: { title: event.title, description: event.description },
    };
    return this.http.patch(
      `${environment.firebase.databaseURL}/eventi.json`,
      postData
    );
  }

  deleteEvent(id: string) {
    return this.http.delete(
      `${environment.firebase.databaseURL}/eventi/${id}.json`
    );
  }
}
