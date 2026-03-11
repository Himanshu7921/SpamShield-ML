# How to Run the Backend

This guide covers everything needed to set up and run the SpamShield-ML backend on your local machine.

---

## **Prerequisites**

- **Python 3.10 or 3.11 (Recommended)** (64-bit)
  - Download from: https://www.python.org/downloads/
  - ⚠️ **IMPORTANT**:
    - **Do NOT use** Python 3.12+ (may cause NumPy pre-built wheel issues)
    - **Do NOT use** Python 3.9 (deprecated, missing some packages)
    - **Recommended**: Python 3.10.x or 3.11.x
  - ✅ Check "Add Python to PATH" during installation
  - Verify: Open Command Prompt/PowerShell → `python --version`

---

## **System Requirements**

- **RAM**: 4 GB minimum (8 GB recommended)
- **Disk Space**: ~3-4 GB for dependencies + ML models
- **Internet**: Required for initial setup and LLM API calls
- **Ports**: 5000 (Flask), 8501 (Streamlit) must be free

---

## **Windows-Specific Notes**

- **PowerShell vs Command Prompt**: This guide uses PowerShell. Most commands work on both, but venv activation differs (see Step 1)
- **Spaces in path**: Path has spaces - use quotes: `cd "d:\CodingContent\Web Development\..."`
- **Long path issues**: If installation fails due to "path too long", move project to shorter path like `C:\projects\spamshield`

---

## **Step 1: Create Virtual Environment**

Navigate to the backend folder and create an isolated Python environment:

```bash
cd "d:\CodingContent\Web Development\SpamShield-ML\backend"

# Create virtual environment
python -m venv venv
```

**Activate Virtual Environment:**

**Windows PowerShell:**

```powershell
.\venv\Scripts\Activate.ps1
```

_(You should see `(venv)` prefix in your terminal)_

**Windows Command Prompt (cmd):**

```cmd
venv\Scripts\activate.bat
```

**If you get PowerShell execution policy error:**

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Then try: .\venv\Scripts\Activate.ps1
```

---

## **Step 2: Install All Dependencies (In Batches)**

⚠️ **CRITICAL**: Install packages in the order below. Installing everything at once can cause conflicts.

Once virtual environment is activated, install packages in 4 separate batches:

### **Batch 1: Core Web Framework** (Install first)

```bash
pip install Flask==2.2.2 Flask-Cors==3.0.10 gunicorn==20.1.0
```

### **Batch 2: Data Processing & Web Scraping**

```bash
pip install numpy==1.24.3 requests==2.28.1 beautifulsoup4==4.11.1
```

### **Batch 3: ML and Domain Analysis**

```bash
pip install scikit-learn==1.1.2 lxml==4.9.1 tldextract==3.4.0 python-whois==0.8.0 python-dateutil==2.8.2
```

### **Batch 4: Text Processing**

```bash
pip install nltk==3.8.1
```

### **Batch 5: AI/LLM Integration**

```bash
pip install langchain langchain-core langchain-google-genai google-generativeai
```

### **Batch 6: UI (Optional - for Streamlit)**

```bash
pip install streamlit
```

✅ **If all batches complete successfully**, you're ready for Step 3.

**⚠️ If you get `numpy` compilation error:**

- You're likely on Python 3.12+ or missing a C compiler
- This is already handled by our batch install using NumPy 1.24.3 (pre-built wheels available)
- If still fails, ensure Python version is 3.10 or 3.11

---

## **Common Installation Errors & Fixes**

### **Error: "UnknownCompiler" or "The system cannot find the file specified"**

```
ERROR: Unknown compiler(s): [['icl'], ['cl'], ['cc'], ...]
Running `gcc --version` gave "[WinError 2] The system cannot find the file specified"
```

**Fix**: This happens with Python 3.12+ trying to compile NumPy from source. We avoid this with NumPy 1.24.3 (pre-built). If you still see it:

1. Check Python version: `python --version`
2. If 3.12+, downgrade to Python 3.11
3. Delete venv: `rmdir /s venv`
4. Start fresh from Step 1

### **Error: "ModuleNotFoundError: No module named 'pip'"**

```
python: error while finding module specification for 'pip' (No module named 'pip')
```

**Fix**:

- Reinstall Python with "Add Python to PATH" checked
- Or run: `python -m ensurepip --upgrade`

### **Error: "Cannot be loaded because running scripts is disabled"** (PowerShell)

```
.ps1 cannot be loaded because running scripts is disabled on this system
```

**Fix**: Run this once in PowerShell (as Admin is NOT required):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then activate venv again: `.\venv\Scripts\Activate.ps1`

---

---

## **Step 3: Download NLTK Data** (One-Time Setup)

Required for natural language processing in spam/phishing detection:

```bash
python -m nltk.downloader punkt stopwords
```

---

## **Step 4: Set Google Gemini API Key** (Required for LLM Features)

The LLM agent needs an API key for Google Gemini to provide detailed phishing analysis.

**Get a free API key:**

- Go to: https://aistudio.google.com/apikey
- Click "Get API Key"
- Copy your key

**Set it as environment variable (Windows PowerShell):**

```powershell
$env:GOOGLE_API_KEY="paste_your_api_key_here"
```

**Or (Windows Command Prompt):**

```cmd
set GOOGLE_API_KEY=paste_your_api_key_here
```

---

## **Complete Dependency Summary**

### What gets installed:

| Category            | Packages                                                               | Purpose                                  |
| ------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| **Web Framework**   | Flask, Flask-Cors, gunicorn                                            | REST API server                          |
| **Data Processing** | numpy, scikit-learn, pandas                                            | ML model inference                       |
| **Web Scraping**    | requests, beautifulsoup4, lxml                                         | Extract URL features                     |
| **Domain Analysis** | tldextract, python-whois, python-dateutil                              | Check domain info & WHOIS records        |
| **Text Processing** | nltk                                                                   | Tokenization, stemming, stopword removal |
| **AI/LLM**          | langchain, langchain-core, langchain-google-genai, google-generativeai | Gemini integration for detailed analysis |
| **UI**              | streamlit                                                              | Alternative simple test interface        |

---

## **How to Run the Backend**

Choose which service(s) to run:

### **Option 1: Phishing Detection API (Recommended to start)**

```bash
cd d:\CodingContent\Web Development\SpamShield-ML\backend\phish-api
python app.py
```

**Output:**

```
 * Running on http://127.0.0.1:5000
