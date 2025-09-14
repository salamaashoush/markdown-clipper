/**
 * Message handlers for background service worker
 */

import { MessageType, MessageFactory, type Message, type MessageResponse } from '~/types/messages';
import { storage } from '~/services/storage';
import type { ConvertPageRequest, ConvertTabsRequest } from '~/types/messages';

/**
 * Setup context menu items
 */
export function setupContextMenu() {
  browser.contextMenus.create({
    id: 'copy-as-markdown',
    title: 'Copy as Markdown',
    contexts: ['page', 'selection'],
  });

  browser.contextMenus.create({
    id: 'download-as-markdown',
    title: 'Download as Markdown',
    contexts: ['page', 'selection'],
  });

  browser.contextMenus.create({
    id: 'separator',
    type: 'separator',
    contexts: ['page'],
  });

  browser.contextMenus.create({
    id: 'copy-all-tabs',
    title: 'Copy All Tabs as Markdown',
    contexts: ['page'],
  });
}

/**
 * Handle messages from other parts of the extension
 */
export async function handleMessage(
  message: Message,
  _sender: Browser.runtime.MessageSender
): Promise<MessageResponse> {
  switch (message.type) {
    case MessageType.CONVERT_PAGE:
      return handleConvertPage(message.payload as ConvertPageRequest, message.id);

    case MessageType.CONVERT_TABS:
      return handleConvertTabs(message.payload as ConvertTabsRequest, message.id);

    case MessageType.GET_ALL_TABS:
      return handleGetAllTabs(message.id);

    case MessageType.GET_PREFERENCES:
      return handleGetPreferences(message.id);

    case MessageType.SAVE_PREFERENCES:
      return handleSavePreferences(message.payload, message.id);

    case MessageType.GET_PROFILES:
      return handleGetProfiles(message.id);

    case MessageType.SAVE_PROFILE:
      return handleSaveProfile(message.payload, message.id);

    case MessageType.DELETE_PROFILE:
      return handleDeleteProfile(message.payload, message.id);

    default:
      return MessageFactory.createError(
        message.id,
        'UNKNOWN_MESSAGE_TYPE',
        `Unknown message type: ${message.type}`
      );
  }
}

/**
 * Create offscreen document if it doesn't exist
 */
async function ensureOffscreenDocument() {
  try {
    // Check if we're using Chrome/Edge (which support offscreen API)
    if (typeof browser !== 'undefined' && browser.offscreen) {
      // Check if offscreen document already exists
      const existingContexts = await browser.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
      });

      if (existingContexts.length > 0) {
        console.log('Offscreen document already exists');
        return;
      }

      // Create offscreen document
      console.log('Creating offscreen document...');
      await browser.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['DOM_PARSER'],
        justification: 'Parse HTML and convert to Markdown',
      });
      console.log('Offscreen document created');

      // Give it a moment to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else {
      console.log('Offscreen API not supported, will convert inline');
    }
  } catch (error) {
    console.error('Error ensuring offscreen document:', error);
  }
}

/**
 * Handle page conversion request
 */
