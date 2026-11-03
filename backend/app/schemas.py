from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from .models import Priority, Role, TicketStatus, TicketType


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --- USUARIOS ---

class UserSummaryOut(ORM):
    id: int
    name: str
    email: str
    phone: str | None = None
    role: Role


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    password: str = Field(min_length=8, max_length=72)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORM):
    id: int
    name: str
    email: str
    phone: str | None = None
    role: Role
    is_active: bool


class UserUpdate(BaseModel):
    role: Role | None = None
    phone: str | None = None
    is_active: bool | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# --- SEGUIMIENTO / COMENTARIOS ---

class CommentIn(BaseModel):
    content: str = Field(min_length=1)


class CommentOut(ORM):
    id: int
    ticket_id: int
    content: str
    created_at: datetime
    author: UserSummaryOut


# --- TICKETS ---

class TicketIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1)
    ticket_type: TicketType = TicketType.incident
    priority: Priority = Priority.medium


class TicketUpdate(BaseModel):
    status: TicketStatus | None = None
    priority: Priority | None = None
    assigned_to_id: int | None = None  # Para que un coordinador o técnico se asignen el ticket


class TicketOut(ORM):
    id: int
    title: str
    description: str
    ticket_type: TicketType
    priority: Priority
    status: TicketStatus
    created_at: datetime
    first_responded_at: datetime | None = None
    closed_at: datetime | None = None
    sla_due_at: datetime | None = None
    author: UserSummaryOut
    assigned_to: UserSummaryOut | None = None
    comments: list[CommentOut] = []