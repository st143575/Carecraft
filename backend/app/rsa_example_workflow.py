"""
RSA Emergency Training Workflow
Interactive training system for roadside assistance scenarios
"""

import os
import io
import wave
import time
import asyncio
import pyaudio
from openai import AzureOpenAI
from dotenv import load_dotenv
import azure.cognitiveservices.speech as speechsdk
from typing import Dict, List, Any

from prompts import FINAL_GRADER_SYSTEM_PROMPT, EVALUATOR_SYSTEM_PROMPT, GENERATOR_SYSTEM_PROMPT
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

# Speech Services configuration
speech_config = speechsdk.SpeechConfig(
    subscription=os.getenv("AZURE_SPEECH_KEY"), 
    region=os.getenv("AZURE_SPEECH_REGION"),
)
# Use high-quality DragonHD voice for more realistic emergency scenarios
speech_config.speech_synthesis_voice_name = "en-US-Emma2:DragonHDLatestNeural"

# ============================================================================
# RSA Emergency Scenarios
# ============================================================================

RSA_SCENARIOS = {
    "flat_tire": {
        "type": "Vehicle Breakdown - Flat Tire",
        "situation": """You are driving on Highway 95 near mile marker 47 when your front left tire suddenly goes flat. 
        You've managed to pull over to the shoulder safely, but you're stranded. It's getting dark and you're feeling anxious. 
        You don't have a spare tire or the tools to change it. You need roadside assistance urgently!""",
        "location": "Highway 95, mile marker 47, northbound shoulder",
        "urgency": "HIGH",
        "key_details": ["flat tire", "no spare", "getting dark", "highway location", "safe but stranded"]
    },
    
    "dead_battery": {
        "type": "Vehicle Breakdown - Dead Battery",
        "situation": """You're in a shopping mall parking lot and your car won't start. The engine doesn't even turn over - 
        it seems like the battery is completely dead. You left your headlights on for 3 hours while shopping. 
        You're supposed to pick up your kids from school in 20 minutes! You need help fast!""",
        "location": "Westfield Shopping Mall parking lot, section C",
        "urgency": "HIGH", 
        "key_details": ["dead battery", "won't start", "left lights on", "time pressure", "kids waiting"]
    },
    
    "engine_trouble": {
        "type": "Vehicle Emergency - Engine Failure",
        "situation": """You're driving to work when your car engine starts making loud knocking sounds and begins smoking. 
        You've pulled over immediately and turned off the engine. You can smell something burning! 
        You're scared the car might catch fire. This happened on a busy street with no nearby parking.""",
        "location": "Main Street near the courthouse, pulled over by bus stop",
        "urgency": "HIGH",
        "key_details": ["engine knocking", "smoking", "burning smell", "fire risk", "busy street"]
    }
}

# ============================================================================
# Audio Handler
# ============================================================================

class AudioHandler:
    def __init__(self):
        self.sample_rate = 16000
        self.channels = 1
        self.chunk_size = 1024
        self.format = pyaudio.paInt16
        self.audio = pyaudio.PyAudio()
    
    def record_audio(self, duration_seconds=10):
        """Record audio input from user"""
        print(f"🎤 Recording for {duration_seconds} seconds... Speak now!")
        
        frames = []
        stream = self.audio.open(
            format=self.format,
            channels=self.channels,
            rate=self.sample_rate,
            input=True,
            frames_per_buffer=self.chunk_size
        )
        
        for _ in range(0, int(self.sample_rate / self.chunk_size * duration_seconds)):
            data = stream.read(self.chunk_size, exception_on_overflow=False)
            frames.append(data)
        
        stream.stop_stream()
        stream.close()
        
        # Convert to WAV format
        audio_data = b''.join(frames)
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
# Core Workflow Functions
# ============================================================================

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
            {"role": "system", "content": GENERATOR_SYSTEM_PROMPT},
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
        result = response.choices[0].message.content
        print(f"✅ Generated response: '{result[:100]}...'")
        return result
    except Exception as e:
        print(f"❌ Response generation error: {e}")
        return None

def evaluate_response(scenario_context, conversation_history, user_input, generated_response):
    """Evaluate generated response for quality and appropriateness"""
    try:
        print("⚖️ Evaluating response quality...")
        
        evaluation_context = f"""
        SCENARIO: {scenario_context}
        
        CONVERSATION HISTORY:
        {format_conversation_history(conversation_history)}
        
        TRAINEE INPUT: {user_input}
        GENERATED RESPONSE: {generated_response}
        """
        
        response = gpt4_client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": EVALUATOR_SYSTEM_PROMPT},
                {"role": "user", "content": evaluation_context}
            ],
            max_completion_tokens=100,
            temperature=0.1
        )
        
        evaluation = response.choices[0].message.content.strip()
        print(f"✅ Evaluation: {evaluation}")
        
        if evaluation.startswith("APPROVED"):
            return True, evaluation
        else:
            return False, evaluation
            
    except Exception as e:
        print(f"❌ Evaluation error: {e}")
        return True, "Evaluation failed - proceeding anyway"

