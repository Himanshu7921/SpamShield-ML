/* global chrome */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('analyzeBtn');
  const status = document.getElementById('status');
  const result = document.getElementById('result');

  function setStatus(s) { status.textContent = s; }
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

  function renderAnalysis(data) {
    if (!data) return showResult('No result');
    const modelPred = data.model_prediction || '';
    const analysis = data.analysis || {};
    const classification = analysis.classification || modelPred || '';
    const findings = (typeof analysis === 'string') ? analysis : (analysis.analysis_findings || '');
    const recommended = (typeof analysis === 'string') ? '' : (analysis.recommended_action || '');

    // badge class
    let badgeClass = 'unknown';
    if ((classification || '').toLowerCase().includes('spam')) badgeClass = 'spam';
    else if ((classification || '').toLowerCase().includes('not')) badgeClass = 'notspam';

    const html = `
      <div class="analysis">
        <div class="analysis-header">
          <div class="analysis-title">PhishLens Analysis</div>
          <div>
            <span class="badge ${badgeClass}">${escapeHtml(classification || modelPred || 'Unknown')}</span>
          </div>
        </div>
        <div class="findings">${markdownToHtml(findings)}</div>
        ${recommended ? `<div class="recommend"><strong>Recommended:</strong> ${escapeHtml(recommended)}</div>` : ''}
        <div class="small-muted">Model prediction: ${escapeHtml(modelPred || '')}</div>
      </div>
    `;
    result.innerHTML = html;
  }

  const FRONTEND_URL = 'http://localhost:8080';

  function encodeScan(scan) {
    try {
      const json = JSON.stringify(scan);
      const b64 = btoa(unescape(encodeURIComponent(json)));
      return encodeURIComponent(b64);
    } catch (e) { return null; }
  }

  function buildScanFromResult(data, messageText) {
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
      subject: (messageText && messageText.slice(0,80)) || 'Scanned content',
      riskLevel: risk,
      confidence: 0.92,
      timestamp: new Date().toISOString(),
      body: messageText || '',
      dangerousPhrases: [],
      reasons: [],
      techniques: [],
      links: [],
      recommendation: recommended || '',
      llmAnalysis: findings || ''
    };
    return scan;
  }

  function showResult(textOrObj) { 
    if (!textOrObj) { result.innerHTML = ''; return; }
    if (typeof textOrObj === 'string') result.innerHTML = markdownToHtml(textOrObj);
    else renderAnalysis(textOrObj);
  }

  btn.addEventListener('click', async () => {
    // disable to ensure one LLM call per click
    btn.disabled = true;
    setStatus('Requesting content from page...');
    showResult('');

    try {
      // get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        setStatus('No active tab');
        btn.disabled = false;
        return;
      }

      // ask content script to extract and trigger analysis
      setStatus('Asking page to analyze selection/body...');
      chrome.tabs.sendMessage(tab.id, { type: 'FORCE_ANALYZE' }, (resp) => {
        // content script will forward analysis via background and overlay; but background returns here when done
        if (chrome.runtime.lastError) {
          // content script not available or error: fallback to scripting.executeScript
          setStatus('Content script not available on this page; attempting in-page extraction...');
          try {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: function () {
                // try common email container selectors, then selection, then active input, then body text
                const selectors = ['div.a3s', 'div.ii', 'div.adn', 'div.gs'];
                for (const sel of selectors) {
                  const node = document.querySelector(sel);
                  if (node && node.innerText && node.innerText.trim().length > 30) return node.innerText.trim();
                }
                const sel = (window.getSelection && window.getSelection().toString && window.getSelection().toString().trim()) || '';
                if (sel && sel.length > 10) return sel;
                const active = document.activeElement;
                if (active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type === 'text'))) {
                  const v = active.value && active.value.trim();
                  if (v && v.length > 10) return v;
                }
                // last resort: page body but cap length
                const bodyText = document.body && document.body.innerText ? document.body.innerText.trim() : '';
                return bodyText ? bodyText.slice(0, 15000) : '';
              }
            }, (injectionResults) => {
              try {
                const text = (injectionResults && injectionResults[0] && injectionResults[0].result) || '';
                if (!text) {
                  setStatus('No usable text found on page');
                  btn.disabled = false;
                  return;
                }
                setStatus('Page text extracted — requesting analysis');
                // send to background for analysis; background will respond and also broadcast ML_RESULT_POPUP
                chrome.runtime.sendMessage({ type: 'ANALYZE', message: text }, (resp2) => {
                  if (!resp2 || !resp2.ok) {
                    setStatus('Analysis failed: ' + (resp2 && resp2.error));
                    btn.disabled = false;
                    return;
                  }
                  setStatus('Result received');
                  const data = resp2.data || {};
                  showResult(data);
                  // add detailed link
                  try {
                    const orig = resp2.message || text || '';
                    const scan = buildScanFromResult(data, orig);
                    const encoded = encodeScan(scan);
                    if (encoded) {
                      const link = document.createElement('a');
                      link.href = FRONTEND_URL + '/scans?scan=' + encoded;
                      link.target = '_blank';
                      link.rel = 'noreferrer noopener';
                      link.textContent = 'Click here to see Detailed Analysis';
                      link.style.display = 'inline-block';
                      link.style.marginTop = '10px';
                      link.style.fontWeight = '600';
                      link.style.color = '#2563eb';
                      result.appendChild(link);
                    }
                  } catch (e) {}
                  btn.disabled = false;
                });
              } catch (e) {
                setStatus('Extraction failed: ' + (e && e.message));
                btn.disabled = false;
              }
            });
          } catch (e) {
            setStatus('Injection failed: ' + (e && e.message));
            btn.disabled = false;
          }
          return;
        }
        setStatus('Analysis requested — waiting for result');
        // We'll listen for a one-time ML_RESULT message from background via runtime.onMessage
      });

      // temporary listener for the response routed through background
      function onMessage(msg) {
        if (msg && msg.type === 'ML_RESULT_POPUP') {
          const data = msg.result || {};
          const orig = msg.message || '';
          setStatus('Result received');
          showResult(data);

          // add Detailed Analysis link/button
          try {
            const scan = buildScanFromResult(data, orig);
            const encoded = encodeScan(scan);
            if (encoded) {
              const link = document.createElement('a');
              link.href = FRONTEND_URL + '/scans?scan=' + encoded;
              link.target = '_blank';
              link.rel = 'noreferrer noopener';
              link.textContent = 'Click here to see Detailed Analysis';
              link.style.display = 'inline-block';
              link.style.marginTop = '10px';
              link.style.fontWeight = '600';
              link.style.color = '#2563eb';
              result.appendChild(link);
            }
          } catch (e) {}

          btn.disabled = false;
          chrome.runtime.onMessage.removeListener(onMessage);
        }
      }
      chrome.runtime.onMessage.addListener(onMessage);

      // safety re-enable after 12s in case no response
      setTimeout(() => {
        if (btn.disabled) {
          btn.disabled = false;
          setStatus('Ready');
        }
      }, 12000);

    } catch (e) {
      setStatus('Error: ' + (e && e.message));
      btn.disabled = false;
    }
  });
});
