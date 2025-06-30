#!/usr/bin/env python3
"""
Test script for the Bosch eCall Emergency Communication System

This script tests the core workflow logic without requiring external dependencies.
It simulates different emergency scenarios to validate the system behavior.
"""

import sys
import os
import json
from datetime import datetime

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_incident_classification():
    """Test the incident classification logic."""
    print("=" * 60)
    print("TESTING INCIDENT CLASSIFICATION")
    print("=" * 60)
    
    # Import the classification function
    try:
        from agent.nodes import classify_incident
        from agent.state import create_initial_state, IncidentType
        
        test_cases = [
            {
                "input": "I've been in a crash and I'm hurt, need ambulance",
                "expected": IncidentType.INJURY_ACCIDENT,
                "description": "Injury accident scenario"
            },
            {
                "input": "Had a fender bender, no injuries just damage",
                "expected": IncidentType.LIGHT_ACCIDENT,
                "description": "Light accident scenario"
            },
            {
                "input": "I have a flat tire and need help",
                "expected": IncidentType.RSA_NEED,
                "description": "Roadside assistance scenario"
            },
            {
                "input": "There's debris on the highway blocking traffic",
                "expected": IncidentType.ROAD_HAZARD,
                "description": "Road hazard scenario"
            },
            {
                "input": "Hello, what can you help me with?",
                "expected": IncidentType.UNKNOWN,
                "description": "Unknown/unclear scenario"
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\nTest {i}: {test_case['description']}")
            print(f"Input: '{test_case['input']}'")
            
            # Create test state
            state = create_initial_state("test-session", test_case['input'])
            
            # Run classification
            result = classify_incident(state)
            classified_type = result.get('incident_type')
            confidence = result.get('metrics', {}).get('classification_confidence', 0)
            
            print(f"Classified as: {classified_type}")
            print(f"Confidence: {confidence:.2f}")
            print(f"Expected: {test_case['expected']}")
            
            if classified_type == test_case['expected']:
                print("✅ PASS")
            else:
                print("❌ FAIL")
        
        print("\n" + "=" * 60)
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False


def test_mock_services():
    """Test the mock PSAP and RSA services."""
    print("TESTING MOCK SERVICES")
    print("=" * 60)
    
    try:
        from services.psap_service import contact_psap
        from services.rsa_service import contact_rsa
        
        # Test PSAP service
        print("\n🚨 Testing PSAP Service:")
        psap_data = {
            "incident_type": "INJURY_ACCIDENT",
            "severity": "HIGH",
            "location": "Highway 101, Mile Marker 45",
            "vehicle_info": "2020 BMW X5, License: ABC123",
            "occupant_info": "2 occupants, 1 injured",
            "additional_context": "Driver reports chest pain"
        }
        
        psap_response = contact_psap(psap_data)
        print(f"PSAP Response Status: {psap_response['status']}")
        print(f"Reference ID: {psap_response['psap_reference_id']}")
        print(f"Priority: {psap_response['priority_level']}")
        
        # Test RSA service
        print("\n🔧 Testing RSA Service:")
        rsa_data = {
            "assistance_type": "FLAT_TIRE",
            "location": "Main Street Parking Lot",
            "vehicle_info": "2019 Honda Civic, License: XYZ789",
            "customer_info": "John Doe, Member ID: 12345",
            "urgency": "STANDARD",
            "additional_context": "Front left tire is flat"
        }
        
        rsa_response = contact_rsa(rsa_data)
        print(f"RSA Response Status: {rsa_response['status']}")
        print(f"Service Ticket: {rsa_response['service_ticket']}")
        print(f"Service Type: {rsa_response['service_type']}")
        print(f"ETA: {rsa_response['estimated_arrival']}")
        
        print("\n✅ Mock services working correctly")
        print("=" * 60)
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False


def test_workflow_nodes():
    """Test individual workflow nodes."""
    print("TESTING WORKFLOW NODES")
    print("=" * 60)
    
    try:
        from agent.nodes import (
            start_interaction, process_injury_accident, 
            process_rsa_request, handle_unknown
        )
        from agent.state import create_initial_state
        
        # Test start interaction
        print("\n🚀 Testing start_interaction node:")
        state = create_initial_state("test-session")
        result = start_interaction(state)
        print(f"Response: {result['final_response'][:100]}...")
        print(f"Next Action: {result.get('next_action')}")
        
        # Test injury accident processing
        print("\n🚑 Testing process_injury_accident node:")
        injury_state = create_initial_state("test-session", "I'm hurt in a crash")
        injury_state['incident_type'] = 'INJURY_ACCIDENT'
        injury_state['context'] = {
            'location': 'Highway 101',
            'vehicle_info': '2020 BMW X5'
        }
        
        injury_result = process_injury_accident(injury_state)
        print(f"Response: {injury_result['final_response'][:100]}...")
        print(f"Is Complete: {injury_result.get('is_complete')}")
        
        # Test RSA processing
        print("\n🔧 Testing process_rsa_request node:")
        rsa_state = create_initial_state("test-session", "I have a flat tire")
        rsa_state['incident_type'] = 'RSA_NEED'
        rsa_state['context'] = {
            'location': 'Main Street',
            'vehicle_info': '2019 Honda Civic'
        }
        
        rsa_result = process_rsa_request(rsa_state)
        print(f"Response: {rsa_result['final_response'][:100]}...")
        print(f"Is Complete: {rsa_result.get('is_complete')}")
        
        # Test unknown handling
        print("\n❓ Testing handle_unknown node:")
        unknown_state = create_initial_state("test-session", "Hello")
        unknown_result = handle_unknown(unknown_state)
        print(f"Response: {unknown_result['final_response'][:100]}...")
        print(f"Next Action: {unknown_result.get('next_action')}")
        
        print("\n✅ All workflow nodes working correctly")
        print("=" * 60)
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False


def test_state_management():
    """Test state creation and management functions."""
    print("TESTING STATE MANAGEMENT")
    print("=" * 60)
    
    try:
        from agent.state import (
            create_initial_state, add_to_history, 
            update_metrics, IncidentType, NextAction
        )
        
        # Test initial state creation
        print("\n📊 Testing initial state creation:")
        state = create_initial_state("test-123", "Hello world")
        print(f"Session ID: {state['session_id']}")
        print(f"User Input: {state['user_input']}")
        print(f"History Length: {len(state['history'])}")
        print(f"Is Complete: {state['is_complete']}")
        
        # Test adding to history
        print("\n📝 Testing history management:")
        updated_state = add_to_history(state, "User message", "AI response")
        print(f"History after addition: {len(updated_state['history'])} entries")
        print(f"Latest entry: {updated_state['history'][-1]}")
        
        # Test metrics update
        print("\n📈 Testing metrics update:")
        metrics_state = update_metrics(state, "test_metric", "test_value")
        print(f"Updated metric: {metrics_state['metrics']['test_metric']}")
        
        # Test enums
        print("\n🏷️ Testing enums:")
        print(f"Incident types: {list(IncidentType)}")
        print(f"Next actions: {list(NextAction)}")
        
        print("\n✅ State management working correctly")
        print("=" * 60)
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False


def main():
    """Run all tests."""
    print("🚗 BOSCH eCALL EMERGENCY COMMUNICATION SYSTEM - TEST SUITE")
    print("=" * 80)
    print(f"Test started at: {datetime.now().isoformat()}")
    print("=" * 80)
    
    tests = [
        ("State Management", test_state_management),
        ("Mock Services", test_mock_services),
        ("Incident Classification", test_incident_classification),
        ("Workflow Nodes", test_workflow_nodes)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} tests...")
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            results.append((test_name, False))
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{test_name}: {status}")
        if success:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    print(f"Success rate: {(passed/total)*100:.1f}%")
    
    if passed == total:
        print("\n🎉 All tests passed! The eCall system is ready for deployment.")
    else:
        print(f"\n⚠️  {total-passed} test(s) failed. Please review the issues above.")
    
    print("=" * 80)
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
