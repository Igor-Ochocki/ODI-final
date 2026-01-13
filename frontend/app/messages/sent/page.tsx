"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { decryptRSA, importAESKey, decryptAES, base64ToArrayBuffer } from "@/lib/crypto";
import { getCryptoKeyPair } from "@/lib/indexeddb";
import { useAuth } from "@/contextAPI/auth-context";
import SentHeader from "@/components/messages/sent/SentHeader";
import SentMessageList from "@/components/messages/sent/SentMessageList";

interface Message {
  id: string;
  sender?: {
    id: string;
    username: string;
    email: string;
  };
  subject_encrypted: string;
  encrypted_key: string;
  has_attachments: boolean;
  attachments_count: number;
  recipients_count: number;
  created_at: string;
  is_read: boolean;
}

export default function SentPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedSubjects, setDecryptedSubjects] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const privateKeyRef = useRef<CryptoKey | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const decryptSubjects = useCallback(
    async (msgs: Message[]) => {
      if (!user?.id) {
        privateKeyRef.current = null;
        currentUserIdRef.current = null;
        return;
      }

      try {
        if (currentUserIdRef.current !== user.id) {
          privateKeyRef.current = null;
          currentUserIdRef.current = user.id;
        }

        const cryptoKeyPair = await getCryptoKeyPair(user.id);
        if (!cryptoKeyPair) {
          privateKeyRef.current = null;
          return;
        }

        if (!privateKeyRef.current) {
          privateKeyRef.current = cryptoKeyPair.privateKey;
        }

        const newDecrypted = new Map<string, string>();

        for (const msg of msgs) {
          if (!msg.encrypted_key) continue;

          try {
            const encryptedKeyBuffer = base64ToArrayBuffer(msg.encrypted_key);
            const aesKeyRaw = await decryptRSA(encryptedKeyBuffer, privateKeyRef.current);
            const aesKey = await importAESKey(aesKeyRaw);

            const subjectBuffer = base64ToArrayBuffer(msg.subject_encrypted);
            const subjectNonce = subjectBuffer.slice(0, 12);
            const subjectCiphertext = subjectBuffer.slice(12);
            const decryptedSubject = await decryptAES(subjectCiphertext, aesKey, subjectNonce);
            const subject = new TextDecoder().decode(decryptedSubject);

            newDecrypted.set(msg.id, subject);
          } catch (e) {
            console.error("Failed to decrypt subject for message:", msg.id, e);
          }
        }

        setDecryptedSubjects(newDecrypted);
      } catch (err) {
        console.error("Failed to decrypt subjects:", err);
        privateKeyRef.current = null;
      }
    },
    [user?.id]
  );

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.getSent(page, 20);

      if (response.data) {
        setMessages(response.data.messages);
        setTotalPages(response.data.total_pages);
        setTotal(response.data.total);
        await decryptSubjects(response.data.messages);
      } else if (response.error) {
        setError(response.message || "Error fetching messages");
      }
    } catch {
      setError("Server connection error");
    } finally {
      setIsLoading(false);
    }
  }, [page, decryptSubjects]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("pl-PL", { weekday: "short" });
    } else {
      return date.toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "short",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <SentHeader isLoading={isLoading} onRefresh={fetchMessages} />

      <div className="px-4 py-4">
        <SentMessageList
          messages={messages}
          decryptedSubjects={decryptedSubjects}
          isLoading={isLoading}
          error={error}
          page={page}
          totalPages={totalPages}
          total={total}
          formatDate={formatDate}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
