/**
 * Background service worker for Chrome Extension
 */

import { MessageFactory, MessageType } from '~/types/messages';
import type { ConvertPageRequest } from '~/types/messages';
import { setupContextMenu, handleMessage, handleContextMenuClick } from './background/handlers';
import { storage } from '~/services/storage';

export default defineBackground(() => {
  console.log('Background service worker started');

  // Setup context menu on installation
  setupContextMenu();

  // Handle messages from popup, content scripts, and options page
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
      .then(sendResponse)
      .catch((error) => {
        sendResponse(
          MessageFactory.createError(message.id || 'unknown', 'INTERNAL_ERROR', error.message)
        );
      });

    // Return true to indicate async response
    return true;
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(handleContextMenuClick);

  // Handle keyboard shortcuts
  browser.commands.onCommand.addListener(async (command) => {
    console.log('Command received:', command);

    const preferences = await storage.getPreferences();
    const profileId = preferences.defaultProfile;

    switch (command) {
      case 'copy-current-page':
        await handleQuickConvert(profileId, 'copy');
        break;
      case 'download-current-page':
        await handleQuickConvert(profileId, 'download');
        break;
    }
  });
});

/**
 * Handle quick conversion via keyboard shortcut
 */
async function handleQuickConvert(profileId: string, mode: 'copy' | 'download') {
  try {
    const request: ConvertPageRequest = {
      profileId,
      mode,
      includeMetadata: true,
    };

    const message = MessageFactory.create(MessageType.CONVERT_PAGE, request, {
      context: 'background',
    });

    // Send to the handler
    const response = await handleMessage(message, {} as any);

    if (response.success) {
      // Show notification
      const preferences = await storage.getPreferences();
      if (preferences.showNotifications) {
        browser.notifications.create({
          type: 'basic',
          iconUrl: '/icon/128.png',
          title: 'Copy as Markdown',
          message: mode === 'copy' ? 'Page copied to clipboard!' : 'Page downloaded as markdown!',
        });
      }
    }
  } catch (error) {
    console.error('Quick convert failed:', error);
    browser.notifications.create({
      type: 'basic',
      iconUrl: '/icon/128.png',
      title: 'Conversion Failed',
      message: error instanceof Error ? error.message : 'Failed to convert page',
    });
  }
}

/**
 * Reusable helper functions
 */
async function ensureOffscreenDocument() {
  try {
    if (typeof browser !== 'undefined' && browser.offscreen) {
      const existingContexts = await browser.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
      });

      if (existingContexts.length > 0) {
        return;
      }

      await browser.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['DOM_PARSER'],
        justification: 'Parse HTML and convert to Markdown',
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('Error ensuring offscreen document:', error);
  }
}

async function copyToClipboard(text: string): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: (text: string) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      },
      args: [text],
    });
  }
}

async function downloadMarkdown(content: string, fileName: string): Promise<void> {
  const base64 = btoa(unescape(encodeURIComponent(content)));
  const dataUrl = `data:text/markdown;base64,${base64}`;

  await browser.downloads.download({
    url: dataUrl,
    filename: fileName,
    saveAs: false,
  });
}