async function handleConvertPage(
  request: ConvertPageRequest,
  messageId: string
): Promise<MessageResponse> {
  try {
    // Get the active tab
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    console.log('Active tab:', tab);

    if (!tab || !tab.id) {
      console.error('No active tab found');
      return MessageFactory.createError(messageId, 'NO_ACTIVE_TAB', 'No active tab found');
    }

    console.log('Tab URL:', tab.url);

    // Check for restricted URLs
    const urlCheck = isRestrictedUrl(tab.url || '');
    if (urlCheck.restricted) {
      console.error('URL is restricted:', tab.url, 'Reason:', urlCheck.reason);
      return MessageFactory.createError(
        messageId,
        'RESTRICTED_PAGE',
        urlCheck.reason || 'Cannot convert this page due to browser restrictions'
      );
    }

    // Get the conversion profile
    const profile = await storage.getProfile(request.profileId);
    if (!profile) {
      return MessageFactory.createError(
        messageId,
        'PROFILE_NOT_FOUND',
        `Profile ${request.profileId} not found`
      );
    }

    // Extract content from the page
    const content = await extractPageContent(tab.id);

    // Ensure offscreen document exists
    await ensureOffscreenDocument();

    // Send HTML to offscreen document for conversion
    console.log('Sending message to offscreen document...');
    const conversionResult = await browser.runtime.sendMessage({
      type: 'CONVERT_HTML',
      html: content.html,
      profile,
      metadata: {
        title: content.title,
        url: content.url,
        ...content.metadata,
      },
    });

    console.log('Conversion result:', conversionResult);

    if (!conversionResult || !conversionResult.success) {
      throw new Error(conversionResult?.error || 'Conversion failed - offscreen document may not be responding');
    }

    const document = conversionResult.data;

    // Handle the conversion based on mode
    if (request.mode === 'copy' || request.mode === 'both') {
      await copyToClipboard(document.content);
    }

    if (request.mode === 'download' || request.mode === 'both') {
      const fileName = request.customFileName || document.fileName;
      await downloadMarkdown(document.content, fileName);
    }

    // Record the conversion
    await storage.addRecentConversion({
      id: crypto.randomUUID(),
      url: content.url,
      title: content.title,
      timestamp: Date.now(),
      profileUsed: profile.id,
      sizeBytes: document.sizeBytes,
      duration: 0,
      success: true,
    });

    return MessageFactory.createResponse(messageId, {
      markdown: document.content,
      fileName: document.fileName,
      sizeBytes: document.sizeBytes,
      metadata: document.metadata,
    });
  } catch (error) {
    console.error('Convert page error:', error);
    return MessageFactory.createError(
      messageId,
      'CONVERSION_FAILED',
      error instanceof Error ? error.message : 'Conversion failed'
    );
  }
}

/**
 * Handle multiple tabs conversion
 */
async function handleConvertTabs(
  request: ConvertTabsRequest,
  messageId: string
): Promise<MessageResponse> {
  try {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Get the specified tabs
    const tabs = await browser.tabs.query({});
    const selectedTabs = tabs.filter((tab) => request.tabIds.includes(String(tab.id)));

    if (selectedTabs.length === 0) {
      return MessageFactory.createError(messageId, 'NO_TABS_SELECTED', 'No tabs selected');
    }

    // Get the conversion profile
    const profile = await storage.getProfile(request.profileId);
    if (!profile) {
      return MessageFactory.createError(
        messageId,
        'PROFILE_NOT_FOUND',
        `Profile ${request.profileId} not found`
      );
    }

    // Ensure offscreen document exists
    await ensureOffscreenDocument();

    const documents = [];

    // Process each tab
    for (const tab of selectedTabs) {
      const urlCheck = isRestrictedUrl(tab.url || '');
      if (!tab.id || urlCheck.restricted) {
        results.push({
          tabId: String(tab.id),
          success: false,
          error: {
            code: 'RESTRICTED_PAGE',
            message: urlCheck.reason || 'Cannot convert restricted page',
          },
        });
        failureCount++;
        continue;
      }

      try {
        const content = await extractPageContent(tab.id);

        // Send HTML to offscreen document for conversion
        const conversionResult = await browser.runtime.sendMessage({
          type: 'CONVERT_HTML',
          html: content.html,
          profile,
          metadata: {
            title: content.title,
            url: content.url,
            ...content.metadata,
          },
        });

        if (!conversionResult || !conversionResult.success) {
          throw new Error(conversionResult?.error || 'Conversion failed');
        }

        const document = conversionResult.data;
        documents.push(document);
        results.push({
          tabId: String(tab.id),
          success: true,
          markdown: document.content,
          fileName: document.fileName,
        });
        successCount++;
      } catch (error) {
        results.push({
          tabId: String(tab.id),
          success: false,
          error: {
            code: 'EXTRACTION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to extract content',
          },
        });
        failureCount++;
      }
    }

    // Handle batch mode
    if (request.batchMode === 'combined') {
      const combinedMarkdown = documents.map((doc) => doc.content).join('\n\n---\n\n');
      const combinedFileName = 'combined-pages.md';

      if (request.mode === 'copy' || request.mode === 'both') {
        await copyToClipboard(combinedMarkdown);
      }
      if (request.mode === 'download' || request.mode === 'both') {
        await downloadMarkdown(combinedMarkdown, combinedFileName);
      }

      return MessageFactory.createResponse(messageId, {
        markdown: combinedMarkdown,
        combinedFileName,
        successCount,
        failureCount,
      });
    } else {
      // Separate files
      for (const document of documents) {
        if (request.mode === 'download' || request.mode === 'both') {
          await downloadMarkdown(document.content, document.fileName);
        }
      }

      return MessageFactory.createResponse(messageId, {
        results,
        successCount,
        failureCount,
      });
    }
  } catch (error) {
    console.error('Convert tabs error:', error);
    return MessageFactory.createError(
      messageId,
      'BATCH_CONVERSION_FAILED',
      error instanceof Error ? error.message : 'Batch conversion failed'
    );
  }
}

