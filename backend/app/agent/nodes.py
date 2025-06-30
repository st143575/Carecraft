"""
Workflow Nodes for Bosch eCall Emergency Communication System

This module contains the Python functions that represent the steps in the
LangGraph workflow. Each function takes the current state as input and
returns a dictionary with updated state values.
"""

from typing import Dict, Any
from datetime import datetime
import re

try:
    from .state import AgentState, IncidentType, NextAction, add_to_history, update_metrics
    from ..services.psap_service import contact_psap
    from ..services.rsa_service import contact_rsa
    from ..services.llm_service import llm_service
except ImportError:
    # Fallback for direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from agent.state import AgentState, IncidentType, NextAction, add_to_history, update_metrics
    from services.psap_service import contact_psap
    from services.rsa_service import contact_rsa
    from services.llm_service import llm_service


def start_interaction(state: AgentState) -> Dict[str, Any]:
    """
    Entry point for the eCall workflow. Greets the user and asks for situation details.
    Uses LLM to generate contextually appropriate greeting.

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values
    """

    # Generate dynamic greeting using LLM
    initial_context = {
        "session_id": state.get("session_id"),
        "timestamp": datetime.now().isoformat(),
        "system": "vehicle eCall emergency detection"
    }

    try:
        greeting_message = llm_service.generate_greeting(initial_context)
    except Exception as e:
        print(f"LLM greeting generation failed: {e}")
        # Fallback to basic greeting
        greeting_message = (
            "Hello, this is Bosch Emergency Services. I'm here to help you with any emergency "
            "situation you may be experiencing. Can you please tell me what's happening right now?"
        )

    # Update state with greeting and set next action
    updated_state = add_to_history(state, "", greeting_message)

    return {
        "final_response": greeting_message,
        "next_action": NextAction.ASK_FOR_CLARIFICATION,
        "history": updated_state["history"]
    }


def classify_incident(state: AgentState) -> Dict[str, Any]:
    """
    Core routing node that classifies the incident type based on user input.
    Uses LLM-powered intelligent classification instead of keyword matching.

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values including incident_type
    """

    user_input = state.get("user_input", "")
    conversation_history = state.get("history", [])

    # Convert history to format expected by LLM service
    llm_history = []
    for entry in conversation_history:
        if len(entry) >= 2:
            llm_history.append({
                "user": entry[0],
                "agent": entry[1]
            })

    try:
        # Use LLM for intelligent classification
        classification_result = llm_service.classify_incident(user_input, llm_history)

        # Map LLM result to our IncidentType enum
        incident_type_mapping = {
            "INJURY_ACCIDENT": IncidentType.INJURY_ACCIDENT,
            "LIGHT_ACCIDENT": IncidentType.LIGHT_ACCIDENT,
            "RSA_NEED": IncidentType.RSA_NEED,
            "ROAD_HAZARD": IncidentType.ROAD_HAZARD,
            "UNKNOWN": IncidentType.UNKNOWN
        }

        incident_type = incident_type_mapping.get(
            classification_result.get("incident_type"),
            IncidentType.UNKNOWN
        )
        confidence = classification_result.get("confidence", 0.5)

        # Store additional LLM insights in metrics
        updated_state = update_metrics(state, "classification_confidence", confidence)
        updated_state = update_metrics(updated_state, "llm_reasoning", classification_result.get("reasoning", ""))
        updated_state = update_metrics(updated_state, "urgency_level", classification_result.get("urgency_level", "MEDIUM"))

    except Exception as e:
        print(f"LLM classification failed: {e}")
        # Fallback to basic classification
        incident_type = IncidentType.UNKNOWN
        confidence = 0.3
        updated_state = update_metrics(state, "classification_confidence", confidence)
        updated_state = update_metrics(updated_state, "classification_method", "fallback")

    # For INJURY and RSA incidents, execute immediately without confirmation
    if incident_type == IncidentType.INJURY_ACCIDENT:
        # Execute injury accident response immediately
        return process_injury_accident(state)
    elif incident_type == IncidentType.RSA_NEED:
        # Execute RSA request immediately
        return process_rsa_request(state)

    # For other incidents, set up confirmation
    elif incident_type in [IncidentType.LIGHT_ACCIDENT, IncidentType.ROAD_HAZARD]:
        pending_action = "CONTACT_PSAP"
        action_details = {"incident_type": incident_type}
        return {
            "incident_type": incident_type,
            "pending_action": pending_action,
            "pending_action_details": action_details,
            "next_action": NextAction.CONFIRM_ACTION,
            "metrics": updated_state["metrics"]
        }
    else:
        # Unknown incident - generate clarification response
        return ask_for_clarification(state)


