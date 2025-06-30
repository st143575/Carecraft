from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import base64
import io
import os
from dotenv import load_dotenv
import azure.cognitiveservices.speech as speechsdk
from openai import AzureOpenAI
from app.prompts import GENERATOR_SYSTEM_PROMPT, GENERATOR_PRESENTATION_SYSTEM_PROMPT

# Load environment variables from .env file
load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Debug prints for Azure Speech configuration
print("DEBUG: AZURE_SPEECH_KEY:", os.getenv("AZURE_SPEECH_KEY"))
print("DEBUG: AZURE_SPEECH_REGION:", os.getenv("AZURE_SPEECH_REGION"))

# Setup Azure clients
speech_config = speechsdk.SpeechConfig(
    subscription=os.getenv("AZURE_SPEECH_KEY"),
    region=os.getenv("AZURE_SPEECH_REGION"),
)
speech_config.speech_synthesis_voice_name = "en-US-Emma2:DragonHDLatestNeural"

gpt4_client = AzureOpenAI(
    api_version="2024-12-01-preview",
    azure_endpoint=os.getenv("GPT4_AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("GPT4_AZURE_OPENAI_API_KEY"),
)

# Add Whisper client
whisper_client = AzureOpenAI(
    api_version="2024-06-01",
    azure_endpoint=os.getenv("WHISPER_AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("WHISPER_AZURE_OPENAI_API_KEY"),
)

def speech_to_text(audio_data):
    """Convert speech to text using Whisper"""
    try:
        print("🔄 Converting speech to text...")
        response = whisper_client.audio.transcriptions.create(
            model="whisper",
            file=audio_data,
            response_format="text"
        )
        result = response.strip()
        print(f"✅ Transcribed: '{result}'")
        return result
    except Exception as e:
        print(f"❌ Speech-to-text error: {e}")
        return None

def generate_response(scenario_context, conversation_history, user_input):
    """Generate emergency victim response using GPT-4"""
    try:
        print("🧠 Generating emergency response...")
        # Prepare conversation context
        messages = [
            {"role": "system", "content": GENERATOR_PRESENTATION_SYSTEM_PROMPT},
            {"role": "system", "content": f"EMERGENCY SCENARIO: {scenario_context}"},
        ]
        # Add conversation history (support new JSON structure)
        for entry in conversation_history:
            if entry.get('speaker') == 'trainee':
                messages.append({"role": "user", "content": f"Trainee: {entry['message']}"})
            elif entry.get('speaker') == 'customer':
                messages.append({"role": "assistant", "content": entry['message']})
        # Add current user input
        messages.append({"role": "user", "content": f"Trainee: {user_input}"})
        response = gpt4_client.chat.completions.create(
            model="gpt-4.1",
            messages=messages,
            max_completion_tokens=200,
            temperature=0.8
        )
        if not response or not getattr(response, 'choices', None):
            print("❌ OpenAI API returned no choices. Response:", response)
            return None
        result = response.choices[0].message.content
        print(f"✅ Generated response: '{result[:100]}...'")
        return result
    except Exception as e:
        print(f"❌ Response generation error: {e}")
        return None


@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            print(f"[DEBUG] Received audio bytes: {len(data)} bytes")
            # Save received bytes as WEBM file in memory for Whisper
            audio_bytes = io.BytesIO(data)
            audio_bytes.name = "audio.webm"  # Set correct file extension for Whisper
            print(f"[DEBUG] BytesIO name: {audio_bytes.name}, size: {audio_bytes.getbuffer().nbytes}")
            # --- Whisper STT ---
            user_text = speech_to_text(audio_bytes)
            print(f"[DEBUG] Whisper returned: {user_text}")
            if not user_text:
                user_text = "(Could not transcribe audio)"
            # --- GPT-4 response ---
            ai_text = generate_response("", [], user_text)
            if not ai_text:
                print("[ERROR] AI response is None or empty. Skipping TTS.")
                await websocket.send_json({
                    "audio": None,
                    "text": "(AI response unavailable)"
                })
                continue
            # --- TTS ---
            audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)
            synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
            # result = synthesizer.speak_text_async(ai_text).get()
            ssml_text = f"""
                <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' 
                        xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
                    <voice name='en-US-AriaNeural'>
                        <mstts:express-as style="terrified" styledegree="1.5">
                            {ai_text}
                        </mstts:express-as>
                    </voice>
                </speak>
                """
            result = synthesizer.speak_ssml_async(ssml_text).get()

            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                audio_data = result.audio_data
                await websocket.send_json({
                    "audio": base64.b64encode(audio_data).decode("utf-8"),
                    "text": ai_text
                })
    except WebSocketDisconnect:
        pass