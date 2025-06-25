document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const totalTimeEl = document.getElementById('total-time');
  const productiveTimeEl = document.getElementById('productive-time');
  const unproductiveTimeEl = document.getElementById('unproductive-time');
  const productiveBarEl = document.getElementById('productive-bar');
  const unproductiveBarEl = document.getElementById('unproductive-bar');
  const productivePercentEl = document.getElementById('productive-percent');
  const unproductivePercentEl = document.getElementById('unproductive-percent');
  const currentSiteEl = document.getElementById('current-site-url');
  const classificationBadgeEl = document.getElementById('classification-badge');
  const classificationTextEl = document.getElementById('classification-text');
  const statusDotEl = document.querySelector('.status-dot');

  // Format time as Xh Ym or Xm
  function formatTime(seconds) {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  // Update the UI with latest data
  async function updateUI() {
    // Get data from storage
    const result = await chrome.storage.local.get([
      'todayTotal',
      'todayProductive',
      'todayUnproductive',
      'currentUrl',
      'currentClassification'
    ]);

    const total = result.todayTotal || 0;
    const productive = result.todayProductive || 0;
    const unproductive = result.todayUnproductive || 0;

    // Update time displays
    totalTimeEl.textContent = formatTime(total);
    productiveTimeEl.textContent = formatTime(productive);
    unproductiveTimeEl.textContent = formatTime(unproductive);

    // Update progress bars
    const productivePercent = total ? Math.round((productive / total) * 100) : 0;
    const unproductivePercent = total ? Math.round((unproductive / total) * 100) : 0;

    productiveBarEl.style.width = `${productivePercent}%`;
    unproductiveBarEl.style.width = `${unproductivePercent}%`;
    productivePercentEl.textContent = `${productivePercent}%`;
    unproductivePercentEl.textContent = `${unproductivePercent}%`;

    // Update current site info
    if (result.currentUrl) {
      try {
        const url = new URL(result.currentUrl);
        currentSiteEl.textContent = url.hostname.replace('www.', '');
      } catch {
        currentSiteEl.textContent = result.currentUrl;
      }
    }

    // Update classification
    const classification = result.currentClassification || 'neutral';
    classificationTextEl.textContent = classification;
    classificationBadgeEl.className = `classification-badge ${classification}`;
    statusDotEl.className = `status-dot ${classification}`;
  }

  // Get current active tab and update UI
  async function updateCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      await chrome.storage.local.set({
        currentUrl: tab.url,
        currentClassification: await getClassification(tab.url)
      });
      updateUI();
    }
  }

  // Get classification from background script
  function getClassification(url) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'GET_CLASSIFICATION', url },
        (response) => resolve(response || 'neutral')
      );
    });
  }

  // Button event listeners
  document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });

  document.getElementById('settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // // Initial UI update
  updateCurrentTab();
  setInterval(updateUI, 5000); // Update every 5 seconds
});
