import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AuthService } from './core/auth.service';
import { Role } from './core/models';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();
  });

  async function render(role?: Role) {
    if (role) {
      const auth = TestBed.inject(AuthService);
      auth.token.set('abc');
      auth.user.set({ id: 1, name: 'Ana', email: 'a@x.com', role, is_active: true });
    }
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows only brand and auth links when logged out (no protected nav)', async () => {
    const el = await render();
    expect(el.querySelector('.brand')?.textContent).toContain('HelpDesk');
    expect(el.querySelector('nav')).toBeNull();
    expect(el.querySelector('.session')?.textContent).toContain('Iniciar sesión');
    expect(el.querySelector('.session')?.textContent).toContain('Registrarse');
  });

  it('shows the user name and role badge when logged in', async () => {
    const el = await render('agent');
    expect(el.querySelector('.session')?.textContent).toContain('Ana');
    expect(el.querySelector('.badge')?.textContent).toContain('agent');
  });

  it('shows the "Usuarios" link to admins and coordinators', async () => {
    expect((await render('admin')).querySelector('nav')?.textContent).toContain('Usuarios');
    expect((await render('coordinator')).querySelector('nav')?.textContent).toContain('Usuarios');
  });

  it('hides the "Usuarios" link from regular users and agents', async () => {
    expect((await render('user')).querySelector('nav')?.textContent).not.toContain('Usuarios');
    expect((await render('agent')).querySelector('nav')?.textContent).not.toContain('Usuarios');
  });
});
