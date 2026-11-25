import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Priority, Ticket } from '../../core/models';

// TEMPORAL: datos de prueba locales hasta conectar el servicio HTTP de tickets.
const MOCK_TICKETS: Ticket[] = [
  {
    id: 2,
    title: 'Sin internet en la sala 3',
    description: 'Ningún equipo tiene conexión',
    priority: 'high',
    status: 'open',
    created_at: '2026-10-10T14:30:00Z',
    author: { id: 2, name: 'Ana' },
  },
  {
    id: 1,
    title: 'Impresora atascada',
    description: 'Las hojas salen arrugadas',
    priority: 'low',
    status: 'closed',
    created_at: '2026-10-09T09:15:00Z',
    author: { id: 3, name: 'Beto' },
  },
];

@Component({
  imports: [FormsModule, DatePipe],
  selector: 'app-tickets',
  styleUrl: './tickets.css',
  templateUrl: './tickets.html',
})
export class Tickets {
  protected auth = inject(AuthService);

  tickets = signal<Ticket[]>(MOCK_TICKETS);

  title = '';
  description = '';
  priority: Priority = 'medium';

  create() {
    if (!this.title.trim() || !this.description.trim()) return;
    const currentUser = this.auth.user();
    const ticket: Ticket = {
      id: Date.now(),
      title: this.title.trim(),
      description: this.description.trim(),
      priority: this.priority,
      status: 'open',
      created_at: new Date().toISOString(),
      author: { id: currentUser?.id ?? 0, name: currentUser?.name ?? 'Yo' },
    };
    this.tickets.update((list) => [ticket, ...list]);
    this.title = '';
    this.description = '';
    this.priority = 'medium';
  }

  remove(t: Ticket) {
    this.tickets.update((list) => list.filter((x) => x.id !== t.id));
  }
}
