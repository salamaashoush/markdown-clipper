import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '~/lib/storage/index';
import { StorageKey, DEFAULT_PROFILE } from '~/types/storage';
import { DEFAULT_PREFERENCES } from '~/types/preferences';

describe('StorageManager', () => {
  let storage: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new StorageManager();
  });

  describe('Preferences', () => {
    it('should return default preferences when none are stored', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({});

      const preferences = await storage.getPreferences();

      expect(preferences).toEqual(DEFAULT_PREFERENCES);
      expect(browser.storage.sync.get).toHaveBeenCalledWith(StorageKey.PREFERENCES);
    });

    it('should return stored preferences', async () => {
      const stored = { ...DEFAULT_PREFERENCES, autoDownload: true };
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        [StorageKey.PREFERENCES]: stored,
      });

      const preferences = await storage.getPreferences();

      expect(preferences).toEqual(stored);
    });

    it('should save preferences', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        [StorageKey.PREFERENCES]: DEFAULT_PREFERENCES,
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      const updates = { autoDownload: true };
      await storage.savePreferences(updates);

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        [StorageKey.PREFERENCES]: {
          ...DEFAULT_PREFERENCES,
          autoDownload: true,
        },
      });
    });

    it('should reset preferences', async () => {
      browser.storage.sync.remove = vi.fn().mockResolvedValue(undefined);

      await storage.resetPreferences();

      expect(browser.storage.sync.remove).toHaveBeenCalledWith(StorageKey.PREFERENCES);
    });
  });

  describe('Profiles', () => {
    it('should return default profile when none are stored', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({});

      const profiles = await storage.getProfiles();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe('default');
      expect(profiles[0].name).toBe('Default');
    });

    it('should get a specific profile by ID', async () => {
      const customProfile = { ...DEFAULT_PROFILE, id: 'custom', name: 'Custom' };
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        [StorageKey.PROFILES]: [DEFAULT_PROFILE, customProfile],
      });

      const profile = await storage.getProfile('custom');

      expect(profile).toEqual(customProfile);
    });

    it('should return null for non-existent profile', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        [StorageKey.PROFILES]: [DEFAULT_PROFILE],
      });

      const profile = await storage.getProfile('non-existent');

      expect(profile).toBeNull();
    });

    it('should save a new profile', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        [StorageKey.PROFILES]: [DEFAULT_PROFILE],
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      const newProfile = { ...DEFAULT_PROFILE, id: 'new', name: 'New Profile' };
      await storage.saveProfile(newProfile);

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        [StorageKey.PROFILES]: [
          DEFAULT_PROFILE,
          expect.objectContaining({
            ...newProfile,
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
          }),
        ],
      });
    });

    it('should update an existing profile', async () => {
      const existing = { ...DEFAULT_PROFILE, id: 'custom', name: 'Old Name' };
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        [StorageKey.PROFILES]: [DEFAULT_PROFILE, existing],
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      const updated = { ...existing, name: 'New Name' };
      await storage.saveProfile(updated);

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        [StorageKey.PROFILES]: [
          DEFAULT_PROFILE,
          expect.objectContaining({
            ...updated,
            updatedAt: expect.any(Number),
          }),
        ],
      });
    });

    it('should delete a profile', async () => {
      const customProfile = { ...DEFAULT_PROFILE, id: 'custom', name: 'Custom' };
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        [StorageKey.PROFILES]: [DEFAULT_PROFILE, customProfile],
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      await storage.deleteProfile('custom');

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        [StorageKey.PROFILES]: [DEFAULT_PROFILE],
      });
    });

    it('should not delete the default profile', async () => {
      await expect(storage.deleteProfile('default')).rejects.toThrow(
        'Cannot delete default profile'
      );
    });

    it('should set default profile', async () => {
      const customProfile = { ...DEFAULT_PROFILE, id: 'custom', name: 'Custom', isDefault: false };
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        [StorageKey.PROFILES]: [
          { ...DEFAULT_PROFILE, isDefault: true },
          customProfile,
        ],
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      await storage.setDefaultProfile('custom');

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        [StorageKey.PROFILES]: [
          expect.objectContaining({ id: 'default', isDefault: false }),
          expect.objectContaining({ id: 'custom', isDefault: true }),
        ],
      });
    });
  });

  describe('Recent Conversions', () => {
    it('should return empty array when no conversions are stored', async () => {
      browser.storage.local.get = vi.fn().mockResolvedValue({});

      const conversions = await storage.getRecentConversions();

      expect(conversions).toEqual([]);
    });

    it('should add a recent conversion', async () => {
      browser.storage.local.get = vi.fn().mockResolvedValue({});
      browser.storage.local.set = vi.fn().mockResolvedValue(undefined);

      const conversion = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test Page',
        timestamp: Date.now(),
        profileUsed: 'default',
        sizeBytes: 1024,
        duration: 100,
        success: true,
      };

      await storage.addRecentConversion(conversion);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [StorageKey.RECENT_CONVERSIONS]: [conversion],
      });
    });

    it('should limit recent conversions to 50', async () => {
      const existing = Array.from({ length: 50 }, (_, i) => ({
        id: `id-${i}`,
        url: `https://example.com/${i}`,
        title: `Page ${i}`,
        timestamp: Date.now() - i * 1000,
        profileUsed: 'default',
        sizeBytes: 1024,
        duration: 100,
        success: true,
      }));

      browser.storage.local.get = vi.fn().mockResolvedValue({
        [StorageKey.RECENT_CONVERSIONS]: existing,
      });
      browser.storage.local.set = vi.fn().mockResolvedValue(undefined);

      const newConversion = {
        id: 'new-id',
        url: 'https://example.com/new',
        title: 'New Page',
        timestamp: Date.now(),
        profileUsed: 'default',
        sizeBytes: 1024,
        duration: 100,
        success: true,
      };

      await storage.addRecentConversion(newConversion);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [StorageKey.RECENT_CONVERSIONS]: expect.arrayContaining([
          newConversion,
          ...existing.slice(0, 49),
        ]),
      });
    });

    it('should clear recent conversions', async () => {
      browser.storage.local.remove = vi.fn().mockResolvedValue(undefined);

      await storage.clearRecentConversions();

      expect(browser.storage.local.remove).toHaveBeenCalledWith(StorageKey.RECENT_CONVERSIONS);
    });
  });

  describe('Storage Info', () => {
    it('should get storage info', async () => {
      browser.storage.sync.getBytesInUse = vi.fn().mockResolvedValue(1024);
      browser.storage.local.getBytesInUse = vi.fn().mockResolvedValue(2048);

      const info = await storage.getStorageInfo();

      expect(info.sync.used).toBe(1024);
      expect(info.sync.total).toBe(browser.storage.sync.QUOTA_BYTES);
      expect(info.local.used).toBe(2048);
      expect(info.local.total).toBe(browser.storage.local.QUOTA_BYTES);
    });
  });

  describe('Import/Export', () => {
    it('should export all data', async () => {
      const mockData = {
        preferences: DEFAULT_PREFERENCES,
        profiles: [DEFAULT_PROFILE],
        recentConversions: [],
      };

      browser.storage.sync.get = vi.fn().mockImplementation((keys) => {
        if (keys === StorageKey.PREFERENCES) {
          return Promise.resolve({ [StorageKey.PREFERENCES]: mockData.preferences });
        }
        if (keys === StorageKey.PROFILES) {
          return Promise.resolve({ [StorageKey.PROFILES]: mockData.profiles });
        }
        return Promise.resolve({});
      });

      browser.storage.local.get = vi.fn().mockResolvedValue({
        [StorageKey.RECENT_CONVERSIONS]: mockData.recentConversions,
      });

      const exported = await storage.exportData();

      expect(exported).toEqual({
        version: 1,
        exportDate: expect.any(Number),
        data: mockData,
      });
    });

    it('should import data', async () => {
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);
      browser.storage.local.set = vi.fn().mockResolvedValue(undefined);

      const importData = {
        version: 1,
        exportDate: Date.now(),
        data: {
          preferences: { ...DEFAULT_PREFERENCES, autoDownload: true },
          profiles: [DEFAULT_PROFILE],
          recentConversions: [],
        },
      };

      await storage.importData(importData.data);

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        [StorageKey.PREFERENCES]: importData.data.preferences,
        [StorageKey.PROFILES]: importData.data.profiles,
      });

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [StorageKey.RECENT_CONVERSIONS]: importData.data.recentConversions,
      });
    });
  });
});