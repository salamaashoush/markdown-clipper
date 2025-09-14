/**
 * Conversion and document types
 */

export interface ConversionOptions {
  profileId: string;
  tabIds: string[];
  mode: ConversionMode;
  includeMetadata: boolean;
  customFileName?: string;
  batchMode?: BatchMode;
  waitForDynamic?: boolean;
}

export const ConversionMode = {
  COPY: 'copy',
  DOWNLOAD: 'download',
  BOTH: 'both',
} as const;

export type ConversionMode = (typeof ConversionMode)[keyof typeof ConversionMode];

export const BatchMode = {
  SEPARATE: 'separate',
  COMBINED: 'combined',
  ZIP: 'zip',
} as const;

export type BatchMode = (typeof BatchMode)[keyof typeof BatchMode];

export interface MarkdownDocument {
  content: string;
  metadata: DocumentMetadata;
  fileName: string;
  sizeBytes: number;
  checksum?: string;
  generatedAt: number;
}

export interface DocumentMetadata {
  title: string;
  url: string;
  author?: string;
  description?: string;
  publishDate?: string;
  convertedAt: string;
  converterVersion: string;
  profile: string;
  wordCount?: number;
  imageCount?: number;
  linkCount?: number;
}

export interface ExtractedContent {
  html: string;
  title: string;
  url: string;
  metadata: PageMetadata;
  isLoading?: boolean;
}

export interface PageMetadata {
  author?: string;
  description?: string;
  publishDate?: string;
  ogImage?: string;
  canonicalUrl?: string;
  keywords?: string[];
}

export interface ConversionResult {
  success: boolean;
  markdown?: string;
  fileName?: string;
  error?: ConversionError;
}

export interface ConversionError {
  code: string;
  message: string;
  details?: unknown;
}

export const ERROR_CODES = {
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  NO_TABS_SELECTED: 'NO_TABS_SELECTED',
  RESTRICTED_PAGE: 'RESTRICTED_PAGE',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  CONVERSION_FAILED: 'CONVERSION_FAILED',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  INVALID_PREFERENCES: 'INVALID_PREFERENCES',
} as const;