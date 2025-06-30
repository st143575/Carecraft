# Bosch eCall Emergency Communication System

An AI-driven emergency communication system for vehicle incidents using FastAPI and LangGraph to create a stateful, agentic workflow that handles different emergency scenarios.

## 🚗 Overview

The Bosch eCall Emergency Communication System is designed to automatically handle various emergency scenarios by:

- **Classifying incidents** based on user input (injury accidents, light accidents, roadside assistance needs, road hazards)
- **Routing to appropriate services** (PSAP for emergencies, RSA for roadside assistance)
- **Managing conversation state** through a sophisticated workflow
- **Providing structured responses** with proper escalation and follow-up

## 🏗️ Architecture

### Core Components

1. **Agent State Management** (`app/agent/state.py`)
   - TypedDict structure for LangGraph state
   - Tracks conversation history, incident classification, and metrics
   - Manages session lifecycle and context

2. **Workflow Nodes** (`app/agent/nodes.py`)
   - Individual processing functions for each workflow step
   - Incident classification using keyword matching
   - Specialized handlers for different emergency types

3. **LangGraph Workflow** (`app/agent/workflow.py`)
   - State machine implementation with conditional routing
   - Orchestrates the flow between different nodes
   - Handles complex decision trees

4. **Mock Services** (`app/services/`)
   - **PSAP Service**: Simulates emergency services contact
   - **RSA Service**: Simulates roadside assistance coordination

5. **FastAPI Server** (`app/main.py`)
   - REST API endpoints for session management
   - Real-time conversation handling
   - Session state persistence

## 🔄 Workflow Process

```
User Input → Classification → Route by Type → Contact Services → Response
     ↓              ↓              ↓              ↓              ↓
Start Session → Analyze Intent → Emergency/RSA → PSAP/RSA → End Session
```

### Supported Scenarios

1. **Injury Accident** (Scenario 4)
   - Highest priority emergency
   - Immediate PSAP contact
   - Medical response coordination

2. **Light Accident** (Scenario 1)
   - Property damage only
   - Police notification
   - Standard priority

3. **Road Hazard** (Scenario 2)
   - Safety hazard reporting
   - Highway maintenance alert
   - Public safety notification

4. **Roadside Assistance** (Scenario 3)
   - Vehicle breakdown support
   - RSA service coordination
   - Customer service focus

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip package manager

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd Carecraft/backend
   ```

2. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn langgraph langchain-core
   ```

3. **Run the validation test:**
   ```bash
   python3 simple_test.py
   ```

4. **Start the server:**
   ```bash
   python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access the API:**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/
   - Workflow Info: http://localhost:8000/workflow/visualization

## 📡 API Endpoints

### Session Management

- **POST** `/e-call/session` - Start new emergency session
- **POST** `/e-call/session/{session_id}` - Continue conversation
- **GET** `/e-call/session/{session_id}/status` - Get session status
- **DELETE** `/e-call/session/{session_id}` - End session
- **GET** `/e-call/sessions` - List active sessions

### System Information

- **GET** `/` - Health check
- **GET** `/workflow/visualization` - Workflow structure info

## 🧪 Testing

### Run Basic Functionality Test
```bash
python3 simple_test.py
```

### Run Comprehensive Test Suite
```bash
python3 test_workflow.py
```

### Example API Usage

**Start a session:**
```bash
curl -X POST "http://localhost:8000/e-call/session" \
  -H "Content-Type: application/json" \
  -d '{
    "initial_message": "",
    "vehicle_info": {"make": "BMW", "model": "X5", "year": "2020"},
    "location": {"lat": 37.7749, "lng": -122.4194}
  }'
```

**Send a message:**
```bash
curl -X POST "http://localhost:8000/e-call/session/{session_id}" \
  -H "Content-Type: application/json" \
  -d '{"message": "I have been in an accident and I am hurt"}'
```

## 🔧 Configuration

The system runs with default configuration and doesn't require environment variables. Server settings can be modified in the startup command or by editing `main.py`.

### Customization Points

1. **Incident Classification**: Modify keyword patterns in `classify_incident()`
2. **Service Integration**: Replace mock services with real API calls
3. **Response Templates**: Customize messages in workflow nodes
4. **Metrics Collection**: Extend metrics tracking in state management

## 🏥 Emergency Scenarios

### Scenario 1: Light Accident
- **Trigger**: "accident", "crash", "collision" (no injury keywords)
- **Action**: Contact PSAP with medium priority
- **Response**: Police dispatch confirmation

### Scenario 2: Road Hazard
- **Trigger**: "debris", "hazard", "blocking", "dangerous"
- **Action**: Contact PSAP for hazard reporting
- **Response**: Maintenance team dispatch

### Scenario 3: Roadside Assistance
- **Trigger**: "flat tire", "battery", "breakdown", "tow"
- **Action**: Contact RSA service
- **Response**: Technician dispatch with ETA

### Scenario 4: Injury Accident
- **Trigger**: "hurt", "injured", "medical", "ambulance"
- **Action**: Immediate PSAP contact with high priority
- **Response**: Emergency services dispatch

## 🔮 Future Enhancements

### Planned Features
1. **LLM Integration**: Replace keyword matching with GPT-4 classification
2. **Real Service Integration**: Connect to actual PSAP and RSA systems
3. **Voice Support**: Add speech-to-text and text-to-speech
4. **Multi-language**: Support for multiple languages
5. **Advanced Analytics**: Comprehensive metrics and reporting
6. **Mobile App Integration**: Native mobile app support

### Technical Improvements
- Database persistence for session storage
- Redis caching for improved performance
- WebSocket support for real-time updates
- Authentication and authorization
- Rate limiting and security enhancements

## 📊 System Metrics

The system tracks various metrics for performance monitoring:

- **Call Start Time**: When the emergency session begins
- **Classification Confidence**: Accuracy of incident type detection
- **PSAP Contact Time**: When emergency services are contacted
- **RSA Contact Time**: When roadside assistance is contacted
- **Resolution Time**: When the session is completed

## 🛡️ Security Considerations

- Input validation and sanitization
- Session management and timeout handling
- Rate limiting for API endpoints
- Secure communication protocols
- Data privacy and GDPR compliance

## 📞 Support

For technical support or questions about the Bosch eCall Emergency Communication System:

- **Documentation**: See inline code comments for detailed implementation notes
- **Testing**: Use the provided test scripts to validate functionality
- **API Reference**: Access interactive documentation at `/docs` endpoint

## 📄 License

This project is developed for the Bosch Hackathon and is intended for demonstration purposes.

---

**🚨 Important Note**: This is a demonstration system with mock services. In a production environment, ensure proper integration with real emergency services and roadside assistance providers.
