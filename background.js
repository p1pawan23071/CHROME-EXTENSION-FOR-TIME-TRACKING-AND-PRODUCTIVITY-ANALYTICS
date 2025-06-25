// Background service worker - runs persistently

// Initialize default lists
let productiveSites = [
  'github.com', 
  'stackoverflow.com', 
  'developer.mozilla.org',
  'w3schools.com',
  'codecademy.com'
];
let unproductiveSites = [
  'facebook.com', 
  'twitter.com', 
  'instagram.com',
  'youtube.com',
  'netflix.com'
];

// Store current tracking state
let currentTab = null;
let startTime = null;
let currentUrl = null;
let currentClassification = 'neutral';

// Set default values on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ productiveSites, unproductiveSites });
  chrome.storage.local.set({
    sessions: [],
    todayTotal: 0,
    todayProductive: 0,
    todayUnproductive: 0
  });
});

// Classify a website URL
function classifyWebsite(url) {
  const domain = new URL(url).hostname;
  
  // Check against productive sites
  for (const site of productiveSites) {
    if (domain.includes(site)) return 'productive';
  }
  
  // Check against unproductive sites
  for (const site of unproductiveSites) {
    if (domain.includes(site)) return 'unproductive';
  }
  
  return 'neutral';
}

// Handle tab switching
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab.url) {
      updateCurrentTab(tab.id, tab.url);
    }
  });
});

// Handle URL changes in the same tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    updateCurrentTab(tabId, changeInfo.url);
  }
});

function updateCurrentTab(tabId, url) {
  const now = new Date();
  
  // Save the previous session if it exists
  if (currentTab && startTime && currentUrl) {
    const duration = (now - startTime) / 1000; // in seconds
    
    saveSession({
      url: currentUrl,
      tabId: currentTab,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      duration,
      classification: currentClassification
    });
  }
  
  // Start new session
  currentTab = tabId;
  currentUrl = url;
  currentClassification = classifyWebsite(url);
  startTime = now;
  
  // Update the badge
  updateBadge();
}

function saveSession(session) {
  chrome.storage.local.get(
    ['sessions', 'todayTotal', 'todayProductive', 'todayUnproductive'],
    (result) => {
      const sessions = result.sessions || [];
      sessions.push(session);
      
      // Update today's totals
      const todayTotal = (result.todayTotal || 0) + session.duration;
      let todayProductive = result.todayProductive || 0;
      let todayUnproductive = result.todayUnproductive || 0;
      
      if (session.classification === 'productive') {
        todayProductive += session.duration;
      } else if (session.classification === 'unproductive') {
        todayUnproductive += session.duration;
      }
      
      // Save back to storage
      chrome.storage.local.set({
        sessions,
        todayTotal,
        todayProductive,
        todayUnproductive,
        lastUpdated: new Date().toISOString()
      });
    }
  );
}

function updateBadge() {
  if (currentClassification === 'productive') {
    chrome.action.setBadgeBackgroundColor({ color: '#10B981' }); // Green
    chrome.action.setBadgeText({ text: 'P' });
  } else if (currentClassification === 'unproductive') {
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' }); // Red
    chrome.action.setBadgeText({ text: 'U' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Listen for messages from content scripts/popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'GET_CLASSIFICATION':
      sendResponse(classifyWebsite(request.url));
      break;
      
    case 'GET_SUMMARY':
      chrome.storage.local.get(
        ['todayTotal', 'todayProductive', 'todayUnproductive'],
        sendResponse
      );
      return true; // Required for async response
  }
});