def text_to_speech(text):
    """Convert text to speech using Azure Speech Services"""
    try:
        print("🔊 Converting text to speech...")
        
        # Create audio configuration
        audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)
        synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
        
        # Use SSML for terrified emotional style
        ssml_text = f"""
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' 
               xmlns:mstts='http://www.w3.org/2001/mstts' xml:lang='en-US'>
            <voice name='en-US-AriaNeural'>
                <mstts:express-as style="terrified" styledegree="1.5">
                    {text}
                </mstts:express-as>
            </voice>
        </speak>
        """
        
        print("🎵 Playing emergency scenario...")
        result = synthesizer.speak_ssml_async(ssml_text).get()
        
        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            print("✅ Speech synthesis completed")
            return True
        else:
            print(f"❌ Speech synthesis failed: {result.reason}")
            return False
            
    except Exception as e:
        print(f"❌ Text-to-speech error: {e}")
        return False

def save_conversation_transcript(conversation_history, scenario, filename=None):
    """Save complete conversation transcript with speaker labels and timestamps"""
    if filename is None:
        timestamp = int(time.time())
        filename = f"rsa_training_transcript_{timestamp}.txt"
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("=" * 80 + "\n")
            f.write("RSA EMERGENCY TRAINING SESSION TRANSCRIPT\n")
            f.write("=" * 80 + "\n\n")
            f.write("TRAINING SCENARIO:\n")
            f.write(f"Type: {scenario.get('type', 'Unknown')}\n")
            f.write(f"Location: {scenario['location']}\n")
            f.write(f"Urgency: {scenario['urgency']}\n")
            f.write(f"Situation: {scenario['situation']}\n\n")
            f.write("CONVERSATION TRANSCRIPT (JSON):\n")
            import json
            f.write(json.dumps(conversation_history, indent=2, ensure_ascii=False))
            f.write("\n\n")
            f.write("=" * 80 + "\n")
            f.write("END OF TRANSCRIPT\n")
            f.write("=" * 80 + "\n")
        print(f"✅ Conversation transcript saved to: {filename}")
        return filename
    except Exception as e:
        print(f"❌ Error saving transcript: {e}")
        return None

def generate_final_grade(conversation_history, scenario):
    """Generate final performance evaluation using scenario-specific criteria"""
    try:
        print("📊 Generating final performance evaluation...")
        
        # Format complete conversation with speaker labels
        conversation_text = "COMPLETE CONVERSATION TRANSCRIPT:\n\n"
        conversation_text += "EMERGENCY VICTIM: Help! I need roadside assistance! My car is broken down and I don't know what to do!\n\n"
        
        for i, entry in enumerate(conversation_history):
            conversation_text += f"Turn {i+1}:\n"
            conversation_text += f"TRAINEE: {entry['user']}\n"
            if 'assistant' in entry:
                conversation_text += f"EMERGENCY VICTIM: {entry['assistant']}\n"
            conversation_text += "\n"
        
        evaluation_context = f"""
        SCENARIO-SPECIFIC EVALUATION CRITERIA:
        
        {conversation_text}
        
        Evaluate the trainee's performance using the scenario-specific criteria provided above.
        Focus on the specific requirements and success indicators defined for this emergency type.
        """
        
        response = gpt4_client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": FINAL_GRADER_SYSTEM_PROMPT},
                {"role": "user", "content": evaluation_context}
            ],
            max_completion_tokens=700,
            temperature=0.0
        )
        
        evaluation = response.choices[0].message.content
        print("✅ Final evaluation generated")
        return evaluation
        
    except Exception as e:
        print(f"❌ Final grading error: {e}")
        return "Unable to generate final evaluation"

# ============================================================================
# Helper Functions
# ============================================================================

def format_conversation_history(history):
    """Format conversation history for display with timestamps and deltas"""
    formatted = ""
    for entry in history:
        formatted += f"[{entry['timestamp']}] {entry['speaker'].upper()}: {entry['message']}\n"
    return formatted

def check_conversation_completion(conversation_history, scenario):
    """Check if conversation has covered essential points"""
    # Simple heuristic - can be enhanced with more sophisticated logic
    if len(conversation_history) >= 5:  # At least 5 exchanges
        return True
    return False

# ============================================================================
# Main Workflow
# ============================================================================

