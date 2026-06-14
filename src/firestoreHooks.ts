import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc, query, deleteDoc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Competitor, Epreuve, FrameLog } from "./types";
import { useAuth } from "./AuthProvider";

export function useCompetitors() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "competitors"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const comps: Competitor[] = [];
        snapshot.forEach((doc) => {
          comps.push({ id: doc.id, ...doc.data() } as Competitor);
        });
        setCompetitors(comps);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "competitors");
      }
    );
    return () => unsubscribe();
  }, [user]);

  const addCompetitor = async (comp: Omit<Competitor, "id"> | Competitor) => {
    try {
      const id = (comp as Competitor).id || crypto.randomUUID();
      await setDoc(doc(db, "competitors", id), comp);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "competitors");
    }
  };

  const deleteCompetitor = async (id: string) => {
    try {
      await deleteDoc(doc(db, "competitors", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `competitors/${id}`);
    }
  };

  const updateCompetitor = async (comp: Competitor) => {
    try {
      await updateDoc(doc(db, "competitors", comp.id), { ...comp });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `competitors/${comp.id}`);
    }
  };
  
  const addCompetitorsBatch = async (comps: (Omit<Competitor, "id"> | Competitor)[]) => {
      // Basic loop instead of batch to catch specific errors
      for(const comp of comps) {
          await addCompetitor(comp);
      }
  }

  return { competitors, addCompetitor, updateCompetitor, deleteCompetitor, addCompetitorsBatch };
}

export function useEpreuves() {
  const [epreuves, setEpreuves] = useState<Epreuve[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "epreuves"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Epreuve[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as Epreuve);
        });
        setEpreuves(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "epreuves");
      }
    );
    return () => unsubscribe();
  }, [user]);

  const addEpreuve = async (item: Omit<Epreuve, "id"> | Epreuve) => {
    try {
      const id = (item as Epreuve).id || crypto.randomUUID();
      await setDoc(doc(db, "epreuves", id), item);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "epreuves");
    }
  };

  const updateEpreuve = async (item: Epreuve) => {
    try {
      await updateDoc(doc(db, "epreuves", item.id), { ...item });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `epreuves/${item.id}`);
    }
  };

  const deleteEpreuve = async (id: string) => {
    try {
      await deleteDoc(doc(db, "epreuves", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `epreuves/${id}`);
    }
  };

  return { epreuves, addEpreuve, updateEpreuve, deleteEpreuve };
}

export function useFrameLogs() {
  const [logs, setLogs] = useState<FrameLog[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "logs"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: FrameLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          items.push({ 
            id: doc.id, 
            ...data,
            timestamp: new Date(data.timestamp) 
          } as FrameLog);
        });
        // Sort manually by timestamp ascending as we didn't setup orderBy in DB layer to avoid composite indexes yet
        items.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
        setLogs(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "logs");
      }
    );
    return () => unsubscribe();
  }, [user]);

  const addLog = async (log: Omit<FrameLog, "id"> | FrameLog) => {
    try {
      const id = (log as FrameLog).id || crypto.randomUUID();
      const payload: any = {
        ...log,
        timestamp: (log.timestamp as Date).toISOString() // Store as ISO string
      };
      if (log.rawData) {
        payload.rawData = Array.from(log.rawData).join(",");
      }
      await setDoc(doc(db, "logs", id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "logs");
    }
  };

  const clearAllLogs = async () => {
    try {
       for(const log of logs) {
           await deleteDoc(doc(db, "logs", log.id));
       }
    } catch(err) {
       handleFirestoreError(err, OperationType.DELETE, "logs");
    }
  };

  return { logs, addLog, clearAllLogs };
}
