/**
 * Offscreen document for DOM parsing and markdown conversion
 */

import { MarkdownConverter } from '~/lib/converter/index';
import type { ConversionProfile } from '~/types/storage';

console.log('Offscreen document loaded and ready');

interface OffscreenMessage {
  type: 'CONVERT_HTML';
  html: string;
  profile: ConversionProfile;
  metadata: {
    title: string;
    url: string;
    author?: string;
    description?: string;
    publishedTime?: string;
  };
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message: OffscreenMessage, sender, sendResponse) => {
  console.log('Offscreen received message:', message.type);

  if (message.type === 'CONVERT_HTML') {
    try {
      console.log('Converting HTML in offscreen document...');
      const converter = new MarkdownConverter(message.profile);
      const result = converter.convert(message.html, message.metadata);
      console.log('Conversion successful in offscreen');

      sendResponse({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Offscreen conversion error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return true; // Keep the message channel open for async response
  }

  return false;
});