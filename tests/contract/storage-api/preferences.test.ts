import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UserPreferences } from '~/types/preferences';
import { StorageKey, NamingPattern, Theme } from '~/types/storage';

describe('Storage API Contract - Preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get default preferences on first load', async () => {
    browser.storage.sync.get = vi.fn().mockResolvedValue({});

    const preferences = await getPreferences();

    expect(preferences).toBeDefined();
    expect(preferences.defaultProfile).toBe('default');
    expect(preferences.autoDownload).toBe(false);
    expect(preferences.fileNamingPattern).toBe(NamingPattern.TAB_TITLE);
    expect(preferences.showNotifications).toBe(true);
    expect(preferences.theme).toBe(Theme.SYSTEM);
  });

  it('should save preferences to sync storage', async () => {
    const newPreferences: Partial<UserPreferences> = {
      autoDownload: true,
      theme: Theme.DARK,
      fileNamingPattern: NamingPattern.DOMAIN_TITLE,
    };

    browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

    await savePreferences(newPreferences);

    expect(browser.storage.sync.set).toHaveBeenCalledWith({
      [StorageKey.PREFERENCES]: expect.objectContaining(newPreferences),
    });
  });

  it('should retrieve saved preferences', async () => {
    const savedPreferences: UserPreferences = {
      defaultProfile: 'custom',
      autoDownload: true,
      fileNamingPattern: NamingPattern.TIMESTAMP,
      showNotifications: false,
      theme: Theme.LIGHT,
      advancedMode: true,
      debugMode: false,
    };

    browser.storage.sync.get = vi.fn().mockResolvedValue({
      [StorageKey.PREFERENCES]: savedPreferences,
    });

    const preferences = await getPreferences();

    expect(preferences).toEqual(savedPreferences);
  });

  it('should merge partial updates with existing preferences', async () => {
    const existing: UserPreferences = {
      defaultProfile: 'default',
      autoDownload: false,
      fileNamingPattern: NamingPattern.TAB_TITLE,
      showNotifications: true,
      theme: Theme.SYSTEM,
      advancedMode: false,
      debugMode: false,
    };

    browser.storage.sync.get = vi.fn().mockResolvedValue({
      [StorageKey.PREFERENCES]: existing,
    });
    browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

    await savePreferences({ autoDownload: true });

    expect(browser.storage.sync.set).toHaveBeenCalledWith({
      [StorageKey.PREFERENCES]: {
        ...existing,
        autoDownload: true,
      },
    });
  });

  it('should reset preferences to defaults', async () => {
    browser.storage.sync.remove = vi.fn().mockResolvedValue(undefined);

    await resetPreferences();

    expect(browser.storage.sync.remove).toHaveBeenCalledWith(StorageKey.PREFERENCES);
  });

  it('should validate preferences on save', async () => {
    const invalidPreferences = {
      fileNamingPattern: 'invalid_pattern' as any,
      theme: 'invalid_theme' as any,
    };

    await expect(savePreferences(invalidPreferences)).rejects.toThrow('Invalid preferences');
  });

  it('should handle storage quota exceeded error', async () => {
    browser.storage.sync.set = vi.fn().mockRejectedValue(
      new Error('QUOTA_BYTES quota exceeded')
    );

    const largePreferences: Partial<UserPreferences> = {
      shortcuts: {
        convertPage: 'Ctrl+Shift+C',
        openPopup: 'Ctrl+Shift+P',
        // ... many more shortcuts
      },
    };

    await expect(savePreferences(largePreferences)).rejects.toThrow('Storage quota exceeded');
  });
});

// Test helper functions that wrap the storage API
async function getPreferences(): Promise<UserPreferences> {
  const result = await browser.storage.sync.get(StorageKey.PREFERENCES);
  return result[StorageKey.PREFERENCES] || {
    defaultProfile: 'default',
    autoDownload: false,
    fileNamingPattern: NamingPattern.TAB_TITLE,
    showNotifications: true,
    theme: Theme.SYSTEM,
    advancedMode: false,
    debugMode: false,
  };
}

async function savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
  // Validate preferences
  if (preferences.fileNamingPattern && !Object.values(NamingPattern).includes(preferences.fileNamingPattern)) {
    throw new Error('Invalid preferences');
  }
  if (preferences.theme && !Object.values(Theme).includes(preferences.theme)) {
    throw new Error('Invalid preferences');
  }

  const current = await getPreferences();
  const updated = { ...current, ...preferences };

  try {
    await browser.storage.sync.set({
      [StorageKey.PREFERENCES]: updated,
    });
  } catch (error: any) {
    if (error?.message?.includes('QUOTA_BYTES')) {
      throw new Error('Storage quota exceeded');
    }
    throw error;
  }
}

async function resetPreferences(): Promise<void> {
  await browser.storage.sync.remove(StorageKey.PREFERENCES);
}