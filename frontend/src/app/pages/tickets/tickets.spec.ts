import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { Role, Ticket } from '../../core/models';
import { Tickets } from './tickets';

const ticket: Ticket = {
  id: 1,
  title: 'La impresora no funciona',
  description: 'Atasco de papel',
  ticket_type: 'incident',
  priority: 'high',
  status: 'open',
  created_at: '2026-10-10T15:00:00Z',
  author: { id: 2, name: 'Luis', email: 'luis@x.com', role: 'user' },
  assigned_to: null,
  comments: [],
};
const url = `${environment.apiUrl}/tickets`;

describe('Tickets', () => {
  let component: Tickets;
  let fixture: ComponentFixture<Tickets>;
  let http: HttpTestingController;

  async function setup(role: Role, tickets: Ticket[] = [ticket]) {
    TestBed.inject(AuthService).user.set({
      id: 1,
      name: 'Ana',
      email: 'a@x.com',
      role,
      is_active: true,
    });
    fixture = TestBed.createComponent(Tickets);
    component = fixture.componentInstance;
    http.expectOne(url).flush(tickets);
    await fixture.whenStable();
    fixture.detectChanges();
  }
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Tickets],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should create', async () => {
    await setup('user');
    expect(component).toBeTruthy();
  });

  it('lists tickets and filters them locally by status and search', async () => {
    const second: Ticket = { ...ticket, id: 2, title: 'Sin red', status: 'closed', priority: 'low' };
    await setup('agent', [ticket, second]);

    expect(component.filteredTickets().length).toBe(2);
    component.statusFilter.set('closed');
    expect(component.filteredTickets().map((t) => t.id)).toEqual([2]);

    component.statusFilter.set('all');
    component.search.set('impresora');
    expect(component.filteredTickets().map((t) => t.id)).toEqual([1]);
  });

  describe('as a user', () => {
    beforeEach(() => setup('user'));

    it('sees "Mis tickets" and the creation form', () => {
      expect(el().querySelector('h1')?.textContent).toBe('Mis tickets');
      expect(el().querySelector('form.ticket-form')).toBeTruthy();
    });

    it('cannot change status inline or delete', () => {
      expect(el().querySelector('tbody select')).toBeNull();
      expect(el().querySelector('button.danger')).toBeNull();
    });

    it('create() posts the ticket, prepends it and resets the form', () => {
      component.form.setValue({
        title: 'Nuevo',
        description: 'Detalle',
        ticket_type: 'request',
        priority: 'low',
      });
      component.create();

      const req = http.expectOne(url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        title: 'Nuevo',
        description: 'Detalle',
        ticket_type: 'request',
        priority: 'low',
      });
      req.flush({ ...ticket, id: 9, title: 'Nuevo' });

      expect(component.tickets()[0].id).toBe(9);
      expect(component.tickets().length).toBe(2);
      expect(component.form.controls.title.value).toBe('');
      expect(component.form.controls.priority.value).toBe('medium');
    });
  });

  describe('as an agent', () => {
    beforeEach(() => setup('agent'));

    it('sees "Todos los tickets", status selector and no creation form or delete button', () => {
      expect(el().querySelector('h1')?.textContent).toBe('Todos los tickets');
      expect(el().querySelector('tbody select')).toBeTruthy();
      expect(el().querySelector('form.ticket-form')).toBeNull();
      expect(el().querySelector('button.danger')).toBeNull();
    });

    it('setStatus() sends PATCH and updates the row', () => {
      component.setStatus(ticket, 'closed');
      const req = http.expectOne(`${url}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'closed' });
      req.flush({ ...ticket, status: 'closed' });
      expect(component.tickets()[0].status).toBe('closed');
    });

    it('setStatus() reloads list and shows error when API fails', () => {
      component.setStatus(ticket, 'closed');
      http.expectOne(`${url}/1`).flush({}, { status: 403, statusText: 'Forbidden' });
      expect(component.error()).toContain('No tienes permisos');
      http.expectOne(url).flush([ticket]);
    });
  });

  describe('as an admin', () => {
    beforeEach(() => setup('admin'));

    it('sees delete button and removes ticket after confirmation', () => {
      expect(el().querySelector('button.danger')).toBeTruthy();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.remove(ticket);
      const req = http.expectOne(`${url}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      expect(component.tickets().length).toBe(0);
    });
  });
});
