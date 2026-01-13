"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contextAPI/auth-context";
import { encryptMessage, encryptAttachment, sha256, arrayBufferToHex } from "@/lib/crypto";
import { AlertCircle, Check } from "lucide-react";
import { getCryptoKeyPair } from "@/lib/indexeddb";
import ComposeHeader from "@/components/messages/compose/ComposeHeader";
import RecipientSelector from "@/components/messages/compose/RecipientSelector";
import MessageForm from "@/components/messages/compose/MessageForm";
import AttachmentList from "@/components/messages/compose/AttachmentList";

interface Recipient {
  user_id: string;
  username: string;
  email: string;
  signing_public_key: string;
}

interface AttachmentFile {
  file: File;
  id: string;
}

export default function ComposePage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: AttachmentFile[] = Array.from(files).map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
    }));

    setAttachments([...attachments, ...newAttachments]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      setError("Select at least one recipient");
      return;
    }

    if (!subject.trim()) {
      setError("Enter message subject");
      return;
    }

    if (!body.trim()) {
      setError("Enter message body");
      return;
    }

    setError("");
    setIsSending(true);

    try {
      const cryptoKeyPair = await getCryptoKeyPair(user?.id || "");
      if (!cryptoKeyPair) {
        setError("Error while reading key pair from indexedDB");
        return;
      }

      const publicKey = cryptoKeyPair.publicKey;

      const recipientPublicKeys = recipients.map((r) => ({
        recipientId: r.user_id,
        publicKeyPem: r.signing_public_key,
      }));

      const { subjectEncrypted, bodyEncrypted, recipientKeys, senderEncryptedKey, aesKey } =
        await encryptMessage(subject, body, recipientPublicKeys, publicKey);

      let encryptedAttachments: Array<{
        filename_encrypted: string;
        mime_type_encrypted: string;
        size: number;
        content_encrypted: string;
        encryption_nonce: string;
        checksum: string;
      }> = [];

      if (attachments.length > 0) {
        for (const att of attachments) {
          const encrypted = await encryptAttachment(att.file, aesKey);
          encryptedAttachments.push({
            filename_encrypted: encrypted.filenameEncrypted,
            mime_type_encrypted: encrypted.mimeTypeEncrypted,
            size: att.file.size,
            content_encrypted: encrypted.contentEncrypted,
            encryption_nonce: encrypted.nonce,
            checksum: encrypted.checksum,
          });
        }
      }

      const signatureData = subjectEncrypted + bodyEncrypted + new Date().toISOString();
      const signatureHash = await sha256(signatureData);
      const signature = arrayBufferToHex(signatureHash).padEnd(128, "0");

      const response = await api.sendMessage({
        subject_encrypted: subjectEncrypted,
        body_encrypted: bodyEncrypted,
        signature: signature,
        recipients: recipientKeys.map((rk) => ({
          recipient_id: rk.recipientId,
          encrypted_key: rk.encryptedKey,
        })),
        sender_encrypted_key: senderEncryptedKey,
        attachments: encryptedAttachments.length > 0 ? encryptedAttachments : undefined,
      });

      if (response.error) {
        setError(response.message || "Message send error");
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/messages/sent");
      }, 2000);
    } catch (err) {
      console.error("Send error:", err);
      setError("Encryption or message send error");
    } finally {
      setIsSending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-500/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Message sent!</h1>
          <p className="text-dark-400">Your encrypted message has been delivered.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ComposeHeader
        isSending={isSending}
        canSend={recipients.length > 0 && subject.trim().length > 0 && body.trim().length > 0}
        onSend={handleSend}
      />

      <div className="px-4 py-6 max-w-4xl mx-auto">
        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="card-cyber space-y-6">
          <RecipientSelector recipients={recipients} onRecipientsChange={setRecipients} />

          <MessageForm
            subject={subject}
            body={body}
            onSubjectChange={setSubject}
            onBodyChange={setBody}
          />

          <AttachmentList
            attachments={attachments}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onRemove={removeAttachment}
          />
        </div>
      </div>
    </div>
  );
}
