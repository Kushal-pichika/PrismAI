# FastAPI Audio WebSocket Backend

Simple async WebSocket server that receives binary audio data from the frontend.

## Setup

```bash
cd backend
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

| Method | Path           | Description                      |
|--------|----------------|----------------------------------|
| WS     | `/ws/audio`   | Binary audio streaming endpoint |
| GET    | `/health`     | Health check                     |

## API

### WebSocket: `/ws/audio`

**Connection:** `ws://localhost:8000/ws/audio`

**Send:** Raw binary audio data (bytes)

**Receive:** Echo of the same binary data

The server logs each received chunk size to the console.

## Frontend Integration

Update the React app's `audioProcessor.js` to send audio chunks to the WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/audio');
ws.binaryType = 'arraybuffer';

// In onAudioChunk callback:
ws.send(audioChunk);
```

## Test with wscat

```bash
npm install -g wscat
wscat -c ws://localhost:8000/ws/audio
# Then send raw binary data
```
