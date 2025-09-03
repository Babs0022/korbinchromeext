// src/content/index.ts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_dom") {
    const dom = document.documentElement.outerHTML;
    sendResponse({ dom });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'execute_action') {
    const { action, details } = request.payload;
    try {
      if (action === 'click') {
        const el = document.querySelector(details.selector);
        if (el instanceof HTMLElement) {
          el.click();
          sendResponse({ status: 'success', message: `Clicked element with selector: ${details.selector}` });
        } else {
          throw new Error(`Element not found for selector: ${details.selector}`);
        }
      } else if (action === 'type') {
        const el = document.querySelector(details.selector);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.value = details.text;
          // Dispatch input event to trigger any attached event listeners
          el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          sendResponse({ status: 'success', message: `Typed text into element with selector: ${details.selector}` });
        } else {
          throw new Error(`Input element not found for selector: ${details.selector}`);
        }
      } else {
        throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      sendResponse({ status: 'error', error: errorMessage });
    }
    return true; // Keep channel open for async response
  }

  // Return true to indicate you wish to send a response asynchronously
  return true;
});

    