import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { TicketService } from './ticket.service';

describe('TicketService', () => {
  let service: TicketService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/tickets`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TicketService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('list() sends GET /tickets', () => {
    service.list().subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getById() sends GET /tickets/:id', () => {
    service.getById(4).subscribe();
    const req = http.expectOne(`${url}/4`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('create() sends POST /tickets with payload', () => {
    const payload = {
      title: 'Falla',
      description: 'No imprime',
      ticket_type: 'incident' as const,
      priority: 'high' as const,
    };
    service.create(payload).subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({});
  });

  it('update() sends PATCH /tickets/:id with partial payload', () => {
    service.update(7, { status: 'in_progress', assigned_to_id: 2 }).subscribe();
    const req = http.expectOne(`${url}/7`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'in_progress', assigned_to_id: 2 });
    req.flush({});
  });

  it('addComment() sends POST /tickets/:id/comments', () => {
    service.addComment(7, 'Revisando equipo').subscribe();
    const req = http.expectOne(`${url}/7/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Revisando equipo' });
    req.flush({});
  });

  it('remove() sends DELETE /tickets/:id', () => {
    service.remove(7).subscribe();
    const req = http.expectOne(`${url}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