def ask_for_clarification(state: AgentState) -> Dict[str, Any]:
    """
    Generate an empathetic clarification request when the user's input is unclear.
    This handles casual greetings, unclear messages, and requests for more information.

    Args:
        state: Current agent state

    Returns:
        Dict with clarification response and updated state
    """

    user_input = state.get("user_input", "")
    conversation_history = state.get("history", [])

    # Convert history to format expected by LLM service
    llm_history = []
    for entry in conversation_history:
        if len(entry) >= 2:
            llm_history.append({"user": entry[0], "agent": entry[1]})

    try:
        # Use LLM to generate empathetic clarification response
        clarification_message = llm_service.generate_response(
            incident_type="UNKNOWN",
            user_input=user_input,
            conversation_history=llm_history,
            context={"clarification_needed": True, "be_conversational": True}
        )
    except Exception as e:
        print(f"LLM clarification generation failed: {e}")
        # Fallback clarification responses based on input type
        if user_input.lower() in ['hey', 'hi', 'hello', 'help']:
            clarification_message = "Hi there! I'm here to help. What's going on with your vehicle today?"
        elif len(user_input.strip()) < 3:
            clarification_message = "I want to make sure I understand. Can you tell me a bit more about what's happening?"
        else:
            clarification_message = "I'm here to help, but I need a bit more information. Are you having car trouble, been in an accident, or need roadside assistance?"

    # Add to conversation history
    updated_history_state = add_to_history(state, user_input, clarification_message)

    return {
        "final_response": clarification_message,
        "next_action": NextAction.ASK_FOR_CLARIFICATION,
        "incident_type": IncidentType.UNKNOWN,
        "history": updated_history_state["history"]
    }


def process_injury_accident(state: AgentState) -> Dict[str, Any]:
    """
    Handles the "Accident with Injury" scenario (Scenario 4).
    This is the highest priority emergency type.
    
    Args:
        state: Current agent state
    
    Returns:
        Dict with updated state values
    """
    
    # Prepare emergency data for PSAP
    emergency_data = {
        "incident_type": "INJURY_ACCIDENT",
        "severity": "HIGH",
        "location": state.get("context", {}).get("location", "Location being determined"),
        "vehicle_info": state.get("context", {}).get("vehicle_info", "Vehicle information available"),
        "occupant_info": "Injuries reported - immediate medical attention required",
        "additional_context": f"User reported: {state.get('user_input', '')}"
    }
    
    # Contact PSAP (emergency services)
    psap_response = contact_psap(emergency_data)
    
    # Update metrics with PSAP contact time
    updated_state = update_metrics(state, "psap_contact_time", datetime.now().isoformat())
    
    # Generate contextual response using LLM
    conversation_history = state.get("history", [])
    llm_history = []
    for entry in conversation_history:
        if len(entry) >= 2:
            llm_history.append({"user": entry[0], "agent": entry[1]})

    context_info = {
        "psap_response": psap_response,
        "emergency_data": emergency_data,
        "reference_id": psap_response['psap_reference_id']
    }

    try:
        response_message = llm_service.generate_response(
            incident_type="INJURY_ACCIDENT",
            user_input=state.get("user_input", ""),
            conversation_history=llm_history,
            context=context_info
        )
    except Exception as e:
        print(f"LLM response generation failed: {e}")
        # Fallback response
        response_message = (
            f"I understand this is a serious situation with injuries. I've immediately contacted "
            f"emergency services for you. {psap_response['response_message']} "
            f"Your emergency reference number is {psap_response['psap_reference_id']}. "
            f"Please stay calm and follow the instructions from emergency services."
        )
    
    # Add to conversation history
    updated_history_state = add_to_history(state, state.get("user_input", ""), response_message)
    
    return {
        "final_response": response_message,
        "next_action": NextAction.ASK_IF_RESOLVED,
        "context": {**state.get("context", {}), "psap_response": psap_response},
        "history": updated_history_state["history"],
        "metrics": updated_state["metrics"]
    }


