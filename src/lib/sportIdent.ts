import { useState, useEffect, useCallback } from 'react';

/**
 * États possibles de l'automate de lecture SPORTident
 */
export enum SIReaderState {
  DISCONNECTED = 'DISCONNECTED',
  AWAKE = 'AWAKE',
  WAITING_FOR_CHIP = 'WAITING_FOR_CHIP',
  READING_CHIP = 'READING_CHIP',
  WAITING_CHIP_REMOVAL = 'WAITING_CHIP_REMOVAL',
}

/**
 * Hook React pour gérer l'acquisition matérielle via Web Serial API.
 * Gère l'automate d'états : Éveil -> Attente puce -> Lecture -> Attente retrait.
 */
export function useSPORTidentReader() {
  const [state, setState] = useState<SIReaderState>(SIReaderState.DISCONNECTED);
  const [port, setPort] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastReadData, setLastReadData] = useState<Uint8Array | null>(null);

  // Fonction pour se connecter au port série
  const connect = async () => {
    if (!('serial' in navigator)) {
      setError("Web Serial API n'est pas supporté par ce navigateur. Utilisez Chrome ou Edge.");
      return;
    }

    try {
      const serialPort = await (navigator as any).serial.requestPort();
      await serialPort.open({ baudRate: 38400 }); // Vitesse standard SPORTident master station
      setPort(serialPort);
      setState(SIReaderState.AWAKE);
      setError(null);
    } catch (err: any) {
      setError(`Erreur de connexion : ${err.message}`);
    }
  };

  // Fonction de déconnexion
  const disconnect = async () => {
    if (port) {
      try {
        await port.close();
      } catch (err) {
        console.error("Erreur à la fermeture du port", err);
      }
      setPort(null);
      setState(SIReaderState.DISCONNECTED);
    }
  };

  // Automate de lecture en boucle
  useEffect(() => {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    let keepReading = true;

    const readLoop = async () => {
      if (!port) return;

      try {
        while (port.readable && keepReading) {
          reader = port.readable.getReader();
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                // Le port a été fermé
                break;
              }
              if (value) {
                processIncomingBytes(value);
              }
            }
          } catch (error) {
            console.error("Erreur de lecture série:", error);
          } finally {
            reader.releaseLock();
          }
        }
      } catch (e) {
        console.error("Erreur fatale de lecture", e);
      }
    };

    if (port) {
      readLoop();
    }

    return () => {
      keepReading = false;
      if (reader) {
        reader.cancel().catch(console.error);
      }
    };
  }, [port]);

  // Buffer pour accumuler les fragments hexadécimaux (puces SI5 à SI11, SIAC, pCard)
  let buffer: number[] = [];

  const processIncomingBytes = (data: Uint8Array) => {
    // ---------------------------------------------------------
    // Logique simplifiée de l'automate SPORTident
    // Trame standard SPORTident : [STX (0x02), CMD, LEN, ...DATA..., CRC1, CRC2, ETX (0x03)]
    // ---------------------------------------------------------
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];

      if (byte === 0x02) {
        // Début de trame (STX)
        buffer = [byte];
        setState(SIReaderState.READING_CHIP);
      } else if (state === SIReaderState.READING_CHIP) {
        buffer.push(byte);

        if (byte === 0x03) {
          // Fin de trame (ETX)
          handleCompleteFrame(new Uint8Array(buffer));
          buffer = [];
          setState(SIReaderState.WAITING_CHIP_REMOVAL);
        }
      }
    }
  };

  const handleCompleteFrame = (frame: Uint8Array) => {
    // Ici on décode la trame complète (CMD = 0x53, 0x46, etc. selon le type de puce)
    // Extraction des numéros de puces (SI5..SI11, SIAC) et des temps de passage.
    console.log("Trame complète reçue:", frame);
    setLastReadData(frame);
    
    // Après lecture, on attend le retrait de la puce (indiqué par une commande spécifique 0xE4, ou temporisation)
    // Pour simplifier l'automate, on reset après un timeout
    setTimeout(() => {
      setState(SIReaderState.WAITING_FOR_CHIP);
    }, 2000);
  };

  return { state, port, error, connect, disconnect, lastReadData };
}
