/**
 * AudioWorklet procesor za ObrtnIQ (Žigo STT V2).
 * 
 * Izvršava se u pozadinskoj audio dretvi preglednika (Web Audio API).
 * Pretvara sirovi mono audio stream iz Float32 [-1.0, 1.0] formata
 * u Linear PCM Int16 [-32768, 32767] format prikladan za Google Cloud Speech-to-Text V2.
 * 
 * Koristi transferable ArrayBuffer mehanizam za slanje bez kopiranja u memoriji.
 */

class PcmWorkerProcessor extends AudioWorkletProcessor {
  process(inputs, _outputs, _parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0]; // Uzorkovanje mono kanala
      if (channelData && channelData.length > 0) {
        const int16Array = new Int16Array(channelData.length);
        for (let i = 0; i < channelData.length; i++) {
          // Rezanje/clamping amplitude unutar raspona [-1.0, 1.0]
          const s = Math.max(-1, Math.min(1, channelData[i]));
          // Pretvorba u 16-bitni signed integer
          int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        // Transferable transfer ArrayBuffera na glavni port
        this.port.postMessage(int16Array.buffer, [int16Array.buffer]);
      }
    }
    return true;
  }
}

registerProcessor('pcm-worker-processor', PcmWorkerProcessor);
