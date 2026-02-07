import os
from dotenv import load_dotenv
import os
from docx import Document


from langchain_google_genai import ChatGoogleGenerativeAI

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.getenv("Gemini_APIKEY")

# Initialize LLM (Gemini)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=GOOGLE_API_KEY)

def load_persona(agent_name: str) -> str:
    """Load persona text for a given agent with braces escaped."""
    persona_path = f"./persona/{agent_name}.txt"
    with open(persona_path, "r", encoding="utf-8") as f:
        persona_text = f.read()
    return persona_text.replace("{", "{{").replace("}", "}}")




def load_startup_input(file_path: str) -> str:
    """Load and extract readable text from any uploaded startup file (TXT, PDF, DOCX, etc.)."""
    ext = os.path.splitext(file_path)[1].lower()

    # --- 1️⃣ Handle Plain Text Files ---
    if ext in [".txt", ".md", ".json"]:
        with open(file_path, "rb") as f:
            raw_data = f.read()
            detected = chardet.detect(raw_data)
            encoding = detected.get("encoding", "utf-8")
        try:
            return raw_data.decode(encoding, errors="ignore")
        except Exception:
            return raw_data.decode("utf-8", errors="ignore")

    # --- 2️⃣ Handle PDF Files ---
    elif ext == ".pdf":
        text = ""
        with open(file_path, "rb") as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text.strip() or "N/A"

    # --- 3️⃣ Handle Word Documents ---
    elif ext in [".docx"]:
        doc = Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs]).strip() or "N/A"

    # --- 4️⃣ Fallback for Unknown Types ---
    else:
        with open(file_path, "rb") as f:
            raw_data = f.read()
            detected = chardet.detect(raw_data)
            encoding = detected.get("encoding", "utf-8")
        try:
            return raw_data.decode(encoding, errors="ignore")
        except Exception:
            return "N/A"


# def load_startup_input(file_path: str) -> str:
#     """Load raw startup input text from a file."""
#     with open(file_path, "r", encoding="utf-8") as f:
#         return f.read()


def run_pipeline(startup_file: str) -> dict:
    """Initialize all agents and execute the multi-agent startup pipeline."""

    # Load startup input
    startup_text = load_startup_input(startup_file)

    # Initialize agents with their persona and shared LLM
    input_agent = InputHandlerAgent("InputHandlerAgent", load_persona("input_handler_agent"), llm)
    problem_product_market_agent = ProblemProductMarketAgent(
        "ProblemProductMarketAgent", load_persona("problem_product_market_agent"), llm
    )
    team_risk_agent = TeamRiskAgent("TeamRiskAgent", load_persona("team_risk_agent"), llm)
    financial_agent = FinancialAgent("FinancialAgent", load_persona("financial_agent"), llm)
    executive_summary_agent = ExecutiveSummaryAgent(
        "ExecutiveSummaryAgent", load_persona("executive_summary_agent"), llm
    )
    slide_insights_agent = SlideInsightsAgent(
        "SlideInsightsAgent", load_persona("slide_insights_agent"), llm
    )
    investment_agent = InvestmentDecisionAgent(
        "InvestmentDecisionAgent", load_persona("investment_decision_agent"), llm
    )
    output_parser_agent = OutputParserAgent(
        "OutputParserAgent", load_persona("output_parser_agent"), llm
    )

    # Instantiate the main orchestrator agent
    main_agent = MainAgent(
        name="MainAgent",
        persona=load_persona("main_agent"),
        llm=llm,
        input_agent=input_agent,
        problem_product_market_agent=problem_product_market_agent,
        team_risk_agent=team_risk_agent,
        financial_agent=financial_agent,
        executive_summary_agent=executive_summary_agent,
        slide_insights_agent=slide_insights_agent,
        investment_agent=investment_agent,
        output_parser_agent= output_parser_agent
    )

    # Execute pipeline and return final structured output
    final_report = main_agent.run_pipeline(startup_file)
    return final_report

if __name__ == "__main__":
    # Example: Process 'edTech' startup input
    startup_file_path = "./input/edTech_startup_unstructured.txt"
    final_report = run_pipeline(startup_file_path)

    print("===== FINAL REPORT =====\n")
    print(final_report)