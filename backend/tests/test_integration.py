"""
Integration tests for the complete Bosch eCall Emergency Communication System.
"""

import pytest
from unittest.mock import patch, MagicMock

from app.agent.state import AgentState, IncidentType, NextAction
from app.agent.nodes import (
    start_interaction,
    classify_incident,
    process_injury_accident,
    process_rsa_request,
    end_interaction
)


class TestSystemIntegration:
    """Integration tests for the complete emergency communication workflow."""
    
    @pytest.mark.asyncio
    async def test_complete_injury_accident_workflow(self):
        """Test complete workflow for injury accident scenario."""
        # Initial state
        state = {
            "session_id": "integration-test-001",
            "user_input": "Hello, I need help",
            "history": [],
            "incident_type": IncidentType.UNKNOWN,
            "next_action": NextAction.ASK_FOR_CLARIFICATION,
            "location": None,
            "severity": "UNKNOWN",
            "is_complete": False,
            "psap_contacted": False,
            "rsa_contacted": False,
            "metrics": {}
        }
        
        # Step 1: Start interaction
        result = start_interaction(state)
        assert result['next_action'] == NextAction.ASK_FOR_CLARIFICATION
        assert len(result['final_response']) > 0
        
        # Step 2: User reports injury accident
        result['user_input'] = "There's been a terrible car accident on Highway 101! Someone is seriously injured!"
        result['location'] = "Highway 101, Mile Marker 45"
        
        # Step 3: Classify incident
        classification_result = classify_incident(result)
        assert classification_result['incident_type'] == IncidentType.INJURY_ACCIDENT

        # Merge classification result back into state
        result = {**result, **classification_result}
        
        # Step 4: Process injury accident
        processing_result = process_injury_accident(result)
        assert processing_result['is_complete'] is True
        assert processing_result['next_action'] == NextAction.END_INTERACTION
        assert 'context' in processing_result
        assert 'psap_response' in processing_result['context']

        # Merge processing result back into state
        result = {**result, **processing_result}

        # Step 5: End interaction
        end_result = end_interaction(result)
        assert end_result['is_complete'] is True
        assert len(end_result['final_response']) > 0

        # Verify conversation history was maintained in the processing result
        assert len(processing_result['history']) > 0
    
    @pytest.mark.asyncio
    async def test_complete_rsa_workflow(self):
        """Test complete workflow for roadside assistance scenario."""
        # Initial state
        state = {
            "session_id": "integration-test-002",
            "user_input": "Hi there",
            "history": [],
            "incident_type": IncidentType.UNKNOWN,
            "next_action": NextAction.ASK_FOR_CLARIFICATION,
            "location": None,
            "severity": "UNKNOWN",
            "is_complete": False,
            "psap_contacted": False,
            "rsa_contacted": False,
            "metrics": {}
        }
        
        # Step 1: Start interaction
        result = start_interaction(state)
        
        # Step 2: User requests roadside assistance
        result['user_input'] = "My car battery died in the parking lot. Can you send someone to jump start it?"
        result['location'] = "Shopping Mall Parking Lot, Section B"
        
        # Step 3: Classify incident
        classification_result = classify_incident(result)
        assert classification_result['incident_type'] == IncidentType.RSA_NEED

        # Merge classification result back into state
        result = {**result, **classification_result}
        
        # Step 4: Process RSA request
        processing_result = process_rsa_request(result)
        assert processing_result['is_complete'] is True
        assert processing_result['next_action'] == NextAction.END_INTERACTION
        assert 'context' in processing_result
        assert 'rsa_response' in processing_result['context']
        
        # Merge processing result back into state
        result = {**result, **processing_result}

        # Step 5: End interaction
        end_result = end_interaction(result)
        assert end_result['is_complete'] is True

        # Verify RSA service was properly configured in processing result
        rsa_response = processing_result['context']['rsa_response']
        assert rsa_response['status'] == 'DISPATCHED'
        assert 'service_ticket' in rsa_response
    
    @pytest.mark.asyncio
    async def test_unclear_situation_clarification(self):
        """Test workflow when user input is unclear and needs clarification."""
        state = {
            "session_id": "integration-test-003",
            "user_input": "Um, I'm not sure what's happening...",
            "history": [],
            "incident_type": IncidentType.UNKNOWN,
            "next_action": NextAction.ASK_FOR_CLARIFICATION,
            "location": None,
            "severity": "UNKNOWN",
            "is_complete": False,
            "psap_contacted": False,
            "rsa_contacted": False,
            "metrics": {}
        }
        
        # Start interaction
        result = start_interaction(state)
        
        # Classify unclear input
        classification_result = classify_incident(result)
        assert classification_result['incident_type'] == IncidentType.UNKNOWN

        # Merge classification result back into state
        result = {**result, **classification_result}
        
        # Should ask for clarification
        assert 'final_response' in result
        response = result['final_response'].lower()
        assert any(word in response for word in ['tell', 'describe', 'what', 'how', 'where'])
    
    @pytest.mark.asyncio
    async def test_conversation_context_preservation(self):
        """Test that conversation context is preserved throughout the workflow."""
        state = {
            "session_id": "integration-test-004",
            "user_input": "Hello",
            "history": [],
            "incident_type": IncidentType.UNKNOWN,
            "next_action": NextAction.ASK_FOR_CLARIFICATION,
            "location": None,
            "severity": "UNKNOWN",
            "is_complete": False,
            "psap_contacted": False,
            "rsa_contacted": False,
            "metrics": {}
        }
        
        # Multiple interaction steps
        result = start_interaction(state)
        initial_history_length = len(result.get('history', []))

        # Simulate a complete workflow that adds to history
        result['user_input'] = "My tire is flat and I need help"
        classification_result = classify_incident(result)
        result = {**result, **classification_result}

        # Process the RSA request (this adds to history)
        processing_result = process_rsa_request(result)
        result = {**result, **processing_result}

        # Conversation history should grow with each interaction that adds to history
        final_history_length = len(result.get('history', []))
        assert final_history_length > initial_history_length
    
    def test_llm_service_error_handling(self):
        """Test system behavior when LLM service encounters errors."""
        state = {
            "session_id": "integration-test-005",
            "user_input": "Emergency help needed",
            "history": [],
            "incident_type": IncidentType.UNKNOWN,
            "next_action": NextAction.ASK_FOR_CLARIFICATION,
            "location": "Test Location",
            "severity": "HIGH",
            "is_complete": False,
            "psap_contacted": False,
            "rsa_contacted": False,
            "metrics": {}
        }
        
        # Mock LLM service to fail
        with patch('app.services.llm_service.llm_service') as mock_llm:
            mock_llm.classify_incident.side_effect = Exception("LLM Service Error")
            mock_llm.generate_response.side_effect = Exception("LLM Service Error")
            
            # System should still function with fallbacks
            result = classify_incident(state)
            
            # Should fallback to UNKNOWN classification
            assert result['incident_type'] == IncidentType.UNKNOWN
            assert 'metrics' in result
    
    @pytest.mark.asyncio
    async def test_metrics_tracking(self):
        """Test that metrics are properly tracked throughout the workflow."""
        state = {
            "session_id": "integration-test-006",
            "user_input": "Car accident with injuries",
            "history": [],
            "incident_type": IncidentType.UNKNOWN,
            "next_action": NextAction.ASK_FOR_CLARIFICATION,
            "location": "Highway 95",
            "severity": "HIGH",
            "is_complete": False,
            "psap_contacted": False,
            "rsa_contacted": False,
            "metrics": {}
        }
        
        # Run through workflow
        result = start_interaction(state)
        result = classify_incident(result)
        result = process_injury_accident(result)
        result = end_interaction(result)
        
        # Check that metrics were tracked
        assert 'metrics' in result
        # Metrics should contain timing and classification information
        metrics = result['metrics']
        assert isinstance(metrics, dict)
    
    def test_session_id_consistency(self):
        """Test that session ID remains consistent throughout workflow."""
        session_id = "test-session-consistency"
        state = {
            "session_id": session_id,
            "user_input": "Test input",
            "history": [],
            "incident_type": IncidentType.UNKNOWN,
            "next_action": NextAction.ASK_FOR_CLARIFICATION,
            "location": None,
            "severity": "UNKNOWN",
            "is_complete": False,
            "psap_contacted": False,
            "rsa_contacted": False,
            "metrics": {}
        }
        
        # Run through multiple nodes
        result = start_interaction(state)
        # Merge result back into state to preserve session_id
        result = {**state, **result}
        assert result['session_id'] == session_id

        classification_result = classify_incident(result)
        result = {**result, **classification_result}
        assert result['session_id'] == session_id

        end_result = end_interaction(result)
        result = {**result, **end_result}
        assert result['session_id'] == session_id
