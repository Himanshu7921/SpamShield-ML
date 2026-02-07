// content/content.js
// This script runs inside the webpage (e.g., Gmail, Outlook, or any site)

console.log("[PhishLens] Content script loaded");

// Utility function to extract visible text from the page
function extractPageText() {
  const bodyText = document.body.innerText || "";
  return bodyText.slice(0, 5000); // limit size for demo safety
}

// Utility function to extract links from the page
function extractLinks() {
  const anchors = Array.from(document.querySelectorAll("a"));
  return anchors.map(a => ({
    text: a.innerText || "",
    href: a.href || ""
  }));
}

// Main extraction function
function extractEmailData() {
  const data = {
    url: window.location.href,
    title: document.title,
    text: extractPageText(),
    links: extractLinks(),
    timestamp: new Date().toISOString()
  };

  return data;
}

// Send extracted data to background script
function sendDataToBackground() {
  const extractedData = extractEmailData();

  chrome.runtime.sendMessage(
    {
      type: "PHISHLENS_EXTRACTED_DATA",
      payload: extractedData
    },
    response => {
      if (chrome.runtime.lastError) {
        console.warn("[PhishLens] Message error:", chrome.runtime.lastError);
      } else {
        console.log("[PhishLens] Data sent to background:", response);
      }
    }
  );
}

// Run once when page loads
sendDataToBackground();
