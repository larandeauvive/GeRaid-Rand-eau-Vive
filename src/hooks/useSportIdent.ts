import { useState, useRef, useCallback } from 'react';
import { FrameLog } from '../types';
import { useFrameLogs } from '../firestoreHooks';

export function useSportIdent() {
  const [isConnected, setIsConnected] = useState(false);
  const { logs, addLog, clearAllLogs } = useFrameLogs();
  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);

  const connect = async () => {
    try {
      if (!('serial' in navigator)) {
        alert("L'API Web Serial n'est pas supportée par votre navigateur.\nVeuillez utiliser un navigateur compatible comme Google Chrome ou Microsoft Edge.");
        return;
      }

      // @ts-ignore - Web Serial API typings might not be fully present
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 38400, dataBits: 8, stopBits: 1, parity: "none" });
      
      portRef.current = port;
      setIsConnected(true);
      
      // We don't await this so it runs in background
      readLoop(port);
    } catch (error) {
      console.error("Erreur de connexion SportIdent:", error);
      // Don't alert if the user just cancelled the picker
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        return;
      }
      alert("Échec de la connexion au boîtier. Vérifiez qu'il n'est pas utilisé par une autre application.");
    }
  };

  const disconnect = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (portRef.current) {
        // give it a short time to cancel before closing
        await new Promise(res => setTimeout(res, 100));
        await portRef.current.close();
        portRef.current = null;
      }
      setIsConnected(false);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleData = useCallback(async (bytes: Uint8Array) => {
    const hexString = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
      
    const newLog: FrameLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      hexData: hexString,
      // Since raw Uint8Array is tricky with firestore without special conversion, 
      // but we could base64 encode it or convert to an array of numbers,
      // actually firestore does NOT support Uint8Array directly unless wrapped in Bytes, 
      // but we defined it as string in schema. So let's store it as hexString there.
      rawData: bytes, // we will omit this or serialize it. Wait, the schema says string.
      // So let's serialize it:
    };
    
    // We update local schema type later if needed, but in DRAFT_firestore.rules it's a string,
    // so we should probably map it. But in local types.ts it is Uint8Array. 
    // Wait, let's just serialize it properly in `addLog`.
    await addLog(newLog);

  }, [addLog]);

  const readLoop = async (port: any) => {
    try {
      while (port.readable) {
        const reader = port.readable.getReader();
        readerRef.current = reader;
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }
            if (value) {
              handleData(value);
            }
          }
        } catch (error) {
          console.error("Erreur de lecture locale:", error);
        } finally {
          reader.releaseLock();
          readerRef.current = null;
        }
      }
    } catch (error) {
      console.error("Erreur readLoop globale:", error);
    } finally {
      setIsConnected(false);
    }
  };

  return { isConnected, connect, disconnect, logs, clearLogs: clearAllLogs };
}
