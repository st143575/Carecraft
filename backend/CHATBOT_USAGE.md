# Bosch eCall Emergency Services - Chatbot Usage Guide

## 🚀 How to Launch the Live Chatbot

### Prerequisites
1. Make sure you have Azure OpenAI credentials configured in your environment
2. Navigate to the backend directory: `cd Carecraft/backend`
3. Ensure all dependencies are installed

### Launch the Chatbot
```bash
python3 chatbot.py
```

## 🎯 Features

### Auto-Execution (No Confirmation Required)
- **Injury Accidents**: "I had a car accident with injuries" → Immediately calls emergency services
- **Roadside Assistance**: "I need roadside assistance" → Immediately arranges RSA

### Confirmation Required
- **Light Accidents**: "I had a minor fender bender" → Asks "Should I proceed?" before calling services
- **Road Hazards**: "There's a road hazard" → Asks for confirmation before reporting

### Conversation Flow
1. **Classification**: AI classifies your emergency type
2. **Action**: Either auto-executes (INJURY/RSA) or asks for confirmation (others)
3. **Resolution Check**: "Is everything resolved or do you need assistance with anything else?"
4. **Multi-Issue Support**: If you say "no", it asks for additional problems
5. **Proper Closure**: Only ends when you confirm everything is resolved

## 💬 Example Conversations

### Injury Accident (Auto-Execute)
```
YOU: I had a car accident with injuries
SYSTEM: [Immediately calls emergency services]
AGENT: Emergency services have been contacted. Are you seriously injured?...
AGENT: Is everything resolved or do you need assistance with anything else?
YOU: yes
AGENT: Thank you for confirming. Stay safe!
[Conversation ends]
```

### Roadside Assistance (Auto-Execute)
```
YOU: I need roadside assistance
SYSTEM: [Immediately arranges RSA]
AGENT: Roadside assistance has been arranged. Can you tell me your location?...
AGENT: Is everything resolved or do you need assistance with anything else?
YOU: yes
AGENT: Thank you! Safe travels!
[Conversation ends]
```

### Light Accident (Confirmation Required)
```
YOU: I had a minor fender bender
AGENT: I'll contact emergency services for you. Should I proceed?
YOU: yes
SYSTEM: [Calls emergency services after confirmation]
AGENT: Emergency services contacted. Please move to a safe location...
AGENT: Is everything resolved or do you need assistance with anything else?
YOU: yes
AGENT: Thank you for confirming. Drive safely!
[Conversation ends]
```

### Multi-Issue Conversation
```
YOU: I had a car accident with injuries
SYSTEM: [Auto-executes emergency services]
AGENT: Emergency services contacted...
AGENT: Is everything resolved or do you need assistance with anything else?
YOU: no, I also need roadside assistance
SYSTEM: [Auto-executes RSA]
AGENT: Roadside assistance arranged...
AGENT: Is everything resolved now?
YOU: yes
AGENT: Thank you! Stay safe!
[Conversation ends]
```

## 🎮 Available Commands

While in the chatbot:
- `help` - Show available commands
- `status` - Show current conversation status
- `reset` - Reset the conversation session
- `quit` or `exit` - Exit the chatbot

## 🧪 Test Scenarios

Try these example inputs to test different flows:

### Auto-Execute Scenarios
- "I had a car accident with injuries"
- "Someone is hurt in my car"
- "I need roadside assistance"
- "My car broke down"
- "I need a tow truck"

### Confirmation Required Scenarios
- "I had a minor fender bender"
- "There's a small accident"
- "There's a road hazard ahead"
- "I see debris on the highway"

### Unclear Scenarios (Will ask for clarification)
- "I need help"
- "Something happened"
- "I'm not sure what to do"

## 🔧 Technical Details

### Real-Time AI Processing
- Uses Azure OpenAI GPT-4.1 for all responses
- Intelligent incident classification
- Dynamic conversation flow management
- Real-time state tracking

### Session Management
- Each conversation has a unique session ID
- State persists throughout the conversation
- Supports conversation reset and restart

### Error Handling
- Graceful fallbacks for API failures
- User-friendly error messages
- Automatic retry mechanisms

## 🆘 Emergency Protocol

The chatbot follows professional emergency communication protocols:
- **Immediate action** for life-threatening situations (injuries)
- **Quick response** for urgent situations (RSA needs)
- **Confirmation** for non-urgent situations (minor accidents, hazards)
- **Empathetic communication** throughout all interactions
- **Multi-issue support** for complex emergency situations

## 📱 Production Ready

This chatbot is production-ready and can be integrated with:
- Vehicle telematics systems
- Mobile applications
- Web interfaces
- Call center systems
- Emergency dispatch systems

The conversation flow is designed to handle real emergency situations with appropriate urgency levels and professional communication standards.
