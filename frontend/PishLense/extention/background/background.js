// background/background.js
// Service worker for PhishLens (Manifest V3)

console.log("[PhishLens] Background service worker started");

// Helper: generate a simple unique ID
function generateId() {
  return "scan_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// Helper: get existing scans from localStorage
function getStoredScans() {
  const raw = localStorage.getItem("phishlens_scans");
  return raw ? JSON.parse(raw) : [];
}

// Helper: save scans to localStorage
function saveScans(scans) {
  localStorage.setItem("phishlens_scans", JSON.stringify(scans));
}

// VERY BASIC dummy phishing analysis (placeholder for AI/ML)
function analyzeContent(extractedData) {
  const text = extractedData.text.toLowerCase();

  let risk = "safe";
  let score = 0.2;
  const reasons = [];

  if (text.includes("urgent") || text.includes("immediately")) {
    risk = "high";
    score = 0.85;
    reasons.push("Urgent language detected");
  }

  if (text.includes("verify your account") || text.includes("suspended")) {
    risk = "high";
    score = Math.max(score, 0.9);
    reasons.push("Account threat language detected");
  }

  if (reasons.length === 0) {
    reasons.push("No obvious phishing patterns detected");
  }

  return {
    risk,
    score,
    reasons
  };
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PHISHLENS_EXTRACTED_DATA") {
    const extractedData = message.payload;

    const analysis = analyzeContent(extractedData);

    const scanResult = {
      id: generateId(),
      url: extractedData.url,
      title: extractedData.title,
      timestamp: extractedData.timestamp,
      risk: analysis.risk,
      score: analysis.score,
      reasons: analysis.reasons,
      links: extractedData.links
    };

    const scans = getStoredScans();
    scans.unshift(scanResult); // newest first
    saveScans(scans);

    console.log("[PhishLens] Scan stored:", scanResult);

    sendResponse({
      status: "stored",
      scanId: scanResult.id,
      risk: scanResult.risk
    });
  }
});
// background/background.js
// Service worker for PhishLens (Manifest V3)

console.log("[PhishLens] Background service worker started");

// Helper: generate a simple unique ID
function generateId() {
  return "scan_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// Helper: get existing scans from localStorage
function getStoredScans() {
  const raw = localStorage.getItem("phishlens_scans");
  return raw ? JSON.parse(raw) : [];
}

// Helper: save scans to localStorage
function saveScans(scans) {
  localStorage.setItem("phishlens_scans", JSON.stringify(scans));
}

// VERY BASIC dummy phishing analysis (placeholder for AI/ML)
function analyzeContent(extractedData) {
  const text = extractedData.text.toLowerCase();

  let risk = "safe";
  let score = 0.2;
  const reasons = [];

  if (text.includes("urgent") || text.includes("immediately")) {
    risk = "high";
    score = 0.85;
    reasons.push("Urgent language detected");
  }

  if (text.includes("verify your account") || text.includes("suspended")) {
    risk = "high";
    score = Math.max(score, 0.9);
    reasons.push("Account threat language detected");
  }

  if (reasons.length === 0) {
    reasons.push("No obvious phishing patterns detected");
  }

  return {
    risk,
    score,
    reasons
  };
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PHISHLENS_EXTRACTED_DATA") {
    const extractedData = message.payload;

    const analysis = analyzeContent(extractedData);

    const scanResult = {
      id: generateId(),
      url: extractedData.url,
      title: extractedData.title,
      timestamp: extractedData.timestamp,
      risk: analysis.risk,
      score: analysis.score,
      reasons: analysis.reasons,
      links: extractedData.links
    };

    const scans = getStoredScans();
    scans.unshift(scanResult); // newest first
    saveScans(scans);

    console.log("[PhishLens] Scan stored:", scanResult);

    sendResponse({
      status: "stored",
      scanId: scanResult.id,
      risk: scanResult.risk
    });
  }
});
