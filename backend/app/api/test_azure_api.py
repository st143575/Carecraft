"""
Emergency Training API Test Script  
Tests: Audio Input → Whisper → GPT-4 → Azure Speech TTS → Audio Output
For training service experts in emergency response scenarios
"""

import os
import io
import wave
import time
import base64
import asyncio
import threading
import pygame
import pyaudio
from openai import AzureOpenAI
from dotenv import load_dotenv
import azure.cognitiveservices.speech as speechsdk

load_dotenv()

# ============================================================================
# Azure Clients Setup
# ============================================================================

# GPT-4 Client (for text generation)
gpt4_client = AzureOpenAI(
    api_version="2024-12-01-preview",
    azure_endpoint=os.getenv("GPT4_AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("GPT4_AZURE_OPENAI_API_KEY"),
)

# Whisper Client (for speech-to-text)
whisper_client = AzureOpenAI(
    api_version="2024-06-01",
    azure_endpoint=os.getenv("WHISPER_AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("WHISPER_AZURE_OPENAI_API_KEY"),
)

# Speech Services configuration optimized for emergency scenarios
speech_config = speechsdk.SpeechConfig(
    subscription=os.getenv("AZURE_SPEECH_KEY"), 
    region=os.getenv("AZURE_SPEECH_REGION"),
)
# Use high-quality DragonHD voice for more realistic emergency scenarios
speech_config.speech_synthesis_voice_name = "en-US-Emma2:DragonHDLatestNeural"  # Higher quality voice for emergency training

# Configure speech rate and emotional tone for emergency situations
speech_config.set_speech_synthesis_output_format(speechsdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm)

# ============================================================================
# Simple Audio Recorder
# ============================================================================

class SimpleAudioRecorder:
    def __init__(self):
        self.sample_rate = 16000
        self.channels = 1
        self.chunk_size = 1024
        self.format = pyaudio.paInt16
        self.audio = pyaudio.PyAudio()
        self.recording = False
        self.frames = []
    
    def record_audio(self, duration_seconds=5):
        """Record audio for specified duration"""
        print(f"🎤 Recording for {duration_seconds} seconds... Speak now!")
        
        self.recording = True
        self.frames = []
        
        stream = self.audio.open(
            format=self.format,
            channels=self.channels,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=self.chunk_size
        )
        
        # Record for specified duration
        for _ in range(0, int(self.sample_rate / self.chunk_size * duration_seconds)):
            if self.recording:
                data = stream.read(self.chunk_size, exception_on_overflow=False)
                self.frames.append(data)
        
        stream.stop_stream()
        stream.close()
        
        if not self.frames:
            return None
        
        # Convert to WAV format
        audio_data = b''.join(self.frames)
        wav_buffer = io.BytesIO()
        
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(self.channels)
            wav_file.setsampwidth(self.audio.get_sample_size(self.format))
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(audio_data)
        
        wav_buffer.seek(0)
        wav_buffer.name = "recorded_audio.wav"
        return wav_buffer
    
    def cleanup(self):
        self.audio.terminate()

# ============================================================================
# API Test Functions
# ============================================================================

def test_speech_to_text(audio_data):
    """Test Whisper STT"""
    print("🔄 Converting speech to text...")
    try:
        response = whisper_client.audio.transcriptions.create(
            model="whisper",
            file=audio_data,
            response_format="text"
        )
        print(f"✅ You said: '{response}'")
        return response.strip()
    except Exception as e:
        print(f"❌ Speech-to-text error: {e}")
        return None

def test_gpt4_emergency_response(user_text):
    """Test GPT-4 emergency scenario generation"""
    print("🚨 Generating emergency scenario response...")
    try:
        # Enhanced system prompt for realistic emergency training scenarios
        system_prompt = """You are roleplaying as a person in a genuine emergency situation calling for help. 

CRITICAL INSTRUCTIONS:
- You are currently experiencing a real emergency (car accident, medical emergency, fire, etc.)
- Speak with extreme urgency and panic! Use lots of exclamation marks!!!
- Sound distressed, scared, and desperate for help!
- Interrupt yourself, repeat important details, show genuine fear!
- Provide realistic details but be emotional and panicked about them
- React with high stress to the responder's questions and guidance
- Show panic, fear, confusion, but remain coherent enough to communicate
- Beg for help repeatedly and show relief when given instructions!
- Include realistic background details with emotional urgency (location, what happened, current condition)
- Use short, choppy sentences when panicked! Don't speak in perfect paragraphs!

SPEECH PATTERNS:
- Use lots of exclamation marks! Multiple ones!!!
- Repeat important information! Say "please help me!" frequently!
- Show breathing difficulty or stress in your responses!
- Be human, be urgent, be PANICKED! This is for professional training purposes."""

        response = gpt4_client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text}
            ],
            max_completion_tokens=200,  # Increased for more realistic responses
            temperature=0.8  # Higher temperature for more natural, varied responses
        )
        
        gpt4_text = response.choices[0].message.content
        print(f"✅ Emergency response: '{gpt4_text}'")
        return gpt4_text
    except Exception as e:
        print(f"❌ GPT-4 error: {e}")
        return None

