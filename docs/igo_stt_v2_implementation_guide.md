# Specifikacija implementacije: Google Cloud Speech-to-Text V2 za lik Žiga (ObrtnIQ)

**Namjena dokumenta:** Uputa za autonomnog inženjerskog agenta unutar **Antigravity IDE**.  
**Cilj:** Implementirati dvosmjerni, low-latency audio capture i streaming transkripciju korisničkog glasa pomoću **Google Cloud Speech-to-Text V2 API-ja (`chirp_2` / `chirp`)**, s prilagodbom za dubrovački govor i računovodstveni leksik, integriran s mehanizmom kognitivnog prekida (STOP / `AbortController`) i kontekstom radne plohe ObrtnIQ sustava.

---

## 1. Arhitekturni pregled sustava

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PREGLEDNIK / KLIJENT (Web App)                 │
│                                                                        │
│   AudioWorkletNode (PCM 16kHz) ──── WebSocket Stream ───────┐          │
│                                                             │          │
│   Tipka STOP (AbortController) ──── Signal prekida ─────────┤          │
│                                                             │          │
│   Žigo Screen Context (KPR, Prag, Certifikat, Ekran) ───────┤          │
└─────────────────────────────────────────────────────────────┼──────────┘
                                                              │
                                                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND GATEWAY (Node.js / Python Fastify)           │
│                                                                        │
│   1. WebSocket Server prima sirovi PCM stream                          │
│   2. Inicijalizira dvosmjerni gRPC Stream prema GCP STT V2             │
│   3. Mapira interim & final transkripte                                │
│   4. Reagira na STOP signal: momentalno gasi gRPC stream i LLM context  │
└─────────────────────────────────────────────────────────────┬──────────┘
                                                              │
                                                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│             GOOGLE CLOUD SPEECH-TO-TEXT V2 API (eu lokacija)           │
│                                                                        │
│   - Resource: projects/{PROJECT_ID}/locations/eu/recognizers/zigo-rec  │
│   - Model: chirp_2                                                     │
│   - SpeechAdaptation: PhraseSet s raguzejskim i fiskalnim leksikom     │
│   - Izlaz: UTF-8 transkript s riječnim vremenskim pomacima (offsets)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Priprema i konfiguracija GCP Resursa (IaC / Setup Skripta)

Agent mora osigurati postojanje Recognizer i PhraseSet resursa na GCP-u unutar lokacije `eu`.

### 2.1. Skripta za inicijalizaciju resursa (`scripts/setup-stt-v2.py`)

