import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Register } from './register';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('validates matching passwords before submitting', () => {
    component.form.setValue({
      name: 'Ana',
      email: 'ana@example.com',
      phone: '',
      password: 'password123',
      confirmPassword: 'different123',
    });
    component.submit();

    http.expectNone(`${environment.apiUrl}/auth/register`);
    expect(component.form.errors?.['passwordMismatch']).toBe(true);
  });

  it('goes to /login after registering', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.form.setValue({
      name: 'Ana',
      email: 'ana@example.com',
      phone: '',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.submit();

    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.body).toEqual({ name: 'Ana', email: 'ana@example.com', password: 'password123' });
    req.flush({ id: 1, name: 'Ana', email: 'ana@example.com', role: 'user', is_active: true });

    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('explains that the email is already registered on 409', () => {
    component.form.setValue({
      name: 'Ana',
      email: 'ana@example.com',
      phone: '',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.submit();

    http.expectOne(`${environment.apiUrl}/auth/register`).flush({}, { status: 409, statusText: 'Conflict' });
    expect(component.error()).toBe('Ese email ya está registrado');
    expect(component.loading()).toBe(false);
  });
});
