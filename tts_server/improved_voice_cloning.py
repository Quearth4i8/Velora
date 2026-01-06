import torchaudio as ta
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS

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

# Load the model
print("Loading Chatterbox Turbo TTS model...")
model = ChatterboxTurboTTS.from_pretrained(device="cuda")

# Check reference audio
audio_path = "jane.mp3"
try:
    audio_info = get_audio_info(audio_path)
    print(f"✅ Reference audio: {audio_path}")
    print(f"   Duration: {audio_info['duration']:.2f} seconds")
    print(f"   Sample rate: {audio_info['sample_rate']} Hz")
    print(f"   Channels: {audio_info['channels']}")
    
    if audio_info['duration'] < 5:
        print("⚠️  Audio is quite short - results may be limited")
    elif audio_info['duration'] > 20:
        print("⚠️  Audio is long - consider trimming to 10-15 seconds")
    else:
        print("✅ Audio duration looks good for voice cloning")
        
except Exception as e:
    print(f"❌ Error with {audio_path}: {e}")
    exit(1)

# Generate with voice cloning
text = "Hi there, this is Jane's voice speaking through Chatterbox TTS [chuckle]. Isn't this amazing?"
print(f"\n🎙️  Generating: '{text}'")

try:
    wav = model.generate(text, audio_prompt_path=audio_path)
    output_file = "jane_voice_cloned.wav"
    ta.save(output_file, wav, model.sr)
    print(f"✅ Success! Saved to: {output_file}")
    
except Exception as e:
    print(f"❌ Error: {e}")