/**
 * Get all tabs
 */
async function handleGetAllTabs(messageId: string): Promise<MessageResponse> {
  try {
    const tabs = await browser.tabs.query({ currentWindow: true });
    const tabInfo = tabs.map((tab) => ({
      id: String(tab.id),
      title: tab.title || 'Untitled',
      url: tab.url || '',
      faviconUrl: tab.favIconUrl,
      isActive: tab.active || false,
      isSelected: false,
      index: tab.index,
      status: tab.status as 'loading' | 'complete',
      audible: tab.audible,
      pinned: tab.pinned,
    }));

    return MessageFactory.createResponse(messageId, { tabs: tabInfo });
  } catch (error) {
    return MessageFactory.createError(messageId, 'TABS_QUERY_FAILED', 'Failed to query tabs');
  }
}

/**
 * Get preferences
 */
async function handleGetPreferences(messageId: string): Promise<MessageResponse> {
  try {
    const preferences = await storage.getPreferences();
    return MessageFactory.createResponse(messageId, { preferences });
  } catch (error) {
    return MessageFactory.createError(
      messageId,
      'PREFERENCES_LOAD_FAILED',
      'Failed to load preferences'
    );
  }
}

/**
 * Save preferences
 */
async function handleSavePreferences(
  preferences: any,
  messageId: string
): Promise<MessageResponse> {
  try {
    await storage.savePreferences(preferences);
    return MessageFactory.createResponse(messageId, { success: true });
  } catch (error) {
    return MessageFactory.createError(
      messageId,
      'PREFERENCES_SAVE_FAILED',
      error instanceof Error ? error.message : 'Failed to save preferences'
    );
  }
}

/**
 * Get profiles
 */
async function handleGetProfiles(messageId: string): Promise<MessageResponse> {
  try {
    const profiles = await storage.getProfiles();
    return MessageFactory.createResponse(messageId, { profiles });
  } catch (error) {
    return MessageFactory.createError(messageId, 'PROFILES_LOAD_FAILED', 'Failed to load profiles');
  }
}

/**
 * Save profile
 */
async function handleSaveProfile(profile: any, messageId: string): Promise<MessageResponse> {
  try {
    await storage.saveProfile(profile);
    return MessageFactory.createResponse(messageId, { success: true });
  } catch (error) {
    return MessageFactory.createError(
      messageId,
      'PROFILE_SAVE_FAILED',
      error instanceof Error ? error.message : 'Failed to save profile'
    );
  }
}

/**
 * Delete profile
 */
async function handleDeleteProfile(
  payload: { profileId: string },
  messageId: string
): Promise<MessageResponse> {
  try {
    await storage.deleteProfile(payload.profileId);
    return MessageFactory.createResponse(messageId, { success: true });
  } catch (error) {
    return MessageFactory.createError(
      messageId,
      'PROFILE_DELETE_FAILED',
      error instanceof Error ? error.message : 'Failed to delete profile'
    );
  }
}

/**
 * Handle context menu click
 */
export async function handleContextMenuClick(
  info: Browser.contextMenus.OnClickData,
  tab?: Browser.tabs.Tab
) {
  console.log('Context menu clicked:', info.menuItemId, tab);

  // Get the current tab if not provided
  if (!tab || !tab.id) {
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id) {
      console.error('No active tab found');
      return;
    }
    tab = activeTab;
  }

  const preferences = await storage.getPreferences();
  const profileId = preferences.defaultProfile;

  const request: ConvertPageRequest = {
    profileId,
    mode: info.menuItemId === 'download-as-markdown' ? 'download' : 'copy',
    includeMetadata: true,
  };

  const message = MessageFactory.create(MessageType.CONVERT_PAGE, request, {
    context: 'background',
  });

  await handleConvertPage(request, message.id);
}

