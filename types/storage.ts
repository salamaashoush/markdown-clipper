/**
 * Chrome Storage API types and schemas
 */

import TurndownService from 'turndown';

export const StorageKey = {
  PREFERENCES: 'preferences',
  PROFILES: 'profiles',
  RECENT_CONVERSIONS: 'recentConversions',
  CACHE: 'cache',
  VERSION: 'version',
} as const;

export type StorageKey = (typeof StorageKey)[keyof typeof StorageKey];

export const StorageArea = {
  SYNC: 'sync',
  LOCAL: 'local',
  SESSION: 'session',
} as const;

export type StorageArea = (typeof StorageArea)[keyof typeof StorageArea];

export { NamingPattern, Theme } from './preferences';

export interface StorageSchema {
  [StorageKey.PREFERENCES]: import('./preferences').UserPreferences;
  [StorageKey.PROFILES]: ConversionProfile[];
  [StorageKey.VERSION]: string;
  [StorageKey.RECENT_CONVERSIONS]: RecentConversion[];
  [StorageKey.CACHE]?: ConversionCache;
}

export interface ConversionProfile {
  id: string;
  name: string;
  markdownFlavor: MarkdownFlavor;
  imageHandling: ImageHandling;
  linkHandling: LinkHandling;
  contentFilters: ContentFilters;
  formatting: FormattingOptions;
  conversionOptions: TurndownService.Options;
  outputFormat: OutputFormat;
  isDefault: boolean;
  isBuiltIn: boolean;
  createdAt: number;
  updatedAt: number;
}

export const MarkdownFlavor = {
  COMMONMARK: 'commonmark',
  GFM: 'gfm',
  MINIMAL: 'minimal',
  GITHUB: 'github',
  GITLAB: 'gitlab',
  REDDIT: 'reddit',
  DISCORD: 'discord',
} as const;

export type MarkdownFlavor = (typeof MarkdownFlavor)[keyof typeof MarkdownFlavor];

export interface ImageHandling {
  strategy: ImageStrategy;
  maxWidth?: number;
  lazyLoadHandling: boolean;
  fallbackAltText: string;
}

export const ImageStrategy = {
  LINK: 'link',
  SKIP: 'skip',
  DOWNLOAD: 'download',
  BASE64: 'base64',
} as const;

export type ImageStrategy = (typeof ImageStrategy)[keyof typeof ImageStrategy];

export interface LinkHandling {
  style: LinkStyle;
  openInNewTab: boolean;
  shortenUrls: boolean;
  convertRelativeUrls: boolean;
  removeTrackingParams: boolean;
  followRedirects: boolean;
}

export const LinkStyle = {
  ABSOLUTE: 'absolute',
  RELATIVE: 'relative',
  REFERENCE: 'reference',
  REMOVE: 'remove',
} as const;

export type LinkStyle = (typeof LinkStyle)[keyof typeof LinkStyle];

export interface ContentFilters {
  includeCss: string[];
  excludeCss: string[];
  includeHidden: boolean;
  includeComments: boolean;
  includeScripts: boolean;
  includeIframes?: boolean;
  maxHeadingLevel: number;
  minContentLength: number;
}

export interface FormattingOptions {
  lineWidth?: number;
  codeBlockSyntax: boolean;
  tableAlignment: boolean;
  listIndentation: number;
  boldStyle: BoldStyle;
  italicStyle: ItalicStyle;
  hrStyle: string;
}

export const BoldStyle = {
  ASTERISKS: '**',
  UNDERSCORES: '__',
} as const;

export type BoldStyle = (typeof BoldStyle)[keyof typeof BoldStyle];

export const ItalicStyle = {
  ASTERISK: '*',
  UNDERSCORE: '_',
} as const;

export type ItalicStyle = (typeof ItalicStyle)[keyof typeof ItalicStyle];

export interface OutputFormat {
  addMetadata: boolean;
  addTableOfContents: boolean;
  addFootnotes: boolean;
  wrapLineLength: number;
  preserveNewlines: boolean;
}


export interface RecentConversion {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  profileUsed: string;
  sizeBytes: number;
  duration: number;
  success: boolean;
  errorMessage?: string;
}

export interface ConversionCache {
  [url: string]: CachedContent;
}

export interface CachedContent {
  content: string;
  title: string;
  timestamp: number;
  expires: number;
  hash: string;
  sizeBytes: number;
}

export const DEFAULT_PROFILE: ConversionProfile = {
  id: 'default',
  name: 'Default',
  markdownFlavor: 'commonmark',
  imageHandling: {
    strategy: 'link',
    lazyLoadHandling: true,
    fallbackAltText: 'Image',
  },
  linkHandling: {
    style: 'absolute',
    openInNewTab: false,
    shortenUrls: false,
    convertRelativeUrls: true,
    removeTrackingParams: true,
    followRedirects: false,
  },
  contentFilters: {
    includeCss: [],
    excludeCss: ['script', 'style', 'noscript'],
    includeHidden: false,
    includeComments: false,
    includeScripts: false,
    maxHeadingLevel: 6,
    minContentLength: 0,
  },
  conversionOptions: {
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
  },
  formatting: {
    codeBlockSyntax: true,
    tableAlignment: true,
    listIndentation: 2,
    boldStyle: '**',
    italicStyle: '*',
    hrStyle: '---',
  },
  outputFormat: {
    addMetadata: true,
    addTableOfContents: false,
    addFootnotes: true,
    wrapLineLength: 0,
    preserveNewlines: false,
  },
  isDefault: true,
  isBuiltIn: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const STORAGE_LIMITS = {
  sync: {
    QUOTA_BYTES: 102400, // 100KB
    QUOTA_BYTES_PER_ITEM: 8192, // 8KB
    MAX_ITEMS: 512,
  },
  local: {
    QUOTA_BYTES: 10485760, // 10MB
  },
};
