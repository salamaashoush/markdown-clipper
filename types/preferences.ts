/**
 * User preferences and settings types
 */

export interface UserPreferences {
  defaultProfile: string;
  autoDownload: boolean;
  downloadPath?: string;
  fileNamingPattern: NamingPattern;
  customNamingTemplate?: string;
  showNotifications: boolean;
  theme: Theme;
  shortcuts?: KeyboardShortcuts;
  recentProfiles?: string[];
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
  customNamingTemplate: '{title}_{date}',
  showNotifications: true,
  theme: 'system',
};

// Template variables for custom file naming
export const TEMPLATE_VARIABLES = {
  '{title}': 'Page title',
  '{domain}': 'Domain name (e.g., example.com)',
  '{host}': 'Host name without subdomain',
  '{date}': 'Current date (YYYY-MM-DD)',
  '{time}': 'Current time (HH-MM-SS)',
  '{timestamp}': 'Unix timestamp',
  '{year}': 'Current year',
  '{month}': 'Current month (01-12)',
  '{day}': 'Current day (01-31)',
} as const;

export type TemplateVariable = keyof typeof TEMPLATE_VARIABLES;