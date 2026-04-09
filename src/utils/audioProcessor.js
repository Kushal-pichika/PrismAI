const SAMPLE_RATE = 16000; // Downsample to 16kHz
const CHUNK_SIZE_MS = 30; // ~30ms chunks

let audioContext = null;
let mediaStreamSource = null;
let audioWorkletNode = null;
let scriptProcessorNode = null;
let mediaStream = null;

// Fallback for older browsers or if AudioWorklet is not available
const createScriptProcessor = (audioContext, source) => {
  scriptProcessorNode = audioContext.createScriptProcessor(4096, 1, 1); // 4096 buffer size, 1 input channel, 1 output channel

  scriptProcessorNode.onaudioprocess = (event) => {
    const inputBuffer = event.inputBuffer.getChannelData(0); // Get mono input (already 1 channel)
    processAudio(inputBuffer);
  };

  source.connect(scriptProcessorNode);
  scriptProcessorNode.connect(audioContext.destination);
};

const processAudio = (audioData) => {
  // Downsample and chunking logic here
  // For now, just log the raw audio data
  console.log('Audio Chunk (raw, ScriptProcessorNode):', audioData);
};

export const startListening = async (onAudioChunk) => {
  if (audioContext && audioContext.state === 'running') {
    console.log('Already listening.');
    return;
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    } });
    mediaStreamSource = audioContext.createMediaStreamSource(mediaStream);

    // Prefer AudioWorklet
    if (audioContext.audioWorklet) {
      await audioContext.audioWorklet.addModule('/audio-worklet-processor.js');
      audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-worklet-processor');

      audioWorkletNode.port.onmessage = (event) => {
        // Convert Float32 to Int16 for Vosk compatibility
        const float32Data = event.data;
        const int16Data = new Int16Array(float32Data.length);

        for (let i = 0; i < float32Data.length; i++) {
          const s = Math.max(-1, Math.min(1, float32Data[i]));
          int16Data[i] = s < 0 ? s * 32768 : s * 32767;
        }

        console.log('Sending Int16 audio chunk');
        onAudioChunk(int16Data.buffer);
      };

      mediaStreamSource.connect(audioWorkletNode);
      audioWorkletNode.connect(audioContext.destination); // Connect to output

    } else {
      // Fallback to ScriptProcessorNode
      console.warn('AudioWorklet not supported, falling back to ScriptProcessorNode.');
      createScriptProcessor(audioContext, mediaStreamSource);
      scriptProcessorNode.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer.getChannelData(0);
        const outputBuffer = downsampleAndMono(inputBuffer, audioContext.sampleRate, SAMPLE_RATE);
        const chunks = splitIntoChunks(outputBuffer, SAMPLE_RATE / 1000 * CHUNK_SIZE_MS);
        chunks.forEach(chunk => onAudioChunk(chunk));
      };
    }

  } catch (error) {
    console.error('Error accessing microphone:', error);
    alert('Could not access the microphone. Please ensure it is connected and permissions are granted.');
    stopListening();
  }
};

export const stopListening = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
  }
  audioContext = null;
  mediaStreamSource = null;
  audioWorkletNode = null;
  scriptProcessorNode = null;
  mediaStream = null;
  console.log('Stopped listening.');
};

// Helper to convert stereo to mono and downsample (for ScriptProcessorNode fallback)
function downsampleAndMono(buffer, inputSampleRate, outputSampleRate) {
  let outputBuffer = resample(buffer, inputSampleRate, outputSampleRate);
  // If the input was stereo, it's already converted to mono by getting ChannelData(0)
  return outputBuffer;
}

// Basic resampling function
function resample(buffer, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < newLength) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0, count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

// Split into chunks
function splitIntoChunks(buffer, chunkSize) {
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  return chunks;
}