```

**Test it:**

- Open browser → `http://localhost:5000/` → Should see "Hello World"
- API endpoint: `http://localhost:5000/analyze_message` (POST)

### **Option 2: SMS/Email Spam Classifier (Streamlit)**

```bash
cd d:\CodingContent\Web Development\SpamShield-ML\backend
streamlit run sms-email-spam-classifier-main/app.py
```

**Output:**

```
You can now view your Streamlit app in your browser.
Local URL: http://localhost:8501
```

### **Option 3: Run Both Services (Recommended for full testing)**

Open **2 separate terminal windows**, activate venv in each:

**Terminal 1:**

```bash
cd d:\CodingContent\Web Development\SpamShield-ML\backend\phish-api
python app.py
```

**Terminal 2:**

```bash
cd d:\CodingContent\Web Development\SpamShield-ML\backend
streamlit run sms-email-spam-classifier-main/app.py
```

---

## **Testing the API**

### Test Message Analysis (SMS/Email Spam Detection):

```bash
curl -X POST http://localhost:5000/analyze_message \
  -H "Content-Type: application/json" \
  -d '{"message": "Click here to verify your account: http://suspicious-link.com"}'
```

**Expected Response:**

```json
{
  "model_prediction": "Spam",
  "analysis": {
    "classification": "Spam",
    "analysis_findings": "Suspicious verification request with non-HTTPS link",
    "recommended_action": "Delete message, do not click links"
  }
}
```

### Test URL Analysis (Phishing Detection):

```bash
curl -X POST http://localhost:5000/post \
  -d "URL=https://example.com" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

---

## **Troubleshooting**

### **Installation Issues**

| Error                                                             | Cause                                                  | Solution                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `numpy` compilation error / "Unknown compiler"                    | Missing C compiler OR Python 3.12+                     | 1. Check Python version: `python --version` (must be 3.10/3.11) <br> 2. If Python 3.12+, downgrade to 3.11 <br> 3. Use NumPy 1.24.3 (included in our batches) |
| `ModuleNotFoundError: No module named 'pip'`                      | Python path issue                                      | Reinstall Python with "Add Python to PATH" checked                                                                                                            |
| `Permission denied` when activating venv                          | PowerShell execution policy                            | Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`                                                                                   |
| `fatal error: Python.h: No such file or directory`                | Python dev headers missing                             | Reinstall Python, check "Install development headers"                                                                                                         |
| **Installing from Batch 5 fails with missing google-\* packages** | LangChain sub-dependencies                             | Run again: `pip install langchain langchain-core langchain-google-genai google-generativeai` (our install handles this)                                       |
| Some package says "compatible wheel not found"                    | Pre-built wheels not available for your Python version | Ensure using Python 3.10 or 3.11 (not 3.9, 3.12, or 3.13+)                                                                                                    |

### **Runtime Issues**