/**
 * Extract content from a page
 */
async function extractPageContent(tabId: number) {
  try {
    // Try to send message to content script
    const response = await browser.tabs.sendMessage(tabId, {
      type: MessageType.EXTRACT_CONTENT,
      payload: {
        includeHidden: false,
        waitForDynamic: true,
        timeout: 3000,
      },
    });
    return response;
  } catch (error) {
    console.error('Failed to communicate with content script:', error);
    // Content script might not be injected, try to inject it
    try {
      await browser.scripting.executeScript({
        target: { tabId },
        files: ['content-scripts/content.js'],
      });

      // Try again after injection
      const response = await browser.tabs.sendMessage(tabId, {
        type: MessageType.EXTRACT_CONTENT,
        payload: {
          includeHidden: false,
          waitForDynamic: true,
          timeout: 3000,
        },
      });
      return response;
    } catch (injectError) {
      console.error('Failed to inject content script:', injectError);
      // Fallback: get the page content directly
      const [result] = await browser.scripting.executeScript({
        target: { tabId },
        func: () => {
          return {
            html: document.body.innerHTML,
            title: document.title,
            url: window.location.href,
            metadata: {
              author: document.querySelector('meta[name="author"]')?.getAttribute('content'),
              description: document
                .querySelector('meta[name="description"]')
                ?.getAttribute('content'),
            },
            isLoading: false,
          };
        },
      });
      return result.result;
    }
  }
}

/**
 * Check if URL is restricted and get the reason
 */
function isRestrictedUrl(url: string): { restricted: boolean; reason?: string } {
  // Handle empty or undefined URLs
  if (!url) {
    console.log('URL is empty or undefined');
    return { restricted: true, reason: 'No URL provided' };
  }

  // Check for about:blank specifically
  if (url === 'about:blank') {
    console.log('URL is about:blank - new tab or loading page');
    return { restricted: true, reason: 'Please navigate to a web page first' };
  }

  // Check for new tab pages
  if (url === 'chrome://newtab/' || url === 'edge://newtab/') {
    console.log('URL is new tab page');
    return { restricted: true, reason: 'Cannot convert new tab page' };
  }

  const restricted = [
    { prefix: 'chrome://', reason: 'Cannot convert Chrome system pages' },
    { prefix: 'chrome-extension://', reason: 'Cannot convert extension pages' },
    { prefix: 'edge://', reason: 'Cannot convert Edge system pages' },
    { prefix: 'about:', reason: 'Cannot convert browser internal pages' },
    { prefix: 'file://', reason: 'Cannot convert local files' },
    { prefix: 'view-source:', reason: 'Cannot convert source view pages' },
    { prefix: 'data:', reason: 'Cannot convert data URLs' },
    { prefix: 'javascript:', reason: 'Cannot convert JavaScript URLs' },
    { prefix: 'moz-extension://', reason: 'Cannot convert extension pages' },
  ];

  for (const { prefix, reason } of restricted) {
    if (url.startsWith(prefix)) {
      console.log(`Restricted URL detected: ${url} - ${reason}`);
      return { restricted: true, reason };
    }
  }

  // Check if it's a valid URL
  try {
    const urlObj = new URL(url);
    if (!urlObj.protocol.startsWith('http')) {
      console.log(`Non-HTTP URL: ${url}`);
      return { restricted: true, reason: 'Only HTTP and HTTPS pages can be converted' };
    }
  } catch (e) {
    console.log(`Invalid URL: ${url}`);
    return { restricted: true, reason: 'Invalid URL format' };
  }

  console.log(`URL is allowed: ${url}`);
  return { restricted: false };
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<void> {
  // Use scripting API to copy to clipboard
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

/**
 * Download markdown file
 */
async function downloadMarkdown(content: string, fileName: string): Promise<void> {
  console.log('Downloading file:', fileName);

  // Convert content to base64 data URL (service workers don't support createObjectURL)
  const base64 = btoa(unescape(encodeURIComponent(content)));
  const dataUrl = `data:text/markdown;base64,${base64}`;

  try {
    await browser.downloads.download({
      url: dataUrl,
      filename: fileName,
      saveAs: false,
    });
    console.log('Download initiated successfully');
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}
