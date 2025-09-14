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
      case 'copy-selection':
        await handleSelectionConvert(profileId, 'copy');
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
 * Handle selection conversion via keyboard shortcut
 */
async function handleSelectionConvert(profileId: string, mode: 'copy' | 'download') {
  try {
    // Get the active tab
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error('No active tab found');
    }

    // Execute script to get selection
    const [result] = await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim() === '') {
          return null;
        }

        // Create a container with the selected content
        const container = document.createElement('div');
        for (let i = 0; i < selection.rangeCount; i++) {
          const range = selection.getRangeAt(i);
          container.appendChild(range.cloneContents());
        }

        return {
          html: container.innerHTML,
          text: selection.toString(),
          url: window.location.href,
          title: document.title,
        };
      },
    });

    if (!result?.result) {
      throw new Error('No text selected');
    }

    const selectionData = result.result;

    // Convert the selection
    const profile = await storage.getProfile(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Ensure offscreen document exists
    await ensureOffscreenDocument();

    // Send HTML to offscreen document for conversion
    const conversionResult = await browser.runtime.sendMessage({
      type: 'CONVERT_HTML',
      html: selectionData.html,
      profile,
      metadata: {
        title: `Selection from: ${selectionData.title}`,
        url: selectionData.url,
      },
    });

    if (!conversionResult || !conversionResult.success) {
      throw new Error(conversionResult?.error || 'Conversion failed');
    }

    const document = conversionResult.data;

    // Handle the conversion based on mode
    if (mode === 'copy') {
      await copyToClipboard(document.content);

      // Show notification
      const preferences = await storage.getPreferences();
      if (preferences.showNotifications) {
        browser.notifications.create({
          type: 'basic',
          iconUrl: '/icon/128.png',
          title: 'Copy as Markdown',
          message: 'Selection copied to clipboard!',
        });
      }
    } else if (mode === 'download') {
      await downloadMarkdown(document.content, `selection-${Date.now()}.md`);
    }
  } catch (error) {
    console.error('Selection convert failed:', error);
    browser.notifications.create({
      type: 'basic',
      iconUrl: '/icon/128.png',
      title: 'Conversion Failed',
      message: error instanceof Error ? error.message : 'Failed to convert selection',
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