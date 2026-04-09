# PrismAI 🎙️

PrismAI is a real-time audio processing system that detects specific keywords from a live microphone stream and provides immediate feedback. It uses a high-accuracy speech recognition model on the backend and a responsive React frontend.

## 🚀 Features

- **Dynamic Keyword Detection**: Define a custom list of keywords in the UI; the system updates its recognition grammar in real-time.
- **Low-Latency Streaming**: Uses `AudioWorklet` for efficient, non-blocking audio processing and WebSockets for full-duplex communication.
- **High Accuracy**: Powered by the `vosk-model-en-us-0.22` model for precise speech-to-text conversion.
- **Audio Feedback**: Integrated with the browser's `SpeechSynthesis API` to speak detected keywords back to the user.
- **Strict Matching**: Implements exact word matching and stability checks to eliminate false positives.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Web Audio API (`AudioWorklet`), WebSockets.
- **Backend**: FastAPI (Python), Vosk Speech Recognition, Uvicorn.
- **Audio Format**: Mono PCM, 16kHz, 16-bit signed integers.

## 📦 Setup Instructions

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Ensure you have the Vosk model at ./backend/models/vosk-model-en-us-0.22
python main.py
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```
Open the local server URL (e.g., `http://localhost:5173`) in your browser.

## 📖 Usage

1. **Set Keywords**: Enter comma-separated keywords in the input field (e.g., `help, alert, system`).
2. **Start Listening**: Click the **Start** button. The frontend connects to the backend and sends the keyword list.
3. **Speak**: Say one of your defined keywords clearly.
4. **Result**: When a keyword is detected, the backend sends a trigger, and the browser will speak the word aloud.

## 📂 Project Structure

```text
PrismAI/
├── backend/
│   ├── main.py              # FastAPI server & Vosk logic
│   ├── models/              # Vosk model files (git-ignored)
│   └── requirements.txt     # Python dependencies
├── public/
│   └── audio-worklet-processor.js  # Low-level audio processing
├── src/
│   ├── components/
│   │   └── AudioInput.jsx   # UI for keyword input and controls
│   ├── utils/
│   │   └── audioProcessor.js # Audio context and worklet management
│   └── App.jsx              # Main application logic & WebSocket handler
├── package.json
└── .gitignore
```

## ⚖️ License
MIT
