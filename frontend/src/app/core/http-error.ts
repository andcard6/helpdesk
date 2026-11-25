import { HttpErrorResponse } from '@angular/common/http';
import { Priority, TicketStatus, TicketType } from './models';

export const TICKET_STATUSES: readonly { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Abierto' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'waiting', label: 'En espera' },
  { value: 'escalated', label: 'Escalado' },
  { value: 'closed', label: 'Cerrado' },
];

export const TICKET_PRIORITIES: readonly { value: Priority; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
];

export const TICKET_TYPES: readonly { value: TicketType; label: string }[] = [
  { value: 'incident', label: 'Falla / Incidente' },
  { value: 'request', label: 'Solicitud' },
];

export function formatHttpError(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) return fallback;
  if (err.status === 0) return 'No se pudo conectar con el servidor';
  if (err.status === 401) return 'Tu sesión expiró o no es válida';
  if (err.status === 403) return 'No tienes permisos para realizar esta acción';
  if (err.status === 404) return 'El recurso solicitado no existe';
  const detail = (err.error as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  return fallback;
}
