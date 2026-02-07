// Auto-extract message text on supported sites (Gmail) or fallback to selected text
(function () {
  const OVERLAY_ID = 'phishlens-overlay';
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

  function showOverlay(content) {
    let el = document.getElementById(OVERLAY_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = OVERLAY_ID;
      el.style.position = 'fixed';
      el.style.bottom = '12px';
      el.style.right = '12px';
      el.style.zIndex = 2147483647;
      el.style.maxWidth = '380px';
      el.style.maxHeight = '320px';
      el.style.overflow = 'auto';
      el.style.background = 'white';
      el.style.border = '1px solid rgba(0,0,0,0.08)';
      el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
      el.style.padding = '10px';
      el.style.borderRadius = '8px';
      el.style.fontSize = '13px';
      el.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(el);
    }
    el.innerHTML = content;
  }

  function clearOverlay() {
    const el = document.getElementById(OVERLAY_ID);
    if (el) el.remove();
  }

  function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function markdownToHtml(md) {
    if (!md) return '';
    let text = escapeHtml(md);
    text = text.replace(/```([\s\S]*?)```/g, (m, code) => '<pre><code>' + code.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</code></pre>');
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    const lines = text.split(/\r?\n/);
    const out = [];
    let inUl = false, inOl = false;
    for (let line of lines) {
      const ol = line.match(/^\s*\d+\.\s+(.*)/);
      const ul = line.match(/^\s*[-*+]\s+(.*)/);
      if (ol) {
        if (!inOl) { out.push('<ol>'); inOl = true; }
        out.push('<li>' + ol[1] + '</li>');
      } else if (ul) {
        if (!inUl) { out.push('<ul>'); inUl = true; }
        out.push('<li>' + ul[1] + '</li>');
      } else {
        if (inUl) { out.push('</ul>'); inUl = false; }
        if (inOl) { out.push('</ol>'); inOl = false; }
        if (line.trim() === '') out.push('<br/>'); else out.push('<p>' + line + '</p>');
      }
    }
    if (inUl) out.push('</ul>');
    if (inOl) out.push('</ol>');
    return out.join('\n');
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
          showOverlay('<div class="phishlens-error">Analysis failed: ' + (resp.error || 'unknown') + '</div>');
          return;
        }
        const data = resp.data || {};
        const model = data.model_prediction || '';
        const analysis = data.analysis || {};
        let findings = '';
        if (typeof analysis === 'string') findings = analysis;
        else if (analysis.analysis_findings) findings = analysis.analysis_findings;
        else findings = JSON.stringify(analysis);

          const short = findings.length > 1000 ? findings.slice(0, 1000) + '...' : findings;
          const recommended = (analysis && analysis.recommended_action) ? analysis.recommended_action : '';
          const badgeClass = (model && model.toLowerCase().includes('spam')) ? 'spam' : ((model && model.toLowerCase().includes('not')) ? 'notspam' : 'unknown');
          const header = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><div style="font-weight:600">PhishLens — ${escapeHtml(model)}</div><div style="padding:4px 8px;border-radius:999px;color:white;font-weight:600;${badgeClass==='spam'? 'background:#ef4444': (badgeClass==='notspam'? 'background:#10b981':'background:#64748b')}">${escapeHtml(model)}</div></div>`;
          const findingsHtml = `<div>${markdownToHtml(short)}</div>`;
          const recommendHtml = recommended ? `<div style="margin-top:8px;background:#fff7ed;border:1px solid #ffedd5;padding:8px;border-radius:6px;color:#92400e"><strong>Recommended:</strong> ${escapeHtml(recommended)}</div>` : '';
          const html = header + findingsHtml + recommendHtml;
          // append a Detailed Analysis link which opens the frontend scans page and syncs the scan
          try {
            const scan = {
              id: Date.now().toString() + Math.random().toString(36).slice(2,8),
              sender: 'extension',
              senderName: 'PhishLens Extension',
              subject: (text && text.slice(0,80)) || 'Scanned content',
              riskLevel: (model && model.toLowerCase().includes('spam')) ? 'high' : ((model && model.toLowerCase().includes('not')) ? 'safe' : 'medium'),
              confidence: 0.9,
              timestamp: new Date().toISOString(),
              body: text || '',
              dangerousPhrases: [],
              reasons: [],
              techniques: [],
              links: [],
              recommendation: recommended || '',
              llmAnalysis: findings || ''
            };
            const json = JSON.stringify(scan);
            const b64 = btoa(unescape(encodeURIComponent(json)));
            const encoded = encodeURIComponent(b64);
            const link = `<div style="margin-top:8px"><a href="http://localhost:8080/scans?scan=${encoded}" target="_blank" rel="noreferrer noopener" style="font-weight:600;color:#2563eb">Click here to see Detailed Analysis</a></div>`;
            showOverlay(html + link);
          } catch (e) {
            showOverlay(html);
          }
      });
    } catch (e) {
      console.warn('PhishLens: sendForAnalysis error', e);
    }
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
  // tryExtractAndSend();
  // const obs = new MutationObserver(() => { tryExtractAndSend(); });
  // obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
  // document.addEventListener('selectionchange', () => setTimeout(tryExtractAndSend, 250));
  
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
        // use the same sendForAnalysis path which will forward to background and return
        sendForAnalysis(text);
        // also ask background to send a response when done — content script will not wait for it
        sendResponse({ ok: true });
      }
    } catch (e) {
      console.warn('FORCE_ANALYZE handler failed', e);
      try { sendResponse({ ok: false, error: e && e.message }); } catch (e2) {}
    }
    // indicate sendResponse was called synchronously
    return true;
  });
})();