def test_emergency_speech_tts(text):
    """Test Azure Speech Services for emergency scenario speech synthesis"""
    print("🔊 Converting emergency response to speech...")
    try:
        # Create audio configuration for direct playback (no file saving)
        audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)
        
        # Create speech synthesizer
        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config, 
            audio_config=audio_config
        )
        
        # Add SSML for more realistic emergency speech patterns
        
        # Option 1: DragonHD voice with prosody controls (commented out)
        # ssml_text = f"""
        # <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        #     <voice name="en-US-Emma2:DragonHDLatestNeural">
        #         <prosody rate="medium" pitch="+5%" volume="loud">
        #             {text}
        #         </prosody>
        #     </voice>
        # </speak>
        # """
        
        # Option 2: AriaNeural with "terrified" emotional style at high intensity
        ssml_text = f"""
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' 
               xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
            <voice name='en-US-AriaNeural'>
                <mstts:express-as style="terrified" styledegree="1.1">
                    {text}
                </mstts:express-as>
            </voice>
        </speak>
        """
        
        print("🎵 Playing emergency scenario...")
        
        # Synthesize and stream speech directly to speakers (with SSML)
        result = synthesizer.speak_ssml_async(ssml_text).get()
        
        # Alternative: Simple text synthesis without SSML (commented out)
        # print("🎵 Playing emergency scenario...")
        # result = synthesizer.speak_text_async(text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            print("✅ Speech synthesis completed")
            return True
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = result.cancellation_details
            print(f"❌ Speech synthesis canceled: {cancellation_details.reason}")
            if cancellation_details.error_details:
                print(f"Error details: {cancellation_details.error_details}")
            return False
        else:
            print(f"❌ Unexpected result: {result.reason}")
            return False
            
    except Exception as e:
        print(f"❌ Emergency Speech TTS error: {e}")
        return False

def check_environment():
    """Quick environment check"""
    required_vars = [
        "GPT4_AZURE_OPENAI_ENDPOINT", "GPT4_AZURE_OPENAI_API_KEY",
        "WHISPER_AZURE_OPENAI_ENDPOINT", "WHISPER_AZURE_OPENAI_API_KEY", 
        "AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"
    ]
    
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        print(f"❌ Missing environment variables: {', '.join(missing)}")
        return False
    
    print("✅ Environment variables configured")
    return True

# ============================================================================
# Main Test Workflow
# ============================================================================

async def run_emergency_training_test():
    """Run emergency training API test: Audio → Whisper → GPT-4 → Azure Speech TTS → Audio"""
    
    print("Emergency Response Training API Test")
    print("Flow: Microphone → Whisper → Emergency GPT-4 → Direct Speech Output")
    print("=" * 70)
    
    # Check environment
    if not check_environment():
        print("Fix environment variables and try again.")
        return False
            
    recorder = SimpleAudioRecorder()
    
    try:
        # Step 1: Record audio (commented out for testing)
        print("\n1️⃣ AUDIO INPUT TEST")
        # input("Press Enter when ready to record (5 seconds)...")
        # audio_data = recorder.record_audio(duration_seconds=5)
        # if not audio_data:
        #     print("❌ Failed to record audio")
        #     return False
        
        # Step 2: Speech to text (Whisper) - using test input
        print("\n2️⃣ SPEECH-TO-TEXT TEST (Whisper)")
        user_text = "Hi, here is special emergency service provider Nils, how can I help you?"  # test_speech_to_text(audio_data)
        print(f"✅ Emergency responder said: '{user_text}'")
        if not user_text:
            return False
        
        # Step 3: GPT-4 emergency scenario generation
        print("\n3️⃣ EMERGENCY SCENARIO GENERATION")
        emergency_response = test_gpt4_emergency_response(user_text)
        if not emergency_response:
            return False
        
        # Step 4: Direct speech synthesis and playback
        print("\n4️⃣ EMERGENCY SPEECH SYNTHESIS")
        tts_success = test_emergency_speech_tts(emergency_response)
        if not tts_success:
            return False
            
        print("\n✅ All API tests passed")
        return True
                
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    finally:
        recorder.cleanup()
        print("🧹 Cleaned up audio resources")

def main():
    """Main entry point for emergency training test"""
    
    # Run the emergency training test
    success = asyncio.run(run_emergency_training_test())
    
    if success:
        print("\n✅ API communication working")
    else:
        print("\n❌ Fix the issues above before proceeding")

if __name__ == "__main__":
    main()