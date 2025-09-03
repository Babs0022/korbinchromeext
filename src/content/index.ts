// src/content/index.ts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_dom") {
    const dom = document.documentElement.outerHTML;
    sendResponse({ dom });
  }
  // Keep the message channel open for the response
  return true;
});