def process_light_accident(state: AgentState) -> Dict[str, Any]:
    """
    Handles Scenario 1 - Light accident without injuries.
    Contacts PSAP with lower urgency level.

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values
    """

    # Prepare accident data for PSAP
    accident_data = {
        "incident_type": "LIGHT_ACCIDENT",
        "severity": "MEDIUM",
        "location": state.get("context", {}).get("location", "Location being determined"),
        "vehicle_info": state.get("context", {}).get("vehicle_info", "Vehicle information available"),
        "occupant_info": "No injuries reported",
        "additional_context": f"User reported: {state.get('user_input', '')}"
    }

    # Contact PSAP
    psap_response = contact_psap(accident_data)

    # Update metrics
    updated_state = update_metrics(state, "psap_contact_time", datetime.now().isoformat())

    # Generate contextual response using LLM
    conversation_history = state.get("history", [])
    llm_history = []
    for entry in conversation_history:
        if len(entry) >= 2:
            llm_history.append({"user": entry[0], "agent": entry[1]})

    context_info = {
        "psap_response": psap_response,
        "accident_data": accident_data,
        "reference_id": psap_response['psap_reference_id']
    }

    try:
        response_message = llm_service.generate_response(
            incident_type="LIGHT_ACCIDENT",
            user_input=state.get("user_input", ""),
            conversation_history=llm_history,
            context=context_info
        )
    except Exception as e:
        print(f"LLM response generation failed: {e}")
        # Fallback response
        response_message = (
            f"I understand you've been in an accident. I'm glad to hear there are no injuries. "
            f"I've contacted the appropriate authorities for you. {psap_response['response_message']} "
            f"Your reference number is {psap_response['psap_reference_id']}. "
            f"Please ensure your vehicle is in a safe location and your hazard lights are on if possible."
        )

    # Add to conversation history
    updated_history_state = add_to_history(state, state.get("user_input", ""), response_message)

    return {
        "final_response": response_message,
        "next_action": NextAction.ASK_IF_RESOLVED,
        "context": {**state.get("context", {}), "psap_response": psap_response},
        "history": updated_history_state["history"],
        "metrics": updated_state["metrics"]
    }


def process_road_hazard(state: AgentState) -> Dict[str, Any]:
    """
    Handles Scenario 2 - Objects on the road or road hazards.
    Contacts PSAP to report the hazard.

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values
    """

    # Prepare hazard data for PSAP
    hazard_data = {
        "incident_type": "ROAD_HAZARD",
        "severity": "MEDIUM",
        "location": state.get("context", {}).get("location", "Location being determined"),
        "vehicle_info": state.get("context", {}).get("vehicle_info", "Vehicle information available"),
        "occupant_info": "Occupants safe",
        "additional_context": f"Road hazard reported: {state.get('user_input', '')}"
    }

    # Contact PSAP
    psap_response = contact_psap(hazard_data)

    # Update metrics
    updated_state = update_metrics(state, "psap_contact_time", datetime.now().isoformat())

    # Generate contextual response using LLM
    conversation_history = state.get("history", [])
    llm_history = []
    for entry in conversation_history:
        if len(entry) >= 2:
            llm_history.append({"user": entry[0], "agent": entry[1]})

    context_info = {
        "psap_response": psap_response,
        "hazard_data": hazard_data,
        "reference_id": psap_response['psap_reference_id']
    }

    try:
        response_message = llm_service.generate_response(
            incident_type="ROAD_HAZARD",
            user_input=state.get("user_input", ""),
            conversation_history=llm_history,
            context=context_info
        )
    except Exception as e:
        print(f"LLM response generation failed: {e}")
        # Fallback response
        response_message = (
            f"Thank you for reporting this road hazard. I've notified the appropriate authorities "
            f"to address this safety concern. {psap_response['response_message']} "
            f"Your report reference number is {psap_response['psap_reference_id']}. "
            f"Please drive carefully and avoid the hazard if possible."
        )

    # Add to conversation history
    updated_history_state = add_to_history(state, state.get("user_input", ""), response_message)

    return {
        "final_response": response_message,
        "next_action": NextAction.ASK_IF_RESOLVED,
        "context": {**state.get("context", {}), "psap_response": psap_response},
        "history": updated_history_state["history"],
        "metrics": updated_state["metrics"]
    }


