// popup/popup.js
// Handles UI logic for the PhishLens popup

document.addEventListener("DOMContentLoaded", () => {
  const statusEl = document.getElementById("status");
  const riskTextEl = document.getElementById("riskText");
  const reasonsEl = document.getElementById("reasons");
  const viewBtn = document.getElementById("viewDetails");

  // Read scans from localStorage
  const rawScans = localStorage.getItem("phishlens_scans");
  const scans = rawScans ? JSON.parse(rawScans) : [];

  if (!scans.length) {
    riskTextEl.textContent = "No scans yet";
    return;
  }

  // Get most recent scan
  const latestScan = scans[0];

  // Update status
  riskTextEl.textContent = latestScan.risk.toUpperCase();
  statusEl.classList.remove("safe", "high");
  statusEl.classList.add(latestScan.risk);

  // Populate reasons
  reasonsEl.innerHTML = "";
  latestScan.reasons.forEach(reason => {
    const li = document.createElement("li");
    li.textContent = reason;
    reasonsEl.appendChild(li);
  });

  // Enable button
  viewBtn.disabled = false;

  // Open website dashboard for detailed view
  viewBtn.addEventListener("click", () => {
    const dashboardUrl = `http://localhost:8080/scans/${latestScan.id}`;
    chrome.tabs.create({ url: dashboardUrl });
  });
});
