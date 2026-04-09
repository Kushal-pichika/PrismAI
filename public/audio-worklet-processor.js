class MyAudioWorkletProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [];
  }

  constructor() {
    super();
    this.sampleRate = 16000; // Expected output sample rate
    this.chunkSize = this.sampleRate / 1000 * 30; // ~30ms chunks
    this.buffer = [];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const monoAudio = input[0]; // Assuming mono or taking the first channel if stereo

      // Simple downsampling (average values)
      const originalSampleRate = sampleRate; // Global sampleRate from AudioContext
      if (originalSampleRate !== this.sampleRate) {
        const ratio = originalSampleRate / this.sampleRate;
        const newLength = Math.round(monoAudio.length / ratio);
        const downsampled = new Float32Array(newLength);
        let offsetResult = 0;
        let offsetBuffer = 0;

        while (offsetResult < newLength) {
          const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
          let accum = 0, count = 0;
          for (let i = offsetBuffer; i < nextOffsetBuffer && i < monoAudio.length; i++) {
            accum += monoAudio[i];
            count++;
          }
          downsampled[offsetResult] = accum / count;
          offsetResult++;
          offsetBuffer = nextOffsetBuffer;
        }
        this.buffer.push(...downsampled);
      } else {
        this.buffer.push(...monoAudio);
      }

      // Split into chunks and post messages
      while (this.buffer.length >= this.chunkSize) {
        const chunk = this.buffer.splice(0, this.chunkSize);
        this.port.postMessage(chunk);
        console.log('Audio Chunk (Worklet):', chunk); // Log chunks from worklet
      }
    }
    return true;
  }
}

registerProcessor('audio-worklet-processor', MyAudioWorkletProcessor);
