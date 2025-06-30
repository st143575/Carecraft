"""
Unit tests for PSAP and RSA services with LLM integration.
"""

import pytest
from unittest.mock import patch, MagicMock

from app.services.psap_service import contact_psap, get_psap_status
from app.services.rsa_service import contact_rsa, get_rsa_status


class TestPSAPService:
    """Test suite for PSAP service functionality."""
    
    def test_contact_psap_injury_accident(self, sample_emergency_data):
        """Test PSAP contact for injury accidents."""
        result = contact_psap(sample_emergency_data)
        
        assert result is not None
        assert result['status'] == 'SUCCESS'
        assert 'psap_reference_id' in result
        assert 'response_message' in result
        assert 'dispatch_units' in result
        assert 'priority_level' in result
        
        # High priority incidents should have critical priority
        assert result['priority_level'] == 'CRITICAL'
        assert 'Ambulance' in result['dispatch_units']
        assert 'Police' in result['dispatch_units']
    
    def test_contact_psap_light_accident(self):
        """Test PSAP contact for light accidents."""
        data = {
            "incident_type": "LIGHT_ACCIDENT",
            "location": "Parking lot",
            "severity": "LOW",
            "vehicle_info": "Minor damage",
            "occupant_info": "No injuries"
        }
        
        result = contact_psap(data)
        
        assert result is not None
        assert result['status'] == 'SUCCESS'
        assert result['priority_level'] == 'STANDARD'
        assert 'Police' in result['dispatch_units']
    
    def test_contact_psap_road_hazard(self):
        """Test PSAP contact for road hazards."""
        data = {
            "incident_type": "ROAD_HAZARD",
            "location": "Highway 101",
            "severity": "MEDIUM",
            "additional_context": "Debris on road"
        }
        
        result = contact_psap(data)
        
        assert result is not None
        assert result['status'] == 'SUCCESS'
        assert result['priority_level'] == 'STANDARD'
        assert 'Highway Maintenance' in result['dispatch_units']
    
    def test_psap_response_message_generation(self, sample_emergency_data):
        """Test that PSAP generates appropriate response messages."""
        result = contact_psap(sample_emergency_data)
        
        assert 'response_message' in result
        response = result['response_message']
        assert isinstance(response, str)
        assert len(response) > 0
        
        # Should contain relevant emergency response information
        assert any(word in response.lower() for word in ['emergency', 'dispatch', 'response', 'services'])
    
    def test_get_psap_status(self):
        """Test PSAP status checking."""
        reference_id = "PSAP-20231225123456"
        
        result = get_psap_status(reference_id)
        
        assert result is not None
        assert result['reference_id'] == reference_id
        assert 'status' in result
        assert 'estimated_arrival' in result
        assert 'last_update' in result
    
    def test_psap_llm_fallback(self, sample_emergency_data):
        """Test PSAP service fallback when LLM fails."""
        with patch('app.services.psap_service.llm_service') as mock_llm:
            mock_llm.generate_response.side_effect = Exception("LLM Error")
            
            result = contact_psap(sample_emergency_data)
            
            # Should still work with fallback messages
            assert result is not None
            assert result['status'] == 'SUCCESS'
            assert 'response_message' in result


class TestRSAService:
    """Test suite for RSA service functionality."""
    
    def test_contact_rsa_flat_tire(self, sample_rsa_data):
        """Test RSA contact for flat tire assistance."""
        result = contact_rsa(sample_rsa_data)
        
        assert result is not None
        assert result['status'] == 'DISPATCHED'
        assert 'service_ticket' in result
        assert 'service_type' in result
        assert 'technician_type' in result
        assert 'estimated_arrival' in result
        
        # Should be tire-specific service
        assert 'Tire' in result['service_type']
        assert 'Tire Specialist' in result['technician_type']
    
    def test_contact_rsa_dead_battery(self):
        """Test RSA contact for dead battery assistance."""
        data = {
            "assistance_type": "DEAD_BATTERY",
            "location": "Office parking garage",
            "vehicle_info": "2021 Honda Civic",
            "urgency": "HIGH"
        }
        
        result = contact_rsa(data)
        
        assert result is not None
        assert result['status'] == 'DISPATCHED'
        assert 'Battery' in result['service_type']
        assert 'Battery Specialist' in result['technician_type']
    
    def test_contact_rsa_lockout(self):
        """Test RSA contact for vehicle lockout."""
        data = {
            "assistance_type": "LOCKOUT",
            "location": "Shopping center",
            "vehicle_info": "2020 Ford F-150",
            "urgency": "STANDARD"
        }
        
        result = contact_rsa(data)
        
        assert result is not None
        assert result['status'] == 'DISPATCHED'
        assert 'Lockout' in result['service_type']
        assert 'Locksmith' in result['technician_type']
    
    def test_contact_rsa_tow_needed(self):
        """Test RSA contact for towing service."""
        data = {
            "assistance_type": "TOW_NEEDED",
            "location": "Highway breakdown lane",
            "vehicle_info": "2019 Subaru Outback",
            "urgency": "HIGH"
        }
        
        result = contact_rsa(data)
        
        assert result is not None
        assert result['status'] == 'DISPATCHED'
        assert 'Towing' in result['service_type']
        assert 'Tow Truck' in result['technician_type']
    
    def test_rsa_service_instructions(self, sample_rsa_data):
        """Test that RSA generates appropriate service instructions."""
        result = contact_rsa(sample_rsa_data)
        
        assert 'service_instructions' in result
        instructions = result['service_instructions']
        assert isinstance(instructions, list)
        assert len(instructions) > 0
        
        # Should contain safety and preparation instructions
        instruction_text = ' '.join(instructions).lower()
        assert any(word in instruction_text for word in ['safe', 'vehicle', 'technician', 'ready'])
    
    def test_get_rsa_status(self):
        """Test RSA status checking."""
        service_ticket = "RSA-20231225123456"
        
        result = get_rsa_status(service_ticket)
        
        assert result is not None
        assert result['service_ticket'] == service_ticket
        assert 'status' in result
        assert 'technician_name' in result
        assert 'estimated_arrival' in result
    
    def test_rsa_urgency_handling(self):
        """Test that RSA handles urgency levels correctly."""
        # Test high urgency
        high_urgency_data = {
            "assistance_type": "ENGINE_TROUBLE",
            "location": "Remote highway",
            "urgency": "HIGH"
        }
        
        result = contact_rsa(high_urgency_data)
        
        assert result is not None
        # High urgency should affect estimated arrival time
        assert 'Priority Service' in result['estimated_arrival'] or 'minutes' in result['estimated_arrival']
    
    def test_rsa_llm_fallback(self, sample_rsa_data):
        """Test RSA service fallback when LLM fails."""
        with patch('app.services.rsa_service.llm_service') as mock_llm:
            mock_llm.generate_response.side_effect = Exception("LLM Error")
            
            result = contact_rsa(sample_rsa_data)
            
            # Should still work with fallback instructions
            assert result is not None
            assert result['status'] == 'DISPATCHED'
            assert 'service_instructions' in result
            assert len(result['service_instructions']) > 0
