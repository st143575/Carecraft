"""
LangGraph Workflow for Bosch eCall Emergency Communication System

This module wires together the workflow nodes into a state machine using LangGraph.
The workflow handles different emergency scenarios with conditional routing based
on incident classification.
"""

try:
    from typing import Literal
except ImportError:
    from typing_extensions import Literal

try:
    from langgraph.graph import StateGraph, END
    from langgraph.graph.graph import CompiledGraph
    LANGGRAPH_AVAILABLE = True
except ImportError:
    # Mock LangGraph for testing without dependencies
    LANGGRAPH_AVAILABLE = False
    class StateGraph:
        def __init__(self, state_type): pass
        def add_node(self, name, func): pass
        def set_entry_point(self, name): pass
        def add_conditional_edges(self, source, condition, mapping): pass
        def add_edge(self, source, target): pass
        def compile(self): return MockCompiledGraph()

    class MockCompiledGraph:
        def invoke(self, state):
            # Simple mock workflow execution
            if not state.get("final_response"):
                state["final_response"] = "Mock response for testing"
                state["is_complete"] = True
            return state

    END = "END"

try:
    from .state import AgentState, IncidentType, NextAction
    from .nodes import (
        start_interaction,
        classify_incident,
        process_injury_accident,
        process_light_accident,
        process_road_hazard,
        process_rsa_request,
        handle_unknown,
        end_interaction,
        confirm_action,
        check_if_resolved,
        handle_confirmation_response,
        handle_resolution_response
    )
except ImportError:
    # Fallback for direct execution
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from agent.state import AgentState, IncidentType, NextAction
    from agent.nodes import (
        start_interaction,
        classify_incident,
        process_injury_accident,
        process_light_accident,
        process_road_hazard,
        process_rsa_request,
        handle_unknown,
        end_interaction,
        confirm_action,
        check_if_resolved,
        handle_confirmation_response,
        handle_resolution_response
    )


def should_classify_incident(state: AgentState) -> Literal["classify_incident", "end_interaction"]:
    """
    Conditional edge function to determine if we should classify the incident
    or end the interaction.

    Args:
        state: Current agent state

    Returns:
        Next node name to execute
    """

    # If interaction is complete, end it
    if state.get("is_complete"):
        return "end_interaction"

    # If we have user input and haven't classified yet, classify the incident
    if state.get("user_input") and not state.get("incident_type"):
        return "classify_incident"

    # If no user input yet (just started), end and wait for user input
    if not state.get("user_input"):
        return "end_interaction"

    # Default to classification
    return "classify_incident"



def should_continue_or_end(state: AgentState) -> Literal["classify_incident", "end_interaction"]:
    """
    Conditional edge function to determine if we should continue processing
    or end the interaction.

    Args:
        state: Current agent state

    Returns:
        Next node name to execute
    """

    # If the interaction is marked as complete, end it
    if state.get("is_complete"):
        return "end_interaction"

    # If we need more clarification, go back to classification
    return "classify_incident"


def route_after_classification(state: AgentState) -> Literal[
    "confirm_action",
    "handle_unknown"
]:
    """
    Route after classification - either confirm action or handle unknown.

    Args:
        state: Current agent state

    Returns:
        Next node name to execute
    """

    next_action = state.get("next_action")

    if next_action == NextAction.CONFIRM_ACTION:
        return "confirm_action"
    else:
        return "handle_unknown"


def route_confirmation_response(state: AgentState) -> Literal[
    "process_injury_accident",
    "process_light_accident",
    "process_road_hazard",
    "process_rsa_request",
    "classify_incident"
]:
    """
    Route based on confirmation response and pending action.

    Args:
        state: Current agent state

    Returns:
        Next node name to execute
    """

    action_confirmed = state.get("action_confirmed")
    pending_action = state.get("pending_action")
    incident_type = state.get("incident_type")

    if action_confirmed is False:
        return "classify_incident"

    if pending_action == "CONTACT_PSAP":
        if incident_type == IncidentType.INJURY_ACCIDENT:
            return "process_injury_accident"
        elif incident_type == IncidentType.LIGHT_ACCIDENT:
            return "process_light_accident"
        elif incident_type == IncidentType.ROAD_HAZARD:
            return "process_road_hazard"
    elif pending_action == "CONTACT_RSA":
        return "process_rsa_request"

    # Default fallback
    return "classify_incident"


def route_resolution_response(state: AgentState) -> Literal[
    "classify_incident",
    "end_interaction"
]:
    """
    Route based on resolution response.

    Args:
        state: Current agent state

    Returns:
        Next node name to execute
    """

    if state.get("is_complete") or state.get("issue_resolved"):
        return "end_interaction"
    else:
        return "classify_incident"