```python
import os
from google.cloud.speech_v2 import SpeechClient
from google.cloud.speech_v2.types import cloud_speech

PROJECT_ID = os.environ["GCP_PROJECT_ID"]
LOCATION = os.environ.get("GCP_LOCATION", "eu")
PHRASE_SET_ID = "zigo-dubrovnik-phrases"
RECOGNIZER_ID = "zigo-recognizer-chirp2"

client = SpeechClient()
parent = f"projects/{PROJECT_ID}/locations/{LOCATION}"

def setup_phrase_set():
    print(f"Kreira se PhraseSet: {PHRASE_SET_ID}...")
    phrases = [
        # Fonološke i dijalektalne osobitosti dubrovačkog govora
        cloud_speech.PhraseSet.Phrase(value="duman", boost=15.0),
        cloud_speech.PhraseSet.Phrase(value="nema preše", boost=12.0),
        cloud_speech.PhraseSet.Phrase(value="Orlando", boost=10.0),
        cloud_speech.PhraseSet.Phrase(value="orlandov lakat", boost=15.0),
        cloud_speech.PhraseSet.Phrase(value="Senat", boost=10.0),
        cloud_speech.PhraseSet.Phrase(value="spenza", boost=12.0),
        cloud_speech.PhraseSet.Phrase(value="čeljade", boost=10.0),
        cloud_speech.PhraseSet.Phrase(value="gledan", boost=12.0),
        cloud_speech.PhraseSet.Phrase(value="računan", boost=12.0),
        cloud_speech.PhraseSet.Phrase(value="vidihnuh", boost=10.0),
        # Domenski računovodstveni i porezni pojmovi
        cloud_speech.PhraseSet.Phrase(value="KPR", boost=15.0),
        cloud_speech.PhraseSet.Phrase(value="knjiga prometa", boost=12.0),
        cloud_speech.PhraseSet.Phrase(value="prag od 40000 eura", boost=15.0),
        cloud_speech.PhraseSet.Phrase(value="fiskalni certifikat", boost=12.0),
        cloud_speech.PhraseSet.Phrase(value="paušalni obrt", boost=12.0),
        cloud_speech.PhraseSet.Phrase(value="JIR", boost=15.0),
        cloud_speech.PhraseSet.Phrase(value="ZKI", boost=15.0),
        cloud_speech.PhraseSet.Phrase(value="OIB", boost=10.0),
    ]

    phrase_set = cloud_speech.PhraseSet(phrases=phrases)
    request = cloud_speech.CreatePhraseSetRequest(
        parent=parent,
        phrase_set=phrase_set,
        phrase_set_id=PHRASE_SET_ID,
    )
    res = client.create_phrase_set(request=request)
    print(f"PhraseSet kreiran: {res.name}")
    return res.name

def setup_recognizer(phrase_set_name: str):
    print(f"Kreira se Recognizer: {RECOGNIZER_ID}...")
    recognizer = cloud_speech.Recognizer(
        default_recognition_config=cloud_speech.RecognitionConfig(
            model="chirp_2",
            language_codes=["hr-HR"],
            features=cloud_speech.RecognitionFeatures(
                enable_automatic_punctuation=True,
                enable_word_time_offsets=True,
                enable_word_confidence=True,
            ),
            adaptation=cloud_speech.SpeechAdaptation(
                phrase_sets=[
                    cloud_speech.SpeechAdaptation.AdaptationPhraseSet(
                        phrase_set=phrase_set_name
                    )
                ]
            ),
            explicit_decoding_config=cloud_speech.ExplicitDecodingConfig(
                encoding=cloud_speech.ExplicitDecodingConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                audio_channel_count=1,
            ),
        )
    )

    request = cloud_speech.CreateRecognizerRequest(
        parent=parent,
        recognizer=recognizer,
        recognizer_id=RECOGNIZER_ID,
    )
    operation = client.create_recognizer(request=request)
    res = operation.result()
    print(f"Recognizer kreiran i aktivan: {res.name}")
    return res.name

if __name__ == "__main__":
    ps_name = setup_phrase_set()
    setup_recognizer(ps_name)
```

---

## 3. Backend Implementacija (Streaming Gateway)

Backend poslužitelj prima sirovi stream s klijenta putem WebSocketa i prosljeđuje ga prema Google Cloud Speech-to-Text V2 servisu kroz gRPC.

### 3.1. Servis za STT streaming (`server/src/services/sttService.ts`)

```typescript
import { SpeechClient } from '@google-cloud/speech/build/src/v2';
import { Transform } from 'stream';

const client = new SpeechClient();
const PROJECT_ID = process.env.GCP_PROJECT_ID!;
const LOCATION = process.env.GCP_LOCATION || 'eu';
const RECOGNIZER = `projects/${PROJECT_ID}/locations/${LOCATION}/recognizers/zigo-recognizer-chirp2`;

export interface AudioStreamSession {
  writeChunk: (chunk: Buffer) => void;
  stop: () => void;
}

export function startSttSession(
  onInterim: (text: string) => void,
  onFinal: (text: string) => void,
  onError: (err: any) => void
): AudioStreamSession {
  let isClosed = false;

  const audioStream = new Transform({
    transform(chunk, _encoding, callback) {
      callback(null, chunk);
    },
  });

  const recognizeStream = client
    ._streamingRecognize()
    .on('data', (response: any) => {
      if (!response.results || response.results.length === 0) return;

      for (const result of response.results) {
        const transcript = result.alternatives?.[0]?.transcript || '';
        if (result.isFinal) {
          onFinal(transcript);
        } else {
          onInterim(transcript);
        }
      }
    })
    .on('error', (err: any) => {
      if (!isClosed) {
        onError(err);
      }
    })
    .on('end', () => {
      isClosed = true;
    });

  // 1. Prva poruka mora sadržavati streaming konfiguraciju prema STT V2 protokolu
  recognizeStream.write({
    recognizer: RECOGNIZER,
    streamingConfig: {
      streamingFeatures: {
        interimResults: true,
        enableVoiceActivityEvents: true,
      },
    },
  });

  // 2. Prosljeđivanje audio chunkova u streamingRecognize formatu
  audioStream.on('data', (buffer: Buffer) => {
    if (isClosed) return;
    recognizeStream.write({
      audio: buffer,
    });
  });

  return {
    writeChunk: (chunk: Buffer) => {
      if (!isClosed) audioStream.write(chunk);
    },
    stop: () => {
      if (isClosed) return;
      isClosed = true;
      audioStream.end();
      recognizeStream.end();
    },
  };
}
```

