const DB_NAME = "e2e_messaging";
const DB_VERSION = 2;
const STORE_NAME = "private_keys";

interface PrivateKeyRecord {
  id?: number;
  userId?: string;
  email?: string;
  cryptoKeyPair: CryptoKeyPair;
  createdAt: number;
}

let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        objectStore.createIndex("userId", "userId", { unique: true });
        objectStore.createIndex("email", "email", { unique: true });
        objectStore.createIndex("createdAt", "createdAt", { unique: false });
      } else {
        const objectStore = (event.target as IDBTransaction).objectStore(STORE_NAME);
        if (!objectStore.indexNames.contains("email")) {
          objectStore.createIndex("email", "email", { unique: true });
        }
        if (!objectStore.indexNames.contains("userId")) {
          objectStore.createIndex("userId", "userId", { unique: true });
        }
      }
    };
  });
}

export async function storeKeyPair(userId: string, cryptoKeyPair: CryptoKeyPair): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const userIdIndex = store.index("userId");

  const existingRecord = await new Promise<PrivateKeyRecord | null>((resolve) => {
    const request = userIdIndex.get(userId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });

  const record: PrivateKeyRecord = {
    ...(existingRecord ? { id: existingRecord.id } : {}),
    userId,
    ...(existingRecord?.email ? { email: existingRecord.email } : {}),
    cryptoKeyPair,
    createdAt: existingRecord?.createdAt || Date.now(),
  };

  return new Promise((resolve, reject) => {
    if (existingRecord) {
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to update private key"));
    } else {
      const request = store.add(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to store private key"));
    }
  });
}

export async function storeKeyPairByEmail(
  email: string,
  cryptoKeyPair: CryptoKeyPair
): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const emailIndex = store.index("email");

  const existingRecord = await new Promise<PrivateKeyRecord | null>((resolve) => {
    const request = emailIndex.get(email.toLowerCase());
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => resolve(null);
  });

  const record: PrivateKeyRecord = {
    ...(existingRecord ? { id: existingRecord.id } : {}),
    ...(existingRecord?.userId ? { userId: existingRecord.userId } : {}),
    email: email.toLowerCase(),
    cryptoKeyPair,
    createdAt: existingRecord?.createdAt || Date.now(),
  };

  return new Promise((resolve, reject) => {
    if (existingRecord) {
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to update private key by email"));
    } else {
      const request = store.add(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to store private key by email"));
    }
  });
}

export async function getCryptoKeyPair(userId: string): Promise<CryptoKeyPair | null> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const userIdIndex = store.index("userId");

  return new Promise((resolve, reject) => {
    const request = userIdIndex.get(userId);
    request.onsuccess = () => {
      const record = request.result as PrivateKeyRecord | undefined;
      resolve(record?.cryptoKeyPair || null);
    };
    request.onerror = () => reject(new Error("Failed to retrieve private key"));
  });
}

export async function getCryptoKeyPairByEmail(email: string): Promise<CryptoKeyPair | null> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const emailIndex = store.index("email");

  return new Promise((resolve, reject) => {
    const request = emailIndex.get(email.toLowerCase());
    request.onsuccess = () => {
      const record = request.result as PrivateKeyRecord | undefined;
      resolve(record?.cryptoKeyPair || null);
    };
    request.onerror = () => reject(new Error("Failed to retrieve private key by email"));
  });
}

export async function migrateKeyFromEmailToUserId(email: string, userId: string): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const emailIndex = store.index("email");

  return new Promise((resolve, reject) => {
    const getRequest = emailIndex.get(email.toLowerCase());
    getRequest.onsuccess = () => {
      const record = getRequest.result as PrivateKeyRecord | undefined;
      if (!record) {
        resolve();
        return;
      }

      const updatedRecord: PrivateKeyRecord = {
        id: record.id,
        userId,
        email: record.email,
        cryptoKeyPair: record.cryptoKeyPair,
        createdAt: record.createdAt,
      };

      const putRequest = store.put(updatedRecord);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(new Error("Failed to migrate private key"));
    };
    getRequest.onerror = () => reject(new Error("Failed to migrate private key"));
  });
}

export async function deleteCryptoKeyPair(userId: string): Promise<void> {
  const db = await getDB();
  const transaction = db.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const userIdIndex = store.index("userId");

  return new Promise((resolve, reject) => {
    const getRequest = userIdIndex.get(userId);
    getRequest.onsuccess = () => {
      const record = getRequest.result as PrivateKeyRecord | undefined;
      if (!record || !record.id) {
        resolve();
        return;
      }

      const deleteRequest = store.delete(record.id);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(new Error("Failed to delete private key"));
    };
    getRequest.onerror = () => reject(new Error("Failed to delete private key"));
  });
}

export async function hasPrivateKey(userId: string): Promise<boolean> {
  const key = await getCryptoKeyPair(userId);
  return key !== null;
}
