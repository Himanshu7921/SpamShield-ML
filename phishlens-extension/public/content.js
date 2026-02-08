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
    let el = document.getElementById(OVERLAY_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = OVERLAY_ID;
      document.body.appendChild(el);
    }
    
    // Alert-like styling based on spam status
    const borderColor = isSpam ? '#ef4444' : '#22c55e';
    const bgColor = isSpam ? '#fef2f2' : '#f0fdf4';
    const headerBg = isSpam ? '#fee2e2' : '#dcfce7';
    
    el.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 2147483647;
      max-width: 400px;
      max-height: 400px;
      overflow: hidden;
      background: ${bgColor};
      border: 2px solid ${borderColor};
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      animation: phishlens-slide-in 0.3s ease-out;
    `;
    
    // Add animation keyframes
    if (!document.getElementById('phishlens-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'phishlens-styles';
      styleEl.textContent = `
        @keyframes phishlens-slide-in {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes phishlens-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        #${OVERLAY_ID} .phishlens-content {
          max-height: 320px;
          overflow-y: auto;
          padding: 12px 16px 16px;
        }
        #${OVERLAY_ID} .phishlens-close:hover {
          background: rgba(0,0,0,0.1) !important;
        }
      `;
      document.head.appendChild(styleEl);
    }
    
    el.innerHTML = content;
  }

  function clearOverlay() {
    const el = document.getElementById(OVERLAY_ID);
    if (el) {
      el.style.animation = 'none';
      el.style.transform = 'translateX(120%)';
      el.style.transition = 'transform 0.2s ease-in';
      setTimeout(() => el.remove(), 200);
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
    
    const isSpam = modelPrediction.toLowerCase().includes('spam') && 
                   !modelPrediction.toLowerCase().includes('not');
    
    // Extract classification info
    let confidence = 90;
    let riskLevel = 'medium';
    
    if (llmAnalysis.classification) {
      if (typeof llmAnalysis.classification === 'object') {
        confidence = llmAnalysis.classification.confidence_score || confidence;
        const llmRisk = (llmAnalysis.classification.risk_level || '').toLowerCase();
        if (llmRisk === 'high') riskLevel = 'high';
        else if (llmRisk === 'low') riskLevel = 'safe';
        else riskLevel = 'medium';
      }
    }
    
    // Override based on spam detection
    if (isSpam) riskLevel = 'high';
    else if (modelPrediction.toLowerCase().includes('not spam')) riskLevel = 'safe';
    
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

    try {
      console.debug('PhishLens: sending text for analysis (len=', text.length, ')');
      chrome.runtime.sendMessage({ type: 'ANALYZE', message: text }, (resp) => {
        if (!resp) return;
        if (!resp.ok) {
          showOverlay(buildErrorOverlay(resp.error || 'Analysis failed'), true);
          return;
        }
        
        const data = resp.data || {};
        const { scan, isSpam } = parseBackendResponse(data, text);
        
        // Save to localStorage
        saveScanToStorage(scan);
        
        // Build the overlay HTML
        const overlayHtml = buildResultOverlay(scan, isSpam);
        showOverlay(overlayHtml, isSpam);
      });
    } catch (e) {
      console.warn('PhishLens: sendForAnalysis error', e);
    }
  }

  function buildErrorOverlay(errorMsg) {
    return `
      <div style="background:#fee2e2;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #fecaca;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">⚠️</span>
          <span style="font-weight:600;color:#991b1b;">Analysis Error</span>
        </div>
        <button onclick="document.getElementById('${OVERLAY_ID}').remove()" class="phishlens-close" style="background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:4px;font-size:18px;color:#991b1b;">✕</button>
      </div>
      <div class="phishlens-content" style="padding:16px;color:#991b1b;">
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
        <div style="margin-top:12px;">
          <div style="font-weight:600;font-size:11px;text-transform:uppercase;color:#6b7280;margin-bottom:6px;">Indicators Found</div>
          ${scan.indicators.slice(0, 3).map(ind => `
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f3f4f6;">
              <span style="background:${severityColors[ind.severity] || '#6b7280'};color:white;font-size:9px;padding:2px 6px;border-radius:3px;text-transform:uppercase;font-weight:600;">${escapeHtml(ind.severity)}</span>
              <span style="font-size:12px;color:#374151;flex:1;">${escapeHtml(ind.description).slice(0, 100)}${ind.description.length > 100 ? '...' : ''}</span>
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
        <div style="margin-top:12px;">
          <div style="font-weight:600;font-size:11px;text-transform:uppercase;color:#6b7280;margin-bottom:6px;">URLs Detected</div>
          ${scan.detectedUrls.slice(0, 2).map(u => `
            <div style="background:#f9fafb;padding:8px;border-radius:6px;margin-bottom:4px;">
              <div style="font-size:11px;word-break:break-all;color:#374151;">${escapeHtml(u.url).slice(0, 50)}...</div>
              <div style="display:flex;gap:6px;margin-top:4px;">
                <span style="background:${u.is_https ? '#dcfce7' : '#fee2e2'};color:${u.is_https ? '#166534' : '#991b1b'};font-size:9px;padding:2px 6px;border-radius:3px;">${u.is_https ? '🔒 HTTPS' : '⚠️ HTTP'}</span>
                <span style="background:${repColors[u.domain_reputation] || '#f3f4f6'};color:white;font-size:9px;padding:2px 6px;border-radius:3px;">${escapeHtml(u.domain_reputation)}</span>
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
        <div style="margin-top:12px;background:${recBg};padding:10px;border-radius:6px;">
          <div style="font-weight:600;font-size:11px;color:${recColor};margin-bottom:4px;">💡 Recommended Action</div>
          <div style="font-size:12px;color:${recColor};">${escapeHtml(scan.recommendation).slice(0, 150)}${scan.recommendation.length > 150 ? '...' : ''}</div>
        </div>
      `;
    }
    
    // Safety tip from user guidance
    let safetyTipHtml = '';
    if (scan.userGuidance && scan.userGuidance.safety_tip) {
      safetyTipHtml = `
        <div style="margin-top:8px;font-size:11px;color:#6b7280;font-style:italic;">
          🛡️ ${escapeHtml(scan.userGuidance.safety_tip)}
        </div>
      `;
    }
    
    return `
      <div style="background:${headerBg};padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:24px;">${icon}</span>
          <div>
            <div style="font-weight:700;color:${headerColor};">PhishLens Analysis</div>
            <div style="background:${badgeBg};color:white;font-size:10px;padding:3px 8px;border-radius:4px;font-weight:600;display:inline-block;margin-top:4px;">${badgeText}</div>
          </div>
        </div>
        <button onclick="document.getElementById('${OVERLAY_ID}').remove()" class="phishlens-close" style="background:none;border:none;cursor:pointer;padding:6px 10px;border-radius:6px;font-size:20px;color:${headerColor};font-weight:bold;line-height:1;">✕</button>
      </div>
      <div class="phishlens-content">
        ${scan.analysisSummary ? `<div style="font-size:13px;color:#374151;line-height:1.5;">${escapeHtml(scan.analysisSummary).slice(0, 200)}${scan.analysisSummary.length > 200 ? '...' : ''}</div>` : ''}
        ${indicatorsHtml}
        ${urlsHtml}
        ${recommendHtml}
        ${safetyTipHtml}
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center;">
          <a href="http://localhost:8080/scans/${scan.id}" target="_blank" rel="noreferrer noopener" 
             style="display:inline-block;background:#2563eb;color:white;padding:8px 16px;border-radius:6px;font-weight:600;font-size:12px;text-decoration:none;">
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
