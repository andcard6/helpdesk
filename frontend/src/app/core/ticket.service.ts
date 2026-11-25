import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  CreateTicketPayload,
  Ticket,
  TicketComment,
  UpdateTicketPayload,
} from './models';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/tickets`;

  list() {
    return this.http.get<Ticket[]>(this.url);
  }

  getById(id: number) {
    return this.http.get<Ticket>(`${this.url}/${id}`);
  }

  create(data: CreateTicketPayload) {
    return this.http.post<Ticket>(this.url, data);
  }

  update(id: number, data: UpdateTicketPayload) {
    return this.http.patch<Ticket>(`${this.url}/${id}`, data);
  }

  addComment(ticketId: number, content: string) {
    return this.http.post<TicketComment>(`${this.url}/${ticketId}/comments`, { content });
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
