"""
PSAP (Public Safety Answering Point) Service

This module provides mock functionality for contacting emergency services.
In a real implementation, this would integrate with actual PSAP systems
to transmit emergency data and coordinate response.
"""

from typing import Dict, Any
from datetime import datetime
import json

try:
    from .llm_service import llm_service
except ImportError:
    # Fallback for direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(__file__))
    from llm_service import llm_service


def contact_psap(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mock function to simulate contacting the Public Safety Answering Point (PSAP).
    
    In a real implementation, this would:
    - Establish secure connection to PSAP systems
    - Transmit emergency data in standardized format
    - Receive confirmation and response instructions
    - Handle emergency dispatch coordination
    
    Args:
        data: Dictionary containing emergency information including:
            - incident_type: Type of emergency
            - location: GPS coordinates or address
            - severity: Urgency level
            - vehicle_info: Vehicle identification and details
            - occupant_info: Number of occupants and injury status
            - additional_context: Any other relevant information
    
    Returns:
        Dict containing PSAP response with confirmation and next steps
    """
    
    # Simulate processing time and generate response
    timestamp = datetime.now().isoformat()
    
    # Log the emergency data being sent to PSAP
    print("=" * 60)
    print("🚨 EMERGENCY ALERT - CONTACTING PSAP 🚨")
    print("=" * 60)
    print(f"Timestamp: {timestamp}")
    print(f"Incident Type: {data.get('incident_type', 'UNKNOWN')}")
    print(f"Severity Level: {data.get('severity', 'MEDIUM')}")
    print(f"Location: {data.get('location', 'Location not provided')}")
    print(f"Vehicle Info: {data.get('vehicle_info', 'Not available')}")
    print(f"Occupant Status: {data.get('occupant_info', 'Unknown')}")
    print(f"Additional Context: {data.get('additional_context', 'None')}")
    print("=" * 60)
    print("📡 Data transmitted to emergency services successfully")
    print("🚑 Emergency response has been dispatched")
    print("=" * 60)
    
    # Simulate different response types based on incident severity
    incident_type = data.get('incident_type', 'UNKNOWN')
    severity = data.get('severity', 'MEDIUM')
    
    # Determine dispatch configuration based on incident type
    if incident_type == 'INJURY_ACCIDENT' or severity == 'HIGH':
        dispatch_units = ["Ambulance", "Police", "Fire Department"]
        priority_level = "CRITICAL"
        estimated_arrival = "8-12 minutes"
    elif incident_type == 'LIGHT_ACCIDENT':
        dispatch_units = ["Police"]
        priority_level = "STANDARD"
        estimated_arrival = "15-20 minutes"
    elif incident_type == 'ROAD_HAZARD':
        dispatch_units = ["Highway Maintenance", "Police"]
        priority_level = "STANDARD"
        estimated_arrival = "20-30 minutes"
    else:
        dispatch_units = ["Emergency Assessment Team"]
        priority_level = "STANDARD"
        estimated_arrival = "15-25 minutes"

    # Generate dynamic response message using LLM
    context_info = {
        "incident_type": incident_type,
        "severity": severity,
        "dispatch_units": dispatch_units,
        "priority_level": priority_level,
        "estimated_arrival": estimated_arrival,
        "location": data.get('location', 'Location being determined')
    }

    try:
        # Use natural language instead of system-like commands to avoid content filtering
        response_message = llm_service.generate_response(
            incident_type=incident_type,
            user_input="Emergency services have been contacted and are responding to the situation",
            conversation_history=[],
            context=context_info
        )
    except Exception as e:
        print(f"LLM PSAP response generation failed: {e}")
        # Fallback responses
        if incident_type == 'INJURY_ACCIDENT' or severity == 'HIGH':
            response_message = "Emergency services dispatched immediately. Ambulance and police en route."
        elif incident_type == 'LIGHT_ACCIDENT':
            response_message = "Police unit dispatched for accident report."
        elif incident_type == 'ROAD_HAZARD':
            response_message = "Highway maintenance and police notified. Response team dispatched to clear hazard."
        else:
            response_message = "Emergency services alerted. Appropriate response team will be dispatched."
    
    # Return structured response
    return {
        "status": "SUCCESS",
        "psap_reference_id": f"PSAP-{timestamp.replace(':', '').replace('-', '').replace('.', '')[:14]}",
        "contact_timestamp": timestamp,
        "response_message": response_message,
        "dispatch_units": dispatch_units,
        "priority_level": priority_level,
        "estimated_arrival": "8-20 minutes" if priority_level == "CRITICAL" else "15-30 minutes",
        "follow_up_required": True,
        "instructions": [
            "Stay with your vehicle if safe to do so",
            "Keep your phone available for emergency services contact",
            "Do not move injured persons unless in immediate danger",
            "Provide additional information if requested by emergency services"
        ]
    }


def get_psap_status(reference_id: str) -> Dict[str, Any]:
    """
    Mock function to check the status of a PSAP emergency response.
    
    Args:
        reference_id: PSAP reference ID from initial contact
    
    Returns:
        Dict containing current status of emergency response
    """
    
    print(f"📞 Checking PSAP status for reference: {reference_id}")
    
    # Mock status response
    return {
        "reference_id": reference_id,
        "status": "ACTIVE",
        "units_dispatched": ["Unit-A12", "Unit-M34"],
        "estimated_arrival": "6 minutes",
        "last_update": datetime.now().isoformat(),
        "additional_info": "Units are en route to your location"
    }


def update_psap_info(reference_id: str, additional_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mock function to send additional information to PSAP.
    
    Args:
        reference_id: PSAP reference ID from initial contact
        additional_data: Additional emergency information
    
    Returns:
        Dict containing confirmation of information update
    """
    
    timestamp = datetime.now().isoformat()
    
    print("=" * 40)
    print("📝 UPDATING PSAP INFORMATION")
    print("=" * 40)
    print(f"Reference ID: {reference_id}")
    print(f"Update Time: {timestamp}")
    print(f"Additional Data: {json.dumps(additional_data, indent=2)}")
    print("=" * 40)
    
    return {
        "status": "UPDATED",
        "reference_id": reference_id,
        "update_timestamp": timestamp,
        "confirmation": "Additional information has been forwarded to emergency response team"
    }
