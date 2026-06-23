import { useState, useRef, useCallback } from 'react';
import { FrameLog } from '../types';
import { useFrameLogs } from '../firestoreHooks';
import { generateId } from '../utils';

export function useSportIdent() {
  const [isConnected, setIsConnected] = useState(false);
  const { logs, addLog, clearAllLogs } = useFrameLogs();
  const [lastReadChipNumber, setLastReadChipNumber] = useState<string | null>(null);
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
      
    // Naive 0x53 parser
    let stationNumber, chipNumber, punchTime;
    if (bytes[0] === 0x02 && bytes[1] === 0x53 && bytes.length >= 18) {
      // 02 53 0D [3:CN_H] [4:SI3] [5:SI2] [6:SI1] [7:SI0] [8:CN_L] [9:TH] [10:TL] [11:TSS] [12:DOW] [13:?CRC]...
      const cn = (bytes[3] << 8) | bytes[8];
      stationNumber = cn.toString();
      
      const si = (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7];
      chipNumber = si.toString();
      setLastReadChipNumber(chipNumber);
      
      // Time could be generic: HH MM SS
      // Assuming TH (9) = hours, TL (10) = mins, TSS (11) = secs
      if (bytes[9] <= 23 && bytes[10] <= 59 && bytes[11] <= 59) {
          const now = new Date();
          punchTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), bytes[9], bytes[10], bytes[11], 0);
      }
    }

    const newLog: FrameLog = {
      id: generateId(),
      timestamp: new Date(),
      hexData: hexString,
      rawData: bytes, 
      stationNumber,
      chipNumber,
      punchTime
    };
    
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

  return { isConnected, connect, disconnect, logs, clearLogs: clearAllLogs, lastReadChipNumber, setLastReadChipNumber };
}
