import {
  ApiResponse,
  GenericResponse,
  GetMessageResponse,
  GetUserPublicKeyResponse,
  LoginRequest,
  MessageListResponse,
  RegisterRequest,
  SearchUserResponse,
  SendMessageRequest,
  SendMessageResponse,
  Setup2FAResponse,
  SuccessResponse,
  TokenResponse,
  User,
} from "@/types/interfaces";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost/api";

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem("access_token");
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("access_token", token);
      } else {
        localStorage.removeItem("access_token");
      }
    }
  }

  private getCsrfToken(): string | undefined {
    return Cookies.get("csrf_token");
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_URL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const method = options.method?.toUpperCase() || "GET";
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      if (response.status === 401 && this.accessToken) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers["Authorization"] = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
            credentials: "include",
          });
          return this.handleResponse<T>(retryResponse);
        }
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error("API request error:", error);
      return {
        error: "network_error",
        message: "Connection error",
      };
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get("content-type");

    let data: any;
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return {
        error: data.error || "unknown_error",
        message: data.message || data.detail || "An error occurred",
      };
    }

    return { data };
  }

  async refreshToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!response.ok) {
          this.setAccessToken(null);
          return false;
        }

        const data: TokenResponse = await response.json();
        this.setAccessToken(data.access_token);

        return true;
      } catch {
        this.setAccessToken(null);
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async register(data: RegisterRequest) {
    return this.request<GenericResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest) {
    const response = await this.request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.data) {
      this.setAccessToken(response.data.access_token);
    }

    return response;
  }

  async logout() {
    const response = await this.request("/auth/logout", {
      method: "POST",
    });

    this.setAccessToken(null);

    return response;
  }

  async setup2FA() {
    return this.request<Setup2FAResponse>("/auth/2fa/setup", {
      method: "POST",
    });
  }

  async verify2FA(code: string) {
    return this.request<SuccessResponse>("/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  async disable2FA(code: string) {
    return this.request<SuccessResponse>("/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  async requestPasswordReset(email: string) {
    return this.request("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    return this.request("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  async getCurrentUser() {
    return this.request<User>("/users/me");
  }

  async searchUsers(query: string) {
    return this.request<Array<SearchUserResponse>>(`/users/search?q=${encodeURIComponent(query)}`);
  }

  async getUserPublicKey(userId: string) {
    return this.request<GetUserPublicKeyResponse>(`/users/${userId}/public-key`);
  }

  async changePassword(currentPassword: string, newPassword: string, signingPublicKey?: string) {
    const body: any = {
      current_password: currentPassword,
      new_password: newPassword,
    };
    if (signingPublicKey) {
      body.signing_public_key = signingPublicKey;
    }
    return this.request("/users/me/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async sendMessage(data: SendMessageRequest) {
    return this.request<SendMessageResponse>("/messages/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getInbox(page = 1, pageSize = 20, unreadOnly = false) {
    return this.request<MessageListResponse>(
      `/messages/inbox?page=${page}&page_size=${pageSize}&unread_only=${unreadOnly}`
    );
  }

  async getSent(page = 1, pageSize = 20) {
    return this.request<MessageListResponse>(`/messages/sent?page=${page}&page_size=${pageSize}`);
  }

  async getMessage(messageId: string) {
    return this.request<GetMessageResponse>(`/messages/${messageId}`);
  }

  async markMessagesRead(messageIds: string[]) {
    return this.request<{ updated: number }>("/messages/mark-read", {
      method: "PUT",
      body: JSON.stringify({ message_ids: messageIds }),
    });
  }

  async deleteMessages(messageIds: string[]) {
    return this.request<{ deleted: number }>("/messages/", {
      method: "DELETE",
      body: JSON.stringify({ message_ids: messageIds }),
    });
  }

  async getUnreadCount() {
    return this.request<{ unread_count: number }>("/messages/unread/count");
  }

  async getAttachment(messageId: string, attachmentId: string) {
    const url = `${API_URL}/messages/${messageId}/attachments/${attachmentId}`;

    const headers: Record<string, string> = {};
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch attachment");
    }

    const blob = await response.blob();
    const nonce = response.headers.get("X-Encryption-Nonce");
    const checksum = response.headers.get("X-Checksum");

    return { blob, nonce, checksum };
  }
}

export const api = new ApiClient();