async def run_rsa_training_workflow():
    """Main RSA emergency training workflow"""
    print("🚗 RSA Emergency Training System")
    print("=" * 50)
    # Default to flat_tire scenario, do not prompt user
    scenario_choice = "flat_tire"
    selected_scenario = RSA_SCENARIOS[scenario_choice]
    conversation_history = []
    last_time = time.time()
    start_time = last_time
    print(f"\n🎯 Training Scenario: {scenario_choice}")
    print(f"📍 Situation: {selected_scenario['situation']}")
    audio_handler = AudioHandler()
    try:
        # Present initial scenario via LLM (no hardcoded victim intro)
        print("\n📢 Presenting scenario to trainee...")
        initial_call_prompt = f"You are the emergency victim in the following scenario. Briefly describe your situation and ask for help.\n\nSCENARIO:\n{selected_scenario['situation']}\nKey Details: {', '.join(selected_scenario['key_details'])}"
        initial_call = generate_response(selected_scenario['situation'], [], initial_call_prompt)
        if not initial_call:
            initial_call = "Help! I need roadside assistance! My car is broken down and I don't know what to do!"  # fallback
        text_to_speech(initial_call)
        conversation_history.append({
            'id': 1,
            'timestamp': time.strftime('%M:%S', time.gmtime(0)),
            'speaker': 'customer',
            'message': initial_call,
            'section': 1
        })
        max_turns = 10
        turn = 0
        while turn < max_turns:
            print(f"\n--- Turn {turn + 1} ---")
            print("Your turn to respond...")
            use_voice = input("Use voice input? (y/n): ").strip().lower() == 'y'
            if use_voice:
                audio_data = audio_handler.record_audio(duration_seconds=10)
                user_input = speech_to_text(audio_data)
                if not user_input:
                    print("❌ Could not understand audio. Please try again.")
                    continue
            else:
                user_input = input("Type your response: ").strip()
                if not user_input:
                    continue
            user_end = time.time()
            user_timestamp = time.strftime('%M:%S', time.gmtime(user_end - start_time))
            conversation_history.append({
                'id': len(conversation_history) + 1,
                'timestamp': user_timestamp,
                'speaker': 'trainee',
                'message': user_input,
                'section': 1
            })
            ai_start = time.time()
            ai_response = generate_response(
                selected_scenario['situation'],
                conversation_history,
                user_input
            )
            ai_end = time.time()
            ai_timestamp = time.strftime('%M:%S', time.gmtime(ai_end - start_time))
            if not ai_response:
                print("❌ Failed to generate response. Ending session.")
                break
            # Evaluate response
            max_retries = 2
            retry_count = 0
            while retry_count < max_retries:
                is_approved, evaluation = evaluate_response(
                    selected_scenario['situation'],
                    conversation_history,
                    user_input,
                    ai_response
                )
                if is_approved:
                    break
                else:
                    print(f"⚠️ Response rejected: {evaluation}")
                    retry_count += 1
                    if retry_count < max_retries:
                        print("🔄 Regenerating response...")
                        ai_response = generate_response(
                            selected_scenario['situation'],
                            conversation_history,
                            user_input
                        )
            if text_to_speech(ai_response):
                conversation_history.append({
                    'id': len(conversation_history) + 1,
                    'timestamp': ai_timestamp,
                    'speaker': 'customer',
                    'message': ai_response,
                    'section': 1
                })
                last_time = ai_end
                print(f"💬 Victim: {ai_response}")
                print("\n" + "🔍 DEBUG - CONVERSATION HISTORY SO FAR:")
                print("-" * 60)
                for entry in conversation_history:
                    print(f"[{entry['timestamp']}] {entry['speaker'].upper()}: {entry['message']}" )
                print("-" * 60)
                print(f"Total conversation turns: {(len(conversation_history)-1)//2}")
                print()
                if check_conversation_completion(conversation_history, selected_scenario):
                    continue_choice = input("\nContinue conversation? (y/n): ").strip().lower()
                    if continue_choice != 'y':
                        break
                turn += 1
            else:
                print("❌ Failed to convert response to speech.")
                break
        transcript_file = save_conversation_transcript(
            conversation_history,
            selected_scenario,
        )
        print("\n" + "=" * 50)
        print("📋 TRAINING SESSION COMPLETE")
        print("=" * 50)
        final_grade = generate_final_grade(conversation_history, selected_scenario)
        print("\n" + final_grade)
        if transcript_file:
            try:
                eval_filename = transcript_file.replace('.txt', '_evaluation.txt')
                with open(eval_filename, 'w', encoding='utf-8') as f:
                    f.write("RSA TRAINING SESSION EVALUATION\n")
                    f.write("=" * 50 + "\n\n")
                    f.write(final_grade)
                print(f"✅ Final evaluation saved to: {eval_filename}")
            except Exception as e:
                print(f"⚠️ Could not save evaluation file: {e}")
        return True
    except Exception as e:
        print(f"❌ Workflow error: {e}")
        return False
    finally:
        audio_handler.cleanup()
        print("\n🧹 Audio resources cleaned up")

# ============================================================================
# Entry Point
# ============================================================================

def main():
    """Main entry point"""
    success = asyncio.run(run_rsa_training_workflow())
    
    if success:
        print("\n✅ RSA Training session completed successfully!")
    else:
        print("\n❌ Training session encountered errors")

if __name__ == "__main__":
    main()