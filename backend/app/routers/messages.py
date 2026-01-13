import os
import uuid
import base64
import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.users import User
from app.models.messages import Message, MessageRecipient, Attachment
from app.schemas.messages import (
    MessageCreate, MessageResponse, MessageListResponse,
    MessageListItem, RecipientStatus, SenderInfo,
    MarkMessageRead, MessageDelete, AttachmentResponse
)
from app.routers.dependencies import get_current_user
from app.config import get_settings


settings = get_settings()
router = APIRouter(prefix="/messages", tags=["Messages"])

@router.post("/", response_model=dict)
async def send_message(
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    recipient_ids = [r.recipient_id for r in data.recipients]
    
    result = await db.execute(
        select(User).where(
            User.id.in_(recipient_ids),
            User.is_active == True
        )
    )
    valid_recipients = {u.id for u in result.scalars().all()}
    
    invalid_recipients = set(recipient_ids) - valid_recipients
    if invalid_recipients:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid recipients: {', '.join(invalid_recipients)}"
        )
    
    message = Message(
        sender_id=current_user.id,
        subject_encrypted=data.subject_encrypted,
        body_encrypted=data.body_encrypted,
        signature=data.signature,
        sender_encrypted_key=data.sender_encrypted_key
    ) # type: ignore[call-arg]
    db.add(message)
    await db.flush()
    
    for recipient_data in data.recipients:
        recipient = MessageRecipient(
            message_id=message.id,
            recipient_id=recipient_data.recipient_id,
            encrypted_key=recipient_data.encrypted_key
        ) # type: ignore[call-arg]
        db.add(recipient)
    
    if data.attachments:
        attachments_dir = os.path.join(settings.ATTACHMENTS_DIR, message.id)
        os.makedirs(attachments_dir, exist_ok=True)
        
        for att_data in data.attachments:
            attachment_id = str(uuid.uuid4())
            file_path = os.path.join(attachments_dir, attachment_id)
            
            encrypted_content = base64.b64decode(att_data.content_encrypted)
            with open(file_path, "wb") as f:
                f.write(encrypted_content)
            
            attachment = Attachment(
                id=attachment_id,
                message_id=message.id,
                filename_encrypted=att_data.filename_encrypted,
                mime_type_encrypted=att_data.mime_type_encrypted,
                size=att_data.size,
                storage_path=file_path,
                encryption_nonce=att_data.encryption_nonce,
                checksum=att_data.checksum
            ) # type: ignore[call-arg]
            db.add(attachment)
    
    await db.commit()
    
    return {
        "message_id": message.id,
        "recipients_count": len(data.recipients),
        "attachments_count": len(data.attachments) if data.attachments else 0
    }

