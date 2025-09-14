/**
 * Chrome Extension Message API Contracts
 * Version: 1.0.0
 *
 * Defines the message passing contracts between different contexts
 * (popup, content script, background service worker, options page)
 */

// Message Types
export enum MessageType {
  // Conversion Operations
  CONVERT_PAGE = 'CONVERT_PAGE',
  CONVERT_TABS = 'CONVERT_TABS',

  // Tab Management
  GET_ALL_TABS = 'GET_ALL_TABS',
  GET_TAB_INFO = 'GET_TAB_INFO',

  // Storage Operations
  GET_PREFERENCES = 'GET_PREFERENCES',
  SAVE_PREFERENCES = 'SAVE_PREFERENCES',
  GET_PROFILES = 'GET_PROFILES',
  SAVE_PROFILE = 'SAVE_PROFILE',
  DELETE_PROFILE = 'DELETE_PROFILE',

  // Content Extraction
  EXTRACT_CONTENT = 'EXTRACT_CONTENT',
  CHECK_READY_STATE = 'CHECK_READY_STATE',

  // Results
  CONVERSION_COMPLETE = 'CONVERSION_COMPLETE',
  CONVERSION_ERROR = 'CONVERSION_ERROR',
}

// Base Message Structure
export interface Message<T = any> {
  type: MessageType;
  payload: T;
  sender: MessageSender;
  timestamp: number;
  id: string; // For request-response correlation
}

export interface MessageSender {
  context: 'popup' | 'content' | 'background' | 'options';
  tabId?: number;
  frameId?: number;
}

// Response Structure
export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  messageId: string; // Correlates to request
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}

// Conversion Message Payloads
export interface ConvertPageRequest {
  profileId: string;
  mode: 'copy' | 'download' | 'both';
  includeMetadata: boolean;
  customFileName?: string;
}

export interface ConvertTabsRequest {
  tabIds: string[];
  profileId: string;
  mode: 'copy' | 'download' | 'both';
  batchMode: 'separate' | 'combined' | 'zip';
  includeMetadata: boolean;
}

export interface ConvertPageResponse {
  markdown: string;
  fileName: string;
  sizeBytes: number;
  metadata: DocumentMetadata;
}

// Tab Management Payloads
export interface GetAllTabsRequest {
  currentWindow?: boolean;
  includeAudible?: boolean;
  includePinned?: boolean;
}

export interface GetAllTabsResponse {
  tabs: TabInfo[];
}

export interface GetTabInfoRequest {
  tabId: string;
}

export interface GetTabInfoResponse {
  tab: TabInfo;
}

// Storage Payloads
export interface GetPreferencesResponse {
  preferences: UserPreferences;
}

export interface SavePreferencesRequest {
  preferences: Partial<UserPreferences>;
}

export interface GetProfilesResponse {
  profiles: ConversionProfile[];
}

export interface SaveProfileRequest {
  profile: ConversionProfile;
}

export interface DeleteProfileRequest {
  profileId: string;
}

// Content Extraction Payloads
export interface ExtractContentRequest {
  selectors?: string[];
  excludeSelectors?: string[];
  includeHidden: boolean;
  waitForDynamic: boolean;
  timeout?: number;
}

export interface ExtractContentResponse {
  html: string;
  title: string;
  url: string;
  metadata: PageMetadata;
}

export interface PageMetadata {
  author?: string;
  description?: string;
  publishDate?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

// Type Guards
export function isMessage(obj: any): obj is Message {
  return obj &&
    typeof obj.type === 'string' &&
    obj.payload !== undefined &&
    typeof obj.sender === 'object' &&
    typeof obj.timestamp === 'number' &&
    typeof obj.id === 'string';
}

export function isMessageResponse(obj: any): obj is MessageResponse {
  return obj &&
    typeof obj.success === 'boolean' &&
    typeof obj.messageId === 'string';
}

// Message Factory
export class MessageFactory {
  static create<T>(
    type: MessageType,
    payload: T,
    sender: MessageSender
  ): Message<T> {
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

// Imported Types (from data-model.md)
interface UserPreferences {
  defaultProfile: string;
  autoDownload: boolean;
  downloadPath?: string;
  fileNamingPattern: string;
  showNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

interface ConversionProfile {
  id: string;
  name: string;
  markdownFlavor: string;
  imageHandling: any;
  linkHandling: any;
  contentFilters: any;
  formatting: any;
  isDefault: boolean;
}

interface TabInfo {
  id: string;
  title: string;
  url: string;
  faviconUrl?: string;
  isActive: boolean;
  isSelected: boolean;
  index: number;
}

interface DocumentMetadata {
  title: string;
  url: string;
  author?: string;
  description?: string;
  convertedAt: string;
  converterVersion: string;
}