def process_rsa_request(state: AgentState) -> Dict[str, Any]:
    """
    Handles Scenario 3 - Customer in need of roadside assistance.
    Contacts RSA service provider.

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values
    """

    user_input = state.get("user_input", "")

    # Use LLM to determine specific assistance type
    conversation_history = state.get("history", [])
    llm_history = []
    for entry in conversation_history:
        if len(entry) >= 2:
            llm_history.append({"user": entry[0], "agent": entry[1]})

    try:
        # Get detailed classification from LLM for RSA type
        classification_result = llm_service.classify_incident(user_input, llm_history)

        # Map to specific assistance types based on LLM insights
        assistance_type = "GENERAL"
        if "tire" in user_input.lower() or "flat" in user_input.lower():
            assistance_type = "FLAT_TIRE"
        elif "battery" in user_input.lower() or "start" in user_input.lower():
            assistance_type = "DEAD_BATTERY"
        elif "locked" in user_input.lower() or "keys" in user_input.lower():
            assistance_type = "LOCKOUT"
        elif "tow" in user_input.lower():
            assistance_type = "TOW_NEEDED"
        elif "engine" in user_input.lower() or "mechanical" in user_input.lower():
            assistance_type = "ENGINE_TROUBLE"
        elif "fuel" in user_input.lower() or "gas" in user_input.lower():
            assistance_type = "FUEL_DELIVERY"

    except Exception as e:
        print(f"LLM assistance type classification failed: {e}")
        assistance_type = "GENERAL"

    # Prepare RSA request data
    rsa_data = {
        "assistance_type": assistance_type,
        "location": state.get("context", {}).get("location", "Location being determined"),
        "vehicle_info": state.get("context", {}).get("vehicle_info", "Vehicle information available"),
        "customer_info": state.get("context", {}).get("customer_info", "Customer information available"),
        "urgency": "STANDARD",
        "additional_context": f"Customer reported: {state.get('user_input', '')}"
    }

    # Contact RSA
    rsa_response = contact_rsa(rsa_data)

    # Update metrics
    updated_state = update_metrics(state, "rsa_contact_time", datetime.now().isoformat())

    # Generate contextual response using LLM
    context_info = {
        "rsa_response": rsa_response,
        "rsa_data": rsa_data,
        "assistance_type": assistance_type,
        "service_ticket": rsa_response['service_ticket']
    }

    try:
        response_message = llm_service.generate_response(
            incident_type="RSA_NEED",
            user_input=state.get("user_input", ""),
            conversation_history=llm_history,
            context=context_info
        )
    except Exception as e:
        print(f"LLM response generation failed: {e}")
        # Fallback response
        response_message = (
            f"I understand you need roadside assistance. I've contacted our service provider for you. "
            f"A {rsa_response['technician_type']} has been dispatched and will arrive in approximately "
            f"{rsa_response['estimated_arrival']}. Your service ticket number is {rsa_response['service_ticket']}. "
            f"The technician will call you when they arrive."
        )

    # Add to conversation history
    updated_history_state = add_to_history(state, state.get("user_input", ""), response_message)

    return {
        "final_response": response_message,
        "next_action": NextAction.ASK_IF_RESOLVED,
        "context": {**state.get("context", {}), "rsa_response": rsa_response},
        "history": updated_history_state["history"],
        "metrics": updated_state["metrics"]
    }


