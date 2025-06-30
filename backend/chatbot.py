#!/usr/bin/env python3
"""
Bosch eCall Emergency Services - Interactive Chatbot
Real-time conversation system for emergency assistance.
"""

import os
import sys
import uuid
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.agent.state import AgentState, IncidentType, NextAction, create_initial_state


class EmergencyChatbot:
    """Interactive emergency chatbot for real-time conversations."""
    
    def __init__(self):
        self.session_id = str(uuid.uuid4())
        self.current_state = None
        self.conversation_active = False
        
    def print_header(self):
        """Print the chatbot header."""
        print("\n" + "="*80)
        print("🚨 BOSCH eCALL EMERGENCY SERVICES - LIVE CHATBOT 🚨")
        print("="*80)
        print("🆘 EMERGENCY ASSISTANCE SYSTEM")
        print("🤖 Powered by Azure OpenAI GPT-4.1")
        print(f"📱 Session ID: {self.session_id}")
        print("="*80)
        print("\n🚨 THIS IS A LIVE EMERGENCY SYSTEM 🚨")
        print("💡 Type your emergency situation and get real-time AI assistance")
        print("💡 Type 'help' for commands or 'quit' to exit")
        print("💡 For testing: 'I had a car accident with injuries' or 'I need roadside assistance'")
        print("\n" + "="*80)
        
    def print_message(self, message: str, sender: str = "AGENT", timestamp: bool = True):
        """Print a formatted message."""
        if timestamp:
            time_str = datetime.now().strftime("%H:%M:%S")
            print(f"\n🤖 [{time_str}] {sender}: {message}")
        else:
            print(f"\n🤖 {sender}: {message}")
            
    def print_user_input(self, user_input: str):
        """Print formatted user input."""
        time_str = datetime.now().strftime("%H:%M:%S")
        print(f"\n👤 [{time_str}] YOU: {user_input}")
        
    def print_system_info(self, message: str):
        """Print system information."""
        print(f"\n💡 SYSTEM: {message}")
        
    def start_conversation(self):
        """Start a new emergency conversation."""
        if self.conversation_active:
            print("\n⚠️  Conversation already active.")
            return
            
        print("\n🚀 Initializing emergency conversation...")
        self.current_state = create_initial_state(self.session_id, "")
        self.conversation_active = True
        
        try:
            # Get initial greeting
            from app.agent.nodes import start_interaction
            result = start_interaction(self.current_state)
            self.current_state.update(result)
            
            self.print_message(result['final_response'], "EMERGENCY SERVICES")
            print("\n💬 Please describe your emergency situation:")
            
        except Exception as e:
            print(f"\n❌ Error starting conversation: {e}")
            self.conversation_active = False
            
    def process_user_input(self, user_input: str):
        """Process user input through the conversation flow."""
        if not self.conversation_active:
            print("\n⚠️  No active conversation. Starting new session...")
            self.start_conversation()
            return
            
        try:
            # Update state with user input
            self.current_state['user_input'] = user_input
            
            # Process through the conversation flow step by step
            self.print_system_info("🔄 Processing your request...")
            
            # Determine what step we're in based on current state
            next_action = self.current_state.get('next_action')
            
            if next_action == NextAction.ASK_FOR_CLARIFICATION or not self.current_state.get('incident_type'):
                # Step 1: Classify the incident or handle clarification
                from app.agent.nodes import classify_incident
                result = classify_incident(self.current_state)
                self.current_state.update(result)

                # Check if we got a clarification response (UNKNOWN incident)
                if result.get('next_action') == NextAction.ASK_FOR_CLARIFICATION:
                    # Show clarification message and wait for user response
                    self.print_message(result.get('final_response', 'Could you tell me more?'))
                    return

                # Check if action was auto-executed (INJURY or RSA incidents)
                elif result.get('next_action') == NextAction.ASK_IF_RESOLVED:
                    # Action was auto-executed, show response and ask if resolved
                    self.print_message(result.get('final_response', 'Action completed'))

                    from app.agent.nodes import check_if_resolved
                    resolve_result = check_if_resolved(self.current_state)
                    self.current_state.update(resolve_result)
                    self.print_message(resolve_result.get('final_response', 'Is everything resolved?'))
                    return

                # If we have a pending action, ask for confirmation
                elif result.get('pending_action'):
                    from app.agent.nodes import confirm_action
                    confirm_result = confirm_action(self.current_state)
                    self.current_state.update(confirm_result)
                    self.print_message(confirm_result.get('final_response', 'Please confirm'))
                    return
                    
            elif next_action == NextAction.WAIT_FOR_CONFIRMATION:
                # Step 2: Handle confirmation response
                from app.agent.nodes import handle_confirmation_response
                result = handle_confirmation_response(self.current_state)
                self.current_state.update(result)
                
                # handle_confirmation_response executes the action directly if confirmed
                if result.get('next_action') == NextAction.ASK_IF_RESOLVED:
                    # Action was executed, now ask if resolved
                    self.print_message(result.get('final_response', 'Action completed'))
                    
                    from app.agent.nodes import check_if_resolved
                    resolve_result = check_if_resolved(self.current_state)
                    self.current_state.update(resolve_result)
                    self.print_message(resolve_result.get('final_response', 'Is everything resolved?'))
                    return
                else:
                    # User declined or unclear response
                    self.print_message(result.get('final_response', 'Please clarify your response'))
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
                    self.print_message(end_result.get('final_response', 'Thank you for using Bosch Emergency Services. Stay safe!'))
                    print("\n💡 SYSTEM: ✅ Emergency session completed successfully!")
                    self.conversation_active = False
                else:
                    # Continue with more problems
                    self.print_message("I'm here to help with anything else. What other issues are you experiencing?")
                    self.current_state['next_action'] = NextAction.ASK_FOR_CLARIFICATION
                    self.current_state['incident_type'] = None
                    self.current_state['pending_action'] = None
                return

            else:
                # Fallback for any other state
                self.print_message("I'm not sure how to help with that. Could you please describe your emergency situation?")
                self.current_state['next_action'] = NextAction.ASK_FOR_CLARIFICATION
                return
                
        except Exception as e:
            print(f"\n❌ Error processing input: {e}")
            print("Please try again or type 'help' for assistance.")
            
    def show_help(self):
        """Show help information."""
        print("\n📋 AVAILABLE COMMANDS:")
        print("  help           - Show this help message")
        print("  status         - Show current conversation status")
        print("  reset          - Reset the conversation session")
        print("  quit/exit      - Exit the chatbot")
        print("\n🎯 EXAMPLE EMERGENCY SITUATIONS:")
        print("  'I had a car accident with injuries'")
        print("  'I need roadside assistance'")
        print("  'I had a minor fender bender'")
        print("  'There's a road hazard ahead'")
        print("  'My car broke down'")
        
    def show_status(self):
        """Show current conversation status."""
        print(f"\n📊 CONVERSATION STATUS:")
        print(f"Session ID: {self.session_id}")
        print(f"Active: {'Yes' if self.conversation_active else 'No'}")
        if self.current_state:
            print(f"Current Action: {self.current_state.get('next_action', 'None')}")
            print(f"Incident Type: {self.current_state.get('incident_type', 'None')}")
            
    def reset_conversation(self):
        """Reset the conversation session."""
        self.conversation_active = False
        self.current_state = None
        self.session_id = str(uuid.uuid4())
        print(f"\n🔄 Conversation reset. New session ID: {self.session_id}")
        
    def run(self):
        """Run the interactive chatbot."""
        self.print_header()
        
        # Auto-start the conversation
        self.start_conversation()
        
        while True:
            try:
                # Get user input
                user_input = input("\n> ").strip()
                
                if not user_input:
                    continue
                    
                # Handle commands
                if user_input.lower() in ['quit', 'exit']:
                    print("\n👋 Thank you for using Bosch Emergency Services!")
                    print("Stay safe! 🚗💙")
                    break
                elif user_input.lower() == 'help':
                    self.show_help()
                    continue
                elif user_input.lower() == 'status':
                    self.show_status()
                    continue
                elif user_input.lower() == 'reset':
                    self.reset_conversation()
                    self.start_conversation()
                    continue
                    
                # Print user input and process it
                self.print_user_input(user_input)
                self.process_user_input(user_input)
                
            except KeyboardInterrupt:
                print("\n\n👋 Emergency session interrupted. Stay safe! 🚗💙")
                break
            except EOFError:
                print("\n\n👋 Emergency session ended. Stay safe! 🚗💙")
                break


if __name__ == "__main__":
    chatbot = EmergencyChatbot()
    chatbot.run()
