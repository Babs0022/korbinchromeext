// src/background/index.ts

chrome.runtime.onInstalled.addListener(() => {
  console.log('VibePilot extension installed.');
});

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Example of handling a message
  if (request.action === "log_message") {
    console.log("Message from content script:", request.message);
  }

  // To send a response asynchronously, you must return true
  return true;
});
