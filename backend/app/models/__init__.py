"""Modelos ORM da aplicação.

Importados aqui para que o SQLAlchemy registre todas as tabelas.
"""

from app.models.attachment import Attachment
from app.models.project import Project, user_projects
from app.models.ticket import Ticket
from app.models.ticket_history import TicketHistory
from app.models.user import User

__all__ = ["User", "Project", "user_projects", "Ticket", "Attachment", "TicketHistory"]
