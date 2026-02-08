from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI

import os
import json
import datetime


class PhishingAnalysisAgent:
    """
    PhishingAnalysisAgent is responsible for:
      - Taking the raw email/SMS text and the ML model's prediction.
      - Asking Gemini to explain the reasoning behind Spam/Not Spam.
      - Returning results strictly in JSON format:
            {
                "classification": "...",
                "analysis_findings": "...",
                "recommended_action": "..."
            }
    """

    def __init__(self, name, persona, llm=None):
        self.name = name
        self.persona = persona
        self.prompt_template = self._set_persona(self.persona)

        # Default LLM (Gemini Flash)
        if llm is None:
            self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
        else:
            self.llm = llm

    def _set_persona(self, persona: str):
        """
        Defines the persona-driven prompt structure.
        """

        return ChatPromptTemplate.from_messages([
            ("system", persona),
            (
                "user",
                """
                    You are an analysis agent. Evaluate the following message:

                    Message:
                    {message}

                    The ML model classified this message as: {model_prediction}

                    Your tasks:
                    1. Provide analysis_findings explaining why it is Spam or Not Spam.
                    - If Spam → describe phishing indicators (fake URLs, urgency, impersonation, etc.).
                    - If Not Spam → respond exactly with: "No known phishing patterns detected in the content."

                    2. Provide recommended_action describing what the user should do next.

                    Output STRICTLY in JSON with this schema:

                {{
                    "classification": "<Spam_or_NotSpam>",
                    "analysis_findings": "<explanation>",
                    "recommended_action": "<advice>"
                }}
                """
            )
        ])

    def receive_input(self, message_text: str, prediction: str):
        """
        Receives input:
            - message_text: Email or SMS content
            - prediction: Output from ML model (Spam / Not Spam)
        """
        self.data = {
            "message": message_text,
            "model_prediction": prediction
        }

    def process(self):
        """
        Process the input using the LLM pipeline.
        """
        # Render a user-visible prompt for logging (mirrors the prompt template)
        # Use safe placeholders to avoid accidental python .format() interpolation
        prompt_user_template = """
                   You are an analysis agent. Analyze the message for phishing or spam.

                    Message:
                    <<MESSAGE>>

                    Model prediction: <<MODEL_PREDICTION>>

                    Generate a response in the EXACT JSON structure below. Follow these rules:
                    - Fill every field.
                    - Detect URLs in the message and list them with is_https and domain_reputation.
                    - If label = "NotSpam", indicators should be an empty array, and user_guidance.intent/impact should be "none".
                    - If label = "Spam", include appropriate indicators, guidance, and actions.

                    Output ONLY this JSON:

                    {
                    "analysis_id": "<uuid>",
                    "created_at": "<ISO_8601_timestamp>",

                    "message": {
                        "urls": [
                        {
                            "url": "<detected_url>",
                            "is_https": true,
                            "domain_reputation": "trusted | suspicious | malicious | unknown"
                        }
                        ]
                    },

                    "classification": {
                        "label": "Spam | NotSpam",
                        "confidence_score": 0.0,
                        "risk_level": "Low | Medium | High"
                    },

                    "analysis": {
                        "summary": "<short_summary>",
                        "indicators": [
                        {
                            "type": "urgency | impersonation | suspicious_url | insecure_link",
                            "severity": "low | medium | high | critical",
                            "description": "<reason>"
                        }
                        ]
                    },

                    "recommended_actions": {
                        "primary": "<main_action>",
                        "secondary": ["<optional_action>"]
                    },

                    "user_guidance": {
                        "intent": "<attacker_goal_or_none>",
                        "impact": "<possible_impact_or_none>",
                        "safety_tip": "<general_tip>"
                    }
                    }
                """

        # Inject only the two dynamic fields using replace to avoid KeyError from stray braces
        prompt_text = (
            "System:\n" + (self.persona or "") + "\n\nUser:\n" +
            prompt_user_template.replace("<<MESSAGE>>", self.data.get("message", "")).replace("<<MODEL_PREDICTION>>", self.data.get("model_prediction", ""))
        )

        # Execute the chain (prompt -> LLM -> JSON parser)
        chain = (self.prompt_template | self.llm | JsonOutputParser())
        result = chain.invoke(self.data)

        # Persist the call with richer structured logging that includes:
        # - metadata about the LLM and persona
        # - the prompt template used for the user-facing instruction
        # - the rendered prompt that was actually sent
        # - the parsed LLM output and an ISO timestamp
        ts_dt = datetime.datetime.utcnow()
        ts = ts_dt.strftime("%Y%m%dT%H%M%S%f")[:-3]
        ts_iso = ts_dt.isoformat() + "Z"

        log = {
            "metadata": {
                "model": getattr(self.llm, "model", None),
                "persona_summary": (self.persona or "")[:1000]
            },
            "prompt_template": prompt_user_template,
            "rendered_prompt": prompt_text,
            "llm_output": result,
            "logged_at": ts_iso
        }

        log_dir = os.path.join(os.path.dirname(__file__), "llm_logs")
        os.makedirs(log_dir, exist_ok=True)
        filename = f"llm_call_{ts}.txt"
        path = os.path.join(log_dir, filename)
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(log, f, ensure_ascii=False, indent=2)
        except Exception:
            # Don't break the pipeline if logging fails; silently continue
            pass

        return result

    def get_chain(self):
        """
        Returns the chain (prompt → LLM → JSON parser)
        """
        return (self.prompt_template | self.llm | JsonOutputParser())

    def define_tools(self):
        pass


if __name__ == "__main__":
    import os

    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=GOOGLE_API_KEY)

    # Example demo input
    example_message = """
            Dear User,
            We detected a **login attempt from an unrecognized device** on your account at **02:14 AM (UTC)**.
            For your security, access has been temporarily limited until you verify this activity.

            Please review your recent login details using the secure link below:

            **Verification Portal:**
            [http://secure-access-identity-check.verify-center-auth.com](http://secure-access-identity-check.verify-center-auth.com)

            If this was not you, immediate verification is required to prevent unauthorized access.

            Thank you,
            Account Security Team
            Central Authentication Services
            """
    model_output = "Spam"

    persona_text = """
            You are a highly specialized Phishing Analysis Agent designed to evaluate the security risk of emails and SMS messages. 
            You analyze the user’s message along with the ML model’s classification and provide clear, structured reasoning.

            Your responsibilities:
            - Detect known phishing patterns such as:
            • Suspicious or deceptive URLs  
            • Fake security alerts  
            • Urgency or threats  
            • Requests for verification or passwords  
            • Impersonation of banks, services, or official entities  
            • Grammar patterns common in scam messages  
            • Financial fraud triggers (rewards, winnings, account alerts)

            - Give concise and accurate explanations supporting the classification (Spam or Not Spam).

            - If the classification is “Not Spam,” you MUST respond with:
                "No known phishing patterns detected in the content."

            - Provide safety-focused recommendations:
            • Delete the message
            • Do not click external links
            • Verify via official channels
            • Mark as safe (only if applicable)
            • Assess likelihood of harm or intent

            Critical rules:
            - ALWAYS return output in strict JSON format.
            - NEVER include extra commentary outside JSON.
            - NEVER hallucinate. If evidence is insufficient, state it clearly.
            - Keep explanations precise, logical, and based on observable patterns in the text.

            Your goal:
            Enhance the ML model’s Spam/Not Spam classification with clear reasoning and a practical recommended action.
            """
    
    agent = PhishingAnalysisAgent("Phishing Analysis Agent", persona_text, llm=llm)
    agent.receive_input(example_message, model_output)
    result = agent.process()
    print(result)