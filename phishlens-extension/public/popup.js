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
            <button class="phishlens-close-btn" style="background:none;border:none;cursor:pointer;padding:6px 10px;border-radius:6px;font-size:20px;color:${headerColor};font-weight:bold;line-height:1;">✕</button>
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
        
        // Attach close button event listener
        const closeBtn = el.querySelector('.phishlens-close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            el.remove();
          });
        }
      },
      args: [scan, isSpam]
    });
  }

  // Function to inject error overlay into the page
  function injectErrorOverlay(tabId, errorMessage) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: (message) => {
        const OVERLAY_ID = 'phishlens-overlay';
        let el = document.getElementById(OVERLAY_ID);
        if (!el) {
          el = document.createElement('div');
          el.id = OVERLAY_ID;
          document.body.appendChild(el);
        }
        
        const borderColor = '#ef4444';
        const bgColor = '#fef2f2';
        const headerBg = '#fee2e2';
        const headerColor = '#991b1b';
        const badgeBg = '#ef4444';
        const icon = '⚠️';
        
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
        
        el.innerHTML = `
          <div style="background:${headerBg};padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:24px;">${icon}</span>
              <div>
                <div style="font-weight:700;color:${headerColor};">Analysis Failed</div>
                <div style="background:${badgeBg};color:white;font-size:10px;padding:3px 8px;border-radius:4px;font-weight:600;display:inline-block;margin-top:4px;">ERROR</div>
              </div>
            </div>
            <button class="phishlens-close-btn" style="background:none;border:none;cursor:pointer;padding:6px 10px;border-radius:6px;font-size:20px;color:${headerColor};font-weight:bold;line-height:1;">✕</button>
          </div>
          <div style="padding:12px 16px;">
            <div style="font-size:13px;color:#374151;line-height:1.5;">${message}</div>
            <div style="margin-top:12px;background:#fef3c7;padding:10px;border-radius:6px;">
              <div style="font-weight:600;font-size:11px;color:#92400e;margin-bottom:4px;">💡 Troubleshooting</div>
              <div style="font-size:12px;color:#92400e;">Try refreshing the page and analyzing again. Make sure the backend server is running.</div>
            </div>
          </div>
        `;
        
        // Attach close button event listener
        const closeBtn = el.querySelector('.phishlens-close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            el.remove();
          });
        }
      },
      args: [errorMessage]
    });
  }

  btn.addEventListener('click', async () => {
    // disable to ensure one LLM call per click
    btn.disabled = true;
    setStatus('Analyzing...');
    const analyzeStartTime = Date.now();
    const minAnalysisTime = 1500; // Keep "Analyzing..." visible for at least 1.5 seconds

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
                  // Show error overlay on page
                  injectErrorOverlay(tab.id, 'No text content found on this page. Try selecting text or navigating to an email/message.');
                  setStatus('No content');
                  btn.disabled = false;
                  return;
                }
                setStatus('Analyzing...');
                chrome.runtime.sendMessage({ type: 'ANALYZE', message: text }, (resp2) => {
                  // Calculate remaining time to maintain minimum visible duration
                  const elapsedTime = Date.now() - analyzeStartTime;
                  const remainingTime = Math.max(0, minAnalysisTime - elapsedTime);
                  
                  if (!resp2 || !resp2.ok) {
                    const errorMsg = resp2?.error || 'Failed to analyze the content. Please try again.';
                    // Show error overlay on page
                    injectErrorOverlay(tab.id, errorMsg);
                    
                    setTimeout(() => {
                      setStatus('Failed');
                      btn.disabled = false;
                      // Don't auto-clear status for errors - user should see it
                    }, remainingTime);
                    return;
                  }
                  
                  // Inject overlay with the result
                  const scan = resp2.scan || {};
                  const classLower = ((resp2.data?.analysis?.classification) || '').toLowerCase();
                  const isSpam = classLower.includes('spam') && !classLower.includes('not');
                  injectOverlay(tab.id, scan, isSpam);
                  
                  // Show "Done!" after minimum analyzing time
                  setTimeout(() => {
                    setStatus('Done!');
                    btn.disabled = false;
                    clearStatusAfterDelay(1500); // Show "Done!" for 1.5 seconds before clearing
                  }, remainingTime);
                });
              } catch (e) {
                injectErrorOverlay(tab.id, 'An error occurred while processing the page. Please try again.');
                setStatus('Error');
                btn.disabled = false;
              }
            });
          } catch (e) {
            injectErrorOverlay(tab.id, 'An unexpected error occurred. Please try again.');
            setStatus('Error');
            btn.disabled = false;
          }
          return;
        }
        // Content script handled it - result will show in page overlay
        // Calculate remaining time to maintain minimum visible duration
        const elapsedTime = Date.now() - analyzeStartTime;
        const remainingTime = Math.max(0, minAnalysisTime - elapsedTime);
        
        setTimeout(() => {
          setStatus('Done!');
          btn.disabled = false;
          clearStatusAfterDelay(1500); // Show "Done!" for 1.5 seconds before clearing
        }, remainingTime);
      });

      // safety re-enable after 20s in case no response
      setTimeout(() => {
        if (btn.disabled) {
          btn.disabled = false;
          setStatus('');
        }
      }, 20000);

    } catch (e) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        injectErrorOverlay(tab.id, 'An unexpected error occurred. Please try again.');
      }
      setStatus('Error');
      btn.disabled = false;
    }
  });
});
