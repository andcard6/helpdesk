import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { Role, User } from './models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/users`;

  list() {
    return this.http.get<User[]>(this.url);
  }

  update(id: number, data: { role?: Role; phone?: string | null; is_active?: boolean }) {
    return this.http.patch<User>(`${this.url}/${id}`, data);
  }
}
