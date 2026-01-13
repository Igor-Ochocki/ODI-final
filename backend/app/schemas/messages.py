import datetime

from pydantic import BaseModel, Field, field_validator


class AttachmentCreate(BaseModel):
    filename_encrypted: str = Field(
        ...,
        max_length=1000,
        description="Base64 of attachment's encrypted filename"
    )
    mime_type_encrypted: str = Field(
        ...,
        max_length=500,
        description="Base64 of attachment's encrypted MIME type"
    )
    size: int = Field(
        ...,
        gt=0,
        lt=25 * 1024 * 1024, # 25MB
        description="Size of the original attachment"
    )
    content_encrypted: str = Field(
        ...,
        description="Base64 of encrypted file's content"
    )
    encryption_nonce: str = Field(
        ...,
        min_length=24,
        max_length=32,
        description="Nonce used for encryption (hex)"
    )
    checksum: str = Field(
        ...,
        min_length=64,
        max_length=64,
        description="SHA-256 hash of the original attachment (hex)"
    )

class RecipientKey(BaseModel):
    recipient_id: str = Field(
        ...,
        description="Id of the recipient"
    )
    encrypted_key: str = Field(
        ...,
        description="Base64 of AES key encrypted using RSA-OAEP"
    )

class MessageCreate(BaseModel):
    subject_encrypted: str = Field(
        ...,
        max_length=1000,
        description="Base64 of encrypted message's subject"
    )
    body_encrypted: str = Field(
        ...,
        max_length=1000000, # ~750KB after base64
        description="Base64 of encrypted message's body"
    )
    signature: str = Field(
        ...,
        min_length=128,
        max_length=128,
        description="Ed25519 signature of the message (hex)"
    )
    recipients: list[RecipientKey] = Field(
        ...,
        min_length=1,
        max_length=50,
        description="List of recipients and their encrypted keys"
    )
    sender_encrypted_key: str = Field(
        ...,
        description="Base64 of sender's encrypted key for read purposes"
    )
    attachments: list[AttachmentCreate] | None = Field(
        None,
        max_length = 10,
        description="List of attachments"
    )

    @field_validator("recipients")
    @classmethod
    def validate_recipients(cls, v: list[RecipientKey]) -> list[RecipientKey]:
        recipiet_ids = [recipient.recipient_id for recipient in v]
        if len(recipiet_ids) != len(set(recipiet_ids)):
            raise ValueError("Duplicate recipient Ids found")
        return v

class AttachmentResponse(BaseModel):
    id: str

    filename_encrypted: str
    mime_type_encrypted: str
    size: int

    encryption_nonce: str
    checksum: str

    class Config:
        from_attributes = True

class RecipientStatus(BaseModel):
    recipient_id: str
    recipient_username: str
    recipient_email: str

    is_read: bool
    read_at: datetime.datetime | None = None

class SenderInfo(BaseModel):
    id: str
    username: str
    email: str
    signing_public_key: str

class MessageResponse(BaseModel):
    id: str
    sender: SenderInfo | None = None

    subject_encrypted: str
    body_encrypted: str
    signature: str
    
    encrypted_key: str

    attachments: list[AttachmentResponse] = []
    recipients: list[RecipientStatus] = []

    created_at: datetime.datetime
    is_read: bool
    read_at: datetime.datetime | None = None

    class Config:
        from_attributes = True

class MessageListItem(BaseModel):
    id:str
    sender: SenderInfo | None = None

    subject_encrypted: str

    encrypted_key: str

    has_attachments: bool
    attachments_count: int
    recipients_count: int

    created_at: datetime.datetime
    is_read: bool

    class Config:
        from_attributes = True

class MessageListResponse(BaseModel):
    messages: list[MessageListItem]
    total: int
    page: int
    page_size: int
    total_pages: int

class MarkMessageRead(BaseModel):
    message_ids: list[str] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of message ids to mark as read"
    )

class MessageDelete(BaseModel):
    message_ids: list[str] = Field(
        ..., 
        min_length=1, 
        max_length=100,
        description="List of message ids to delete"
    )
