chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "URL_DETECTED") {
    const url = message.url;

    fetch("http://localhost:5000/analyze_message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
       // send as message text so backend analyze_message endpoint can consume it
       body: JSON.stringify({ message: url })
    })
      .then(response => response.json())
      .then(data => {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: "ML_RESULT",
          result: data
        });
      })
      .catch(error => {
        console.error("ML API Error:", error);
      });
  }
});


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "ML_RESULT") {
    console.log("Result from ML backend:", msg.result);
    alert("ML Scan Result: " + JSON.stringify(msg.result, null, 2));
  }
});
// Handle analysis requests from content scripts or popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'ANALYZE') {
    console.debug('PhishLens background: ANALYZE request received (len=', (msg.message||'').length, ') from', sender && sender.tab && sender.tab.id);
    fetch('http://localhost:5000/analyze_message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg.message })
    })
      .then(r => r.json())
      .then(data => {
        // send response to requester and include original message for sync
        sendResponse({ ok: true, data, message: msg.message });
        // also broadcast a runtime message so popup can pick it up (include original message)
        try { chrome.runtime.sendMessage({ type: 'ML_RESULT_POPUP', result: data, message: msg.message }); } catch (e) { console.warn('sendMessage to popup failed', e); }
        // attempt to sync scan to frontend localStorage
        try {
          const FRONTEND = 'http://localhost:8080';
          const modelPred = (data && data.model_prediction) || '';
          const analysis = (data && data.analysis) || {};
          const classification = analysis.classification || modelPred || '';
          const findings = (typeof analysis === 'string') ? analysis : (analysis.analysis_findings || '');
          const recommended = (typeof analysis === 'string') ? '' : (analysis.recommended_action || '');
          const risk = (classification || modelPred || '').toLowerCase().includes('spam') ? 'high' : ((classification || modelPred || '').toLowerCase().includes('not') ? 'safe' : 'medium');

          const scan = {
            id: Date.now().toString() + Math.random().toString(36).slice(2,8),
            sender: 'extension',
            senderName: 'PhishLens Extension',
            subject: (msg.message && msg.message.slice(0,80)) || 'Scanned content',
            riskLevel: risk,
            confidence: 0.9,
            timestamp: new Date().toISOString(),
            body: msg.message || '',
            dangerousPhrases: [],
            reasons: [],
            techniques: [],
            links: [],
            recommendation: recommended || '',
            llmAnalysis: findings || ''
          };

          // look for an existing frontend tab
          chrome.tabs.query({ url: FRONTEND + '/*' }, (tabs) => {
            if (tabs && tabs.length > 0 && tabs[0].id) {
              const tabId = tabs[0].id;
              chrome.scripting.executeScript({
                target: { tabId },
                func: (scanObj) => {
                  try {
                    const STORAGE_KEY = 'phishlens_scans';
                    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
                    const arr = JSON.parse(raw);
                    arr.unshift(scanObj);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
                  } catch (e) { console.error('sync to frontend failed', e); }
                },
                args: [scan]
              }, () => {});
            } else {
              // open the frontend scans page in background and inject the scan once loaded
              chrome.tabs.create({ url: FRONTEND + '/scans', active: false }, (tab) => {
                if (!tab || !tab.id) return;
                const tabId = tab.id;
                const onUpdated = (tid, info) => {
                  if (tid === tabId && info && info.status === 'complete') {
                    chrome.scripting.executeScript({
                      target: { tabId },
                      func: (scanObj) => {
                        try {
                          const STORAGE_KEY = 'phishlens_scans';
                          const raw = localStorage.getItem(STORAGE_KEY) || '[]';
                          const arr = JSON.parse(raw);
                          arr.unshift(scanObj);
                          localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
                        } catch (e) { console.error('sync to frontend failed', e); }
                      },
                      args: [scan]
                    }, () => {
                      try { chrome.tabs.onUpdated.removeListener(onUpdated); } catch (e) {}
                    });
                  }
                };
                chrome.tabs.onUpdated.addListener(onUpdated);
              });
            }
          });
        } catch (e) { console.warn('syncScan error', e); }
      })
      .catch(err => sendResponse({ ok: false, error: err.message }));

    // indicate we'll call sendResponse asynchronously
    return true;
  }

  // keep previous ML_RESULT handler (if other parts post ML_RESULT to background)
  if (msg.type === "ML_RESULT") {
    console.log("Result from ML backend:", msg.result);
    // Note: avoid alerting in background in production; keep for debug
    try { alert("ML Scan Result: " + JSON.stringify(msg.result, null, 2)); } catch (e) {}
  }
});
console.debug('PhishLens background worker loaded');
