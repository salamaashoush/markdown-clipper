/**
 * Content script for extracting page content
 */

import { MessageType } from '~/types/messages';
import { ContentParser } from '~/services/parser';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',

  async main() {
    console.log('Content script loaded');

    const parser = new ContentParser();

    // Listen for extraction requests from background
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === MessageType.EXTRACT_CONTENT) {
        handleExtractContent(message.payload, parser)
          .then(sendResponse)
          .catch((error) => {
            console.error('Content extraction error:', error);
            sendResponse({
              error: error.message,
              html: document.body.innerHTML,
              title: document.title,
              url: window.location.href,
              metadata: {},
            });
          });

        // Return true to indicate async response
        return true;
      }

      if (message.type === MessageType.CHECK_READY_STATE) {
        sendResponse({
          readyState: document.readyState,
          isLoading: document.readyState !== 'complete',
        });
        return false;
      }

      return false; // Default return for unhandled messages
    });

    // Optional: Setup mutation observer for dynamic content
    if (
      window.location.hostname.includes('spa') ||
      window.location.hostname.includes('react') ||
      window.location.hostname.includes('vue') ||
      window.location.hostname.includes('angular')
    ) {
      const observer = parser.observeMutations((mutations) => {
        // Could notify background of significant changes
        console.log('DOM mutations detected:', mutations.length);
      });

      // Clean up observer on page unload
      window.addEventListener('beforeunload', () => {
        observer.disconnect();
      });
    }
  },
});

/**
 * Handle content extraction request
 */
async function handleExtractContent(
  options: {
    selectors?: string[];
    excludeSelectors?: string[];
    includeHidden?: boolean;
    waitForDynamic?: boolean;
    timeout?: number;
  },
  parser: ContentParser
) {
  try {
    // Extract content using the parser
    const extractedContent = await parser.extractContent(options);

    // Clean the HTML if needed
    const cleanedHtml = parser.cleanHTML(extractedContent.html);

    return {
      html: cleanedHtml,
      title: extractedContent.title,
      url: extractedContent.url,
      metadata: extractedContent.metadata,
      isLoading: extractedContent.isLoading,
    };
  } catch (error) {
    console.error('Failed to extract content:', error);
    throw error;
  }
}
