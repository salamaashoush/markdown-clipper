/**
 * Content script for extracting page content
 */

import { MessageType } from '~/types/messages';
import { ContentParser } from '~/services/parser';
import { contentDetector } from '~/services/content-detector';

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

      // Handle smart content detection
      if (message.type === 'DETECT_CONTENT') {
        contentDetector.detectContent(message.payload)
          .then(result => {
            sendResponse({
              success: true,
              mainContent: result.mainContent?.outerHTML,
              metadata: {
                title: result.title,
                author: result.author,
                publishDate: result.publishDate,
                readingTime: result.readingTime,
                wordCount: result.wordCount,
                confidence: result.confidence
              }
            });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });

        return true;
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
    useSmartDetection?: boolean;
    smartDetectionOptions?: any;
  },
  parser: ContentParser
) {
  try {
    let html: string;
    let metadata: any = {};

    // Check if smart detection should be used
    if (options.useSmartDetection) {
      const detected = await contentDetector.detectContent(options.smartDetectionOptions || {});

      if (detected.mainContent && detected.confidence > 50) {
        // Use smart detected content
        html = detected.mainContent.outerHTML;
        metadata = {
          ...metadata,
          author: detected.author,
          publishDate: detected.publishDate,
          readingTime: detected.readingTime,
          wordCount: detected.wordCount,
          detectionConfidence: detected.confidence
        };
      } else {
        // Fallback to regular extraction
        const extractedContent = await parser.extractContent(options);
        html = parser.cleanHTML(extractedContent.html);
        metadata = extractedContent.metadata;
      }
    } else {
      // Use regular extraction
      const extractedContent = await parser.extractContent(options);
      html = parser.cleanHTML(extractedContent.html);
      metadata = extractedContent.metadata;
    }

    return {
      html,
      title: document.title,
      url: window.location.href,
      metadata,
      isLoading: document.readyState !== 'complete',
    };
  } catch (error) {
    console.error('Failed to extract content:', error);
    throw error;
  }
}
