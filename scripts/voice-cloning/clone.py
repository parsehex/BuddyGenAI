# From: https://github.com/LostRuins/koboldcpp/blob/concedo/examples/outetts/voice_cloning.py

import sys
import os
import json
from pydub import AudioSegment
import outetts

DEFAULT_AUDIO = "input.wav"
OUTPUT_JSON = "speaker_output.json"
TEMP_WAV = "_temp_input.wav"

print("Speaker JSON creation for Voice Cloning for OuteTTS...")

# Allow passing the audio file path as first argument
audio_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_AUDIO

if not os.path.exists(audio_path):
	raise FileNotFoundError(f"Audio file not found: {audio_path}")

# Convert to WAV if not already
if not audio_path.lower().endswith(".wav"):
	print(f"Converting {audio_path} to WAV...")
	audio = AudioSegment.from_file(audio_path)
	audio.export(TEMP_WAV, format="wav")
	audio_path = TEMP_WAV
else:
	print("Using WAV input directly.")

# Model config
model_config = outetts.ModelConfig(
    model_path="OuteAI/OuteTTS-0.3-500M",
    language="en",
    interface_version=outetts.InterfaceVersion.V2)

# Create interface
interface = outetts.Interface(config=model_config)

# Create speaker from audio
print(f"Creating speaker from audio: {audio_path}")
speaker = interface.create_speaker(audio_path=audio_path)

# Save speaker JSON
interface.save_speaker(speaker, OUTPUT_JSON)
print(f"Speaker JSON saved to: {OUTPUT_JSON}")

# Also print escaped JSON for embedding
speaker_json = json.dumps(speaker)  # ensures proper escaping
escaped = json.dumps(speaker).replace('"', '\\"')
print("\n--- Escaped JSON for speaker_json field ---")
print(escaped)

# Clean up temp wav if used
if os.path.exists(TEMP_WAV):
	os.remove(TEMP_WAV)
