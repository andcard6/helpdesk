import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, RegisterPayload, Role, User } from './models';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly token = signal<string | null>(this.validToken());
  readonly user = signal<User | null>(this.readStoredUser());
  readonly isLoggedIn = computed(() => !!this.token() && !!this.user());

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  register(payload: RegisterPayload) {
    return this.http.post<User>(`${environment.apiUrl}/auth/register`, {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      ...(payload.phone ? { phone: payload.phone } : {}),
    });
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(...roles: Role[]) {
    const current = this.user();
    return !!current && roles.includes(current.role);
  }

  private setSession(res: LoginResponse) {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.token.set(res.access_token);
    this.user.set(res.user);
  }

  private readStoredUser(): User | null {
    if (!this.token()) return null;
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as User | null;
    } catch {
      return null;
    }
  }

  /** Devuelve el token guardado solo si el JWT no ha expirado. */
  private validToken(): string | null {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    try {
      const payload = stored.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      if (JSON.parse(atob(payload)).exp * 1000 > Date.now()) return stored;
    } catch {
      // Token malformado: se descarta
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
}