def handle_unknown(state: AgentState) -> Dict[str, Any]:
    """
    Fallback node for when the incident type cannot be determined.
    Asks for clarification from the user.

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values
    """

    # Generate contextual clarification using LLM
    conversation_history = state.get("history", [])
    llm_history = []
    for entry in conversation_history:
        if len(entry) >= 2:
            llm_history.append({"user": entry[0], "agent": entry[1]})

    try:
        clarification_message = llm_service.generate_response(
            incident_type="UNKNOWN",
            user_input=state.get("user_input", ""),
            conversation_history=llm_history,
            context={"clarification_needed": True}
        )
    except Exception as e:
        print(f"LLM clarification generation failed: {e}")
        # Fallback clarification
        clarification_message = (
            "I want to make sure I get you the right help. Could you please provide more details about your situation? "
            "For example: Are you injured or is anyone hurt? Have you been in an accident? "
            "Do you need roadside assistance like a tire change or jump start? "
            "Or are you reporting a road hazard or dangerous condition?"
        )

    # Add to conversation history
    updated_history_state = add_to_history(state, state.get("user_input", ""), clarification_message)

    return {
        "final_response": clarification_message,
        "next_action": NextAction.ASK_FOR_CLARIFICATION,
        "history": updated_history_state["history"]
    }


def end_interaction(state: AgentState) -> Dict[str, Any]:
    """
    Final node that prepares a closing message and completes the workflow.

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values
    """

    # Update resolution time metric
    updated_state = update_metrics(state, "resolution_time", datetime.now().isoformat())

    # Generate contextual closing message using LLM
    conversation_history = state.get("history", [])
    llm_history = []
    for entry in conversation_history:
        if len(entry) >= 2:
            llm_history.append({"user": entry[0], "agent": entry[1]})

    context_info = {
        "interaction_complete": True,
        "incident_type": state.get("incident_type"),
        "services_contacted": True
    }

    try:
        closing_message = llm_service.generate_response(
            incident_type=str(state.get("incident_type", "UNKNOWN")),
            user_input="interaction_complete",
            conversation_history=llm_history,
            context=context_info
        )
    except Exception as e:
        print(f"LLM closing message generation failed: {e}")
        # Fallback closing message
        closing_message = (
            "Thank you for using Bosch Emergency Services. We've processed your request and the appropriate "
            "assistance has been arranged. If you need any additional help or have questions about your "
            "service request, please don't hesitate to contact us again. Stay safe!"
        )

    return {
        "final_response": closing_message,
        "is_complete": True,
        "metrics": updated_state["metrics"]
    }


def confirm_action(state: AgentState) -> Dict[str, Any]:
    """
    Ask user to confirm before executing an action (like calling emergency services).

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values
    """

    pending_action = state.get("pending_action", "")
    action_details = state.get("pending_action_details", {})

    # Generate short, efficient confirmation message
    if pending_action == "CONTACT_PSAP":
        if state.get("incident_type") == "INJURY_ACCIDENT":
            confirmation_message = "I need to call emergency services immediately for your injury accident. Should I proceed?"
        else:
            confirmation_message = "I'll contact emergency services for you. Should I proceed?"
    elif pending_action == "CONTACT_RSA":
        assistance_type = action_details.get("assistance_type", "assistance")
        confirmation_message = f"I'll arrange roadside assistance for your {assistance_type.lower().replace('_', ' ')}. Should I proceed?"
    else:
        confirmation_message = "I'm ready to help you with this situation. Should I proceed with the next step?"

    # Add to conversation history
    updated_history_state = add_to_history(state, state.get("user_input", ""), confirmation_message)

    return {
        "final_response": confirmation_message,
        "next_action": NextAction.WAIT_FOR_CONFIRMATION,
        "history": updated_history_state["history"]
    }


def check_if_resolved(state: AgentState) -> Dict[str, Any]:
    """
    Ask user if their issue is resolved and if they need anything else.

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values
    """

    # Generate short, empathetic resolution check message
    incident_type = state.get("incident_type", "UNKNOWN")

    if incident_type == "INJURY_ACCIDENT":
        resolution_message = "Emergency services are on their way. Is there anything else I can help you with while you wait?"
    elif incident_type == "RSA_NEED":
        resolution_message = "Roadside assistance has been arranged. Is your situation resolved or do you need help with anything else?"
    elif incident_type == "ROAD_HAZARD":
        resolution_message = "The hazard has been reported to authorities. Is there anything else I can help you with?"
    else:
        resolution_message = "I've helped with your situation. Is everything resolved or do you need assistance with anything else?"

    # Add to conversation history
    updated_history_state = add_to_history(state, "", resolution_message)

    return {
        "final_response": resolution_message,
        "next_action": NextAction.ASK_IF_RESOLVED,
        "history": updated_history_state["history"]
    }


