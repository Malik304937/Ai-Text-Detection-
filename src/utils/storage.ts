import { HistoryRecord } from '../types';

const DB_NAME = 'ai_text_detective_db';
const DB_VERSION = 1;
const STORE_NAME = 'analysis_history';
const LOCALSTORAGE_KEY = 'ai_text_detective_history_fallback';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        try {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('createdAt', 'createdAt', { unique: false });
            store.createIndex('assessment', 'assessment', { unique: false });
            store.createIndex('source', 'source', { unique: false });
          }
        } catch (e) {
          console.warn('IndexedDB onupgradeneeded warning:', e);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    } catch (err) {
      reject(err);
    }
  });
}

function getFromLocalStorage(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToLocalStorage(records: HistoryRecord[]): void {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('LocalStorage write failed:', e);
  }
}

export async function saveAnalysisRecord(record: Omit<HistoryRecord, 'id' | 'createdAt'> & { id?: string }): Promise<HistoryRecord> {
  const finalRecord: HistoryRecord = {
    ...record,
    id: record.id || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: Date.now()
  };

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(finalRecord);

      req.onsuccess = () => resolve(finalRecord);
      req.onerror = () => {
        // Fallback to localStorage
        const list = getFromLocalStorage();
        const updated = [finalRecord, ...list.filter(r => r.id !== finalRecord.id)];
        saveToLocalStorage(updated);
        resolve(finalRecord);
      };
    });
  } catch (err) {
    // Fallback if IndexedDB fails completely
    const list = getFromLocalStorage();
    const updated = [finalRecord, ...list.filter(r => r.id !== finalRecord.id)];
    saveToLocalStorage(updated);
    return finalRecord;
  }
}

export async function getAnalysisHistory(): Promise<HistoryRecord[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const results = (req.result || []) as HistoryRecord[];
          results.sort((a, b) => b.createdAt - a.createdAt);
          resolve(results);
        };

        req.onerror = () => {
          resolve(getFromLocalStorage());
        };
      } catch (txErr) {
        console.warn('IndexedDB transaction failed, using localStorage:', txErr);
        resolve(getFromLocalStorage());
      }
    });
  } catch {
    const list = getFromLocalStorage();
    list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }
}

export async function deleteAnalysisRecord(id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => {
        // Keep fallback synced
        const list = getFromLocalStorage().filter(r => r.id !== id);
        saveToLocalStorage(list);
        resolve(true);
      };
      req.onerror = () => {
        const list = getFromLocalStorage().filter(r => r.id !== id);
        saveToLocalStorage(list);
        resolve(true);
      };
    });
  } catch {
    const list = getFromLocalStorage().filter(r => r.id !== id);
    saveToLocalStorage(list);
    return true;
  }
}

export async function clearAnalysisHistory(): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => {
        saveToLocalStorage([]);
        resolve(true);
      };
      req.onerror = () => {
        saveToLocalStorage([]);
        resolve(true);
      };
    });
  } catch {
    saveToLocalStorage([]);
    return true;
  }
}
