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

export interface Ticket {
  id: number;
  title: string;
  description: string;
  ticket_type?: TicketType;
  priority: Priority;
  status: TicketStatus;
  created_at: string;
  author: { id: number; name: string };
}
