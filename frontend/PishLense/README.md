# 🛡️ PhishLens  
### An Explainable Phishing Detection System

PhishLens is a **two-part security system** designed to detect phishing emails in real time and **explain clearly why an email is dangerous**, instead of just labeling it as spam or fake.

The system is built for **demo/expo use**, focusing on **clarity, interaction, and explainability**, not heavy infrastructure.

---

## 🔍 What Problem PhishLens Solves

Most phishing tools:
- Only say *“This is phishing”*
- Do not explain *why*
- Do not help users learn

**PhishLens goes deeper** by:
- Detecting phishing attempts
- Explaining the psychological & technical tricks used
- Helping users understand and avoid future scams

---

## 🧩 Core Components

PhishLens has **three main components**:

### 1️⃣ Chrome Extension (Detection Layer)
**Role:** Real-time scanning & alerting  

What it does:
- Automatically reads the currently opened email or message
- Extracts:
  - Sender information
  - Subject & body text
  - Embedded links
- Sends this data to the analysis engine
- Receives a risk assessment
- Shows a **short warning summary**:
  - Risk level (High / Medium / Safe)
  - Why it is suspicious
  - What action to take

The extension stores the scan result in **browser localStorage**.

---

### 2️⃣ Analysis Engine (AI + Logic Layer)
**Role:** Intelligence & decision-making  

What it does:
- Analyzes email content using:
  - Text-based phishing indicators (urgency, fear, impersonation)
  - Link analysis (URL mismatch, suspicious domains)
  - Sender inconsistencies
- Combines multiple signals into a **final risk score**
- Generates **human-readable reasons** for the decision

This layer is shared by:
- Chrome extension
- Website (manual/demo mode)

> Note: For the expo version, this logic is simulated using structured dummy data and rules.

---

### 3️⃣ Website Dashboard (Explainability Layer)
**Role:** Visualization, history & learning  

What it does:
- Reads all previously scanned emails from **localStorage**
- Displays:
  - Dashboard overview (stats & trends)
  - Full scan history
  - Detailed analysis of each email
- Provides:
  - Highlighted risky phrases
  - Link-by-link breakdown
  - Clear explanation of phishing techniques used
  - Recommended user actions

This turns raw detection into **understanding and awareness**.

---

## 🔄 How Components Sync Together

### Step-by-Step Flow

1. User opens an email
2. Chrome Extension:
   - Extracts email data
   - Runs analysis
   - Stores result in `localStorage`
3. Extension shows a **quick warning**
4. User opens the PhishLens website
5. Website:
   - Reads stored scan data
   - Displays it in dashboards & detail pages
6. User understands:
   - Why the email is dangerous
   - How phishing works

No database.  
No user accounts.  
No backend dependency for storage.

---

## 🗂️ Data Handling Strategy

- All scan data is stored in **browser localStorage**
- Dummy phishing data is loaded from **external JSON files**
- No data is hard-coded into UI components
- Settings page allows:
  - Clearing all local data
  - Resetting demo state

This keeps the system:
- Lightweight
- Reliable for demos
- Easy to extend later

---

## 🎯 Why PhishLens Stands Out

- Combines **security + explainable AI**
- Interactive and judge-friendly
- Realistic product architecture
- Focuses on **user awareness**, not just detection

> **PhishLens doesn’t just protect users — it teaches them.**

---

## 🚀 Future Extensions (Out of Scope for Demo)
- Cloud sync & analytics
- Real ML model integration
- Organization-wide phishing insights
- Email client marketplace release

---

**Project Name:** PhishLens  
**Tagline:** *See through phishing attempts*
