import datetime
import uuid

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
if TYPE_CHECKING:
    from app.models.users import User


def generate_uuid():
    return str(uuid.uuid4())

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    sender_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"))

    subject_encrypted: Mapped[str] = mapped_column(Text)
    body_encrypted: Mapped[str] = mapped_column(Text)

    sender_encrypted_key: Mapped[str] = mapped_column(String(128))
    signature: Mapped[str] = mapped_column(String(128))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))

    sender: Mapped["User"] = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])
    recipients: Mapped[list["MessageRecipient"]] = relationship(back_populates="message", cascade="all, delete-orphan")
    attachments: Mapped[list["Attachment"]] = relationship(back_populates="message", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Message {self.id} from {self.sender_id}>"

class MessageRecipient(Base):
    __tablename__ = "message_recipients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    message_id: Mapped[str] = mapped_column(String(36), ForeignKey("messages.id", ondelete="CASCADE"))
    recipient_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))

    encrypted_key: Mapped[str] = mapped_column(Text)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime.datetime | None] = mapped_column(DateTime)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime.datetime | None] = mapped_column(DateTime)

    message: Mapped["Message"] = relationship(back_populates="recipients")
    recipient: Mapped["User"] = relationship(back_populates="received_messages")

class Attachment(Base):
    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    message_id: Mapped[str] = mapped_column(String(36), ForeignKey("messages.id", ondelete="CASCADE"))

    filename_encrypted: Mapped[str] = mapped_column(Text)
    mime_type_encrypted: Mapped[str] = mapped_column(Text)
    size: Mapped[int] = mapped_column(Integer)

    storage_path: Mapped[str] = mapped_column(String(500))
    
    encryption_nonce: Mapped[str] = mapped_column(String(32))
    checksum: Mapped[str] = mapped_column(String(64))

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))

    message: Mapped["Message"] = relationship(back_populates="attachments")

    def __repr__(self):
        return f"<Attachment {self.id} for message {self.message_id}>"
