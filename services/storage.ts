/**
 * Chrome Storage API wrapper for managing extension data
 */

import type { UserPreferences } from '~/types/preferences.ts';
import type { ConversionProfile, RecentConversion } from '~/types/storage';
import { DEFAULT_PREFERENCES } from '~/types/preferences';
import { DEFAULT_PROFILE, StorageKey } from '~/types/storage';

export class StorageManager {
  /**
   * Get user preferences
   */
  public async getPreferences(): Promise<UserPreferences> {
    try {
      const result = await browser.storage.sync.get(StorageKey.PREFERENCES);
      return result[StorageKey.PREFERENCES] || DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return DEFAULT_PREFERENCES;
    }
  }

  /**
   * Save user preferences
   */
  public async savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    const current = await this.getPreferences();
    const updated = { ...current, ...preferences };

    // Normalize theme to lowercase before saving
    if (updated.theme) {
      updated.theme = updated.theme.toLowerCase() as any;
    }

    // Validate preferences
    this.validatePreferences(updated);

    try {
      await browser.storage.sync.set({
        [StorageKey.PREFERENCES]: updated,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('QUOTA_BYTES')) {
        throw new Error('Storage quota exceeded');
      }
      throw error;
    }
  }

  /**
   * Reset preferences to defaults
   */
  public async resetPreferences(): Promise<void> {
    await browser.storage.sync.remove(StorageKey.PREFERENCES);
  }

  /**
   * Validate preferences
   */
  private validatePreferences(preferences: UserPreferences): void {
    // Theme values from the enum are lowercase strings
    const validThemes = ['light', 'dark', 'system'];
    const validPatterns = ['tab_title', 'domain_title', 'custom_prefix', 'timestamp', 'mixed'];

    // Handle both uppercase and lowercase theme values for compatibility
    const normalizedTheme = preferences.theme.toLowerCase();
    if (!validThemes.includes(normalizedTheme)) {
      throw new Error('Invalid preferences: Invalid theme value');
    }

    if (!validPatterns.includes(preferences.fileNamingPattern)) {
      throw new Error('Invalid preferences: Invalid naming pattern');
    }
  }

  /**
   * Get all conversion profiles
   */
  public async getProfiles(): Promise<ConversionProfile[]> {
    try {
      const result = await browser.storage.sync.get(StorageKey.PROFILES);
      const profiles = result[StorageKey.PROFILES] || [];

      // Ensure default profile exists
      if (!profiles.find((p: ConversionProfile) => p.id === 'default')) {
        profiles.unshift(DEFAULT_PROFILE);
      }

      return profiles;
    } catch (error) {
      console.error('Failed to get profiles:', error);
      return [DEFAULT_PROFILE];
    }
  }