@router.get("/inbox", response_model=MessageListResponse)
async def get_inbox(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    base_query = (
        select(MessageRecipient)
        .options(
            selectinload(MessageRecipient.message).selectinload(Message.sender),
            selectinload(MessageRecipient.message).selectinload(Message.attachments),
            selectinload(MessageRecipient.message).selectinload(Message.recipients)
        )
        .where(
            MessageRecipient.recipient_id == current_user.id,
            MessageRecipient.is_deleted == False
        )
    )
    
    if unread_only:
        base_query = base_query.where(MessageRecipient.is_read == False)
    
    count_result = await db.execute(
        select(func.count(MessageRecipient.id))
        .where(
            MessageRecipient.recipient_id == current_user.id,
            MessageRecipient.is_deleted == False
        )
    )
    total = count_result.scalar() or 0
    
    offset = (page - 1) * page_size
    result = await db.execute(
        base_query
        .order_by(MessageRecipient.message_id.desc())
        .offset(offset)
        .limit(page_size)
    )
    
    recipients = result.scalars().all()
    
    messages = []
    for mr in recipients:
        msg = mr.message
        sender = msg.sender
        
        sender_info = None
        if sender:
            sender_info = SenderInfo(
                id=sender.id,
                username=sender.username,
                email=sender.email,
                signing_public_key=sender.signing_public_key
            )
        
        messages.append(MessageListItem(
            id=msg.id,
            sender=sender_info,
            subject_encrypted=msg.subject_encrypted,
            encrypted_key=mr.encrypted_key,
            has_attachments=len(msg.attachments) > 0,
            attachments_count=len(msg.attachments),
            recipients_count=len(msg.recipients),
            created_at=msg.created_at,
            is_read=mr.is_read
        ))
    
    total_pages = (total + page_size - 1) // page_size
    
    return MessageListResponse(
        messages=messages,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/sent", response_model=MessageListResponse)
async def get_sent(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    count_result = await db.execute(
        select(func.count(Message.id))
        .where(Message.sender_id == current_user.id)
    )
    total = count_result.scalar() or 0
    
    offset = (page - 1) * page_size
    result = await db.execute(
        select(Message)
        .options(
            selectinload(Message.attachments),
            selectinload(Message.recipients).selectinload(MessageRecipient.recipient)
        )
        .where(Message.sender_id == current_user.id)
        .order_by(Message.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    
    db_messages = result.scalars().all()
    
    messages = []
    for msg in db_messages:
        sender_info = SenderInfo(
            id=current_user.id,
            username=current_user.username,
            email=current_user.email,
            signing_public_key=current_user.signing_public_key
        )
        
        messages.append(MessageListItem(
            id=msg.id,
            sender=sender_info,
            subject_encrypted=msg.subject_encrypted,
            encrypted_key=msg.sender_encrypted_key or "",
            has_attachments=len(msg.attachments) > 0,
            attachments_count=len(msg.attachments),
            recipients_count=len(msg.recipients),
            created_at=msg.created_at,
            is_read=True
        ))
    
    total_pages = (total + page_size - 1) // page_size
    
    return MessageListResponse(
        messages=messages,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{message_id}", response_model=MessageResponse)
async def get_message(
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Message)
        .options(
            selectinload(Message.sender),
            selectinload(Message.attachments),
            selectinload(Message.recipients).selectinload(MessageRecipient.recipient)
        )
        .where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    is_sender = message.sender_id == current_user.id
    recipient_record = None
    
    for mr in message.recipients:
        if mr.recipient_id == current_user.id:
            recipient_record = mr
            break
    
    if not is_sender and not recipient_record:
        raise HTTPException(status_code=403, detail="No access to message")
    
    if recipient_record and recipient_record.is_deleted:
        raise HTTPException(status_code=404, detail="Message has been deleted")
    
    encrypted_key = ""
    if recipient_record:
        encrypted_key = recipient_record.encrypted_key
    elif is_sender and message.sender_encrypted_key:
        encrypted_key = message.sender_encrypted_key
    
    sender_info = None
    if message.sender:
        sender_info = SenderInfo(
            id=message.sender.id,
            username=message.sender.username,
            email=message.sender.email,
            signing_public_key=message.sender.signing_public_key
        )
    
    recipients_status = []
    for mr in message.recipients:
        if mr.recipient:
            recipients_status.append(RecipientStatus(
                recipient_id=mr.recipient_id,
                recipient_username=mr.recipient.username,
                recipient_email=mr.recipient.email,
                is_read=mr.is_read,
                read_at=mr.read_at
            ))
    
    attachments = [
        AttachmentResponse(
            id=att.id,
            filename_encrypted=att.filename_encrypted,
            mime_type_encrypted=att.mime_type_encrypted,
            size=att.size,
            encryption_nonce=att.encryption_nonce,
            checksum=att.checksum
        )
        for att in message.attachments
    ]
    
    return MessageResponse(
        id=message.id,
        sender=sender_info,
        subject_encrypted=message.subject_encrypted,
        body_encrypted=message.body_encrypted,
        signature=message.signature,
        encrypted_key=encrypted_key,
        attachments=attachments,
        recipients=recipients_status,
        created_at=message.created_at,
        is_read=recipient_record.is_read if recipient_record else True,
        read_at=recipient_record.read_at if recipient_record else None
    )

@router.put("/mark-read")
async def mark_messages_read(
    data: MarkMessageRead,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MessageRecipient)
        .where(
            MessageRecipient.message_id.in_(data.message_ids),
            MessageRecipient.recipient_id == current_user.id,
            MessageRecipient.is_deleted == False
        )
    )
    
    recipients = result.scalars().all()
    updated = 0
    
    for mr in recipients:
        if not mr.is_read:
            mr.is_read = True
            mr.read_at = datetime.datetime.now(datetime.timezone.utc)
            updated += 1
    
    await db.commit()
    
    return {"updated": updated}

@router.delete("/")
async def delete_messages(
    data: MessageDelete,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MessageRecipient)
        .where(
            MessageRecipient.message_id.in_(data.message_ids),
            MessageRecipient.recipient_id == current_user.id
        )
    )
    
    recipients = result.scalars().all()
    deleted = 0
    
    for mr in recipients:
        if not mr.is_deleted:
            mr.is_deleted = True
            mr.deleted_at = datetime.datetime.now(datetime.timezone.utc)
            deleted += 1
    
    await db.commit()
    
    return {"deleted": deleted}

@router.get("/{message_id}/attachments/{attachment_id}")
async def get_attachment(
    message_id: str,
    attachment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Message)
        .options(selectinload(Message.recipients))
        .where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    is_sender = message.sender_id == current_user.id
    is_recipient = any(mr.recipient_id == current_user.id for mr in message.recipients)
    
    if not is_sender and not is_recipient:
        raise HTTPException(status_code=403, detail="No access")
    
    result = await db.execute(
        select(Attachment)
        .where(
            Attachment.id == attachment_id,
            Attachment.message_id == message_id
        )
    )
    attachment = result.scalar_one_or_none()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    assert isinstance(attachment, Attachment)

    if not os.path.exists(attachment.storage_path):
        raise HTTPException(status_code=404, detail="Attachment file not found")
    
    def iterfile():
        with open(attachment.storage_path, "rb") as f:
            while chunk := f.read(8192):
                yield chunk
    
    return StreamingResponse(
        iterfile(),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={attachment_id}",
            "X-Encryption-Nonce": attachment.encryption_nonce,
            "X-Original-Size": str(attachment.size),
            "X-Checksum": attachment.checksum
        }
    )

@router.get("/unread/count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(func.count(MessageRecipient.id))
        .where(
            MessageRecipient.recipient_id == current_user.id,
            MessageRecipient.is_read == False,
            MessageRecipient.is_deleted == False
        )
    )
    count = result.scalar() or 0
    
    return {"unread_count": count}
