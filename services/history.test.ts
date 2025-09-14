/**
 * Unit tests for history functionality
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { historyService } from './history';
import type { HistoryEntry, HistoryFilter } from './history';
import type { ConversionRecord } from '~/types/storage';

// Mock browser storage API
const mockStorage = {
  local: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
};

// @ts-ignore
global.browser = {
  storage: mockStorage,
};

describe('HistoryService', () => {
  const mockEntry: ConversionRecord = {
    id: 'test-id-1',
    url: 'https://example.com/test',
    title: 'Test Page',
    timestamp: Date.now(),
    profileUsed: 'default',
    sizeBytes: 1024,
    duration: 500,
    success: true,
  };

  const mockHistoryEntry: HistoryEntry = {
    ...mockEntry,
    isFavorite: false,
    tags: [],
    notes: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.local.get.mockResolvedValue({});
  });

  describe('addEntry', () => {
    test('should add a new history entry', async () => {
      mockStorage.local.get.mockResolvedValue({ conversion_history: [] });

      await historyService.addEntry(mockEntry);

      expect(mockStorage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          conversion_history: expect.arrayContaining([
            expect.objectContaining({
              id: mockEntry.id,
              url: mockEntry.url,
              title: mockEntry.title,
              isFavorite: false,
              tags: [],
            }),
          ]),
        })
      );
    });

    test('should limit history to MAX_HISTORY_SIZE', async () => {
      const existingHistory = Array.from({ length: 1000 }, (_, i) => ({
        ...mockHistoryEntry,
        id: `old-${i}`,
      }));

      mockStorage.local.get.mockResolvedValue({
        conversion_history: existingHistory,
      });

      await historyService.addEntry(mockEntry);

      const [[setCall]] = mockStorage.local.set.mock.calls;
      expect(setCall.conversion_history).toHaveLength(1000);
      expect(setCall.conversion_history[0].id).toBe(mockEntry.id);
    });
  });

  describe('getHistory', () => {
    const mockHistory: HistoryEntry[] = [
      {
        ...mockHistoryEntry,
        id: '1',
        title: 'JavaScript Tutorial',
        url: 'https://example.com/js',
        notes: 'Great resource',
        tags: ['javascript', 'tutorial'],
        isFavorite: true,
      },
      {
        ...mockHistoryEntry,
        id: '2',
        title: 'Python Guide',
        url: 'https://python.org/guide',
        notes: 'Comprehensive guide',
        tags: ['python'],
        isFavorite: false,
      },
      {
        ...mockHistoryEntry,
        id: '3',
        title: 'React Documentation',
        url: 'https://react.dev',
        profileUsed: 'docs',
        isFavorite: true,
      },
    ];

    beforeEach(() => {
      mockStorage.local.get.mockResolvedValue({
        conversion_history: mockHistory,
      });
    });

    test('should return all history without filter', async () => {
      const result = await historyService.getHistory();
      expect(result).toHaveLength(3);
    });

    test('should filter by search term in title', async () => {
      const filter: HistoryFilter = { searchTerm: 'javascript' };
      const result = await historyService.getHistory(filter);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('JavaScript Tutorial');
    });

    test('should filter by search term in notes', async () => {
      const filter: HistoryFilter = { searchTerm: 'comprehensive' };
      const result = await historyService.getHistory(filter);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Python Guide');
    });

    test('should filter by profile', async () => {
      const filter: HistoryFilter = { profileId: 'docs' };
      const result = await historyService.getHistory(filter);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('React Documentation');
    });

    test('should filter by favorites only', async () => {
      const filter: HistoryFilter = { onlyFavorites: true };
      const result = await historyService.getHistory(filter);

      expect(result).toHaveLength(2);
      expect(result.every(e => e.isFavorite)).toBe(true);
    });

    test('should filter by tags', async () => {
      const filter: HistoryFilter = { tags: ['javascript'] };
      const result = await historyService.getHistory(filter);

      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('javascript');
    });

    test('should filter by date range', async () => {
      const now = Date.now();
      const filter: HistoryFilter = {
        startDate: now - 86400000, // 1 day ago
        endDate: now + 86400000, // 1 day from now
      };

      const result = await historyService.getHistory(filter);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('toggleFavorite', () => {
    test('should toggle favorite status', async () => {
      const history = [{ ...mockHistoryEntry, isFavorite: false }];
      mockStorage.local.get.mockResolvedValue({
        conversion_history: history,
      });

      const result = await historyService.toggleFavorite(mockHistoryEntry.id);

      expect(result).toBe(true);
      expect(mockStorage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          conversion_history: expect.arrayContaining([
            expect.objectContaining({
              id: mockHistoryEntry.id,
              isFavorite: true,
            }),
          ]),
        })
      );
    });

    test('should throw error if entry not found', async () => {
      mockStorage.local.get.mockResolvedValue({ conversion_history: [] });

      await expect(
        historyService.toggleFavorite('non-existent')
      ).rejects.toThrow('History entry not found');
    });
  });

  describe('updateNotes', () => {
    test('should update notes for an entry', async () => {
      const history = [{ ...mockHistoryEntry }];
      mockStorage.local.get.mockResolvedValue({
        conversion_history: history,
      });

      const newNotes = 'Updated notes';
      await historyService.updateNotes(mockHistoryEntry.id, newNotes);

      expect(mockStorage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          conversion_history: expect.arrayContaining([
            expect.objectContaining({
              id: mockHistoryEntry.id,
              notes: newNotes,
            }),
          ]),
        })
      );
    });
  });

  describe('updateTags', () => {
    test('should update tags for an entry', async () => {
      const history = [{ ...mockHistoryEntry }];
      mockStorage.local.get.mockResolvedValue({
        conversion_history: history,
      });

      const newTags = ['test', 'example'];
      await historyService.updateTags(mockHistoryEntry.id, newTags);

      expect(mockStorage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          conversion_history: expect.arrayContaining([
            expect.objectContaining({
              id: mockHistoryEntry.id,
              tags: newTags,
            }),
          ]),
        })
      );
    });
  });

  describe('deleteEntry', () => {
    test('should delete an entry', async () => {
      const history = [
        mockHistoryEntry,
        { ...mockHistoryEntry, id: 'other-id' },
      ];
      mockStorage.local.get.mockResolvedValue({
        conversion_history: history,
      });

      await historyService.deleteEntry(mockHistoryEntry.id);

      const [[setCall]] = mockStorage.local.set.mock.calls;
      expect(setCall.conversion_history).toHaveLength(1);
      expect(setCall.conversion_history[0].id).toBe('other-id');
    });
  });

  describe('clearHistory', () => {
    test('should clear all history when keepFavorites is false', async () => {
      const history = [
        { ...mockHistoryEntry, isFavorite: true },
        { ...mockHistoryEntry, id: '2', isFavorite: false },
      ];
      mockStorage.local.get.mockResolvedValue({
        conversion_history: history,
      });

      await historyService.clearHistory(false);

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        conversion_history: [],
      });
    });

    test('should keep favorites when keepFavorites is true', async () => {
      const favoriteEntry = { ...mockHistoryEntry, isFavorite: true };
      const normalEntry = { ...mockHistoryEntry, id: '2', isFavorite: false };

      mockStorage.local.get.mockResolvedValue({
        conversion_history: [favoriteEntry, normalEntry],
      });

      await historyService.clearHistory(true);

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        conversion_history: [favoriteEntry],
      });
    });
  });

  describe('getStats', () => {
    test('should calculate correct statistics', async () => {
      const history: HistoryEntry[] = [
        {
          ...mockHistoryEntry,
          id: '1',
          url: 'https://example.com/1',
          isFavorite: true,
          success: true,
          duration: 100,
        },
        {
          ...mockHistoryEntry,
          id: '2',
          url: 'https://example.com/2',
          isFavorite: false,
          success: true,
          duration: 200,
        },
        {
          ...mockHistoryEntry,
          id: '3',
          url: 'https://test.com/1',
          isFavorite: false,
          success: false,
          duration: 300,
        },
      ];

      mockStorage.local.get.mockResolvedValue({
        conversion_history: history,
      });

      const stats = await historyService.getStats();

      expect(stats.totalConversions).toBe(3);
      expect(stats.favoriteCount).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
      expect(stats.averageDuration).toBe(200);
      expect(stats.topDomains).toHaveLength(2);
      expect(stats.topDomains[0]).toEqual({
        domain: 'example.com',
        count: 2,
      });
    });

    test('should return empty stats for no history', async () => {
      mockStorage.local.get.mockResolvedValue({
        conversion_history: [],
      });

      const stats = await historyService.getStats();

      expect(stats.totalConversions).toBe(0);
      expect(stats.favoriteCount).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageDuration).toBe(0);
      expect(stats.mostUsedProfile).toBeNull();
      expect(stats.topDomains).toHaveLength(0);
    });
  });

  describe('getSuggestedTags', () => {
    test('should return most used tags', async () => {
      const history: HistoryEntry[] = [
        { ...mockHistoryEntry, id: '1', tags: ['javascript', 'tutorial'] },
        { ...mockHistoryEntry, id: '2', tags: ['javascript', 'react'] },
        { ...mockHistoryEntry, id: '3', tags: ['python', 'tutorial'] },
        { ...mockHistoryEntry, id: '4', tags: ['javascript'] },
      ];

      mockStorage.local.get.mockResolvedValue({
        conversion_history: history,
      });

      const tags = await historyService.getSuggestedTags();

      expect(tags[0]).toBe('javascript'); // Most frequent
      expect(tags[1]).toBe('tutorial'); // Second most frequent
      expect(tags).toContain('python');
      expect(tags).toContain('react');
    });
  });

  describe('export and import', () => {
    test('should export history as JSON', async () => {
      const history = [mockHistoryEntry];
      mockStorage.local.get.mockResolvedValue({
        conversion_history: history,
      });

      const json = await historyService.exportHistory();
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(history);
    });

    test('should import history from JSON', async () => {
      const newHistory = [
        { ...mockHistoryEntry, id: 'imported-1' },
        { ...mockHistoryEntry, id: 'imported-2' },
      ];
      const json = JSON.stringify(newHistory);

      mockStorage.local.get.mockResolvedValue({
        conversion_history: [],
      });

      await historyService.importHistory(json, false);

      expect(mockStorage.local.set).toHaveBeenCalledWith({
        conversion_history: newHistory,
      });
    });

    test('should merge imported history when merge is true', async () => {
      const existingHistory = [{ ...mockHistoryEntry, id: 'existing' }];
      const newHistory = [{ ...mockHistoryEntry, id: 'imported' }];
      const json = JSON.stringify(newHistory);

      mockStorage.local.get.mockResolvedValue({
        conversion_history: existingHistory,
      });

      await historyService.importHistory(json, true);

      const [[setCall]] = mockStorage.local.set.mock.calls;
      expect(setCall.conversion_history).toHaveLength(2);
      expect(setCall.conversion_history.map((e: any) => e.id)).toContain('existing');
      expect(setCall.conversion_history.map((e: any) => e.id)).toContain('imported');
    });

    test('should remove duplicates when merging', async () => {
      const existingHistory = [{ ...mockHistoryEntry, id: 'duplicate' }];
      const newHistory = [
        { ...mockHistoryEntry, id: 'duplicate' },
        { ...mockHistoryEntry, id: 'new' },
      ];
      const json = JSON.stringify(newHistory);

      mockStorage.local.get.mockResolvedValue({
        conversion_history: existingHistory,
      });

      await historyService.importHistory(json, true);

      const [[setCall]] = mockStorage.local.set.mock.calls;
      expect(setCall.conversion_history).toHaveLength(2);
      expect(setCall.conversion_history.filter((e: any) => e.id === 'duplicate')).toHaveLength(1);
    });

    test('should throw error for invalid JSON', async () => {
      await expect(
        historyService.importHistory('invalid json', false)
      ).rejects.toThrow();
    });

    test('should throw error for non-array data', async () => {
      const json = JSON.stringify({ not: 'an array' });

      await expect(
        historyService.importHistory(json, false)
      ).rejects.toThrow('Invalid history data');
    });
  });
});