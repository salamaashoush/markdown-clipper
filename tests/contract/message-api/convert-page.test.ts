import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Message, ConvertPageRequest } from '~/types/messages';
import { MessageType } from '~/types/messages';

describe('Message API Contract - CONVERT_PAGE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send CONVERT_PAGE message with correct payload structure', async () => {
    const request: ConvertPageRequest = {
      profileId: 'default',
      mode: 'copy',
      includeMetadata: true,
    };

    const message: Message<ConvertPageRequest> = {
      type: MessageType.CONVERT_PAGE,
      payload: request,
      sender: {
        context: 'popup',
      },
      timestamp: Date.now(),
      id: 'test-message-id',
    };

    // This will fail until we implement the message handler
    const response = await browser.runtime.sendMessage(message);

    expect(response).toBeDefined();
    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('markdown');
    expect(response.data).toHaveProperty('fileName');
    expect(response.data).toHaveProperty('sizeBytes');
    expect(response.data).toHaveProperty('metadata');
  });

  it('should handle download mode correctly', async () => {
    const request: ConvertPageRequest = {
      profileId: 'default',
      mode: 'download',
      includeMetadata: false,
      customFileName: 'my-page.md',
    };

    const message: Message<ConvertPageRequest> = {
      type: MessageType.CONVERT_PAGE,
      payload: request,
      sender: {
        context: 'popup',
      },
      timestamp: Date.now(),
      id: 'test-message-id-2',
    };

    const response = await browser.runtime.sendMessage(message);

    expect(response.success).toBe(true);
    expect(response.data.fileName).toBe('my-page.md');
  });

  it('should handle both copy and download mode', async () => {
    const request: ConvertPageRequest = {
      profileId: 'default',
      mode: 'both',
      includeMetadata: true,
    };

    const message: Message<ConvertPageRequest> = {
      type: MessageType.CONVERT_PAGE,
      payload: request,
      sender: {
        context: 'popup',
      },
      timestamp: Date.now(),
      id: 'test-message-id-3',
    };

    const response = await browser.runtime.sendMessage(message);

    expect(response.success).toBe(true);
    expect(response.data).toHaveProperty('markdown');
    expect(response.data).toHaveProperty('fileName');
  });

  it('should return error for invalid profile ID', async () => {
    const request: ConvertPageRequest = {
      profileId: 'non-existent-profile',
      mode: 'copy',
      includeMetadata: true,
    };

    const message: Message<ConvertPageRequest> = {
      type: MessageType.CONVERT_PAGE,
      payload: request,
      sender: {
        context: 'popup',
      },
      timestamp: Date.now(),
      id: 'test-message-id-4',
    };

    const response = await browser.runtime.sendMessage(message);

    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error.code).toBe('PROFILE_NOT_FOUND');
  });

  it('should validate message structure', () => {
    const validMessage = {
      type: MessageType.CONVERT_PAGE,
      payload: {
        profileId: 'default',
        mode: 'copy',
        includeMetadata: true,
      },
      sender: {
        context: 'popup',
      },
      timestamp: Date.now(),
      id: 'test-id',
    };

    // This will fail until we implement the isMessage type guard
    expect(() => {
      if (!isMessage(validMessage)) {
        throw new Error('Invalid message structure');
      }
    }).not.toThrow();
  });
});

// Type guard that validates message structure
function isMessage(obj: any): obj is Message {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.type === 'string' &&
    'payload' in obj &&
    'sender' in obj &&
    typeof obj.sender === 'object' &&
    typeof obj.sender.context === 'string' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.id === 'string'
  );
}