def create_workflow() -> CompiledGraph:
    """
    Create and compile the LangGraph workflow for the eCall system.
    
    Returns:
        CompiledGraph: The compiled workflow graph ready for execution
    """
    
    # Initialize the state graph with our AgentState
    workflow = StateGraph(AgentState)
    
    # Add all the workflow nodes
    workflow.add_node("start_interaction", start_interaction)
    workflow.add_node("classify_incident", classify_incident)
    workflow.add_node("confirm_action", confirm_action)
    workflow.add_node("handle_confirmation_response", handle_confirmation_response)
    workflow.add_node("process_injury_accident", process_injury_accident)
    workflow.add_node("process_light_accident", process_light_accident)
    workflow.add_node("process_road_hazard", process_road_hazard)
    workflow.add_node("process_rsa_request", process_rsa_request)
    workflow.add_node("check_if_resolved", check_if_resolved)
    workflow.add_node("handle_resolution_response", handle_resolution_response)
    workflow.add_node("handle_unknown", handle_unknown)
    workflow.add_node("end_interaction", end_interaction)
    
    # Set the entry point
    workflow.set_entry_point("start_interaction")
    
    # Add edges between nodes

    # From start_interaction, we can either classify or end
    workflow.add_conditional_edges(
        "start_interaction",
        should_classify_incident,
        {
            "classify_incident": "classify_incident",
            "end_interaction": "end_interaction"
        }
    )

    # From classify_incident, route to confirmation or unknown handling
    workflow.add_conditional_edges(
        "classify_incident",
        route_after_classification,
        {
            "confirm_action": "confirm_action",
            "handle_unknown": "handle_unknown"
        }
    )

    # From confirm_action, wait for user response
    workflow.add_edge("confirm_action", "handle_confirmation_response")

    # From handle_confirmation_response, route based on user's answer
    workflow.add_conditional_edges(
        "handle_confirmation_response",
        route_confirmation_response,
        {
            "process_injury_accident": "process_injury_accident",
            "process_light_accident": "process_light_accident",
            "process_road_hazard": "process_road_hazard",
            "process_rsa_request": "process_rsa_request",
            "classify_incident": "classify_incident"
        }
    )

    # All processing nodes lead to resolution check
    workflow.add_edge("process_injury_accident", "check_if_resolved")
    workflow.add_edge("process_light_accident", "check_if_resolved")
    workflow.add_edge("process_road_hazard", "check_if_resolved")
    workflow.add_edge("process_rsa_request", "check_if_resolved")

    # From check_if_resolved, wait for user response
    workflow.add_edge("check_if_resolved", "handle_resolution_response")

    # From handle_resolution_response, either continue or end
    workflow.add_conditional_edges(
        "handle_resolution_response",
        route_resolution_response,
        {
            "classify_incident": "classify_incident",
            "end_interaction": "end_interaction"
        }
    )

    # handle_unknown can either continue for more clarification or end
    workflow.add_conditional_edges(
        "handle_unknown",
        should_continue_or_end,
        {
            "classify_incident": "classify_incident",
            "end_interaction": "end_interaction"
        }
    )
    
    # end_interaction is a terminal node
    workflow.add_edge("end_interaction", END)
    
    # Compile and return the workflow
    return workflow.compile()


# Create the compiled workflow instance
compiled_workflow = create_workflow()


def run_workflow_step(state: AgentState) -> AgentState:
    """
    Execute one step of the workflow with the given state.
    
    Args:
        state: Current agent state
    
    Returns:
        AgentState: Updated state after workflow execution
    """
    
    try:
        # Run the workflow with the current state
        result = compiled_workflow.invoke(state)
        return result
    except Exception as e:
        # Handle workflow execution errors gracefully
        print(f"Workflow execution error: {str(e)}")
        
        # Return error state
        error_state = state.copy()
        error_state.update({
            "final_response": "I apologize, but I encountered an error processing your request. Please try again or contact emergency services directly if this is urgent.",
            "is_complete": True
        })
        return error_state


def get_workflow_visualization() -> str:
    """
    Get a text representation of the workflow structure for debugging.
    
    Returns:
        str: Text representation of the workflow
    """
    
    return """
    eCall Emergency Workflow Structure:
    
    START → start_interaction
              ↓
         classify_incident ←─────────┐
              ↓                     │
         [Route by incident type]   │
              ↓                     │
    ┌─────────────────────────────┐ │
    │ process_injury_accident     │ │
    │ process_light_accident      │ │
    │ process_road_hazard         │ │
    │ process_rsa_request         │ │
    │ handle_unknown ─────────────┘ │
    └─────────────────────────────┘
              ↓
         end_interaction
              ↓
             END
    """
