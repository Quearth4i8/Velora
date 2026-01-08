from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
import torchaudio as ta
import io
from chatterbox.tts_turbo import ChatterboxTurboTTS
import uvicorn
import os
from pathlib import Path

app = FastAPI(title="TTS Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
model = None
audio_prompt_path = "jane.mp3"

class TTSRequest(BaseModel):
    text: str

def get_audio_info(audio_path):
    """Get proper audio information"""
    waveform, sample_rate = ta.load(audio_path)
    
    # Calculate duration correctly
    if len(waveform.shape) > 1:
        # Stereo audio, take average of channels
        if waveform.shape[0] == 2:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
    
    duration_seconds = waveform.shape[-1] / sample_rate
    
    return {
        'waveform': waveform,
        'sample_rate': sample_rate,
        'duration': duration_seconds,
        'channels': waveform.shape[0] if len(waveform.shape) > 1 else 1
    }

def load_model():
    global model
    if model is None:
        print("Loading Chatterbox Turbo TTS model...")
        try:
            model = ChatterboxTurboTTS.from_pretrained(device="cuda" if torch.cuda.is_available() else "cpu")
            print("✅ Model loaded successfully")
            
            # Check reference audio
            if os.path.exists(audio_prompt_path):
                audio_info = get_audio_info(audio_prompt_path)
                print(f"✅ Reference audio: {audio_prompt_path}")
                print(f"   Duration: {audio_info['duration']:.2f} seconds")
                print(f"   Sample rate: {audio_info['sample_rate']} Hz")
                print(f"   Channels: {audio_info['channels']}")
            else:
                print(f"⚠️  Reference audio not found: {audio_prompt_path}")
                
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise

@app.on_event("startup")
async def startup_event():
    load_model()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/speak")
async def speak(request: TTSRequest):
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    # Limit text length for better performance
    if len(text) > 200:
        raise HTTPException(status_code=400, detail="Text too long. Please use shorter text (max 200 characters).")
    
    try:
        print(f"🎙️  Generating TTS for: '{text}'")
        print(f"📁 Reference audio exists: {os.path.exists(audio_prompt_path)}")
        
        # Generate audio with voice cloning
        if os.path.exists(audio_prompt_path):
            print("🔄 Using voice cloning...")
            wav = model.generate(text, audio_prompt_path=audio_prompt_path)
        else:
            # Fallback to regular generation if no reference audio
            print("🔄 Using regular generation (no reference audio)")
            wav = model.generate(text)
        
        print("✅ Audio generation complete")
        
        # Convert to bytes
        audio_buffer = io.BytesIO()
        ta.save(audio_buffer, wav, model.sr, format="wav")
        audio_bytes = audio_buffer.getvalue()
        
        print(f"📊 Audio size: {len(audio_bytes)} bytes")
        
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={"Content-Disposition": "inline; filename=speech.wav"}
        )
        
    except Exception as e:
        print(f"❌ Error generating speech: {e}")
        raise HTTPException(status_code=500, detail=f"Speech generation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