  /**
   * Get a specific profile
   */
  public async getProfile(id: string): Promise<ConversionProfile | null> {
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === id) || null;
  }

  /**
   * Save a conversion profile
   */
  public async saveProfile(profile: ConversionProfile): Promise<void> {
    const profiles = await this.getProfiles();
    const index = profiles.findIndex((p) => p.id === profile.id);

    if (index >= 0) {
      profiles[index] = { ...profile, updatedAt: Date.now() };
    } else {
      profiles.push({ ...profile, createdAt: Date.now(), updatedAt: Date.now() });
    }

    await browser.storage.sync.set({
      [StorageKey.PROFILES]: profiles,
    });
  }

  /**
   * Update a profile
   */
  public async updateProfile(id: string, updates: Partial<ConversionProfile>): Promise<void> {
    const profile = await this.getProfile(id);
    if (!profile) {
      throw new Error(`Profile ${id} not found`);
    }

    await this.saveProfile({ ...profile, ...updates });
  }

  /**
   * Delete a profile
   */
  public async deleteProfile(id: string): Promise<void> {
    if (id === 'default') {
      throw new Error('Cannot delete default profile');
    }

    const profiles = await this.getProfiles();
    const filtered = profiles.filter((p) => p.id !== id);

    await browser.storage.sync.set({
      [StorageKey.PROFILES]: filtered,
    });
  }

  /**
   * Set default profile
   */
  public async setDefaultProfile(id: string): Promise<void> {
    const profiles = await this.getProfiles();

    // Update isDefault flag
    const updated = profiles.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));

    await browser.storage.sync.set({
      [StorageKey.PROFILES]: updated,
    });

    // Update preferences
    const preferences = await this.getPreferences();
    await this.savePreferences({ ...preferences, defaultProfile: id });
  }

  /**
   * Get recent conversions
   */
  public async getRecentConversions(limit = 10): Promise<RecentConversion[]> {
    try {
      const result = await browser.storage.local.get(StorageKey.RECENT_CONVERSIONS);
      const conversions = result[StorageKey.RECENT_CONVERSIONS] || [];

      // Sort by timestamp descending and limit
      return conversions
        .sort((a: RecentConversion, b: RecentConversion) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent conversions:', error);
      return [];
    }
  }

  /**
   * Add a recent conversion
   */
  public async addRecentConversion(conversion: RecentConversion): Promise<void> {
    const conversions = await this.getRecentConversions(100); // Keep last 100
    conversions.unshift(conversion);

    // Limit to 100 entries
    if (conversions.length > 100) {
      conversions.pop();
    }

    await browser.storage.local.set({
      [StorageKey.RECENT_CONVERSIONS]: conversions,
    });
  }

  /**
   * Clear recent conversions
   */
  public async clearRecentConversions(): Promise<void> {
    await browser.storage.local.remove(StorageKey.RECENT_CONVERSIONS);
  }

  /**
   * Get storage size information
   */
  public async getStorageSize(): Promise<{
    sync: { used: number; total: number; percentage: number };
    local: { used: number; total: number; percentage: number };
  }> {
    const syncUsed = await browser.storage.sync.getBytesInUse();
    const localUsed = await browser.storage.local.getBytesInUse();

    return {
      sync: {
        used: syncUsed,
        total: browser.storage.sync.QUOTA_BYTES,
        percentage: (syncUsed / browser.storage.sync.QUOTA_BYTES) * 100,
      },
      local: {
        used: localUsed,
        total: browser.storage.local.QUOTA_BYTES,
        percentage: (localUsed / browser.storage.local.QUOTA_BYTES) * 100,
      },
    };
  }

  /**
   * Get storage info with detailed breakdown
   */
  public async getStorageInfo(): Promise<{
    sync: { used: number; total: number; percentage: number };
    local: { used: number; total: number; percentage: number };
    breakdown: {
      profiles: number;
      history: number;
      preferencesSize: number;
      cacheSize: number;
    };
  }> {
    const syncUsed = await browser.storage.sync.getBytesInUse();
    const localUsed = await browser.storage.local.getBytesInUse();

    // Calculate breakdown
    const breakdown = await this.calculateStorageBreakdown();

    return {
      sync: {
        used: syncUsed,
        total: browser.storage.sync.QUOTA_BYTES,
        percentage: (syncUsed / browser.storage.sync.QUOTA_BYTES) * 100,
      },
      local: {
        used: localUsed,
        total: browser.storage.local.QUOTA_BYTES,
        percentage: (localUsed / browser.storage.local.QUOTA_BYTES) * 100,
      },
      breakdown,
    };
  }

  /**
   * Calculate detailed storage breakdown
   */
  private async calculateStorageBreakdown(): Promise<{
    profiles: number;
    history: number;
    preferencesSize: number;
    cacheSize: number;
  }> {
    try {
      // Get profiles count and size
      const profiles = await this.getProfiles();
      const profilesSize = await browser.storage.sync.getBytesInUse(StorageKey.PROFILES);

      // Get history count and size (from history service)
      const historyResult = await browser.storage.local.get('conversion_history');
      const historyEntries = historyResult.conversion_history || [];
      const historySize = await browser.storage.local.getBytesInUse('conversion_history');

      // Get preferences size
      const preferencesSize = await browser.storage.sync.getBytesInUse(StorageKey.PREFERENCES);

      // Get cache size (if exists)
      const cacheSize = await browser.storage.local.getBytesInUse(StorageKey.CACHE);

      return {
        profiles: profiles.length,
        history: historyEntries.length,
        preferencesSize,
        cacheSize,
      };
    } catch (error) {
      console.error('Failed to calculate storage breakdown:', error);
      return {
        profiles: 0,
        history: 0,
        preferencesSize: 0,
        cacheSize: 0,
      };
    }
  }

  /**
   * Export all data
   */
  public async exportData(): Promise<{
    version: string;
    exportedAt: number;
    preferences: UserPreferences;
    profiles: ConversionProfile[];
    recentConversions?: RecentConversion[];
  }> {
    const preferences = await this.getPreferences();
    const profiles = await this.getProfiles();
    const recentConversions = await this.getRecentConversions(100);

    return {
      version: '1.0.0',
      exportedAt: Date.now(),
      preferences,
      profiles,
      recentConversions,
    };
  }

  /**
   * Import data
   */
  public async importData(data: {
    preferences: UserPreferences;
    profiles: ConversionProfile[];
    recentConversions?: RecentConversion[];
  }): Promise<void> {
    // Validate data
    this.validatePreferences(data.preferences);

    // Import preferences
    await browser.storage.sync.set({
      [StorageKey.PREFERENCES]: data.preferences,
      [StorageKey.PROFILES]: data.profiles,
    });

    // Import recent conversions if provided
    if (data.recentConversions) {
      await browser.storage.local.set({
        [StorageKey.RECENT_CONVERSIONS]: data.recentConversions,
      });
    }
  }
}

// Export singleton instance
export const storage = new StorageManager();
