import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Message, ConvertTabsRequest } from '~/types/messages';
import { MessageType } from '~/types/messages';

describe('Message API Contract - CONVERT_TABS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send CONVERT_TABS message for multiple tabs', async () => {
    const request: ConvertTabsRequest = {
      tabIds: ['tab1', 'tab2', 'tab3'],
      profileId: 'default',
      mode: 'download',
      batchMode: 'separate',
      includeMetadata: true,
    };

    const message: Message<ConvertTabsRequest> = {
      type: MessageType.CONVERT_TABS,
      payload: request,
      sender: {
        context: 'popup',
      },
      timestamp: Date.now(),
      id: 'test-batch-message',
    };

    const response = await browser.runtime.sendMessage(message);

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('results');
    expect(response.data.results).toHaveLength(3);
  });

  it('should handle combined batch mode', async () => {
    const request: ConvertTabsRequest = {
      tabIds: ['tab1', 'tab2'],
      profileId: 'default',
      mode: 'copy',
      batchMode: 'combined',
      includeMetadata: false,
    };

    const message: Message<ConvertTabsRequest> = {
      type: MessageType.CONVERT_TABS,
      payload: request,
      sender: {
        context: 'popup',
      },
      timestamp: Date.now(),
      id: 'test-combined-message',
    };

    const response = await browser.runtime.sendMessage(message);

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('markdown');
    expect(response.data).toHaveProperty('combinedFileName');
  });

  it('should handle ZIP batch mode', async () => {
    const request: ConvertTabsRequest = {
      tabIds: ['tab1', 'tab2', 'tab3'],
      profileId: 'default',
      mode: 'download',
      batchMode: 'zip',
      includeMetadata: true,
    };

    const message: Message<ConvertTabsRequest> = {
      type: MessageType.CONVERT_TABS,
      payload: request,
      sender: {
        context: 'popup',
      },
      timestamp: Date.now(),
      id: 'test-zip-message',
    };

    const response = await browser.runtime.sendMessage(message);

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('zipFileName');
    expect(response.data).toHaveProperty('fileCount');
    expect(response.data.fileCount).toBe(3);
  });

  it('should handle empty tab list error', async () => {
    const request: ConvertTabsRequest = {
      tabIds: [],
      profileId: 'default',
      mode: 'download',
      batchMode: 'separate',
      includeMetadata: true,
    };

    const message: Message<ConvertTabsRequest> = {
      type: MessageType.CONVERT_TABS,
      payload: request,
      sender: {
        context: 'popup',
      },
      timestamp: Date.now(),
      id: 'test-empty-tabs',
    };

    const response = await browser.runtime.sendMessage(message);

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error.code).toBe('NO_TABS_SELECTED');
  });

  it('should handle partial failures in batch processing', async () => {
    const request: ConvertTabsRequest = {
      tabIds: ['valid-tab', 'restricted-tab', 'valid-tab-2'],
      profileId: 'default',
      mode: 'download',
      batchMode: 'separate',
      includeMetadata: true,
    };

    const message: Message<ConvertTabsRequest> = {
      type: MessageType.CONVERT_TABS,
      payload: request,
      sender: {
        context: 'popup',
      },
      timestamp: Date.now(),
      id: 'test-partial-failure',
    };

    const response = await browser.runtime.sendMessage(message);

    expect(response.success).toBe(true);
    expect(response.data.results).toHaveLength(3);
    expect(response.data.results[0].success).toBe(true);
    expect(response.data.results[1].success).toBe(false);
    expect(response.data.results[2].success).toBe(true);
    expect(response.data.successCount).toBe(2);
    expect(response.data.failureCount).toBe(1);
  });
});