---

## 4. Frontend Implementacija (Audio Capture i UI integracija)

Klijentski dio mora:
1. Snimati zvuk u formatu **Linear PCM 16kHz mono** putem namjenskog `AudioWorkletNode`-a (izbjeći zastarjeli `ScriptProcessorNode`).
2. Slanje paketa putem WebSocketa prema backendu.
3. Poslati kontekst trenutnog ekrana (`screenContext`) pri pokretanju.
4. Uvezati **tipku STOP** s prekidom audio snimanja, zatvaranjem WebSocketa i emitiranjem `AbortController` signala.

### 4.1. AudioWorklet procesor (`public/audio-processor.js`)

```javascript
class PcmWorkerProcessor extends AudioWorkletProcessor {
  process(inputs, _outputs, _parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0]; // mono kanal
      // Pretvorba iz Float32 [-1.0, 1.0] u Int16 [-32768, 32767]
      const int16Array = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      this.port.postMessage(int16Array.buffer, [int16Array.buffer]);
    }
    return true;
  }
}

registerProcessor('pcm-worker-processor', PcmWorkerProcessor);
```

### 4.2. React / TypeScript Hook (`src/hooks/useZigoVoice.ts`)

```typescript
import { useState, useRef, useCallback } from 'react';

export interface ScreenContextData {
  currentScreen: 'KPR' | 'INVOICE_CREATE' | 'CERTIFICATES' | 'DASHBOARD';
  totalRevenueYTD: number;
  revenueLimit: number;
  unpaidInvoicesCount: number;
}

export function useZigoVoice(screenContext: ScreenContextData) {
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [isDumando, setIsDumando] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopAll = useCallback(() => {
    // 1. Trenutačni abort svih asinkronih procesa i LLM poziva
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Prekid audio capture-a
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }

    // 3. Zatvaranje WebSocket veze prema poslužitelju
    if (socketRef.current) {
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'STOP' }));
      }
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsRecording(false);
    setIsDumando(false);
  }, []);

  const startListening = async () => {
    stopAll(); // Očisti prethodno stanje ako postoji
    abortControllerRef.current = new AbortController();

    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/voice/stt`);
    socket.binaryType = 'arraybuffer';
    socketRef.current = socket;

    socket.onopen = async () => {
      // Šaljemo inicijalni kontekst ekrana
      socket.send(JSON.stringify({
        type: 'INIT',
        screenContext,
      }));

      // Inicijalizacija mikrofona na 16kHz
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;

      await audioCtx.audioWorklet.addModule('/audio-processor.js');
      const source = audioCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtx, 'pcm-worker-processor');

      workletNode.port.onmessage = (event) => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      source.connect(workletNode);
      setIsRecording(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'INTERIM') {
        setInterimText(data.transcript);
      } else if (data.type === 'FINAL') {
        setFinalText(data.transcript);
        setInterimText('');
        setIsDumando(true); // Korisnik je završio izgovor, Žigo započinje dumanje
      } else if (data.type === 'REPLY_READY') {
        setIsDumando(false);
      }
    };

    socket.onerror = () => stopAll();
    socket.onclose = () => setIsRecording(false);
  };

  return {
    isRecording,
    interimText,
    finalText,
    isDumando,
    startListening,
    stopAll, // Povezano s tipkom STOP
  };
}
```

---

## 5. UI/UX komponenta: Žigov kontrolni bedem (`src/components/ZigoVoiceBar.tsx`)

Komponenta prikazuje stanje dumanja ovisno o aktivnom ekranu i nudi trenutačni prekid rada:

```tsx
import React from 'react';
import { useZigoVoice, ScreenContextData } from '../hooks/useZigoVoice';