def handle_confirmation_response(state: AgentState) -> Dict[str, Any]:
    """
    Process user's confirmation response and execute the action if confirmed.

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values
    """

    user_input = state.get("user_input", "").lower().strip()
    pending_action = state.get("pending_action", "")

    # Check if user confirmed (yes, ok, proceed, sure, etc.)
    confirmation_keywords = ["yes", "ok", "okay", "sure", "proceed", "go ahead", "do it", "please"]
    rejection_keywords = ["no", "don't", "stop", "wait", "not yet", "cancel"]

    is_confirmed = any(keyword in user_input for keyword in confirmation_keywords)
    is_rejected = any(keyword in user_input for keyword in rejection_keywords)

    if is_rejected:
        # User rejected the action
        response_message = "Understood. What would you like me to do instead?"
        return {
            "final_response": response_message,
            "next_action": NextAction.ASK_FOR_CLARIFICATION,
            "pending_action": None,
            "pending_action_details": None,
            "action_confirmed": False,
            "history": add_to_history(state, user_input, response_message)["history"]
        }

    elif is_confirmed:
        # User confirmed - execute the pending action
        if pending_action == "CONTACT_PSAP":
            # Execute PSAP contact
            if state.get("incident_type") == "INJURY_ACCIDENT":
                return process_injury_accident(state)
            elif state.get("incident_type") == "LIGHT_ACCIDENT":
                return process_light_accident(state)
            elif state.get("incident_type") == "ROAD_HAZARD":
                return process_road_hazard(state)
        elif pending_action == "CONTACT_RSA":
            return process_rsa_request(state)

    # If unclear response, ask for clarification
    response_message = "I didn't understand. Please say 'yes' to proceed or 'no' if you'd like to do something else."
    return {
        "final_response": response_message,
        "next_action": NextAction.WAIT_FOR_CONFIRMATION,
        "history": add_to_history(state, user_input, response_message)["history"]
    }


def handle_resolution_response(state: AgentState) -> Dict[str, Any]:
    """
    Process user's response about whether their issue is resolved.

    Args:
        state: Current agent state

    Returns:
        Dict with updated state values
    """

    user_input = state.get("user_input", "").lower().strip()

    # Check if user says everything is resolved
    resolved_keywords = ["yes", "resolved", "solved", "good", "fine", "ok", "okay", "done", "nothing else", "all set"]
    more_help_keywords = ["no", "not yet", "help", "problem", "issue", "need", "more", "else", "another"]

    is_resolved = any(keyword in user_input for keyword in resolved_keywords)
    needs_more_help = any(keyword in user_input for keyword in more_help_keywords)

    if is_resolved and not needs_more_help:
        # User confirms everything is resolved - close the call
        response_message = "Perfect! Thank you for using Bosch Emergency Services. Stay safe!"
        return {
            "final_response": response_message,
            "is_complete": True,
            "issue_resolved": True,
            "next_action": NextAction.END_INTERACTION,
            "history": add_to_history(state, user_input, response_message)["history"]
        }

    elif needs_more_help:
        # User needs more help - ask what else they need
        response_message = "I'm here to help. What else do you need assistance with?"
        return {
            "final_response": response_message,
            "next_action": NextAction.ASK_FOR_CLARIFICATION,
            "issue_resolved": False,
            "history": add_to_history(state, user_input, response_message)["history"]
        }

    else:
        # Unclear response - ask for clarification
        response_message = "Is everything resolved, or do you need help with something else?"
        return {
            "final_response": response_message,
            "next_action": NextAction.ASK_IF_RESOLVED,
            "history": add_to_history(state, user_input, response_message)["history"]
        }
