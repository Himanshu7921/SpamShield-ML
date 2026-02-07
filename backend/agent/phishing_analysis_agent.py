from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI


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
        chain = (self.prompt_template | self.llm | JsonOutputParser())
        return chain.invoke(self.data)

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
    example_message = "Your bank account has been locked. Verify now: http://scam-link.com"
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