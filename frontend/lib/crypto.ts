import { Message } from "@/types/interfaces";

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export async function sha256(data: ArrayBuffer | string): Promise<ArrayBuffer> {
  const buffer = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return crypto.subtle.digest("SHA-256", buffer);
}

export async function importAESKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", keyData, { name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function decryptAES(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  nonce: ArrayBuffer
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, ciphertext);
}

export async function importRSAPublicKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s/g, "");

  const binaryDer = base64ToArrayBuffer(pemContents);

  return crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );
}

export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function exportRSAPublicKey(publicKey: CryptoKey): Promise<string> {
  const keyData = await crypto.subtle.exportKey("spki", publicKey);
  const base64 = arrayBufferToBase64(keyData);
  const chunks = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${chunks.join("\n")}\n-----END PUBLIC KEY-----`;
}

export async function decryptRSA(
  ciphertext: ArrayBuffer,
  privateKey: CryptoKey
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, ciphertext);
}

export async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function exportAESKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey("raw", key);
}

export async function encryptAES(
  data: ArrayBuffer | string,
  key: CryptoKey
): Promise<{ ciphertext: ArrayBuffer; nonce: Uint8Array }> {
  const nonce = generateRandomBytes(12); // 96-bit nonce dla GCM
  const plaintext = typeof data === "string" ? new TextEncoder().encode(data) : data;

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce as unknown as ArrayBuffer },
    key,
    plaintext
  );

  return { ciphertext, nonce };
}

export async function encryptRSA(data: ArrayBuffer, publicKey: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, data);
}

export async function encryptMessage(
  subject: string,
  body: string,
  recipientPublicKeys: Array<{ recipientId: string; publicKeyPem: string }>,
  senderPublicKeyPem?: CryptoKey
): Promise<{
  subjectEncrypted: string;
  bodyEncrypted: string;
  recipientKeys: Array<{ recipientId: string; encryptedKey: string }>;
  senderEncryptedKey?: string;
  aesKey: CryptoKey;
}> {
  const aesKey = await generateAESKey();

  const { ciphertext: subjectCiphertext, nonce: subjectNonce } = await encryptAES(subject, aesKey);
  const { ciphertext: bodyCiphertext, nonce: bodyNonce } = await encryptAES(body, aesKey);

  const subjectEncrypted = arrayBufferToBase64(
    concatArrayBuffers(subjectNonce.buffer as ArrayBuffer, subjectCiphertext)
  );
  const bodyEncrypted = arrayBufferToBase64(
    concatArrayBuffers(bodyNonce.buffer as ArrayBuffer, bodyCiphertext)
  );

  const aesKeyRaw = await exportAESKey(aesKey);

  const recipientKeys = await Promise.all(
    recipientPublicKeys.map(async ({ recipientId, publicKeyPem }) => {
      const publicKey = await importRSAPublicKey(publicKeyPem);
      const encryptedKeyBuffer = await encryptRSA(aesKeyRaw, publicKey);
      return {
        recipientId,
        encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
      };
    })
  );

  let senderEncryptedKey: string | undefined;
  if (senderPublicKeyPem) {
    try {
      const senderEncryptedKeyBuffer = await encryptRSA(aesKeyRaw, senderPublicKeyPem);
      senderEncryptedKey = arrayBufferToBase64(senderEncryptedKeyBuffer);
    } catch (error) {
      console.error("Failed to encrypt key for sender:", error);
    }
  }

  return {
    subjectEncrypted,
    bodyEncrypted,
    recipientKeys,
    senderEncryptedKey,
    aesKey,
  };
}

export async function decryptMessage(
  subjectEncrypted: string,
  bodyEncrypted: string,
  encryptedKeyBase64: string,
  privateKey: CryptoKey
): Promise<{ subject: string; body: string }> {
  const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKeyBase64);
  const aesKeyRaw = await decryptRSA(encryptedKeyBuffer, privateKey);
  const aesKey = await importAESKey(aesKeyRaw);

  const subjectBuffer = base64ToArrayBuffer(subjectEncrypted);
  const subjectNonce = subjectBuffer.slice(0, 12);
  const subjectCiphertext = subjectBuffer.slice(12);
  const subjectDecrypted = await decryptAES(subjectCiphertext, aesKey, subjectNonce);

  const bodyBuffer = base64ToArrayBuffer(bodyEncrypted);
  const bodyNonce = bodyBuffer.slice(0, 12);
  const bodyCiphertext = bodyBuffer.slice(12);
  const bodyDecrypted = await decryptAES(bodyCiphertext, aesKey, bodyNonce);

  return {
    subject: new TextDecoder().decode(subjectDecrypted),
    body: new TextDecoder().decode(bodyDecrypted),
  };
}

function concatArrayBuffers(...buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return result.buffer;
}

export async function encryptAttachment(
  file: File,
  aesKey: CryptoKey
): Promise<{
  contentEncrypted: string;
  filenameEncrypted: string;
  mimeTypeEncrypted: string;
  nonce: string;
  checksum: string;
}> {
  const fileBuffer = await file.arrayBuffer();

  const checksumBuffer = await sha256(fileBuffer);
  const checksum = arrayBufferToHex(checksumBuffer);

  const { ciphertext, nonce } = await encryptAES(fileBuffer, aesKey);

  const { ciphertext: filenameCiphertext, nonce: filenameNonce } = await encryptAES(
    file.name,
    aesKey
  );
  const { ciphertext: mimeTypeCiphertext, nonce: mimeTypeNonce } = await encryptAES(
    file.type || "application/octet-stream",
    aesKey
  );

  return {
    contentEncrypted: arrayBufferToBase64(ciphertext),
    filenameEncrypted: arrayBufferToBase64(
      concatArrayBuffers(filenameNonce.buffer as ArrayBuffer, filenameCiphertext)
    ),
    mimeTypeEncrypted: arrayBufferToBase64(
      concatArrayBuffers(mimeTypeNonce.buffer as ArrayBuffer, mimeTypeCiphertext)
    ),
    nonce: arrayBufferToHex(nonce.buffer as ArrayBuffer),
    checksum,
  };
}

export async function decryptAttachment(
  encryptedContent: ArrayBuffer,
  filenameEncrypted: string,
  mimeTypeEncrypted: string,
  aesKey: CryptoKey,
  nonce: string
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  const nonceBuffer = hexToArrayBuffer(nonce);
  const decryptedContent = await decryptAES(encryptedContent, aesKey, nonceBuffer);

  const filenameBuffer = base64ToArrayBuffer(filenameEncrypted);
  const filenameNonce = filenameBuffer.slice(0, 12);
  const filenameCiphertext = filenameBuffer.slice(12);
  const filenameDecrypted = await decryptAES(filenameCiphertext, aesKey, filenameNonce);
  const filename = new TextDecoder().decode(filenameDecrypted);

  const mimeTypeBuffer = base64ToArrayBuffer(mimeTypeEncrypted);
  const mimeTypeNonce = mimeTypeBuffer.slice(0, 12);
  const mimeTypeCiphertext = mimeTypeBuffer.slice(12);
  const mimeTypeDecrypted = await decryptAES(mimeTypeCiphertext, aesKey, mimeTypeNonce);
  const mimeType = new TextDecoder().decode(mimeTypeDecrypted);

  return {
    blob: new Blob([decryptedContent], { type: mimeType }),
    filename,
    mimeType,
  };
}

export async function decryptSubject(msg: Message, privateKey: CryptoKey): Promise<string> {
  const encryptedKeyBuffer = base64ToArrayBuffer(msg.encrypted_key);
  const aesKeyRaw = await decryptRSA(encryptedKeyBuffer, privateKey);
  const aesKey = await importAESKey(aesKeyRaw);

  const subjectBuffer = base64ToArrayBuffer(msg.subject_encrypted);
  const subjectNonce = subjectBuffer.slice(0, 12);
  const subjectCiphertext = subjectBuffer.slice(12);
  const decryptedSubject = await decryptAES(subjectCiphertext, aesKey, subjectNonce);
  const subject = new TextDecoder().decode(decryptedSubject);
  return subject;
}
