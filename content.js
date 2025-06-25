// Content script that runs on every webpage

// Send initial page data when loaded
sendPageData();

// Track URL changes for single-page apps
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    sendPageData();
  }
});

// Start observing the page for changes
observer.observe(document, { subtree: true, childList: true });

function sendPageData() {
  // Get the page title and favicon
  const pageTitle = document.title;
  const favicon = getFaviconUrl();
  
  // Send to background script
  chrome.runtime.sendMessage({
    type: 'PAGE_DATA',
    data: {
      url: location.href,
      title: pageTitle,
      favicon: favicon
    }
  });
}

function getFaviconUrl() {
  const favicon = document.querySelector('link[rel~="icon"]');
  if (favicon) {
    return favicon.href;
  }
  return `${location.origin}/favicon.ico`;
}
