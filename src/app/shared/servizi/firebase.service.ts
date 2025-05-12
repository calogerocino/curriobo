import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '../guard/auth.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  ApiURL= "https://iforalogistics-default-rtdb.europe-west1.firebasedatabase.app/"
  DB_persone ="persone"
  DB_eventi ="eventi"
  DB_fornitori ="fornitori"

  constructor(private readonly http: HttpClient, private readonly authService: AuthService) {}

  insertDatiDB(url: string, body: {}) {
    return this.http.post(`${url}?auth=${this.authService.user}`, body);
  }

  getDatiDB(url: string) {
    return this.http.get(`${url}.json?auth=${this.authService.user}`);
  }

  deleteDatiDB(url: string, id: string) {
    return this.http.delete(`${url}/${id}.json`);
  }

  patchDatiDB(url: string, id: string, body: {}) {
    return this.http.patch(`${url}/${id}.json`, body);
  }
}
