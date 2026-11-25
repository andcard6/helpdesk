import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  formatHttpError,
} from '../../core/http-error';
import {
  Priority,
  Ticket,
  TicketStatus,
  UpdateTicketPayload,
  User,
} from '../../core/models';
import { TicketService } from '../../core/ticket.service';
import { UserService } from '../../core/user.service';

@Component({
  imports: [FormsModule, ReactiveFormsModule, DatePipe, RouterLink],
  selector: 'app-ticket-detail',
  styleUrl: './ticket-detail.css',
  templateUrl: './ticket-detail.html',
})
export class TicketDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  private ticketService = inject(TicketService);
  private userService = inject(UserService);
  protected auth = inject(AuthService);

  protected readonly statuses = TICKET_STATUSES;
  protected readonly priorities = TICKET_PRIORITIES;

  readonly ticket = signal<Ticket | null>(null);
  readonly staffUsers = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly commenting = signal(false);
  readonly error = signal('');

  readonly canManage = computed(() =>
    this.auth.hasRole('agent', 'coordinator', 'admin'),
  );
  readonly canAssignAny = computed(() =>
    this.auth.hasRole('coordinator', 'admin'),
  );

  readonly commentForm = this.fb.group({
    content: ['', [Validators.required]],
  });

  private ticketId = Number(this.route.snapshot.paramMap.get('id'));

  constructor() {
    if (!Number.isFinite(this.ticketId) || this.ticketId <= 0) {
      this.error.set('ID de ticket inválido');
      this.loading.set(false);
      return;
    }

    this.loadTicket();
    if (this.canAssignAny()) {
      this.loadStaff();
    }
  }

  loadTicket(clearError = true) {
    this.loading.set(true);
    if (clearError) this.error.set('');
    this.ticketService.getById(this.ticketId).subscribe({
      next: (data) => {
        this.ticket.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(formatHttpError(err, 'No se pudo cargar el ticket'));
        this.loading.set(false);
      },
    });
  }

  private loadStaff() {
    this.userService.list().subscribe({
      next: (users) =>
        this.staffUsers.set(
          users.filter(
            (u) => u.is_active && ['agent', 'coordinator', 'admin'].includes(u.role),
          ),
        ),
      error: () => {
        // Si falla la carga de usuarios, no bloqueamos el detalle del ticket
      },
    });
  }

  updateField(payload: UpdateTicketPayload) {
    const current = this.ticket();
    if (!current) return;

    this.saving.set(true);
    this.error.set('');
    this.ticketService.update(current.id, payload).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(formatHttpError(err, 'No se pudo actualizar el ticket'));
        this.saving.set(false);
        this.loadTicket(false);
      },
    });
  }

  onStatusChange(status: TicketStatus) {
    this.updateField({ status });
  }

  onPriorityChange(priority: Priority) {
    this.updateField({ priority });
  }

  onAssigneeChange(value: string) {
    const assigned_to_id = value ? Number(value) : null;
    this.updateField({ assigned_to_id });
  }

  assignToMe() {
    const myId = this.auth.user()?.id;
    if (!myId) return;
    this.updateField({ assigned_to_id: myId });
  }

  unassign() {
    this.updateField({ assigned_to_id: null });
  }

  addComment() {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      return;
    }
    const current = this.ticket();
    if (!current) return;

    const content = this.commentForm.controls.content.value.trim();
    if (!content) return;

    this.commenting.set(true);
    this.error.set('');
    this.ticketService.addComment(current.id, content).subscribe({
      next: (comment) => {
        this.ticket.update((t) =>
          t ? { ...t, comments: [...(t.comments ?? []), comment] } : null,
        );
        this.commentForm.reset({ content: '' });
        this.commenting.set(false);
      },
      error: (err) => {
        this.error.set(formatHttpError(err, 'No se pudo agregar el comentario'));
        this.commenting.set(false);
      },
    });
  }

  deleteTicket() {
    const current = this.ticket();
    if (!current || !confirm(`¿Borrar el ticket #${current.id}?`)) return;

    this.saving.set(true);
    this.error.set('');
    this.ticketService.remove(current.id).subscribe({
      next: () => this.router.navigate(['/tickets']),
      error: (err) => {
        this.error.set(formatHttpError(err, 'No se pudo borrar el ticket'));
        this.saving.set(false);
      },
    });
  }

  protected hasCommentError(): boolean {
    const c = this.commentForm.controls.content;
    return c.invalid && (c.touched || c.dirty);
  }
}
