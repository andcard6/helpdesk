import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
  formatHttpError,
} from '../../core/http-error';
import { Priority, Ticket, TicketStatus, TicketType } from '../../core/models';
import { TicketService } from '../../core/ticket.service';

@Component({
  imports: [FormsModule, ReactiveFormsModule, DatePipe, RouterLink],
  selector: 'app-tickets',
  styleUrl: './tickets.css',
  templateUrl: './tickets.html',
})
export class Tickets {
  private fb = inject(NonNullableFormBuilder);
  private ticketService = inject(TicketService);
  protected auth = inject(AuthService);

  protected readonly statuses = TICKET_STATUSES;
  protected readonly priorities = TICKET_PRIORITIES;
  protected readonly types = TICKET_TYPES;

  readonly tickets = signal<Ticket[]>([]);
  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly error = signal('');

  readonly search = signal('');
  readonly statusFilter = signal<TicketStatus | 'all'>('all');
  readonly priorityFilter = signal<Priority | 'all'>('all');

  readonly filteredTickets = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const priority = this.priorityFilter();

    return this.tickets().filter((t) => {
      if (status !== 'all' && t.status !== status) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (!query) return true;
      return (
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.author.name.toLowerCase().includes(query)
      );
    });
  });

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required]],
    ticket_type: ['incident' as TicketType, [Validators.required]],
    priority: ['medium' as Priority, [Validators.required]],
  });

  constructor() {
    this.load();
  }

  load(clearError = true) {
    this.loading.set(true);
    if (clearError) this.error.set('');
    this.ticketService.list().subscribe({
      next: (list) => {
        this.tickets.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(formatHttpError(err, 'No se pudieron cargar los tickets'));
        this.loading.set(false);
      },
    });
  }

  create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.creating.set(true);
    this.error.set('');

    this.ticketService
      .create({
        title: raw.title.trim(),
        description: raw.description.trim(),
        ticket_type: raw.ticket_type,
        priority: raw.priority,
      })
      .subscribe({
        next: (created) => {
          this.tickets.update((list) => [created, ...list]);
          this.form.reset({
            title: '',
            description: '',
            ticket_type: 'incident',
            priority: 'medium',
          });
          this.creating.set(false);
        },
        error: (err) => {
          this.error.set(formatHttpError(err, 'No se pudo crear el ticket'));
          this.creating.set(false);
        },
      });
  }

  setStatus(t: Ticket, status: TicketStatus) {
    this.error.set('');
    this.ticketService.update(t.id, { status }).subscribe({
      next: (updated) => {
        this.tickets.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
      },
      error: (err) => {
        this.error.set(formatHttpError(err, 'No se pudo actualizar el estado'));
        this.load(false);
      },
    });
  }

  remove(t: Ticket) {
    if (!confirm(`¿Borrar el ticket #${t.id}?`)) return;
    this.error.set('');
    this.ticketService.remove(t.id).subscribe({
      next: () => this.tickets.update((list) => list.filter((x) => x.id !== t.id)),
      error: (err) => this.error.set(formatHttpError(err, 'No se pudo borrar el ticket')),
    });
  }

  protected hasError(controlName: 'title' | 'description', errorCode: string): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty) && !!control.errors?.[errorCode];
  }
}
