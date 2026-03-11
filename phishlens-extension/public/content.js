// Auto-extract message text on supported sites (Gmail) or fallback to selected text
(function () {
  const OVERLAY_ID = 'phishlens-overlay';
  const STORAGE_KEY = 'phishlens_scans';
  let lastSent = null;
  console.debug('PhishLens content script injected on', location.href);

  function findGmailBody() {
    const selectors = ['div.a3s', 'div.ii', 'div.adn', 'div.gs'];
    for (const sel of selectors) {
      const nodes = document.querySelectorAll(sel);
      for (const node of nodes) {
        if (node.offsetParent === null) continue;
        const text = node.innerText && node.innerText.trim();
        if (text && text.length > 30) return text;
      }
    }
    return null;
  }

  function getSelectedTextOrInput() {
    const sel = window.getSelection().toString().trim();
    if (sel && sel.length > 10) return sel;
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type === 'text'))) {
      const v = active.value && active.value.trim();
      if (v && v.length > 10) return v;
    }
    return null;
  }

  function showOverlay(content, isSpam = false) {
    // Remove any existing overlay first
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();
    
    // Create new overlay
    const el = document.createElement('div');
    el.id = OVERLAY_ID;
    
    // Alert-like styling based on spam status - all inline, no external CSS needed
    const borderColor = isSpam ? '#ef4444' : '#22c55e';
    const bgColor = isSpam ? '#fef2f2' : '#f0fdf4';
    
    el.style.cssText = `
      position: fixed !important;
      bottom: 16px !important;
      right: 16px !important;
      z-index: 2147483647 !important;
      max-width: 400px !important;
      max-height: 450px !important;
      overflow: hidden !important;
      background: ${bgColor} !important;
      border: 2px solid ${borderColor} !important;
      box-shadow: 0 10px 40px rgba(0,0,0,0.25) !important;
      border-radius: 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 13px !important;
      color: #1f2937 !important;
      line-height: 1.4 !important;
      opacity: 1 !important;
      visibility: visible !important;
      display: block !important;
      pointer-events: auto !important;
    `;
    
    el.innerHTML = content;
    document.body.appendChild(el);
    
    console.debug('PhishLens: overlay shown');
  }

  function clearOverlay() {
    const el = document.getElementById(OVERLAY_ID);
    if (el) {
      el.remove();
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Save scan to localStorage for frontend to pick up
  function saveScanToStorage(scan) {
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const scans = existing ? JSON.parse(existing) : [];
      // Avoid duplicates by ID
      const idx = scans.findIndex(s => s.id === scan.id);
      if (idx >= 0) {
        scans[idx] = scan;
      } else {
        scans.unshift(scan);
      }
      // Keep max 100 scans
      if (scans.length > 100) scans.length = 100;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
      console.debug('PhishLens: saved scan to storage', scan.id);
    } catch (e) {
      console.warn('PhishLens: failed to save to storage', e);
    }
  }

  // Parse the new LLM response format
  function parseBackendResponse(data, originalText) {
    const modelPrediction = data.model_prediction || '';
    const analysis = data.analysis || {};
    const llmAnalysis = data.llm_analysis || {};
    
    // Use the LLM's classification (from analysis object) to determine risk
    // The LLM classification may differ from model_prediction and is more reliable
    const llmClassification = (analysis.classification || '').toLowerCase();
    const isNotSpam = llmClassification.includes('not spam') || llmClassification.includes('notspam');
    const isSpam = llmClassification.includes('spam') && !isNotSpam;
    
    // Extract classification info
    let confidence = 90;
    let riskLevel = 'medium';
    
    // Check for confidence_score in analysis (mapped from LLM)
    if (typeof analysis.confidence_score === 'number') {
      confidence = analysis.confidence_score;
    } else if (llmAnalysis.classification && typeof llmAnalysis.classification === 'object') {
      confidence = llmAnalysis.classification.confidence_score || confidence;
      const llmRisk = (llmAnalysis.classification.risk_level || '').toLowerCase();
      if (llmRisk === 'high') riskLevel = 'high';
      else if (llmRisk === 'low') riskLevel = 'safe';
      else riskLevel = 'medium';
    }
    
    // Determine risk from the LLM classification string
    if (isNotSpam) riskLevel = 'safe';
    else if (isSpam) riskLevel = 'high';
    
    // Extract URLs
    const detectedUrls = [];
    if (llmAnalysis.message && llmAnalysis.message.urls) {
      llmAnalysis.message.urls.forEach(u => {
        detectedUrls.push({
          url: u.url || '',
          is_https: u.is_https || false,
          domain_reputation: u.domain_reputation || 'unknown'
        });
      });
    }
    
    // Extract indicators
    const indicators = [];
    if (llmAnalysis.analysis && llmAnalysis.analysis.indicators) {
      llmAnalysis.analysis.indicators.forEach(ind => {
        indicators.push({
          type: ind.type || 'unknown',
          severity: ind.severity || 'medium',
          description: ind.description || ''
        });
      });
    }
    
    // Extract user guidance
    const userGuidance = llmAnalysis.user_guidance || null;
    
    // Extract recommended actions
    const recommendedActions = llmAnalysis.recommended_actions || null;
    
    // Build the scan object for storage
    const scanId = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    
    // Get summary/findings
    let analysisSummary = '';
    if (llmAnalysis.analysis && llmAnalysis.analysis.summary) {
      analysisSummary = llmAnalysis.analysis.summary;
    } else if (analysis.analysis_findings) {
      analysisSummary = analysis.analysis_findings;
    }
    
    // Get recommendation
    let recommendation = '';
    if (recommendedActions && recommendedActions.primary) {
      recommendation = recommendedActions.primary;
      if (recommendedActions.secondary && recommendedActions.secondary.length) {
        recommendation += ' ' + recommendedActions.secondary.join('. ');
      }
    } else if (analysis.recommended_action) {
      recommendation = analysis.recommended_action;
    }
    
    // Build techniques from indicators
    const techniques = indicators.map(i => i.type).filter(Boolean);
    
    // Build legacy links from detected URLs
    const links = detectedUrls.map(u => ({
      displayText: u.url,
      actualUrl: u.url,
      riskLevel: u.domain_reputation === 'malicious' ? 'high' : 
                 u.domain_reputation === 'suspicious' ? 'medium' : 'safe',
      reason: `Domain reputation: ${u.domain_reputation}. ${u.is_https ? 'HTTPS' : 'HTTP (insecure)'}`
    }));
    
    const scan = {
      id: scanId,
      sender: 'analyzed@message',
      senderName: 'Scanned Message',
      subject: (originalText || '').slice(0, 80) || 'Analyzed Content',
      riskLevel: riskLevel,
      confidence: typeof confidence === 'number' ? Math.round(confidence * 100) / 100 : confidence,
      timestamp: new Date().toISOString(),
      body: originalText || '',
      dangerousPhrases: [],
      reasons: indicators.map(i => i.description).filter(Boolean),
      techniques: techniques,
      links: links,
      recommendation: recommendation,
      llmAnalysis: analysisSummary,
      // New fields
      analysisId: llmAnalysis.analysis_id || null,
      detectedUrls: detectedUrls,
      indicators: indicators,
      userGuidance: userGuidance,
      recommendedActions: recommendedActions,
      analysisSummary: analysisSummary,
      modelPrediction: modelPrediction,
      llmRaw: llmAnalysis
    };
    
    return { scan, isSpam };
  }

  function sendForAnalysis(text) {
    if (!text) return;
    const hash = text.slice(0, 200);
    if (hash === lastSent) return;
    lastSent = hash;

    // Show loading overlay immediately
    showOverlay(buildLoadingOverlay(), false);

    try {
      console.debug('PhishLens: sending text for analysis (len=', text.length, ')');
      chrome.runtime.sendMessage({ type: 'ANALYZE', message: text }, (resp) => {
        console.debug('PhishLens: received response', resp);
        if (chrome.runtime.lastError) {
          console.warn('PhishLens: runtime error', chrome.runtime.lastError);
          showOverlay(buildErrorOverlay('Communication error: ' + chrome.runtime.lastError.message), true);
          return;
        }
        if (!resp) {
          showOverlay(buildErrorOverlay('No response from background'), true);
          return;
        }
        if (!resp.ok) {
          showOverlay(buildErrorOverlay(resp.error || 'Analysis failed'), true);
          return;
        }
        
        const data = resp.data || {};
        // Parse for rich overlay data, but use scan ID from background for consistency
        const { scan: parsedScan, isSpam } = parseBackendResponse(data, text);
        
        // Use the scan ID from background if available, to ensure frontend deduplication works
        if (resp.scan && resp.scan.id) {
          parsedScan.id = resp.scan.id;
        }
        
        // Save to localStorage (note: this is the target page's localStorage, not frontend)
        saveScanToStorage(parsedScan);
        
        // Build the overlay HTML
        const overlayHtml = buildResultOverlay(parsedScan, isSpam);
        showOverlay(overlayHtml, isSpam);
      });
    } catch (e) {
      console.warn('PhishLens: sendForAnalysis error', e);
      showOverlay(buildErrorOverlay('Error: ' + (e && e.message)), true);
    }
  }

  function buildLoadingOverlay() {
    return `
      <style>
        @keyframes phishlens-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div style="background:#dcfce7 !important;padding:16px 20px !important;display:flex !important;align-items:center !important;gap:12px !important;">
        <div style="width:24px !important;height:24px !important;border:3px solid #22c55e !important;border-top-color:#dcfce7 !important;border-radius:50% !important;animation:phishlens-spin 1s linear infinite !important;"></div>
        <div>
          <div style="font-weight:600 !important;color:#166534 !important;font-size:14px !important;">PhishLens Analysis</div>
          <div style="font-size:12px !important;color:#15803d !important;margin-top:4px !important;">Analyzing content...</div>
        </div>
      </div>
    `;
  }

  function buildErrorOverlay(errorMsg) {
    return `
      <div style="background:#fee2e2 !important;padding:12px 16px !important;display:flex !important;align-items:center !important;justify-content:space-between !important;">
        <div style="display:flex !important;align-items:center !important;gap:8px !important;">
          <span style="font-size:18px !important;">⚠️</span>
          <span style="font-weight:600 !important;color:#991b1b !important;">Analysis Error</span>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" style="background:none !important;border:none !important;cursor:pointer !important;padding:4px 8px !important;border-radius:4px !important;font-size:18px !important;color:#991b1b !important;">✕</button>
      </div>
      <div style="padding:16px !important;color:#991b1b !important;font-size:13px !important;">
        ${escapeHtml(errorMsg)}
      </div>
    `;
  }

  function buildResultOverlay(scan, isSpam) {
    const headerBg = isSpam ? '#fee2e2' : '#dcfce7';
    const headerColor = isSpam ? '#991b1b' : '#166534';
    const badgeBg = isSpam ? '#ef4444' : '#22c55e';
    const badgeText = isSpam ? 'SPAM DETECTED' : 'SAFE';
    const icon = isSpam ? '🚨' : '✅';
    
    // Build indicators section
    let indicatorsHtml = '';
    if (scan.indicators && scan.indicators.length > 0) {
      const severityColors = {
        critical: '#dc2626',
        high: '#ea580c',
        medium: '#d97706',
        low: '#65a30d'
      };
      indicatorsHtml = `
        <div style="margin-top:12px !important;">
          <div style="font-weight:600 !important;font-size:11px !important;text-transform:uppercase !important;color:#6b7280 !important;margin-bottom:6px !important;">Indicators Found</div>
          ${scan.indicators.slice(0, 3).map(ind => `
            <div style="display:flex !important;align-items:flex-start !important;gap:8px !important;padding:6px 0 !important;border-bottom:1px solid #f3f4f6 !important;">
              <span style="background:${severityColors[ind.severity] || '#6b7280'} !important;color:white !important;font-size:9px !important;padding:2px 6px !important;border-radius:3px !important;text-transform:uppercase !important;font-weight:600 !important;">${escapeHtml(ind.severity)}</span>
              <span style="font-size:12px !important;color:#374151 !important;flex:1 !important;">${escapeHtml(ind.description).slice(0, 100)}${ind.description.length > 100 ? '...' : ''}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Build URLs section
    let urlsHtml = '';
    if (scan.detectedUrls && scan.detectedUrls.length > 0) {
      const repColors = {
        malicious: '#dc2626',
        suspicious: '#d97706',
        unknown: '#6b7280',
        trusted: '#22c55e'
      };
      urlsHtml = `
        <div style="margin-top:12px !important;">
          <div style="font-weight:600 !important;font-size:11px !important;text-transform:uppercase !important;color:#6b7280 !important;margin-bottom:6px !important;">URLs Detected</div>
          ${scan.detectedUrls.slice(0, 2).map(u => `
            <div style="background:#f9fafb !important;padding:8px !important;border-radius:6px !important;margin-bottom:4px !important;">
              <div style="font-size:11px !important;word-break:break-all !important;color:#374151 !important;">${escapeHtml(u.url).slice(0, 50)}...</div>
              <div style="display:flex !important;gap:6px !important;margin-top:4px !important;">
                <span style="background:${u.is_https ? '#dcfce7' : '#fee2e2'} !important;color:${u.is_https ? '#166534' : '#991b1b'} !important;font-size:9px !important;padding:2px 6px !important;border-radius:3px !important;">${u.is_https ? '🔒 HTTPS' : '⚠️ HTTP'}</span>
                <span style="background:${repColors[u.domain_reputation] || '#f3f4f6'} !important;color:white !important;font-size:9px !important;padding:2px 6px !important;border-radius:3px !important;">${escapeHtml(u.domain_reputation)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Recommendation section
    let recommendHtml = '';
    if (scan.recommendation) {
      const recBg = isSpam ? '#fef3c7' : '#f0fdf4';
      const recColor = isSpam ? '#92400e' : '#166534';
      recommendHtml = `
        <div style="margin-top:12px !important;background:${recBg} !important;padding:10px !important;border-radius:6px !important;">
          <div style="font-weight:600 !important;font-size:11px !important;color:${recColor} !important;margin-bottom:4px !important;">💡 Recommended Action</div>
          <div style="font-size:12px !important;color:${recColor} !important;">${escapeHtml(scan.recommendation).slice(0, 150)}${scan.recommendation.length > 150 ? '...' : ''}</div>
        </div>
      `;
    }
    
    // Safety tip from user guidance
    let safetyTipHtml = '';
    if (scan.userGuidance && scan.userGuidance.safety_tip) {
      safetyTipHtml = `
        <div style="margin-top:8px !important;font-size:11px !important;color:#6b7280 !important;font-style:italic !important;">
          🛡️ ${escapeHtml(scan.userGuidance.safety_tip)}
        </div>
      `;
    }
    
    return `
      <div style="background:${headerBg} !important;padding:12px 16px !important;display:flex !important;align-items:center !important;justify-content:space-between !important;">
        <div style="display:flex !important;align-items:center !important;gap:10px !important;">
          <span style="font-size:24px !important;">${icon}</span>
          <div>
            <div style="font-weight:700 !important;color:${headerColor} !important;font-size:14px !important;">PhishLens Analysis</div>
            <div style="background:${badgeBg} !important;color:white !important;font-size:10px !important;padding:3px 8px !important;border-radius:4px !important;font-weight:600 !important;display:inline-block !important;margin-top:4px !important;">${badgeText}</div>
          </div>
        </div>
        <button onclick="this.closest('#phishlens-overlay').remove()" style="background:none !important;border:none !important;cursor:pointer !important;padding:6px 10px !important;border-radius:6px !important;font-size:20px !important;color:${headerColor} !important;font-weight:bold !important;line-height:1 !important;">✕</button>
      </div>
      <div style="padding:12px 16px 16px !important;max-height:320px !important;overflow-y:auto !important;">
        ${scan.analysisSummary ? `<div style="font-size:13px !important;color:#374151 !important;line-height:1.5 !important;">${escapeHtml(scan.analysisSummary).slice(0, 200)}${scan.analysisSummary.length > 200 ? '...' : ''}</div>` : ''}
        ${scan.llmAnalysis && !scan.analysisSummary ? `<div style="font-size:13px !important;color:#374151 !important;line-height:1.5 !important;">${escapeHtml(scan.llmAnalysis).slice(0, 200)}${scan.llmAnalysis.length > 200 ? '...' : ''}</div>` : ''}
        ${indicatorsHtml}
        ${urlsHtml}
        ${recommendHtml}
        ${safetyTipHtml}
        <div style="margin-top:16px !important;padding-top:12px !important;border-top:1px solid #e5e7eb !important;text-align:center !important;">
          <a href="http://localhost:8080/scans/${scan.id}" target="_blank" rel="noreferrer noopener" 
             style="display:inline-block !important;background:#2563eb !important;color:white !important;padding:8px 16px !important;border-radius:6px !important;font-weight:600 !important;font-size:12px !important;text-decoration:none !important;">
            View Full Analysis →
          </a>
        </div>
      </div>
    `;
  }

  function tryExtractAndSend() {
    if (location.hostname.includes('mail.google.com')) {
      const body = findGmailBody();
      if (body) return sendForAnalysis(body);
    }
    const sel = getSelectedTextOrInput();
    if (sel) return sendForAnalysis(sel);
    clearOverlay();
  }

  // Automatic analysis is disabled to avoid sending LLM requests while extension
  // is in the background or the user isn't actively asking. Only analyze when
  // explicitly requested (FORCE_ANALYZE from popup).
  
  // listen for explicit requests from popup to force an analysis
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    try {
      if (msg && msg.type === 'FORCE_ANALYZE') {
        // attempt to extract the best text and send it for analysis
        let text = null;
        if (location.hostname.includes('mail.google.com')) text = findGmailBody();
        if (!text) text = getSelectedTextOrInput();
        if (!text) {
          sendResponse({ ok: false, error: 'no_text_found' });
          return;
        }
        sendForAnalysis(text);
        sendResponse({ ok: true });
      }
      if (msg && msg.type === 'CLOSE_OVERLAY') {
        clearOverlay();
        sendResponse({ ok: true });
      }
    } catch (e) {
      console.warn('FORCE_ANALYZE handler failed', e);
      try { sendResponse({ ok: false, error: e && e.message }); } catch (e2) {}
    }
    return true;
  });
})();
