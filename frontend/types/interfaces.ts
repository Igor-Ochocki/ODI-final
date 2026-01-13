export interface User {
  id: string;
  email: string;
  username: string;
  signing_public_key: string;
  totp_enabled: boolean;
  created_at: string;
  last_login?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  totp_code?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  signing_public_key: string;
}

export interface LoginResponse {
  success: boolean;
  error?: string;
  message?: string;
  requires2FA?: boolean;
}

export interface GenericResponse {
  success: boolean;
  error?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Setup2FAResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
  provisioning_uri: string;
}

export interface SuccessResponse {
  success: boolean;
}

export interface SearchUserResponse {
  user_id: string;
  username: string;
  email: string;
  signing_public_key: string;
}

export interface GetUserPublicKeyResponse {
  user_id: string;
  username: string;
  email: string;
  signing_public_key: string;
}

export interface SendMessageRequest {
  subject_encrypted: string;
  body_encrypted: string;
  signature: string;
  recipients: Array<{
    recipient_id: string;
    encrypted_key: string;
  }>;
  sender_encrypted_key?: string;
  attachments?: Array<{
    filename_encrypted: string;
  }>;
}

export interface SendMessageResponse {
  message_id: string;
  recipients_count: number;
  attachments_count: number;
}

export interface MessageListItem {
  id: string;
  sender?: {
    id: string;
    username: string;
    email: string;
    signing_public_key: string;
  };
  subject_encrypted: string;
  encrypted_key: string;
  has_attachments: boolean;
  attachments_count: number;
  recipients_count: number;
  created_at: string;
  is_read: boolean;
}

export interface MessageListResponse {
  messages: Array<MessageListItem>;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface GetMessageResponse {
  id: string;
  sender?: {
    id: string;
    username: string;
    email: string;
    signing_public_key: string;
  };
  subject_encrypted: string;
  body_encrypted: string;
  signature: string;
  encrypted_key: string;
  attachments: Array<{
    id: string;
    filename_encrypted: string;
    mime_type_encrypted: string;
    size: number;
    encryption_nonce: string;
    checksum: string;
  }>;
  recipients: Array<{
    recipient_id: string;
    recipient_username: string;
    recipient_email: string;
    is_read: boolean;
    read_at?: string;
  }>;
  created_at: string;
  is_read: boolean;
  read_at?: string;
}

export interface Message {
  id: string;
  sender?: {
    id: string;
    username: string;
    email: string;
    signing_public_key: string;
  };
  subject_encrypted: string;
  encrypted_key: string;
  has_attachments: boolean;
  attachments_count: number;
  recipients_count: number;
  created_at: string;
  is_read: boolean;
}

export interface MessageDetail {
  id: string;
  sender?: {
    id: string;
    username: string;
    email: string;
    signing_public_key: string;
  };
  subject_encrypted: string;
  body_encrypted: string;
  signature: string;
  encrypted_key: string;
  attachments: Array<{
    id: string;
    filename_encrypted: string;
    mime_type_encrypted: string;
    size: number;
    encryption_nonce: string;
    checksum: string;
  }>;
  recipients: Array<{
    recipient_id: string;
    recipient_username: string;
    recipient_email: string;
    is_read: boolean;
    read_at?: string;
  }>;
  created_at: string;
  is_read: boolean;
  read_at?: string;
}
