/**
 * 7. Stockage Web : Persistance locale via IndexedDB
 * Architecture hors-ligne résistant aux rafraîchissements
 */
const DB_NAME = 'RaidMultiDb';
const DB_VERSION = 1;
const STORE_NAME = 'punches';

export interface DBLog {
  id?: number;
  chipNumber: number;
  stationNumber: number;
  punchTime: number; // timestamp js
  synced: boolean; // false si pas encore envoyé vers Firebase/Vercel KV
}

export class LocalStorageManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('chipNumber', 'chipNumber', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => {
        console.error("IndexedDB Error:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  async addPunch(log: Omit<DBLog, 'id'>): Promise<number> {
    if (!this.db) throw new Error("DB non initialisée");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(log);

      request.onsuccess = (event: any) => {
        resolve(event.target.result as number);
      };
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  async getUnsyncedPunches(): Promise<DBLog[]> {
    if (!this.db) throw new Error("DB non initialisée");
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  async markAsSynced(ids: number[]): Promise<void> {
    if (!this.db || ids.length === 0) return;
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event: any) => reject(event.target.error);

      ids.forEach(id => {
        const req = store.get(id);
        req.onsuccess = () => {
          const data = req.result;
          if (data) {
            data.synced = true;
            store.put(data);
          }
        };
      });
    });
  }
}

export const localDb = new LocalStorageManager();
