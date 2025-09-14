/**
 * User preferences and settings types
 */

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

export const NamingPattern = {
  TAB_TITLE: 'tab_title',
  DOMAIN_TITLE: 'domain_title',
  CUSTOM_PREFIX: 'custom_prefix',
  TIMESTAMP: 'timestamp',
  MIXED: 'mixed',
} as const;

export type NamingPattern = (typeof NamingPattern)[keyof typeof NamingPattern];

export const Theme = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export type Theme = (typeof Theme)[keyof typeof Theme];

export interface KeyboardShortcuts {
  convertPage?: string;
  openPopup?: string;
  openOptions?: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultProfile: 'default',
  autoDownload: false,
  fileNamingPattern: 'tab_title',
  showNotifications: true,
  theme: 'system',
  advancedMode: false,
  debugMode: false,
};