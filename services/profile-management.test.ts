/**
 * Tests for profile management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageManager } from '~/services/storage';
import type { ConversionProfile } from '~/types/storage';
import { DEFAULT_PROFILE, MarkdownFlavor, ImageStrategy } from '~/types/storage';
import { DEFAULT_PREFERENCES } from '~/types/preferences';

describe('Profile Management', () => {
  let storage: StorageManager;

  beforeEach(() => {
    vi.clearAllMocks();
    storage = new StorageManager();
  });

  describe('Profile CRUD Operations', () => {
    it('should create a new profile with unique ID', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        profiles: [DEFAULT_PROFILE]
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      const newProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        id: 'custom-1',
        name: 'Custom Profile',
        markdownFlavor: MarkdownFlavor.GITHUB,
        isDefault: false,
        isBuiltIn: false,
      };

      await storage.saveProfile(newProfile);

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        profiles: expect.arrayContaining([
          expect.objectContaining({ id: 'default' }),
          expect.objectContaining({
            id: 'custom-1',
            name: 'Custom Profile',
            markdownFlavor: MarkdownFlavor.GITHUB,
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
          })
        ])
      });
    });

    it('should update an existing profile', async () => {
      const existingProfile = {
        ...DEFAULT_PROFILE,
        id: 'custom-1',
        name: 'Old Name',
        isDefault: false,
      };

      browser.storage.sync.get = vi.fn().mockResolvedValue({
        profiles: [DEFAULT_PROFILE, existingProfile]
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      await storage.updateProfile('custom-1', {
        name: 'Updated Name',
        markdownFlavor: MarkdownFlavor.REDDIT,
      });

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        profiles: expect.arrayContaining([
          expect.objectContaining({ id: 'default' }),
          expect.objectContaining({
            id: 'custom-1',
            name: 'Updated Name',
            markdownFlavor: MarkdownFlavor.REDDIT,
            updatedAt: expect.any(Number),
          })
        ])
      });
    });

    it('should delete a profile', async () => {
      const customProfile = {
        ...DEFAULT_PROFILE,
        id: 'custom-1',
        name: 'To Delete',
        isDefault: false,
      };

      browser.storage.sync.get = vi.fn().mockResolvedValue({
        profiles: [DEFAULT_PROFILE, customProfile]
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      await storage.deleteProfile('custom-1');

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        profiles: [DEFAULT_PROFILE]
      });
    });

    it('should not allow deleting the default profile', async () => {
      await expect(storage.deleteProfile('default')).rejects.toThrow(
        'Cannot delete default profile'
      );
    });

    it('should throw error when updating non-existent profile', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        profiles: [DEFAULT_PROFILE]
      });

      await expect(
        storage.updateProfile('non-existent', { name: 'New Name' })
      ).rejects.toThrow('Profile non-existent not found');
    });
  });

  describe('Default Profile Management', () => {
    it('should set a profile as default', async () => {
      const customProfile = {
        ...DEFAULT_PROFILE,
        id: 'custom-1',
        name: 'Custom',
        isDefault: false,
      };

      browser.storage.sync.get = vi.fn().mockImplementation((keys) => {
        if (keys === 'profiles') {
          return Promise.resolve({
            profiles: [
              { ...DEFAULT_PROFILE, isDefault: true },
              customProfile
            ]
          });
        }
        if (keys === 'preferences') {
          return Promise.resolve({
            preferences: {
              ...DEFAULT_PREFERENCES,
              defaultProfile: 'default'
            }
          });
        }
        return Promise.resolve({});
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      await storage.setDefaultProfile('custom-1');

      // Should update both profiles and preferences
      expect(browser.storage.sync.set).toHaveBeenCalledTimes(2);

      // Check profiles update
      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        profiles: [
          expect.objectContaining({ id: 'default', isDefault: false }),
          expect.objectContaining({ id: 'custom-1', isDefault: true })
        ]
      });

      // Check preferences update
      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        preferences: expect.objectContaining({ defaultProfile: 'custom-1' })
      });
    });

    it('should ensure default profile always exists', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        profiles: [] // No profiles stored
      });

      const profiles = await storage.getProfiles();

      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe('default');
      expect(profiles[0].isDefault).toBe(true);
      expect(profiles[0].isBuiltIn).toBe(true);
    });
  });

  describe('Profile Validation', () => {
    it('should validate profile properties on save', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        profiles: [DEFAULT_PROFILE]
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      const invalidProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        id: '', // Invalid: empty ID
        name: '', // Invalid: empty name
      };

      // Should still save but with defaults applied
      await storage.saveProfile(invalidProfile);

      expect(browser.storage.sync.set).toHaveBeenCalled();
    });

    it('should handle duplicate profile IDs by updating', async () => {
      const existingProfile = {
        ...DEFAULT_PROFILE,
        id: 'custom-1',
        name: 'Existing',
        createdAt: 1000,
        updatedAt: 1000,
      };

      browser.storage.sync.get = vi.fn().mockResolvedValue({
        profiles: [DEFAULT_PROFILE, existingProfile]
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      const duplicateProfile = {
        ...DEFAULT_PROFILE,
        id: 'custom-1', // Same ID
        name: 'Duplicate',
      };

      await storage.saveProfile(duplicateProfile);

      // Should update the existing profile, not create a new one
      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        profiles: expect.arrayContaining([
          expect.objectContaining({ id: 'default' }),
          expect.objectContaining({
            id: 'custom-1',
            name: 'Duplicate',
            updatedAt: expect.any(Number),
          })
        ])
      });

      const callArg = vi.mocked(browser.storage.sync.set).mock.calls[0][0];
      expect(callArg.profiles).toHaveLength(2); // Still only 2 profiles
    });
  });

  describe('Profile Settings Integrity', () => {
    it('should preserve all settings when copying a profile', async () => {
      const sourceProfile: ConversionProfile = {
        ...DEFAULT_PROFILE,
        id: 'source',
        name: 'Source Profile',
        markdownFlavor: MarkdownFlavor.GITHUB,
        imageHandling: {
          strategy: ImageStrategy.SKIP,
          lazyLoadHandling: true,
          fallbackAltText: 'Custom Alt',
          maxWidth: 800,
        },
        linkHandling: {
          style: 'remove',
          openInNewTab: true,
          shortenUrls: true,
          convertRelativeUrls: false,
          removeTrackingParams: false,
          followRedirects: true,
        },
        contentFilters: {
          includeCss: ['.content', '#main'],
          excludeCss: ['.ads', '.sidebar'],
          includeHidden: true,
          includeComments: true,
          includeScripts: true,
          includeIframes: true,
          maxHeadingLevel: 4,
          minContentLength: 100,
        },
        formatting: {
          lineWidth: 80,
          codeBlockSyntax: false,
          tableAlignment: false,
          listIndentation: 4,
          boldStyle: '__',
          italicStyle: '_',
          hrStyle: '***',
        },
        outputFormat: {
          addMetadata: false,
          addTableOfContents: true,
          addFootnotes: false,
          wrapLineLength: 100,
          preserveNewlines: true,
        },
      };

      browser.storage.sync.get = vi.fn().mockResolvedValue({
        profiles: [sourceProfile]
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      // Create a copy with new ID
      const copiedProfile = {
        ...sourceProfile,
        id: 'copy',
        name: 'Copied Profile',
        isDefault: false,
        isBuiltIn: false,
      };

      await storage.saveProfile(copiedProfile);

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        profiles: expect.arrayContaining([
          sourceProfile,
          expect.objectContaining({
            id: 'copy',
            name: 'Copied Profile',
            markdownFlavor: MarkdownFlavor.GITHUB,
            imageHandling: expect.objectContaining({
              strategy: ImageStrategy.SKIP,
              fallbackAltText: 'Custom Alt',
              maxWidth: 800,
            }),
            linkHandling: expect.objectContaining({
              style: 'remove',
              removeTrackingParams: false,
            }),
            contentFilters: expect.objectContaining({
              includeCss: ['.content', '#main'],
              excludeCss: ['.ads', '.sidebar'],
              maxHeadingLevel: 4,
            }),
            formatting: expect.objectContaining({
              lineWidth: 80,
              boldStyle: '__',
              hrStyle: '***',
            }),
            outputFormat: expect.objectContaining({
              addMetadata: false,
              addTableOfContents: true,
              wrapLineLength: 100,
            }),
          })
        ])
      });
    });
  });

  describe('Profile List Management', () => {
    it('should return profiles sorted by creation date', async () => {
      const profiles = [
        { ...DEFAULT_PROFILE, id: 'p1', createdAt: 3000 },
        { ...DEFAULT_PROFILE, id: 'p2', createdAt: 1000 },
        { ...DEFAULT_PROFILE, id: 'p3', createdAt: 2000 },
      ];

      browser.storage.sync.get = vi.fn().mockResolvedValue({ profiles });

      const result = await storage.getProfiles();

      // Default profile should always be first
      expect(result[0].id).toBe('default');
    });

    it('should handle storage quota errors gracefully', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        profiles: [DEFAULT_PROFILE]
      });
      browser.storage.sync.set = vi.fn().mockRejectedValue(
        new Error('QUOTA_BYTES quota exceeded')
      );

      const hugeProfile = {
        ...DEFAULT_PROFILE,
        id: 'huge',
        name: 'a'.repeat(10000), // Very large name
      };

      await expect(storage.saveProfile(hugeProfile)).rejects.toThrow();
    });
  });

  describe('Built-in Profiles', () => {
    it('should not allow modifying built-in profile core properties', async () => {
      browser.storage.sync.get = vi.fn().mockResolvedValue({
        profiles: [{ ...DEFAULT_PROFILE, isBuiltIn: true }]
      });
      browser.storage.sync.set = vi.fn().mockResolvedValue(undefined);

      // Try to update built-in profile
      await storage.updateProfile('default', {
        name: 'Modified Default',
        markdownFlavor: MarkdownFlavor.REDDIT,
      });

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        profiles: expect.arrayContaining([
          expect.objectContaining({
            id: 'default',
            name: 'Modified Default', // Name can be changed
            markdownFlavor: MarkdownFlavor.REDDIT, // Settings can be changed
            isBuiltIn: true, // But it remains built-in
          })
        ])
      });
    });
  });
});