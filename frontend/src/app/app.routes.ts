import { Routes } from '@angular/router';
import { authGuard } from './core/auth-guard';
import { roleGuard } from './core/role-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tickets/tickets').then((m) => m.Tickets),
  },
  {
    path: 'tickets/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/ticket-detail/ticket-detail').then((m) => m.TicketDetail),
  },
  {
    path: 'users',
    canActivate: [roleGuard('admin', 'coordinator')],
    loadComponent: () => import('./pages/users/users').then((m) => m.Users),
  },
  { path: '', pathMatch: 'full', redirectTo: 'tickets' },
  { path: '**', redirectTo: 'tickets' },
];
