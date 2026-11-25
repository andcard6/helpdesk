export type Role = 'user' | 'agent' | 'coordinator' | 'admin';
export type TicketType = 'request' | 'incident';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'escalated' | 'closed';
export type Priority = 'low' | 'medium' | 'high';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  is_active: boolean;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string | null;
  password: string;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  content: string;
  created_at: string;
  author: UserSummary;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  ticket_type: TicketType;
  priority: Priority;
}

export interface UpdateTicketPayload {
  status?: TicketStatus;
  priority?: Priority;
  assigned_to_id?: number | null;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  ticket_type: TicketType;
  priority: Priority;
  status: TicketStatus;
  created_at: string;
  first_responded_at?: string | null;
  closed_at?: string | null;
  sla_due_at?: string | null;
  author: UserSummary;
  assigned_to?: UserSummary | null;
  comments?: TicketComment[];
}
