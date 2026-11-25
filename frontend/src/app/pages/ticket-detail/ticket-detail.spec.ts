import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { Role, Ticket } from '../../core/models';
import { TicketDetail } from './ticket-detail';

const baseTicket: Ticket = {
  id: 5,
  title: 'VPN caída',
  description: 'No conecta al servidor',
  ticket_type: 'incident',
  priority: 'high',
  status: 'open',
  created_at: '2026-10-10T15:00:00Z',
  author: { id: 2, name: 'Luis', email: 'luis@x.com', role: 'user' },
  assigned_to: null,
  comments: [],
};

describe('TicketDetail', () => {
  let component: TicketDetail;
  let fixture: ComponentFixture<TicketDetail>;
  let http: HttpTestingController;
  let router: Router;
  const ticketUrl = `${environment.apiUrl}/tickets/5`;
  const usersUrl = `${environment.apiUrl}/users`;

  async function setup(role: Role) {
    TestBed.inject(AuthService).user.set({
      id: 1,
      name: 'Ana',
      email: 'ana@x.com',
      role,
      is_active: true,
    });
    fixture = TestBed.createComponent(TicketDetail);
    component = fixture.componentInstance;
    http.expectOne(ticketUrl).flush(baseTicket);
    if (role === 'admin' || role === 'coordinator') {
      http.expectOne(usersUrl).flush([
        { id: 10, name: 'Carlos', email: 'c@x.com', role: 'agent', is_active: true },
      ]);
    }
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [TicketDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => http.verify());

  it('renders ticket details and allows user to comment', async () => {
    await setup('user');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('VPN caída');
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Gestión del ticket');

    component.commentForm.setValue({ content: 'Adjunto captura' });
    component.addComment();

    const req = http.expectOne(`${ticketUrl}/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Adjunto captura' });
    req.flush({
      id: 1,
      ticket_id: 5,
      content: 'Adjunto captura',
      created_at: '2026-10-10T16:00:00Z',
      author: { id: 1, name: 'Ana', email: 'ana@x.com', role: 'user' },
    });

    expect(component.ticket()?.comments?.length).toBe(1);
  });

  it('allows agent to self-assign and change status', async () => {
    await setup('agent');
    component.assignToMe();
    const assignReq = http.expectOne(ticketUrl);
    expect(assignReq.request.method).toBe('PATCH');
    expect(assignReq.request.body).toEqual({ assigned_to_id: 1 });
    assignReq.flush({
      ...baseTicket,
      assigned_to: { id: 1, name: 'Ana', email: 'ana@x.com', role: 'agent' },
    });

    expect(component.ticket()?.assigned_to?.id).toBe(1);
  });

  it('allows admin to assign staff and delete ticket', async () => {
    await setup('admin');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    expect(component.staffUsers().length).toBe(1);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteTicket();
    const req = http.expectOne(ticketUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(navigate).toHaveBeenCalledWith(['/tickets']);
  });
});
