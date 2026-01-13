"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { decryptSubject } from "@/lib/crypto";
import { getCryptoKeyPair } from "@/lib/indexeddb";
import { useAuth } from "@/contextAPI/auth-context";
import { Message } from "@/types/interfaces";
import Header from "@/components/messages/Header";
import Inbox from "@/components/messages/Inbox";

export default function InboxPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedSubjects, setDecryptedSubjects] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [unreadOnly, setUnreadOnly] = useState(false);
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
            const subject = await decryptSubject(msg, privateKeyRef.current);
            newDecrypted.set(msg.id, subject);
          } catch (e) {
            console.error("Failed to decrypt subject for message:", msg.id, e);
            setError("Error decrypting message");
          }
        }

        setDecryptedSubjects(newDecrypted);
      } catch (err) {
        console.error("Failed to decrypt subjects:", err);
        setError("Error decrypting messages");
        privateKeyRef.current = null;
      }
    },
    [user?.id]
  );

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.getInbox(page, 20, unreadOnly);

      if (response.data) {
        setMessages(response.data.messages);
        setTotalPages(response.data.total_pages);
        setTotal(response.data.total);
        await decryptSubjects(response.data.messages);
      } else if (response.error) {
        setError(response.message || "Error fetching messages");
      }
    } catch {
      setError("Error connecting to server");
    } finally {
      setIsLoading(false);
    }
  }, [page, unreadOnly, decryptSubjects]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSelectAll = () => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map((m) => m.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleMarkRead = async () => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    const response = await api.markMessagesRead(ids);

    if (response.data) {
      setMessages((prev) => prev.map((m) => (selectedIds.has(m.id) ? { ...m, is_read: true } : m)));
      setSelectedIds(new Set());
      window.dispatchEvent(new CustomEvent("message-read"));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} messages?`)) {
      return;
    }

    const ids = Array.from(selectedIds);
    const response = await api.deleteMessages(ids);

    if (response.data) {
      fetchMessages();
      setSelectedIds(new Set());
      window.dispatchEvent(new CustomEvent("message-read"));
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        isLoading={isLoading}
        unreadOnly={unreadOnly}
        selectedIds={selectedIds}
        messages={messages}
        setUnreadOnly={setUnreadOnly}
        setPage={setPage}
        fetchMessages={fetchMessages}
        handleSelectAll={handleSelectAll}
        handleMarkRead={handleMarkRead}
        handleDelete={handleDelete}
      />

      <Inbox
        error={error}
        isLoading={isLoading}
        messages={messages}
        unreadOnly={unreadOnly}
        selectedIds={selectedIds}
        handleSelect={handleSelect}
        decryptedSubjects={decryptedSubjects}
        totalPages={totalPages}
        total={total}
        page={page}
        setPage={setPage}
      />
    </div>
  );
}
