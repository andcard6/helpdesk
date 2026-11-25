import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tickets } from './tickets';

describe('Tickets', () => {
  let component: Tickets;
  let fixture: ComponentFixture<Tickets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tickets],
    }).compileComponents();

    fixture = TestBed.createComponent(Tickets);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds and removes tickets using signals', () => {
    const initialCount = component.tickets().length;
    component.title = 'Nuevo problema';
    component.description = 'Detalle del problema';
    component.create();

    expect(component.tickets().length).toBe(initialCount + 1);
    const created = component.tickets()[0];
    component.remove(created);
    expect(component.tickets().length).toBe(initialCount);
  });
});
