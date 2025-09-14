/**
 * Message passing types for Chrome Extension communication
 */

import type { DocumentMetadata } from './conversion';

export const MessageType = {
  // Conversion Operations
  CONVERT_PAGE: 'CONVERT_PAGE',
  CONVERT_TABS: 'CONVERT_TABS',

  // Tab Management
  GET_ALL_TABS: 'GET_ALL_TABS',
  GET_TAB_INFO: 'GET_TAB_INFO',

  // Storage Operations
  GET_PREFERENCES: 'GET_PREFERENCES',
  SAVE_PREFERENCES: 'SAVE_PREFERENCES',
  GET_PROFILES: 'GET_PROFILES',
  SAVE_PROFILE: 'SAVE_PROFILE',
  DELETE_PROFILE: 'DELETE_PROFILE',

  // Content Extraction
  EXTRACT_CONTENT: 'EXTRACT_CONTENT',
  CHECK_READY_STATE: 'CHECK_READY_STATE',

  // Results
  CONVERSION_COMPLETE: 'CONVERSION_COMPLETE',
  CONVERSION_ERROR: 'CONVERSION_ERROR',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface Message<T = any> {
  type: MessageType;
  payload: T;
  sender: MessageSender;
  timestamp: number;
  id: string;
}

export interface MessageSender {
  context: 'popup' | 'content' | 'background' | 'options';
  tabId?: number;
  frameId?: number;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  messageId: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}

// Conversion Message Types
export interface ConvertPageRequest {
  profileId: string;
  mode: 'copy' | 'download' | 'both';
  includeMetadata: boolean;
  customFileName?: string;
}

export interface ConvertPageResponse {
  markdown: string;
  fileName: string;
  sizeBytes: number;
  metadata: DocumentMetadata;
}

export interface ConvertTabsRequest {
  tabIds: string[];
  profileId: string;
  mode: 'copy' | 'download' | 'both';
  batchMode: 'separate' | 'combined' | 'zip';
  includeMetadata: boolean;
}

export interface ConvertTabsResponse {
  results?: TabConversionResult[];
  markdown?: string;
  combinedFileName?: string;
  zipFileName?: string;
  fileCount?: number;
  successCount?: number;
  failureCount?: number;
}

export interface TabConversionResult {
  tabId: string;
  success: boolean;
  markdown?: string;
  fileName?: string;
  error?: ErrorResponse;
}

// DocumentMetadata is exported from ./conversion to avoid duplication

// Tab Management Types
export interface GetAllTabsRequest {
  currentWindow?: boolean;
  includeAudible?: boolean;
  includePinned?: boolean;
}

export interface GetAllTabsResponse {
  tabs: TabInfo[];
}

export interface TabInfo {
  id: string;
  title: string;
  url: string;
  faviconUrl?: string;
  isActive: boolean;
  isSelected: boolean;
  index: number;
  status: 'loading' | 'complete';
  audible?: boolean;
  pinned?: boolean;
}

// Type Guards
export function isMessage(obj: any): obj is Message {
  return (
    obj &&
    typeof obj.type === 'string' &&
    obj.payload !== undefined &&
    typeof obj.sender === 'object' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.id === 'string'
  );
}

export function isMessageResponse(obj: any): obj is MessageResponse {
  return obj && typeof obj.success === 'boolean' && typeof obj.messageId === 'string';
}

// Message Factory
export class MessageFactory {
  static create<T>(type: MessageType, payload: T, sender: MessageSender): Message<T> {
    return {
      type,
      payload,
      sender,
      timestamp: Date.now(),
      id: crypto.randomUUID(),
    };
  }

  static createResponse<T>(
    messageId: string,
    data?: T,
    error?: ErrorResponse
  ): MessageResponse<T> {
    return {
      success: !error,
      data,
      error,
      messageId,
    };
  }

  static createError(
    messageId: string,
    code: string,
    message: string,
    details?: any
  ): MessageResponse {
    return {
      success: false,
      error: { code, message, details },
      messageId,
    };
  }
}