#!/usr/bin/env python3
"""
Interactive Demo Conversation System for Bosch eCall Emergency Services

This script provides a chatbot-style interface to demonstrate the complete
conversation flow with real-time LLM responses, conversation session management,
and demo scenarios for different incident types.

Usage:
    python3 demo_conversation.py

Features:
- Real-time conversation with Azure OpenAI GPT-4.1 integration
- Multiple demo scenarios (injury accident, roadside assistance, etc.)
- Session management and conversation history tracking
- Interactive command interface
- Full workflow demonstration from start to finish
"""

import sys
import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.agent.state import AgentState, IncidentType, NextAction, create_initial_state


class ConversationDemo:
    """Interactive conversation demo system."""
    
    def __init__(self):
        """Initialize the demo system."""
        self.session_id = str(uuid.uuid4())
        self.conversation_active = False
        self.current_state: Optional[AgentState] = None
        self.conversation_history: List[tuple] = []
        
    def print_banner(self):
        """Print the demo banner."""
        print("\n" + "="*80)
        print("🚨 BOSCH eCALL EMERGENCY SERVICES - INTERACTIVE DEMO 🚨")
        print("="*80)
        print("Welcome to the Bosch Emergency Communication System Demo!")
        print("This system uses Azure OpenAI GPT-4.1 for intelligent conversation.")
        print(f"Session ID: {self.session_id}")
        print("="*80)
        
    def print_help(self):
        """Print available commands."""
        print("\n📋 AVAILABLE COMMANDS:")
        print("  start          - Start a new emergency conversation")
        print("  demo <type>    - Run a predefined demo scenario")
        print("  status         - Show current conversation status")
        print("  history        - Show conversation history")
        print("  reset          - Reset the conversation session")
        print("  help           - Show this help message")
        print("  quit/exit      - Exit the demo")
        print("\n🎭 DEMO SCENARIOS:")
        print("  demo injury    - Simulate injury accident scenario")
        print("  demo rsa       - Simulate roadside assistance scenario")
        print("  demo hazard    - Simulate road hazard scenario")
        print("  demo unclear   - Simulate unclear situation scenario")
        
    def initialize_state(self) -> AgentState:
        """Initialize a new conversation state."""
        return {
            "session_id": self.session_id,
            "user_input": "",
            "history": [],
            "incident_type": IncidentType.UNKNOWN,
            "next_action": NextAction.ASK_FOR_CLARIFICATION,
            "location": None,
            "severity": "UNKNOWN",
            "is_complete": False,
            "psap_contacted": False,
            "rsa_contacted": False,
            "metrics": {},
            "context": {}
        }
        
    def print_agent_response(self, response: str, response_type: str = "AGENT"):
        """Print agent response with formatting."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"\n🤖 [{timestamp}] {response_type}: {response}")
        
    def print_user_input(self, user_input: str):
        """Print user input with formatting."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"\n👤 [{timestamp}] USER: {user_input}")
        
    def print_system_info(self, info: str):
        """Print system information."""
        print(f"\n💡 SYSTEM: {info}")
        
    def start_conversation(self):
        """Start a new emergency conversation."""
        if self.conversation_active:
            print("\n⚠️  Conversation already active. Use 'reset' to start over.")
            return

        print("\n🚀 Starting emergency conversation...")
        self.current_state = create_initial_state(self.session_id, "")
        self.conversation_active = True

        # Start the conversation with greeting
        try:
            from app.agent.nodes import start_interaction
            result = start_interaction(self.current_state)
            self.current_state.update(result)

            self.print_agent_response(result['final_response'], "EMERGENCY SERVICES")

            print("\n💬 You can now type your emergency situation, or use 'demo <type>' for scenarios.")

        except Exception as e:
            print(f"\n❌ Error starting conversation: {e}")
            
    def process_user_input(self, user_input: str):
        """Process user input through the conversation flow."""
        if not self.conversation_active:
            print("\n⚠️  No active conversation. Use 'start' to begin.")
            return

        self.print_user_input(user_input)

        try:
            # Update state with user input
            self.current_state['user_input'] = user_input

            # Process through the conversation flow step by step
            self.print_system_info("Processing your request...")

            # Determine what step we're in based on current state
            next_action = self.current_state.get('next_action')

            if next_action == NextAction.ASK_FOR_CLARIFICATION or not self.current_state.get('incident_type'):
                # Step 1: Classify the incident
                from app.agent.nodes import classify_incident
                result = classify_incident(self.current_state)
                self.current_state.update(result)

                # Check if action was auto-executed (INJURY or RSA incidents)
                if result.get('next_action') == NextAction.ASK_IF_RESOLVED:
                    # Action was auto-executed, show response and ask if resolved
                    self.print_agent_response(result.get('final_response', 'Action completed'))

                    from app.agent.nodes import check_if_resolved
                    resolve_result = check_if_resolved(self.current_state)
                    self.current_state.update(resolve_result)
                    self.print_agent_response(resolve_result.get('final_response', 'Is everything resolved?'))
                    return

                # If we have a pending action, ask for confirmation
                elif result.get('pending_action'):
                    from app.agent.nodes import confirm_action
                    confirm_result = confirm_action(self.current_state)
                    self.current_state.update(confirm_result)
                    self.print_agent_response(confirm_result.get('final_response', 'No response available'))
                    return

            elif next_action == NextAction.WAIT_FOR_CONFIRMATION:
                # Step 2: Handle confirmation response
                from app.agent.nodes import handle_confirmation_response
                result = handle_confirmation_response(self.current_state)
                self.current_state.update(result)

                # handle_confirmation_response executes the action directly if confirmed
                # Check if it executed an action (by checking if we have a final_response from an action)
                if result.get('next_action') == NextAction.ASK_IF_RESOLVED:
                    # Action was executed, now ask if resolved
                    self.print_agent_response(result.get('final_response', 'Action completed'))

                    from app.agent.nodes import check_if_resolved
                    resolve_result = check_if_resolved(self.current_state)
                    self.current_state.update(resolve_result)
                    self.print_agent_response(resolve_result.get('final_response', 'Is everything resolved?'))
                    return
                else:
                    # User declined or unclear response
                    self.print_agent_response(result.get('final_response', 'Please clarify your response'))
                    return

            elif next_action == NextAction.ASK_IF_RESOLVED:
                # Step 3: Handle resolution response
                from app.agent.nodes import handle_resolution_response
                result = handle_resolution_response(self.current_state)
                self.current_state.update(result)

                if result.get('issue_resolved'):
                    # End the conversation
                    from app.agent.nodes import end_interaction
                    end_result = end_interaction(self.current_state)
                    self.print_agent_response(end_result.get('final_response', 'Thank you for using Bosch Emergency Services. Stay safe!'))
                    print("\n💡 SYSTEM: ✅ Emergency session completed successfully!")
                    self.conversation_active = False
                else:
                    # Continue with more problems
                    self.print_agent_response("I'm here to help with anything else. What other issues are you experiencing?")
                    self.current_state['next_action'] = NextAction.ASK_FOR_CLARIFICATION
                    self.current_state['incident_type'] = None
                    self.current_state['pending_action'] = None
                return

        except Exception as e:
            print(f"\n❌ Error processing input: {e}")
            self.print_system_info("Falling back to basic response...")
            
    def run_demo_scenario(self, scenario_type: str):
        """Run a predefined demo scenario."""
        scenarios = {
            'injury': {
                'description': 'Injury Accident Scenario',
                'inputs': [
                    "Hello, I need help!",
                    "There's been a terrible car accident on Highway 101! Someone is seriously injured and bleeding!"
                ]
            },
            'rsa': {
                'description': 'Roadside Assistance Scenario', 
                'inputs': [
                    "Hi there",
                    "My car battery died in the parking lot. Can you send someone to jump start it?"
                ]
            },
            'hazard': {
                'description': 'Road Hazard Scenario',
                'inputs': [
                    "Hello",
                    "There's a large tree fallen across the highway blocking both lanes. It's very dangerous!"
                ]
            },
            'unclear': {
                'description': 'Unclear Situation Scenario',
                'inputs': [
                    "Um, hello?",
                    "I'm not sure what's happening... something seems wrong with my car..."
                ]
            }
        }
        
        if scenario_type not in scenarios:
            print(f"\n❌ Unknown scenario: {scenario_type}")
            print("Available scenarios: injury, rsa, hazard, unclear")
            return
            
        scenario = scenarios[scenario_type]
        print(f"\n🎭 Running Demo Scenario: {scenario['description']}")
        print("="*60)
        
        # Reset and start conversation
        self.reset_conversation()
        self.start_conversation()

        # Process each input in the scenario
        for user_input in scenario['inputs']:
            print(f"\n⏳ Processing: '{user_input}'...")
            import time
            time.sleep(1)  # Small delay for dramatic effect
            self.process_user_input(user_input)
            time.sleep(2)  # Pause between steps
            
        print(f"\n✅ Demo scenario '{scenario_type}' completed!")
        
    def show_status(self):
        """Show current conversation status."""
        print(f"\n📊 CONVERSATION STATUS:")
        print(f"Session ID: {self.session_id}")
        print(f"Active: {'Yes' if self.conversation_active else 'No'}")
        
        if self.current_state:
            print(f"Incident Type: {self.current_state.get('incident_type', 'Unknown')}")
            print(f"Next Action: {self.current_state.get('next_action', 'Unknown')}")
            print(f"Complete: {'Yes' if self.current_state.get('is_complete', False) else 'No'}")
            print(f"History Length: {len(self.current_state.get('history', []))}")
            
    def show_history(self):
        """Show conversation history."""
        if not self.current_state or not self.current_state.get('history'):
            print("\n📝 No conversation history available.")
            return
            
        print(f"\n📝 CONVERSATION HISTORY:")
        print("="*50)
        
        for i, (user_msg, agent_msg) in enumerate(self.current_state['history'], 1):
            if user_msg:
                print(f"{i}. 👤 USER: {user_msg}")
            print(f"   🤖 AGENT: {agent_msg}")
            print("-" * 50)
            
    async def reset_conversation(self):
        """Reset the conversation session."""
        self.session_id = str(uuid.uuid4())
        self.conversation_active = False
        self.current_state = None
        self.conversation_history = []
        print(f"\n🔄 Conversation reset. New session ID: {self.session_id}")

    def run_interactive_demo(self):
        """Run the interactive demo loop."""
        self.print_banner()
        self.print_help()

        print("\n💡 Type 'start' to begin an emergency conversation, or 'demo injury' for a quick demo!")

        while True:
            try:
                # Get user input
                user_input = input("\n> ").strip()

                if not user_input:
                    continue

                # Parse commands
                parts = user_input.lower().split()
                command = parts[0]

                if command in ['quit', 'exit']:
                    print("\n👋 Thank you for using Bosch Emergency Services Demo!")
                    print("Stay safe! 🚗💙")
                    break

                elif command == 'help':
                    self.print_help()

                elif command == 'start':
                    self.start_conversation()

                elif command == 'demo':
                    if len(parts) > 1:
                        scenario_type = parts[1]
                        self.run_demo_scenario(scenario_type)
                    else:
                        print("\n❌ Please specify a demo type: injury, rsa, hazard, unclear")

                elif command == 'status':
                    self.show_status()

                elif command == 'history':
                    self.show_history()

                elif command == 'reset':
                    self.reset_conversation()

                else:
                    # Treat as user input for active conversation
                    if self.conversation_active:
                        self.process_user_input(user_input)
                    else:
                        print("\n❓ Unknown command. Type 'help' for available commands.")

            except KeyboardInterrupt:
                print("\n\n👋 Demo interrupted. Goodbye!")
                break
            except Exception as e:
                print(f"\n❌ Unexpected error: {e}")
                print("Type 'help' for available commands.")


def main():
    """Main entry point for the demo."""
    try:
        # Check if we're in the right directory
        if not os.path.exists('app'):
            print("❌ Error: Please run this script from the Carecraft/backend directory")
            print("Usage: cd Carecraft/backend && python3 demo_conversation.py")
            return

        # Initialize and run the demo
        demo = ConversationDemo()
        demo.run_interactive_demo()

    except ImportError as e:
        print(f"❌ Import Error: {e}")
        print("Make sure you're running from the Carecraft/backend directory")
        print("and that all dependencies are installed.")
    except Exception as e:
        print(f"❌ Fatal Error: {e}")


if __name__ == "__main__":
    # Run the main function
    main()
