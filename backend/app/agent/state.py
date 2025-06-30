"""
Agent State Definition for Bosch eCall Emergency Communication System

This module defines the TypedDict structure that represents the state
passed between nodes in the LangGraph workflow. The state tracks the
entire conversation and decision-making process for emergency scenarios.
"""

from typing import TypedDict, List, Tuple, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class IncidentType(str, Enum):
    """Enumeration of possible incident types that can be classified."""
    INJURY_ACCIDENT = "INJURY_ACCIDENT"
    LIGHT_ACCIDENT = "LIGHT_ACCIDENT"
    RSA_NEED = "RSA_NEED"
    ROAD_HAZARD = "ROAD_HAZARD"
    UNKNOWN = "UNKNOWN"


class NextAction(str, Enum):
    """Enumeration of possible next actions in the workflow."""
    ASK_ABOUT_INJURIES = "ASK_ABOUT_INJURIES"
    CONFIRM_LOCATION = "CONFIRM_LOCATION"
    CONTACT_PSAP = "CONTACT_PSAP"
    CONTACT_RSA = "CONTACT_RSA"
    ASK_FOR_CLARIFICATION = "ASK_FOR_CLARIFICATION"
    CONFIRM_ACTION = "CONFIRM_ACTION"
    WAIT_FOR_CONFIRMATION = "WAIT_FOR_CONFIRMATION"
    ASK_IF_RESOLVED = "ASK_IF_RESOLVED"
    ASK_FOR_MORE_PROBLEMS = "ASK_FOR_MORE_PROBLEMS"
    END_INTERACTION = "END_INTERACTION"


class AgentState(TypedDict):
    """
    The state structure for the LangGraph workflow.
    
    This state is passed between nodes and tracks the entire conversation
    and decision-making process for emergency scenarios.
    """
    
    # Current user input
    user_input: str
    
    # Classified incident type
    incident_type: Optional[IncidentType]
    
    # Conversation history as list of (human_message, ai_message) tuples
    history: List[Tuple[str, str]]
    
    # Next action the agent should take
    next_action: Optional[NextAction]
    
    # Final response to be sent back to the user
    final_response: str
    
    # Flag to indicate if the workflow is complete
    is_complete: bool
    
    # Session identifier
    session_id: Optional[str]
    
    # Additional context data for incident processing
    context: Dict[str, Any]
    
    # Performance metrics and timestamps
    metrics: Dict[str, Any]

    # Pending action that needs user confirmation
    pending_action: Optional[str]

    # Details about the pending action for user confirmation
    pending_action_details: Optional[Dict[str, Any]]

    # Flag to indicate if user confirmed the action
    action_confirmed: Optional[bool]

    # Flag to indicate if the current issue is resolved
    issue_resolved: Optional[bool]


def create_initial_state(session_id: str, user_input: str = "") -> AgentState:
    """
    Create an initial state for a new eCall session.
    
    Args:
        session_id: Unique identifier for the session
        user_input: Initial user input (optional)
    
    Returns:
        AgentState: Initial state with default values
    """
    return AgentState(
        user_input=user_input,
        incident_type=None,
        history=[],
        next_action=None,
        final_response="",
        is_complete=False,
        session_id=session_id,
        context={},
        metrics={
            "call_start_time": datetime.now().isoformat(),
            "psap_contact_time": None,
            "rsa_contact_time": None,
            "resolution_time": None,
            "classification_confidence": None
        },
        pending_action=None,
        pending_action_details=None,
        action_confirmed=None,
        issue_resolved=None
    )


def update_metrics(state: AgentState, metric_name: str, value: Any) -> AgentState:
    """
    Update a specific metric in the state.

    Args:
        state: Current agent state
        metric_name: Name of the metric to update
        value: Value to set for the metric

    Returns:
        AgentState: Updated state with new metric value
    """
    updated_state = state.copy()
    if "metrics" not in updated_state:
        updated_state["metrics"] = {}
    updated_state["metrics"][metric_name] = value
    return updated_state


def add_to_history(state: AgentState, human_message: str, ai_message: str) -> AgentState:
    """
    Add a conversation exchange to the history.

    Args:
        state: Current agent state
        human_message: Message from the human
        ai_message: Response from the AI agent

    Returns:
        AgentState: Updated state with new history entry
    """
    updated_state = state.copy()
    if "history" not in updated_state:
        updated_state["history"] = []
    updated_state["history"].append((human_message, ai_message))
    return updated_state
