from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from vosk import Model, KaldiRecognizer
import asyncio
import json
import os
import time

app = FastAPI()

# Load model
vosk_model = None
model_path = "./models/vosk-model-en-us-0.22"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def load_model():
    global vosk_model
    print("Loading Vosk model...")
    if not os.path.exists(model_path):
        raise RuntimeError("Model not found")
    vosk_model = Model(model_path)
    print("Using high-accuracy model")

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected")

    keywords = []
    rec = None
    last_detection_time = {}
    last_detected_keyword = None
    COOLDOWN = 2.0

    try:
        while True:
            message = await websocket.receive()

            if "text" in message:
                try:
                    data = json.loads(message["text"])
                    new_keywords = data.get("keywords")
                    if isinstance(new_keywords, list) and new_keywords:
                        keywords = [k.lower().strip() for k in new_keywords]
                        rec = KaldiRecognizer(vosk_model, 16000)
                        rec.SetWords(True)
                        print("Active keywords:", keywords)
                except Exception as e:
                    print("Keyword parse error:", e)

            elif "bytes" in message:
                if rec is None:
                    continue

                audio = message["bytes"]
                if rec.AcceptWaveform(audio):
                    result_json = json.loads(rec.Result())
                    text = result_json.get("text", "").lower().strip()

                    if text:
                        print(f"FINAL: {text}")
                        current_time = time.time()

                        for keyword in keywords:
                            # Strict match: trigger only if the entire spoken phrase is exactly the keyword
                            if text == keyword:
                                # Prevent immediate repeat of the same keyword
                                if keyword == last_detected_keyword:
                                    continue

                                last_time = last_detection_time.get(keyword, 0)
                                if current_time - last_time >= COOLDOWN:
                                    print(f"DETECTED: {keyword}")
                                    await websocket.send_text(json.dumps({"text": keyword}))
                                    last_detection_time[keyword] = current_time
                                    last_detected_keyword = keyword
                    else:
                        # Reset state when no speech is detected in the final result
                        last_detected_keyword = None
                else:
                    partial_json = rec.PartialResult()
                    if partial_json:
                        partial = json.loads(partial_json)
                        text_partial = partial.get("partial", "").lower().strip()
                        if text_partial:
                            print(f"Partial: {text_partial}")
                        else:
                            # Reset detection state during silence in partials as well
                            last_detected_keyword = None

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print("Error:", e)
    finally:
        print("Connection closed")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": vosk_model is not None,
        "model_path": model_path if vosk_model else None
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server on http://localhost:8000")
    print("WebSocket endpoint: ws://localhost:8000/ws/audio")
    uvicorn.run(app, host="0.0.0.0", port=8000)
