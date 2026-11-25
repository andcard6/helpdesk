import { Routes } from '@angular/router';

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
    loadComponent: () => import('./pages/tickets/tickets').then((m) => m.Tickets),
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users').then((m) => m.Users),
  },
  { path: '', pathMatch: 'full', redirectTo: 'tickets' },
  { path: '**', redirectTo: 'tickets' },
];