| Error                                                             | Cause                                 | Solution                                                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ModuleNotFoundError: No module named 'flask'`                    | Virtual environment not activated     | Check terminal shows `(venv)` prefix <br> PowerShell: `.\venv\Scripts\Activate.ps1` <br> CMD: `venv\Scripts\activate.bat` |
| Port 5000 already in use                                          | Another process using Flask port      | Kill it: `netstat -ano \| findstr :5000` or use different port: `python app.py --port 5001`                               |
| NLTK data missing error (`LookupError: Resource punkt not found`) | NLTK datasets not downloaded          | Run: `python -m nltk.downloader punkt stopwords`                                                                          |
| `GOOGLE_API_KEY not set` error                                    | Environment variable not set          | Set it: `$env:GOOGLE_API_KEY="your_api_key_here"` (PowerShell)                                                            |
| Slower first request on `/analyze_message`                        | Normal - LLM loads on first call      | Subsequent requests cached and fast                                                                                       |
| WHOIS/Alexa timeouts on URL analysis                              | Services slow or down                 | Normal behavior. Check internet. Retry request.                                                                           |
| `ConnectionError` when calling LLM                                | No internet or Gemini API unreachable | Check internet connection and API status                                                                                  |

### **Verification Steps**

Before running the backend, verify installation:

```powershell
# Check venv is active (should see (venv) prefix)
# Then run:

python -c "import flask, sklearn, nltk; print('✅ Flask, sklearn, nltk OK')"
python -c "import langchain, streamlit; print('✅ LangChain, Streamlit OK')"
pip list | Select-String -Pattern "Flask|sklearn|nltk|langchain|streamlit"
```

Expected output should list all these packages.

---

## **Quick Start Checklist**

- [ ] **Python 3.10 or 3.11** installed and verified: `python --version`
- [ ] Virtual environment created: `python -m venv venv`
- [ ] Virtual environment activated: `.\venv\Scripts\Activate.ps1` (see `(venv)` prefix)
- [ ] **Batch 1 installed**: Flask framework `pip install Flask==2.2.2 Flask-Cors==3.0.10 gunicorn==20.1.0`
- [ ] **Batch 2 installed**: Data libraries `pip install numpy==1.24.3 requests==2.28.1 beautifulsoup4==4.11.1`
- [ ] **Batch 3 installed**: ML & domain `pip install scikit-learn==1.1.2 lxml==4.9.1 tldextract==3.4.0 python-whois==0.8.0 python-dateutil==2.8.2`
- [ ] **Batch 4 installed**: NLP `pip install nltk==3.8.1`
- [ ] **Batch 5 installed**: LLM `pip install langchain langchain-core langchain-google-genai google-generativeai`
- [ ] **Batch 6 installed** (optional): Streamlit `pip install streamlit`
- [ ] NLTK data downloaded: `python -m nltk.downloader punkt stopwords`
- [ ] Google Gemini API key obtained: https://aistudio.google.com/apikey
- [ ] API key set: `$env:GOOGLE_API_KEY="your_key_here"` (PowerShell)
- [ ] Verified imports work: `python -c "import flask, sklearn, nltk; print('✅ OK')"`
- [ ] Flask app running: `cd phish-api ; python app.py`
- [ ] Tested: `curl http://localhost:5000/` returns "Hello World"

---

## **What Each Component Does**

- **phish-api/app.py** → Analyzes URLs for phishing + SMS/Email messages for spam (returns ML prediction + LLM explanation)
- **sms-email-spam-classifier-main/app.py** → Simple Streamlit UI for manual spam testing
- **agent/phishing_analysis_agent.py** → LLM orchestration (Gemini integration for detailed analysis)

---

## **Need Help?**

If you encounter issues:

1. Ensure virtual environment is **activated** (should see `(venv)` in terminal)
2. Check **Python version**: `python --version` (should be 3.8+)
3. Verify **dependencies**: `pip list` (should show Flask, nltk, streamlit, etc.)
4. Check **Google API key** is set: `echo $env:GOOGLE_API_KEY`
5. Check **ports are free**: 5000 (Flask), 8501 (Streamlit)

---

**You're all set! Start with the Phishing API first, then add Streamlit when ready.** 🚀

---

## **Dependency Installation Details & Why Batches Matter**

### **Why Install in Batches?**

When all packages are installed at once, pip's dependency resolver can:

1. Conflict between version requirements (e.g., NumPy 1.23.0 vs 1.24.3)
2. Try to compile packages from source when pre-built wheels exist
3. Leave sub-dependencies uninstalled

The batch approach ensures:

- Simple packages (Flask, requests) install first
- NumPy installs without compiler issues
- Complex packages (LangChain, Streamlit) resolve their dependencies
- All sub-dependencies are pulled in

### **What Each Batch Installs**

| Batch | Package                               | Purpose                                  | Size   |
| ----- | ------------------------------------- | ---------------------------------------- | ------ |
| 1     | Flask, Flask-Cors, Gunicorn           | Web server for hosting APIs              | 50 MB  |
| 2     | NumPy, requests, BeautifulSoup4       | Data handling & web scraping             | 300 MB |
| 3     | scikit-learn, lxml, tldextract, whois | ML models & domain analysis              | 500 MB |
| 4     | NLTK                                  | Text processing (tokenization, stemming) | 100 MB |
| 5     | LangChain, Gemini packages            | LLM orchestration (Google)               | 200 MB |
| 6     | Streamlit                             | UI for testing (optional)                | 400 MB |

**Total**: ~1.5 GB for all dependencies + models
