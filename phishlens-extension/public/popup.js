/* global chrome */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('analyzeBtn');
  const status = document.getElementById('status');

  function setStatus(s) { status.textContent = s; }

  // Clear status after delay
  function clearStatusAfterDelay(ms = 3000) {
    setTimeout(() => { setStatus(''); }, ms);
  }

  // Function to inject overlay into the page
  function injectOverlay(tabId, scan, isSpam) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (scanData, spam) => {
        const OVERLAY_ID = 'phishlens-overlay';
        let el = document.getElementById(OVERLAY_ID);
        if (!el) {
          el = document.createElement('div');
          el.id = OVERLAY_ID;
          document.body.appendChild(el);
        }
        
        const borderColor = spam ? '#ef4444' : '#22c55e';
        const bgColor = spam ? '#fef2f2' : '#f0fdf4';
        const headerBg = spam ? '#fee2e2' : '#dcfce7';
        const headerColor = spam ? '#991b1b' : '#166534';
        const badgeBg = spam ? '#ef4444' : '#22c55e';
        const badgeText = spam ? 'SPAM DETECTED' : 'SAFE';
        const icon = spam ? '🚨' : '✅';
        
        el.style.cssText = `
          position: fixed;
          bottom: 16px;
          right: 16px;
          z-index: 2147483647;
          max-width: 400px;
          background: ${bgColor};
          border: 2px solid ${borderColor};
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          border-radius: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
        `;
        
        const escapeHtml = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        el.innerHTML = `
          <div style="background:${headerBg};padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:24px;">${icon}</span>
              <div>
                <div style="font-weight:700;color:${headerColor};">PhishLens Analysis</div>
                <div style="background:${badgeBg};color:white;font-size:10px;padding:3px 8px;border-radius:4px;font-weight:600;display:inline-block;margin-top:4px;">${badgeText}</div>
              </div>
            </div>
            <button onclick="document.getElementById('${OVERLAY_ID}').remove()" style="background:none;border:none;cursor:pointer;padding:6px 10px;border-radius:6px;font-size:20px;color:${headerColor};font-weight:bold;line-height:1;">✕</button>
          </div>
          <div style="padding:12px 16px;">
            ${scanData.llmAnalysis ? `<div style="font-size:13px;color:#374151;line-height:1.5;">${escapeHtml(scanData.llmAnalysis).slice(0, 200)}${scanData.llmAnalysis.length > 200 ? '...' : ''}</div>` : ''}
            ${scanData.recommendation ? `
              <div style="margin-top:12px;background:${spam ? '#fef3c7' : '#f0fdf4'};padding:10px;border-radius:6px;">
                <div style="font-weight:600;font-size:11px;color:${spam ? '#92400e' : '#166534'};margin-bottom:4px;">💡 Recommended Action</div>
                <div style="font-size:12px;color:${spam ? '#92400e' : '#166534'};">${escapeHtml(scanData.recommendation).slice(0, 150)}${scanData.recommendation.length > 150 ? '...' : ''}</div>
              </div>
            ` : ''}
            <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;text-align:center;">
              <a href="http://localhost:8080/scans/${scanData.id}" target="_blank" rel="noreferrer noopener" 
                 style="display:inline-block;background:#2563eb;color:white;padding:8px 16px;border-radius:6px;font-weight:600;font-size:12px;text-decoration:none;">
                View Full Analysis →
              </a>
            </div>
          </div>
        `;
      },
      args: [scan, isSpam]
    });
  }

  btn.addEventListener('click', async () => {
    // disable to ensure one LLM call per click
    btn.disabled = true;
    setStatus('Analyzing...');

    try {
      // get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        setStatus('No active tab');
        btn.disabled = false;
        clearStatusAfterDelay();
        return;
      }

      // ask content script to extract and trigger analysis
      chrome.tabs.sendMessage(tab.id, { type: 'FORCE_ANALYZE' }, (resp) => {
        if (chrome.runtime.lastError) {
          // content script not available: fallback to scripting.executeScript
          setStatus('Extracting...');
          try {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: function () {
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
                const bodyText = document.body && document.body.innerText ? document.body.innerText.trim() : '';
                return bodyText ? bodyText.slice(0, 15000) : '';
              }
            }, (injectionResults) => {
              try {
                const text = (injectionResults && injectionResults[0] && injectionResults[0].result) || '';
                if (!text) {
                  setStatus('No text found');
                  btn.disabled = false;
                  clearStatusAfterDelay();
                  return;
                }
                setStatus('Analyzing...');
                chrome.runtime.sendMessage({ type: 'ANALYZE', message: text }, (resp2) => {
                  if (!resp2 || !resp2.ok) {
                    setStatus('Analysis failed');
                    btn.disabled = false;
                    clearStatusAfterDelay();
                    return;
                  }
                  // Inject overlay with the result
                  const scan = resp2.scan || {};
                  const classLower = ((resp2.data?.analysis?.classification) || '').toLowerCase();
                  const isSpam = classLower.includes('spam') && !classLower.includes('not');
                  injectOverlay(tab.id, scan, isSpam);
                  setStatus('Done!');
                  btn.disabled = false;
                  clearStatusAfterDelay(3000);
                });
              } catch (e) {
                setStatus('Failed');
                btn.disabled = false;
                clearStatusAfterDelay();
              }
            });
          } catch (e) {
            setStatus('Failed');
            btn.disabled = false;
            clearStatusAfterDelay();
          }
          return;
        }
        // Content script handled it - result will show in page overlay
        setStatus('Done!');
        btn.disabled = false;
        clearStatusAfterDelay(3000);
      });

      // safety re-enable after 15s in case no response
      setTimeout(() => {
        if (btn.disabled) {
          btn.disabled = false;
          setStatus('');
        }
      }, 15000);

    } catch (e) {
      setStatus('Error');
      btn.disabled = false;
      clearStatusAfterDelay();
    }
  });
});
