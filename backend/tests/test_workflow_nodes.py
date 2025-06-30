"""
Unit tests for workflow nodes with real LLM integration.
"""

import pytest
from unittest.mock import patch, MagicMock

from app.agent.nodes import (
    start_interaction,
    classify_incident,
    process_injury_accident,
    process_light_accident,
    process_road_hazard,
    process_rsa_request,
    handle_unknown,
    end_interaction
)
from app.agent.state import IncidentType, NextAction


class TestWorkflowNodes:
    """Test suite for workflow node functions."""
    
    def test_start_interaction(self, sample_agent_state):
        """Test the start interaction node."""
        result = start_interaction(sample_agent_state)

        assert result is not None
        assert 'final_response' in result
        assert 'next_action' in result
        assert 'history' in result
        assert result['next_action'] == NextAction.ASK_FOR_CLARIFICATION

        # Should generate a greeting
        assert len(result['final_response']) > 0
        assert any(word in result['final_response'].lower() for word in ['hello', 'hi', 'welcome', 'help', 'emergency', 'services'])
    
    def test_classify_incident_injury_accident(self, sample_agent_state):
        """Test incident classification for injury accidents."""
        state = sample_agent_state.copy()
        state['user_input'] = "There's been a terrible car accident! Someone is seriously injured and bleeding!"

        result = classify_incident(state)

        assert result is not None
        assert 'incident_type' in result
        assert 'metrics' in result

        # Should classify as injury accident (or fallback to keyword-based classification)
        assert result['incident_type'] in [IncidentType.INJURY_ACCIDENT, IncidentType.UNKNOWN]
    
    def test_classify_incident_rsa_need(self, sample_agent_state):
        """Test incident classification for RSA needs."""
        state = sample_agent_state.copy()
        state['user_input'] = "My car battery died and I can't start the engine. Can you send roadside assistance?"

        result = classify_incident(state)

        assert result is not None
        assert 'incident_type' in result
        assert 'metrics' in result
        # Should classify as RSA need (or fallback to unknown)
        assert result['incident_type'] in [IncidentType.RSA_NEED, IncidentType.UNKNOWN]
    
    def test_classify_incident_unknown(self, sample_agent_state):
        """Test incident classification for unclear situations."""
        state = sample_agent_state.copy()
        state['user_input'] = "Um, I'm not sure what's happening..."

        result = classify_incident(state)

        assert result is not None
        assert 'incident_type' in result
        assert 'metrics' in result
        assert result['incident_type'] == IncidentType.UNKNOWN
    
    def test_process_injury_accident(self, sample_agent_state):
        """Test processing of injury accidents."""
        state = sample_agent_state.copy()
        state['incident_type'] = IncidentType.INJURY_ACCIDENT
        state['user_input'] = "Yes, someone is hurt badly"
        state['location'] = "Highway 101, Mile 45"

        result = process_injury_accident(state)

        assert result is not None
        assert 'final_response' in result
        assert 'is_complete' in result
        assert 'next_action' in result
        assert 'context' in result

        assert result['is_complete'] is True
        assert result['next_action'] == NextAction.END_INTERACTION

        # Should have PSAP response in context
        assert 'psap_response' in result['context']

        # Response should be empathetic and professional
        response = result['final_response'].lower()
        assert any(word in response for word in ['emergency', 'help', 'dispatch', 'ambulance', 'services'])
    
    def test_process_light_accident(self, sample_agent_state):
        """Test processing of light accidents."""
        state = sample_agent_state.copy()
        state['incident_type'] = IncidentType.LIGHT_ACCIDENT
        state['user_input'] = "Just a minor fender bender, no injuries"
        state['location'] = "Main Street Parking Lot"

        result = process_light_accident(state)

        assert result is not None
        assert 'final_response' in result
        assert 'is_complete' in result
        assert 'next_action' in result
        assert 'context' in result

        assert result['is_complete'] is True
        assert result['next_action'] == NextAction.END_INTERACTION

        # Should have PSAP response in context
        assert 'psap_response' in result['context']
    
    def test_process_road_hazard(self, sample_agent_state):
        """Test processing of road hazards."""
        state = sample_agent_state.copy()
        state['incident_type'] = IncidentType.ROAD_HAZARD
        state['user_input'] = "There's a large tree blocking the highway"
        state['location'] = "Interstate 95, Mile 120"

        result = process_road_hazard(state)

        assert result is not None
        assert 'final_response' in result
        assert 'is_complete' in result
        assert 'next_action' in result
        assert 'context' in result

        assert result['is_complete'] is True
        assert result['next_action'] == NextAction.END_INTERACTION

        # Should have PSAP response in context
        assert 'psap_response' in result['context']
    
    def test_process_rsa_request(self, sample_agent_state):
        """Test processing of RSA requests."""
        state = sample_agent_state.copy()
        state['incident_type'] = IncidentType.RSA_NEED
        state['user_input'] = "My tire is flat and I need help changing it"
        state['location'] = "Shopping Mall Parking Lot"

        result = process_rsa_request(state)

        assert result is not None
        assert 'final_response' in result
        assert 'is_complete' in result
        assert 'next_action' in result
        assert 'context' in result

        assert result['is_complete'] is True
        assert result['next_action'] == NextAction.END_INTERACTION

        # Should have RSA response in context
        assert 'rsa_response' in result['context']
    
    def test_handle_unknown(self, sample_agent_state):
        """Test handling of unknown situations."""
        state = sample_agent_state.copy()
        state['incident_type'] = IncidentType.UNKNOWN
        state['user_input'] = "I'm not sure what's wrong"

        result = handle_unknown(state)

        assert result is not None
        assert 'final_response' in result
        assert 'next_action' in result
        assert 'history' in result

        assert result['next_action'] == NextAction.ASK_FOR_CLARIFICATION

        # Should ask clarifying questions
        response = result['final_response'].lower()
        assert any(word in response for word in ['tell', 'describe', 'what', 'how', 'where', 'details', 'help'])
    
    def test_end_interaction(self, sample_agent_state):
        """Test ending interactions."""
        state = sample_agent_state.copy()
        state['psap_contacted'] = True
        state['incident_type'] = IncidentType.INJURY_ACCIDENT

        result = end_interaction(state)

        assert result is not None
        assert 'final_response' in result
        assert 'is_complete' in result
        assert 'metrics' in result

        assert result['is_complete'] is True

        # Should provide a professional closing
        response = result['final_response'].lower()
        assert any(word in response for word in ['help', 'assistance', 'safe', 'care', 'thank', 'service'])
    
    def test_conversation_history_preservation(self, sample_agent_state):
        """Test that conversation history is preserved across nodes."""
        state = sample_agent_state.copy()
        state['history'] = [("User", "Hello"), ("Assistant", "Hi there!")]

        result = start_interaction(state)

        # History should be preserved and extended
        assert 'history' in result
        assert len(result['history']) >= len(state['history'])
    
    @pytest.mark.asyncio
    async def test_llm_integration_in_nodes(self, sample_agent_state):
        """Test that nodes properly integrate with LLM service."""
        state = sample_agent_state.copy()
        state['user_input'] = "I need emergency help with a car accident"

        # Test that classification uses LLM
        classification_result = classify_incident(state)
        assert 'incident_type' in classification_result
        assert 'metrics' in classification_result

        # Merge classification result back into state for processing
        updated_state = {**state, **classification_result}

        # Test that response generation uses LLM
        if classification_result['incident_type'] == IncidentType.INJURY_ACCIDENT:
            injury_result = process_injury_accident(updated_state)
            assert 'final_response' in injury_result
            assert len(injury_result['final_response']) > 20  # Should be substantial LLM response
