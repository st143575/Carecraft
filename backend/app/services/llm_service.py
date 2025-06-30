"""
Azure OpenAI LLM Service for Bosch eCall Emergency Communication System

This module provides LLM-powered conversation management, incident classification,
and dynamic response generation using Azure OpenAI GPT-4.
"""

import os
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from openai import AzureOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMService:
    """
    Service class for Azure OpenAI integration providing intelligent conversation
    management and incident classification for emergency scenarios.
    """
    
    def __init__(self):
        """Initialize the Azure OpenAI client with configuration."""
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        self.deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4")
        
    def classify_incident(self, user_input: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Use GPT-4 to intelligently classify the incident type based on user input.
        
        Args:
            user_input: The user's description of their situation
            conversation_history: Previous conversation context
            
        Returns:
            Dict containing incident_type, confidence, and reasoning
        """
        
        system_prompt = """You are an expert emergency services classifier for a vehicle eCall system. 
        Your job is to analyze user input and classify the incident into one of these categories:

        1. INJURY_ACCIDENT - Any accident involving injuries, medical emergencies, or serious harm
        2. LIGHT_ACCIDENT - Vehicle accidents with no injuries, minor collisions, fender benders
        3. RSA_NEED - Roadside assistance needs (flat tire, dead battery, lockout, fuel, mechanical issues)
        4. ROAD_HAZARD - Road safety hazards (debris, obstacles, dangerous conditions)
        5. UNKNOWN - Unclear or insufficient information to classify

        Respond with a JSON object containing:
        - incident_type: One of the 5 categories above
        - confidence: Float between 0.0 and 1.0
        - reasoning: Brief explanation of your classification
        - urgency_level: HIGH, MEDIUM, or LOW
        - requires_emergency_services: boolean
        """
        
        # Build context from conversation history
        context = ""
        if conversation_history:
            context = "\n\nConversation history:\n"
            for entry in conversation_history[-3:]:  # Last 3 exchanges
                context += f"User: {entry.get('user', '')}\nAgent: {entry.get('agent', '')}\n"
        
        user_prompt = f"""Classify this emergency situation:
        
        User input: "{user_input}"
        {context}
        
        Provide your classification as a JSON object."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=300
            )
            
            # Parse the JSON response
            result = json.loads(response.choices[0].message.content)
            
            # Validate and normalize the response
            valid_types = ["INJURY_ACCIDENT", "LIGHT_ACCIDENT", "RSA_NEED", "ROAD_HAZARD", "UNKNOWN"]
            if result.get("incident_type") not in valid_types:
                result["incident_type"] = "UNKNOWN"
                
            result["confidence"] = max(0.0, min(1.0, float(result.get("confidence", 0.5))))
            
            return result
            
        except Exception as e:
            print(f"LLM classification error: {e}")
            # Fallback to basic keyword matching
            return self._fallback_classification(user_input)
    
    def generate_response(self, 
                         incident_type: str, 
                         user_input: str, 
                         conversation_history: List[Dict] = None,
                         context: Dict[str, Any] = None) -> str:
        """
        Generate contextually appropriate, empathetic responses using GPT-4.
        
        Args:
            incident_type: The classified incident type
            user_input: The user's current message
            conversation_history: Previous conversation context
            context: Additional context (location, vehicle info, etc.)
            
        Returns:
            Generated response string
        """
        
        system_prompt = f"""You are a caring, professional emergency services operator for Bosch eCall system.
        You are helping someone who may be in a {incident_type} situation.

        COMMUNICATION STYLE - CRITICAL:
        - Be warm, empathetic, and genuinely caring
        - Keep responses SHORT (1-3 sentences max) but meaningful
        - Use simple, clear language - avoid technical jargon
        - Show you understand their stress and are here to help
        - Be conversational and human, not robotic
        - Always acknowledge what they said before asking questions

        CONVERSATION RULES:
        - If they say casual things like "hey", "hello", respond warmly and ask about their situation
        - If they give unclear responses, gently ask for clarification while being supportive
        - Use their conversation history to understand context (like "yes" meaning agreement to previous questions)
        - Never ignore their input - always respond with something helpful

        RESPONSE GUIDELINES BY SITUATION:
        - INJURY_ACCIDENT: "I'm sorry this happened. Help is coming. Are you hurt?" (urgent but caring)
        - LIGHT_ACCIDENT: "I understand this is stressful. Let me help you through this." (supportive)
        - RSA_NEED: "I know this is frustrating. I'm arranging help for you right now." (understanding)
        - ROAD_HAZARD: "Thank you for reporting this. I'll make sure authorities know." (appreciative)
        - UNKNOWN/CASUAL: "Hi there, I'm here to help. What's going on with your vehicle today?" (friendly)

        Remember: Be a caring human first, emergency operator second. Keep it short, sweet, and helpful.
        """
        
        # Build conversation context
        context_info = ""
        if conversation_history:
            context_info += "\n\nConversation history:\n"
            for entry in conversation_history[-3:]:
                # Handle both tuple and dictionary formats
                if isinstance(entry, tuple) and len(entry) >= 2:
                    context_info += f"User: {entry[0]}\nAgent: {entry[1]}\n"
                elif isinstance(entry, dict):
                    context_info += f"User: {entry.get('user', '')}\nAgent: {entry.get('agent', '')}\n"
        
        if context:
            # Sanitize context to avoid triggering content filters
            sanitized_context = self._sanitize_context_for_llm(context)
            if sanitized_context:
                context_info += f"\n\nSituation details: {sanitized_context}"
        
        user_prompt = f"""The user just said: "{user_input}"
        
        Incident type: {incident_type}
        {context_info}
        
        Generate an appropriate response that helps them with their situation."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"LLM response generation error: {e}")
            return self._fallback_response(incident_type, user_input)
    
    def generate_greeting(self, initial_context: Dict[str, Any] = None) -> str:
        """
        Generate a contextually appropriate greeting message.
        
        Args:
            initial_context: Any initial context about the situation
            
        Returns:
            Generated greeting string
        """
        
        system_prompt = """You are a caring emergency services operator for Bosch eCall system.
        Generate a warm, human greeting that:
        - Identifies you as Bosch Emergency Services
        - Shows genuine care and readiness to help
        - Asks what's happening in a friendly, non-alarming way
        - Is SHORT (1-2 sentences max) but warm
        - Makes them feel safe and supported
        - Uses conversational, human language (not robotic)

        Examples of good greetings:
        "Hi, this is Bosch Emergency Services. I'm here to help - what's going on?"
        "Hello, this is Bosch Emergency Services. I can see something might be wrong - how can I help you?"
        """
        
        context_str = ""
        if initial_context:
            context_str = f"\n\nInitial context: {json.dumps(initial_context, indent=2)}"
        
        user_prompt = f"""Generate an appropriate greeting for someone who may be in an emergency situation.{context_str}"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.4,
                max_tokens=200
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"LLM greeting generation error: {e}")
            return ("Hello, this is Bosch Emergency Services. I'm here to help you with any emergency "
                   "situation you may be experiencing. Can you please tell me what's happening right now?")
    
    def _fallback_classification(self, user_input: str) -> Dict[str, Any]:
        """Fallback keyword-based classification if LLM fails."""
        user_input_lower = user_input.lower()
        
        injury_keywords = ["hurt", "injured", "pain", "bleeding", "unconscious", "ambulance", "medical"]
        accident_keywords = ["crash", "accident", "collision", "hit", "damage"]
        rsa_keywords = ["tire", "battery", "won't start", "breakdown", "tow", "stuck", "lockout"]
        hazard_keywords = ["debris", "hazard", "dangerous", "blocking", "obstacle"]
        
        if any(keyword in user_input_lower for keyword in injury_keywords):
            return {"incident_type": "INJURY_ACCIDENT", "confidence": 0.7, "reasoning": "Keyword-based fallback"}
        elif any(keyword in user_input_lower for keyword in accident_keywords):
            return {"incident_type": "LIGHT_ACCIDENT", "confidence": 0.6, "reasoning": "Keyword-based fallback"}
        elif any(keyword in user_input_lower for keyword in rsa_keywords):
            return {"incident_type": "RSA_NEED", "confidence": 0.6, "reasoning": "Keyword-based fallback"}
        elif any(keyword in user_input_lower for keyword in hazard_keywords):
            return {"incident_type": "ROAD_HAZARD", "confidence": 0.6, "reasoning": "Keyword-based fallback"}
        else:
            return {"incident_type": "UNKNOWN", "confidence": 0.3, "reasoning": "Keyword-based fallback"}
    
    def _sanitize_context_for_llm(self, context: Dict[str, Any]) -> str:
        """
        Sanitize context data to avoid triggering Azure content filters.
        Converts system-like data into natural language descriptions.
        """
        sanitized_parts = []

        # Handle different context types safely
        if isinstance(context, dict):
            for key, value in context.items():
                # Skip system-like keys that might trigger filters
                if key in ['psap_response', 'reference_id', 'dispatch_units', 'priority_level']:
                    continue

                # Convert to natural language
                if key == 'incident_type':
                    sanitized_parts.append(f"This is a {value.lower().replace('_', ' ')} situation")
                elif key == 'estimated_arrival':
                    sanitized_parts.append(f"Help is expected to arrive in {value}")
                elif key == 'location':
                    sanitized_parts.append(f"Location: {value}")
                elif key == 'assistance_type':
                    sanitized_parts.append(f"Assistance needed: {value.lower().replace('_', ' ')}")
                elif isinstance(value, (str, int, float)) and len(str(value)) < 100:
                    # Only include simple, short values
                    sanitized_parts.append(f"{key.replace('_', ' ').title()}: {value}")

        return ". ".join(sanitized_parts) if sanitized_parts else ""

    def _fallback_response(self, incident_type: str, user_input: str) -> str:
        """Fallback response generation if LLM fails."""
        fallback_responses = {
            "INJURY_ACCIDENT": "I understand this is a serious situation. I'm contacting emergency services immediately. Please stay calm and don't move if you're injured.",
            "LIGHT_ACCIDENT": "I understand you've been in an accident. I'm glad to hear there are no injuries. I'll help you get the appropriate assistance.",
            "RSA_NEED": "I understand you need roadside assistance. I'm contacting our service provider to help you with your vehicle issue.",
            "ROAD_HAZARD": "Thank you for reporting this road hazard. I'm notifying the appropriate authorities to address this safety concern.",
            "UNKNOWN": "I want to make sure I get you the right help. Could you please provide more details about your situation?"
        }
        return fallback_responses.get(incident_type, fallback_responses["UNKNOWN"])


# Global LLM service instance
llm_service = LLMService()
