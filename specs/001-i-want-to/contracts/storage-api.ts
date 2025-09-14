/**
 * Chrome Storage API Contracts
 * Version: 1.0.0
 *
 * Defines the storage schemas and operations for the extension
 */

// Storage Keys
export enum StorageKey {
  PREFERENCES = 'preferences',
  PROFILES = 'profiles',
  RECENT_CONVERSIONS = 'recentConversions',
  CACHE = 'cache',
  VERSION = 'version',
}

// Storage Areas
export enum StorageArea {
  SYNC = 'sync',
  LOCAL = 'local',
  SESSION = 'session',
}

// Main Storage Schema
export interface StorageSchema {
  // Sync Storage (cross-device, limited size)
  [StorageKey.PREFERENCES]: UserPreferences;
  [StorageKey.PROFILES]: ConversionProfile[];
  [StorageKey.VERSION]: string;

  // Local Storage (device-specific, larger size)
  [StorageKey.RECENT_CONVERSIONS]: RecentConversion[];
  [StorageKey.CACHE]?: ConversionCache;
}

// Storage Operations Interface
export interface StorageOperations {
  // Preferences
  getPreferences(): Promise<UserPreferences>;
  savePreferences(preferences: Partial<UserPreferences>): Promise<void>;
  resetPreferences(): Promise<void>;

  // Profiles
  getProfiles(): Promise<ConversionProfile[]>;
  getProfile(id: string): Promise<ConversionProfile | null>;
  saveProfile(profile: ConversionProfile): Promise<void>;
  updateProfile(id: string, updates: Partial<ConversionProfile>): Promise<void>;
  deleteProfile(id: string): Promise<void>;
  setDefaultProfile(id: string): Promise<void>;

  // Recent Conversions
  getRecentConversions(limit?: number): Promise<RecentConversion[]>;
  addRecentConversion(conversion: RecentConversion): Promise<void>;
  clearRecentConversions(): Promise<void>;

  // Cache
  getCachedContent(url: string): Promise<CachedContent | null>;
  setCachedContent(url: string, content: CachedContent): Promise<void>;
  clearCache(): Promise<void>;
  pruneExpiredCache(): Promise<void>;

  // Utilities
  getStorageSize(): Promise<StorageSize>;
  exportData(): Promise<ExportData>;
  importData(data: ExportData): Promise<void>;
  migrate(fromVersion: string, toVersion: string): Promise<void>;
}

// User Preferences Schema
export interface UserPreferences {
  defaultProfile: string;
  autoDownload: boolean;
  downloadPath?: string;
  fileNamingPattern: NamingPattern;
  showNotifications: boolean;
  theme: Theme;
  shortcuts?: KeyboardShortcuts;
  recentProfiles?: string[];
  advancedMode: boolean;
  debugMode: boolean;
}

export enum NamingPattern {
  TAB_TITLE = 'tab_title',
  DOMAIN_TITLE = 'domain_title',
  CUSTOM_PREFIX = 'custom_prefix',
  TIMESTAMP = 'timestamp',
  MIXED = 'mixed',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export interface KeyboardShortcuts {
  convertPage?: string;
  openPopup?: string;
  openOptions?: string;
}

// Conversion Profile Schema
export interface ConversionProfile {
  id: string;
  name: string;
  markdownFlavor: MarkdownFlavor;
  imageHandling: ImageHandling;
  linkHandling: LinkHandling;
  contentFilters: ContentFilters;
  formatting: FormattingOptions;
  isDefault: boolean;
  isBuiltIn: boolean;
  createdAt: number;
  updatedAt: number;
}

export enum MarkdownFlavor {
  COMMONMARK = 'commonmark',
  GFM = 'gfm',
  MINIMAL = 'minimal',
}

export interface ImageHandling {
  strategy: ImageStrategy;
  maxWidth?: number;
  lazyLoadHandling: boolean;
  fallbackAltText: string;
}

export enum ImageStrategy {
  LINK = 'link',
  SKIP = 'skip',
  DOWNLOAD = 'download',
  BASE64 = 'base64',
}

export interface LinkHandling {
  style: LinkStyle;
  openInNewTab: boolean;
  trackingRemoval: boolean;
  shortenUrls: boolean;
}

export enum LinkStyle {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
  REFERENCE = 'reference',
  REMOVE = 'remove',
}

export interface ContentFilters {
  includeCss: string[];
  excludeCss: string[];
  includeHidden: boolean;
  includeComments: boolean;
  includeScripts: boolean;
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

export enum BoldStyle {
  ASTERISKS = '**',
  UNDERSCORES = '__',
}

export enum ItalicStyle {
  ASTERISK = '*',
  UNDERSCORE = '_',
}

// Recent Conversions Schema
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

// Cache Schema
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

// Storage Utilities
export interface StorageSize {
  sync: {
    used: number;
    total: number;
    percentage: number;
  };
  local: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface ExportData {
  version: string;
  exportedAt: number;
  preferences: UserPreferences;
  profiles: ConversionProfile[];
  recentConversions?: RecentConversion[];
}

// Default Values
export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultProfile: 'default',
  autoDownload: false,
  fileNamingPattern: NamingPattern.TAB_TITLE,
  showNotifications: true,
  theme: Theme.SYSTEM,
  advancedMode: false,
  debugMode: false,
};

export const DEFAULT_PROFILE: ConversionProfile = {
  id: 'default',
  name: 'Default',
  markdownFlavor: MarkdownFlavor.COMMONMARK,
  imageHandling: {
    strategy: ImageStrategy.LINK,
    lazyLoadHandling: true,
    fallbackAltText: 'Image',
  },
  linkHandling: {
    style: LinkStyle.ABSOLUTE,
    openInNewTab: false,
    trackingRemoval: true,
    shortenUrls: false,
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
  formatting: {
    codeBlockSyntax: true,
    tableAlignment: true,
    listIndentation: 2,
    boldStyle: BoldStyle.ASTERISKS,
    italicStyle: ItalicStyle.ASTERISK,
    hrStyle: '---',
  },
  isDefault: true,
  isBuiltIn: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Storage Limits
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