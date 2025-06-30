"""
Unit tests for the LLM Service with real Azure OpenAI integration.
"""

import pytest
import os
from unittest.mock import patch, MagicMock

# Import the LLM service
from app.services.llm_service import llm_service


class TestLLMService:
    """Test suite for LLM Service functionality."""
    
    def test_llm_service_initialization(self):
        """Test that LLM service initializes correctly with Azure OpenAI."""
        assert llm_service is not None
        assert hasattr(llm_service, 'client')
        assert hasattr(llm_service, 'classify_incident')
        assert hasattr(llm_service, 'generate_response')
        assert hasattr(llm_service, 'generate_greeting')
    
    @pytest.mark.asyncio
    async def test_classify_incident_injury_accident(self):
        """Test incident classification for injury accidents."""
        user_input = "There's been a serious car crash on Highway 101. Someone is hurt and bleeding!"
        
        result = llm_service.classify_incident(user_input)
        
        assert result is not None
        assert 'incident_type' in result
        assert 'confidence' in result
        assert 'reasoning' in result
        
        # Should classify as injury accident with high confidence
        assert result['incident_type'] == 'INJURY_ACCIDENT'
        assert result['confidence'] >= 0.8
    
    @pytest.mark.asyncio
    async def test_classify_incident_light_accident(self):
        """Test incident classification for light accidents."""
        user_input = "I had a minor fender bender in the parking lot. No one is hurt, just some scratches."
        
        result = llm_service.classify_incident(user_input)
        
        assert result is not None
        assert result['incident_type'] == 'LIGHT_ACCIDENT'
        assert result['confidence'] >= 0.7
    
    @pytest.mark.asyncio
    async def test_classify_incident_rsa_need(self):
        """Test incident classification for roadside assistance."""
        user_input = "My car won't start. I think the battery is dead. Can you send someone to help?"
        
        result = llm_service.classify_incident(user_input)
        
        assert result is not None
        assert result['incident_type'] == 'RSA_NEED'
        assert result['confidence'] >= 0.7
    
    @pytest.mark.asyncio
    async def test_classify_incident_road_hazard(self):
        """Test incident classification for road hazards."""
        user_input = "There's a large tree fallen across the highway blocking all lanes."
        
        result = llm_service.classify_incident(user_input)
        
        assert result is not None
        assert result['incident_type'] == 'ROAD_HAZARD'
        assert result['confidence'] >= 0.7
    
    @pytest.mark.asyncio
    async def test_generate_response_with_context(self):
        """Test response generation with context."""
        incident_type = "INJURY_ACCIDENT"
        user_input = "Someone is hurt in the accident"
        conversation_history = [
            ("User", "There's been a car crash"),
            ("Assistant", "I understand there's been an accident. Are there any injuries?")
        ]
        context = {
            "location": "Highway 101",
            "severity": "HIGH"
        }
        
        response = llm_service.generate_response(
            incident_type=incident_type,
            user_input=user_input,
            conversation_history=conversation_history,
            context=context
        )
        
        assert response is not None
        assert isinstance(response, str)
        assert len(response) > 0
        # Should be empathetic and professional
        assert any(word in response.lower() for word in ['help', 'emergency', 'assistance', 'dispatch'])
    
    @pytest.mark.asyncio
    async def test_generate_greeting(self):
        """Test greeting generation."""
        context = {
            "time_of_day": "morning",
            "system_name": "Bosch eCall"
        }
        
        greeting = llm_service.generate_greeting(context)
        
        assert greeting is not None
        assert isinstance(greeting, str)
        assert len(greeting) > 0
        # Should be professional and welcoming
        assert any(word in greeting.lower() for word in ['hello', 'hi', 'welcome', 'bosch', 'ecall'])
    
    def test_fallback_on_api_error(self):
        """Test that service handles API errors gracefully with fallbacks."""
        # Mock the client to raise an exception
        with patch.object(llm_service, 'client') as mock_client:
            mock_client.chat.completions.create.side_effect = Exception("API Error")
            
            # Test classification fallback
            result = llm_service.classify_incident("test input")
            assert result['incident_type'] == 'UNKNOWN'
            assert result['confidence'] == 0.3  # Fallback confidence value
            
            # Test response generation fallback
            response = llm_service.generate_response(
                incident_type="UNKNOWN",
                user_input="test",
                conversation_history=[],
                context={}
            )
            assert "I want to make sure I get you the right help" in response
    
    @pytest.mark.asyncio
    async def test_conversation_history_formatting(self):
        """Test that conversation history is properly formatted for LLM context."""
        conversation_history = [
            ("User", "Hello"),
            ("Assistant", "Hi there! How can I help you?"),
            ("User", "I need help with my car")
        ]
        
        response = llm_service.generate_response(
            incident_type="RSA_NEED",
            user_input="My battery is dead",
            conversation_history=conversation_history,
            context={}
        )
        
        assert response is not None
        assert isinstance(response, str)
        # Response should acknowledge the conversation context
        assert len(response) > 20  # Should be a substantial response
