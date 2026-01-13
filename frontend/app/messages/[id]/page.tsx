"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/contextAPI/auth-context";
import {
  decryptMessage,
  importRSAPublicKey,
  decryptAES,
  importAESKey,
  base64ToArrayBuffer,
  decryptRSA,
  hexToArrayBuffer,
  sha256,
  arrayBufferToHex,
} from "@/lib/crypto";
import { getCryptoKeyPair, hasPrivateKey } from "@/lib/indexeddb";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { MessageDetail } from "@/types/interfaces";
import MessageDetailHeader from "@/components/messages/message/MessageDetailHeader";
import MessageMetadata from "@/components/messages/message/MessageMetadata";
import MessageContent from "@/components/messages/message/MessageContent";
import MessageAttachments from "@/components/messages/message/MessageAttachments";
import E2EVerificationPanel from "@/components/messages/message/E2EVerificationPanel";
import DecryptModal from "@/components/messages/message/DecryptModal";

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const messageId = params.id as string;

  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [decryptedSubject, setDecryptedSubject] = useState<string>("");
  const [decryptedBody, setDecryptedBody] = useState<string>("");
  const [decryptedAttachments, setDecryptedAttachments] = useState<
    Map<string, { filename: string; mimeType: string }>
  >(new Map());
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoDecrypting, setIsAutoDecrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState("");
  const [decryptError, setDecryptError] = useState("");
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState<{
    privateKeyStored: boolean;
    canDecrypt: boolean;
    encryptionAlgorithm: string;
    keySize: string;
    publicKeyFingerprint?: string;
    messageFingerprint?: string;
  } | null>(null);
  const aesKeyRef = useRef<CryptoKey | null>(null);

  const tryAutoDecrypt = async (messageData: MessageDetail) => {
    if (!user?.id || !messageData.encrypted_key) {
      return false;
    }

    setIsAutoDecrypting(true);

    try {
      const cryptoKeyPair = await getCryptoKeyPair(user.id);
      if (!cryptoKeyPair) {
        setIsAutoDecrypting(false);
        return false;
      }

      const privateKey = cryptoKeyPair.privateKey;

      const encryptedKeyBuffer = base64ToArrayBuffer(messageData.encrypted_key);
      const aesKeyRaw = await decryptRSA(encryptedKeyBuffer, privateKey);
      const aesKey = await importAESKey(aesKeyRaw);
      aesKeyRef.current = aesKey;

      const { subject, body } = await decryptMessage(
        messageData.subject_encrypted,
        messageData.body_encrypted,
        messageData.encrypted_key,
        privateKey
      );

      setDecryptedSubject(subject);
      setDecryptedBody(body);

      if (messageData.attachments.length > 0) {
        const decryptedAtts = new Map<string, { filename: string; mimeType: string }>();

        for (const att of messageData.attachments) {
          try {
            const filenameBuffer = base64ToArrayBuffer(att.filename_encrypted);

            if (filenameBuffer.byteLength < 28) {
              throw new Error(`Invalid filename data length: ${filenameBuffer.byteLength}`);
            }

            const filenameNonce = new Uint8Array(filenameBuffer.slice(0, 12));
            const filenameCiphertext = filenameBuffer.slice(12);
            const filenameDecrypted = await decryptAES(
              filenameCiphertext,
              aesKey,
              filenameNonce as unknown as ArrayBuffer
            );
            const filename = new TextDecoder().decode(filenameDecrypted);

            const mimeBuffer = base64ToArrayBuffer(att.mime_type_encrypted);
            if (mimeBuffer.byteLength < 28) {
              throw new Error(`Invalid mime type data length: ${mimeBuffer.byteLength}`);
            }
            const mimeNonce = new Uint8Array(mimeBuffer.slice(0, 12));
            const mimeCiphertext = mimeBuffer.slice(12);
            const mimeDecrypted = await decryptAES(
              mimeCiphertext,
              aesKey,
              mimeNonce as unknown as ArrayBuffer
            );
            const mimeType = new TextDecoder().decode(mimeDecrypted);

            decryptedAtts.set(att.id, { filename, mimeType });
          } catch (e) {
            console.error("Failed to decrypt attachment metadata:", e);
            console.error(
              "This may be an old message where attachments were encrypted with a lost key."
            );
            decryptedAtts.set(att.id, {
              filename: "[Old message - key lost]",
              mimeType: "application/octet-stream",
            });
          }
        }

        setDecryptedAttachments(decryptedAtts);
      }

      setIsAutoDecrypting(false);
      return true;
    } catch (err) {
      console.error("Auto-decrypt failed:", err);
      setIsAutoDecrypting(false);
      return false;
    }
  };

  useEffect(() => {
    const fetchMessage = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.getMessage(messageId);
        if (response.error) {
          setError(response.message || "Cannot fetch message");
          return;
        }
        if (response.data) {
          setMessage(response.data);
          if (!response.data.is_read) {
            await api.markMessagesRead([messageId]);
            window.dispatchEvent(new CustomEvent("message-read"));
          }

          await tryAutoDecrypt(response.data);
        }
      } catch {
        setError("Server connection error");
      } finally {
        setIsLoading(false);
      }
    };

    if (messageId) {
      fetchMessage();
    }
  }, [messageId]);

  const handleDecrypt = async () => {
    if (!message || !user?.id) return;

    setIsDecrypting(true);
    setDecryptError("");

    try {
      const cryptoKeyPair = await getCryptoKeyPair(user.id);

      if (!cryptoKeyPair) {
        setDecryptError("Encryption keys not available. Please log in again.");
        return;
      }

      const privateKey = cryptoKeyPair.privateKey;

      const encryptedKeyBuffer = base64ToArrayBuffer(message.encrypted_key);
      const aesKeyRaw = await decryptRSA(encryptedKeyBuffer, privateKey);
      const aesKey = await importAESKey(aesKeyRaw);
      aesKeyRef.current = aesKey;

      const { subject, body } = await decryptMessage(
        message.subject_encrypted,
        message.body_encrypted,
        message.encrypted_key,
        privateKey
      );

      setDecryptedSubject(subject);
      setDecryptedBody(body);

      if (message.attachments.length > 0) {
        const decryptedAtts = new Map<string, { filename: string; mimeType: string }>();

        for (const att of message.attachments) {
          try {
            const filenameBuffer = base64ToArrayBuffer(att.filename_encrypted);

            if (filenameBuffer.byteLength < 28) {
              throw new Error(`Invalid filename data length: ${filenameBuffer.byteLength}`);
            }

            const filenameNonce = new Uint8Array(filenameBuffer.slice(0, 12));
            const filenameCiphertext = filenameBuffer.slice(12);
            const filenameDecrypted = await decryptAES(
              filenameCiphertext,
              aesKey,
              filenameNonce as unknown as ArrayBuffer
            );
            const filename = new TextDecoder().decode(filenameDecrypted);

            const mimeBuffer = base64ToArrayBuffer(att.mime_type_encrypted);
            if (mimeBuffer.byteLength < 28) {
              throw new Error(`Invalid mime type data length: ${mimeBuffer.byteLength}`);
            }
            const mimeNonce = new Uint8Array(mimeBuffer.slice(0, 12));
            const mimeCiphertext = mimeBuffer.slice(12);
            const mimeDecrypted = await decryptAES(
              mimeCiphertext,
              aesKey,
              mimeNonce as unknown as ArrayBuffer
            );
            const mimeType = new TextDecoder().decode(mimeDecrypted);

            decryptedAtts.set(att.id, { filename, mimeType });
          } catch (e) {
            console.error("Failed to decrypt attachment metadata:", e);
            console.error(
              "This may be an old message where attachments were encrypted with a lost key."
            );
            decryptedAtts.set(att.id, {
              filename: "[Old message - key lost]",
              mimeType: "application/octet-stream",
            });
          }
        }

        setDecryptedAttachments(decryptedAtts);
      }

      setShowDecryptModal(false);
    } catch (err) {
      console.error("Decrypt error:", err);
      setDecryptError("Decryption error. Please check if keys are available.");
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDownloadAttachment = async (attachmentId: string) => {
    if (!message || !aesKeyRef.current) return;

    const att = message.attachments.find((a) => a.id === attachmentId);
    if (!att) return;

    const meta = decryptedAttachments.get(attachmentId);
    if (meta?.filename?.includes("key lost")) {
      alert(
        "This attachment is from an old message and cannot be decrypted.\nThe encryption key has been lost."
      );
      return;
    }

    setDownloadingAttachment(attachmentId);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "/api"}/messages/${message.id}/attachments/${attachmentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download attachment");
      }

      const encryptedContent = await response.arrayBuffer();

      const nonceBuffer = hexToArrayBuffer(att.encryption_nonce);
      const decryptedContent = await decryptAES(encryptedContent, aesKeyRef.current, nonceBuffer);

      const filename = meta?.filename || "attachment";
      const mimeType = meta?.mimeType || "application/octet-stream";

      const blob = new Blob([decryptedContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert(
        "Attachment download error.\nThe attachment may have been encrypted with a different key."
      );
    } finally {
      setDownloadingAttachment(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const verifyEncryption = async () => {
    if (!message || !user?.id) return;

    try {
      const hasKey = await hasPrivateKey(user.id);

      let canDecrypt = false;
      let publicKeyFingerprint: string | undefined;
      let messageFingerprint: string | undefined;

      if (hasKey && message.encrypted_key) {
        try {
          const cryptoKeyPair = await getCryptoKeyPair(user.id);
          if (cryptoKeyPair) {
            const privateKey = cryptoKeyPair.privateKey;

            const encryptedKeyBuffer = base64ToArrayBuffer(message.encrypted_key);
            await decryptRSA(encryptedKeyBuffer, privateKey);
            canDecrypt = true;

            if (message.sender?.signing_public_key) {
              try {
                const publicKey = await importRSAPublicKey(message.sender.signing_public_key);
                const keyData = await crypto.subtle.exportKey("spki", publicKey);
                const fingerprint = await sha256(keyData);
                publicKeyFingerprint = arrayBufferToHex(fingerprint).substring(0, 16).toUpperCase();
              } catch (e) {
                console.error("Failed to calculate public key fingerprint:", e);
              }
            }

            const subjectBuf = base64ToArrayBuffer(message.subject_encrypted);
            const bodyBuf = base64ToArrayBuffer(message.body_encrypted);
            const combined = new Uint8Array(subjectBuf.byteLength + bodyBuf.byteLength);
            combined.set(new Uint8Array(subjectBuf), 0);
            combined.set(new Uint8Array(bodyBuf), subjectBuf.byteLength);
            const msgFingerprint = await sha256(combined.buffer);
            messageFingerprint = arrayBufferToHex(msgFingerprint).substring(0, 16).toUpperCase();
          }
        } catch (e) {
          console.error("Decryption verification failed:", e);
        }
      }

      setVerificationDetails({
        privateKeyStored: hasKey,
        canDecrypt,
        encryptionAlgorithm: "RSA-OAEP + AES-GCM",
        keySize: "RSA 2048-bit, AES 256-bit",
        publicKeyFingerprint,
        messageFingerprint,
      });
      setShowVerification(true);
    } catch (error) {
      console.error("Verification error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-400 mb-2">Error</h1>
          <p className="text-dark-400 mb-6">{error}</p>
          <Link href="/messages" className="btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to inbox
          </Link>
        </div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  const isSender = user?.id === message.sender?.id;
  const hasEncryptedKey = !!message.encrypted_key;

  return (
    <div className="min-h-screen">
      <MessageDetailHeader subject={decryptedSubject} onBack={() => router.back()} />

      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        <MessageMetadata
          message={message}
          isSender={isSender}
          decryptedBody={decryptedBody}
          onVerify={verifyEncryption}
          formatDate={formatDate}
        />

        <MessageContent
          isAutoDecrypting={isAutoDecrypting}
          decryptedSubject={decryptedSubject}
          decryptedBody={decryptedBody}
          hasEncryptedKey={hasEncryptedKey}
          onDecrypt={() => setShowDecryptModal(true)}
          onVerify={verifyEncryption}
        />

        {showVerification && verificationDetails && (
          <E2EVerificationPanel
            verificationDetails={verificationDetails}
            onClose={() => setShowVerification(false)}
          />
        )}

        <MessageAttachments
          message={message}
          decryptedAttachments={decryptedAttachments}
          downloadingAttachment={downloadingAttachment}
          decryptedBody={decryptedBody}
          onDownload={handleDownloadAttachment}
        />
      </div>

      <DecryptModal
        isOpen={showDecryptModal}
        isDecrypting={isDecrypting}
        error={decryptError}
        onClose={() => {
          setShowDecryptModal(false);
          setDecryptError("");
        }}
        onDecrypt={handleDecrypt}
      />
    </div>
  );
}
