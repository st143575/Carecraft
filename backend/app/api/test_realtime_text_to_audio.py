import os
import base64
import asyncio
import pyaudio
from openai import AsyncAzureOpenAI
from dotenv import load_dotenv

load_dotenv()

# Audio configuration for OpenAI Realtime API
SAMPLE_RATE = 24000
CHANNELS = 1
SAMPLE_WIDTH = 2  # 16-bit = 2 bytes

async def main() -> None:
    """
    When prompted for user input, type a message and hit enter to send it to the model.
    Enter "q" to quit the conversation.
    """
    
    # Initialize PyAudio
    p = pyaudio.PyAudio()
    
    # Open audio stream for playback
    stream = p.open(
        format=pyaudio.paInt16,  # 16-bit samples
        channels=CHANNELS,
        rate=SAMPLE_RATE,
        output=True,
        frames_per_buffer=1024
    )

    client = AsyncAzureOpenAI(
        azure_endpoint=os.environ["GPT4_REALTIME_ENDPOINT"],
        api_key=os.environ["GPT4_REALTIME_API_KEY"],
        api_version="2024-10-01-preview",
    )

    try:
        async with client.beta.realtime.connect(
            model="gpt-4o-mini-realtime-preview",
        ) as connection:
            await connection.session.update(session={"modalities": ["text", "audio"]})
            
            while True:
                user_input = input("Enter a message: ")
                if user_input == "q":
                    break

                await connection.conversation.item.create(
                    item={
                        "type": "message",
                        "role": "user",
                        "content": [{"type": "input_text", "text": user_input}],
                    }
                )
                await connection.response.create()
                
                async for event in connection:
                    if event.type == "response.text.delta":
                        print(event.delta, flush=True, end="")
                    elif event.type == "response.audio.delta":
                        # Decode and play audio data in real-time
                        audio_data = base64.b64decode(event.delta)
                        stream.write(audio_data)
                        print(f"Playing {len(audio_data)} bytes of audio data.")
                    elif event.type == "response.audio_transcript.delta":
                        print(f"Audio transcript: {event.delta}")
                    elif event.type == "response.text.done":
                        print()
                    elif event.type == "response.done":
                        break
                        
    finally:
        # Clean up audio resources
        stream.stop_stream()
        stream.close()
        p.terminate()

if __name__ == "__main__":
    asyncio.run(main())