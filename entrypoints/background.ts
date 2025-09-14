/**
 * Background service worker for Chrome Extension
 */

import { MessageFactory } from '~/types/messages';
import { setupContextMenu, handleMessage, handleContextMenuClick } from './background/handlers';
import { initializeMigration } from '~/lib/storage/migration';

export default defineBackground(() => {
  console.log('Background service worker started');

  // Initialize storage migration
  initializeMigration().catch(console.error);

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
});