interface Props {
  context: ScreenContextData;
}

export const ZigoVoiceBar: React.FC<Props> = ({ context }) => {
  const { isRecording, interimText, finalText, isDumando, startListening, stopAll } = useZigoVoice(context);

  const getDumanjeLabel = () => {
    switch (context.currentScreen) {
      case 'KPR':
        return 'Žigo duma nad poreznin limiton i stavkama knjige...';
      case 'INVOICE_CREATE':
        return 'Žigo duma nad iznoson računa i pragom od 40.000 €...';
      case 'CERTIFICATES':
        return 'Žigo duma nad valjanošću fiskalnog pečata...';
      default:
        return 'Žigo duma nad stanjem obrta...';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-md w-full bg-slate-900 border border-amber-600/40 rounded-xl p-4 shadow-2xl text-slate-100 flex flex-col gap-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="font-semibold tracking-wide text-amber-400">Žigo (Digitalni Orlando)</span>
        </div>

        {/* Tipka STOP s trenutnim prekidom poziva */}
        {(isRecording || isDumando) && (
          <button
            onClick={stopAll}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs uppercase tracking-wider transition-colors shadow-lg active:scale-95"
            title="Prekini sva dumanja i mrežne pozive"
          >
            Zaustavi dumanje (STOP)
          </button>
        )}
      </div>

      {/* Status i transkripcija */}
      <div className="min-h-[48px] bg-slate-950/60 p-2.5 rounded border border-slate-800 text-sm">
        {isRecording && !interimText && <span className="text-slate-400 italic">Slušan te pažljivo, govori...</span>}
        {interimText && <span className="text-slate-200">{interimText}</span>}
        {isDumando && (
          <div className="flex items-center gap-2 text-amber-400 font-medium animate-pulse">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
            {getDumanjeLabel()}
          </div>
        )}
        {!isRecording && !isDumando && !finalText && (
          <span className="text-slate-500 text-xs">Pritisni mikrofon i reci što te muči. Nema preše.</span>
        )}
      </div>

      {/* Kontrole */}
      <div className="flex justify-end gap-2">
        {!isRecording ? (
          <button
            onClick={startListening}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded text-sm transition-colors flex items-center gap-1.5"
          >
            <span>🎙️</span> Pokreni Žiga
          </button>
        ) : (
          <button
            onClick={stopAll}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-sm transition-colors"
          >
            Završi govor
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## 6. Verifikacijska lista za agenta u Antigravity IDE

Prilikom izvođenja zadatka, agent mora provjeriti sljedeće stavke:

- [ ] **GCP IAM Permisije:** Service account posjeduje `roles/speech.client`.
- [ ] **Varijable okruženja:** `GCP_PROJECT_ID`, `GCP_LOCATION=eu` i `GOOGLE_APPLICATION_CREDENTIALS` su uredno mapirani u `.env`.
- [ ] **Chirp 2 Recognizer:** Recognizer je uspješno kreiran pod regijom `eu` s postavljenim `phrase_sets`.
- [ ] **Bypass V1 API:** Ne koristiti `@google-cloud/speech` V1 sintaksu (`StreamingRecognitionConfig` iz v1 paketa); isključivo koristiti v2 path (`@google-cloud/speech/build/src/v2`).
- [ ] **AudioWorklet podrška:** Provjeriti da `pcm-worker-processor` radi na HTTPS okruženju (preglednici blokiraju `getUserMedia` na nezaštićenom HTTP-u).
- [ ] **STOP mehanizam:** Pritiskom na tipku STOP provjeriti na Network tabu da WebSocket veza dobiva status `CLOSED` i da poslužitelj momentalno prekida gRPC stream prema Googleu bez zaostalih procesa u pozadini.