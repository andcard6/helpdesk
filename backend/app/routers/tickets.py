from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import CurrentUser, require_roles
from ..models import Role, Ticket, TicketComment, TicketStatus
from ..schemas import CommentIn, CommentOut, TicketIn, TicketOut, TicketUpdate

router = APIRouter(prefix="/tickets", tags=["tickets"])
DB = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[TicketOut])
def list_tickets(db: DB, user: CurrentUser):
    query = select(Ticket).order_by(Ticket.created_at.desc())
    
    # El usuario regular solo ve los tickets que él creó
    if user.role == Role.user:
        query = query.where(Ticket.author_id == user.id)
    # Los técnicos (agent) ven los asignados a ellos o sin asignar; coordinadores/admins ven todos
    elif user.role == Role.agent:
        query = query.where((Ticket.assigned_to_id == user.id) | (Ticket.assigned_to_id.is_(None)))

    return db.scalars(query).all()


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(ticket_id: int, db: DB, user: CurrentUser):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket no encontrado")
    
    # Validar permisos de lectura
    if user.role == Role.user and ticket.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes acceso a este ticket")
        
    return ticket


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(data: TicketIn, db: DB, user: CurrentUser):
    ticket = Ticket(**data.model_dump(), author_id=user.id)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int,
    data: TicketUpdate,
    db: DB,
    user: Annotated[CurrentUser, Depends(require_roles(Role.agent, Role.coordinator, Role.admin))],
):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket no encontrado")

    now = datetime.now(timezone.utc)

    # Si se cambia el estado y nunca se había respondido, registrar tiempo de primera respuesta
    if data.status and data.status != TicketStatus.open and not ticket.first_responded_at:
        ticket.first_responded_at = now

    # Si el ticket se cierra, registrar fecha de cierre
    if data.status == TicketStatus.closed and not ticket.closed_at:
        ticket.closed_at = now
    elif data.status and data.status != TicketStatus.closed:
        ticket.closed_at = None

    # Aplicar cambios enviados (estado, prioridad, técnico asignado)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)

    db.commit()
    db.refresh(ticket)
    return ticket


@router.post("/{ticket_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(ticket_id: int, data: CommentIn, db: DB, user: CurrentUser):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket no encontrado")

    # Un usuario normal solo puede comentar en sus propios tickets
    if user.role == Role.user and ticket.author_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No puedes comentar en este ticket")

    comment = TicketComment(ticket_id=ticket.id, author_id=user.id, content=data.content)
    db.add(comment)

    # Si es la primera respuesta de un técnico, marcar tiempo de primera respuesta
    if user.role in [Role.agent, Role.coordinator, Role.admin] and not ticket.first_responded_at:
        ticket.first_responded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(comment)
    return comment


@router.delete(
    "/{ticket_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(Role.admin))],
)
def delete_ticket(ticket_id: int, db: DB):
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ticket no encontrado")
    db.delete(ticket)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)