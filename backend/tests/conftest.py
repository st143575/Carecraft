"""
Pytest configuration and fixtures for the Bosch eCall Emergency Communication System tests.
"""

import pytest
import os
import sys
from pathlib import Path

# Add the app directory to Python path for imports
app_dir = Path(__file__).parent.parent / "app"
sys.path.insert(0, str(app_dir))

# Set environment variables for testing
os.environ.setdefault("AZURE_OPENAI_API_VERSION", "2024-02-01")
os.environ.setdefault("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4.1")

@pytest.fixture
def sample_agent_state():
    """Fixture providing a sample agent state for testing."""
    from app.agent.state import AgentState, IncidentType, NextAction
    
    return {
        "session_id": "test-session-123",
        "user_input": "I need help with my car",
        "conversation_history": [],
        "history": [],  # Add both for compatibility
        "incident_type": IncidentType.UNKNOWN,
        "next_action": NextAction.ASK_FOR_CLARIFICATION,
        "location": "Test Location",
        "severity": "MEDIUM",
        "is_complete": False,
        "psap_contacted": False,
        "rsa_contacted": False,
        "metrics": {}
    }

@pytest.fixture
def sample_emergency_data():
    """Fixture providing sample emergency data for testing."""
    return {
        "incident_type": "INJURY_ACCIDENT",
        "location": "Highway 101, Mile Marker 45",
        "severity": "HIGH",
        "vehicle_info": "2023 BMW X5, License: ABC123",
        "occupant_info": "2 occupants, 1 injured",
        "additional_context": "Vehicle rolled over, blocking traffic"
    }

@pytest.fixture
def sample_rsa_data():
    """Fixture providing sample RSA data for testing."""
    return {
        "assistance_type": "FLAT_TIRE",
        "location": "Main Street Parking Lot",
        "vehicle_info": "2022 Toyota Camry, License: XYZ789",
        "customer_info": "John Doe, Member ID: 12345",
        "urgency": "STANDARD",
        "additional_context": "Front left tire is flat"
    }
