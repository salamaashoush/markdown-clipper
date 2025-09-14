/**
 * Component tests for History UI
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor, screen, cleanup } from '@solidjs/testing-library';
import { History } from './History';
import type { HistoryEntry } from '~/services/history';

// Mock the services
vi.mock('~/services/history', () => ({
  historyService: {
    getHistory: vi.fn(),
    getStats: vi.fn(),
    toggleFavorite: vi.fn(),
    deleteEntry: vi.fn(),
    clearHistory: vi.fn(),
    exportHistory: vi.fn(),
    importHistory: vi.fn(),
    updateNotes: vi.fn(),
    updateTags: vi.fn(),
  },
}));

vi.mock('~/services/storage', () => ({
  storage: {
    getProfiles: vi.fn(),
  },
}));

import { historyService } from '~/services/history';
import { storage } from '~/services/storage';

describe('History Component', () => {
  const mockHistory: HistoryEntry[] = [
    {
      id: '1',
      url: 'https://example.com/page1',
      title: 'Example Page 1',
      timestamp: Date.now() - 3600000, // 1 hour ago
      profileUsed: 'default',
      sizeBytes: 2048,
      duration: 500,
      success: true,
      isFavorite: false,
      tags: ['test', 'example'],
      notes: 'Test notes',
    },
    {
      id: '2',
      url: 'https://test.com/page2',
      title: 'Test Page 2',
      timestamp: Date.now() - 86400000, // 1 day ago
      profileUsed: 'minimal',
      sizeBytes: 1024,
      duration: 300,
      success: true,
      isFavorite: true,
      tags: [],
      notes: '',
    },
  ];

  const mockProfiles = [
    { id: 'default', name: 'Default', isDefault: true },
    { id: 'minimal', name: 'Minimal', isDefault: false },
  ];

  const mockStats = {
    totalConversions: 2,
    favoriteCount: 1,
    successRate: 100,
    averageDuration: 400,
    mostUsedProfile: 'default',
    topDomains: [
      { domain: 'example.com', count: 1 },
      { domain: 'test.com', count: 1 },
    ],
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();

    // Setup default mocks
    (historyService.getHistory as any).mockResolvedValue(mockHistory);
    (historyService.getStats as any).mockResolvedValue(mockStats);
    (storage.getProfiles as any).mockResolvedValue(mockProfiles);
  });

  describe('Rendering', () => {
    test('should render statistics correctly', async () => {
      render(() => <History />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeDefined(); // Total conversions
        expect(screen.getByText('1')).toBeDefined(); // Favorites
        expect(screen.getByText('100%')).toBeDefined(); // Success rate
        expect(screen.getByText('400ms')).toBeDefined(); // Avg duration
      });
    });

    test('should render history entries', async () => {
      render(() => <History />);

      await waitFor(() => {
        expect(screen.getByText('Example Page 1')).toBeDefined();
        expect(screen.getByText('Test Page 2')).toBeDefined();
      });
    });

    test('should show favorite star for favorited entries', async () => {
      render(() => <History />);

      await waitFor(() => {
        const entries = screen.getAllByText(/Test Page 2/);
        expect(entries.length).toBeGreaterThan(0);
        // Check for star icon in parent element
        const parent = entries[0].closest('.bg-white');
        expect(parent?.querySelector('.text-yellow-500')).toBeDefined();
      });
    });

    test('should display tags', async () => {
      render(() => <History />);

      await waitFor(() => {
        expect(screen.getByText('test')).toBeDefined();
        expect(screen.getByText('example')).toBeDefined();
      });
    });

    test('should display notes', async () => {
      render(() => <History />);

      await waitFor(() => {
        expect(screen.getByText('Test notes')).toBeDefined();
      });
    });

    test('should show empty state when no history', async () => {
      (historyService.getHistory as any).mockResolvedValue([]);
      (historyService.getStats as any).mockResolvedValue({
        totalConversions: 0,
        favoriteCount: 0,
        successRate: 0,
        averageDuration: 0,
        mostUsedProfile: null,
        topDomains: [],
      });

      render(() => <History />);

      await waitFor(() => {
        expect(screen.getByText('No history entries found')).toBeDefined();
        expect(screen.getByText('Start converting pages to see them here')).toBeDefined();
      });
    });

    test('should show loading state initially', () => {
      render(() => <History />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeDefined();
    });
  });

  describe('Filtering', () => {
    test('should filter by search term', async () => {
      render(() => <History />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search by title, URL, or notes...');
        expect(searchInput).toBeDefined();
      });

      const searchInput = screen.getByPlaceholderText('Search by title, URL, or notes...') as HTMLInputElement;

      fireEvent.input(searchInput, { target: { value: 'Example' } });

      await waitFor(() => {
        expect(historyService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({ searchTerm: 'Example' })
        );
      });
    });

    test('should filter by profile', async () => {
      render(() => <History />);

      await waitFor(() => {
        const profileSelect = screen.getByText('All Profiles').closest('select');
        expect(profileSelect).toBeDefined();
      });

      const profileSelect = screen.getByText('All Profiles').closest('select') as HTMLSelectElement;

      fireEvent.change(profileSelect, { target: { value: 'minimal' } });

      await waitFor(() => {
        expect(historyService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({ profileId: 'minimal' })
        );
      });
    });

    test('should filter by favorites', async () => {
      render(() => <History />);

      await waitFor(() => {
        const favoritesCheckbox = screen.getByText('Favorites').closest('label')?.querySelector('input[type="checkbox"]');
        expect(favoritesCheckbox).toBeDefined();
      });

      const favoritesCheckbox = screen.getByText('Favorites').closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement;

      fireEvent.click(favoritesCheckbox);

      await waitFor(() => {
        expect(historyService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({ onlyFavorites: true })
        );
      });
    });
  });

  describe('Actions', () => {
    test('should toggle favorite status', async () => {
      (historyService.toggleFavorite as any).mockResolvedValue(true);

      render(() => <History />);

      await waitFor(() => {
        const favoriteButton = screen.getAllByText('Favorite')[0];
        expect(favoriteButton).toBeDefined();
      });

      const favoriteButton = screen.getAllByText('Favorite')[0];
      fireEvent.click(favoriteButton);

      await waitFor(() => {
        expect(historyService.toggleFavorite).toHaveBeenCalledWith('1');
      });
    });

    test('should delete entry with confirmation', async () => {
      window.confirm = vi.fn().mockReturnValue(true);

      render(() => <History />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        expect(deleteButtons.length).toBeGreaterThan(0);
      });

      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this entry?');
        expect(historyService.deleteEntry).toHaveBeenCalledWith('1');
      });
    });

    test('should not delete entry when cancelled', async () => {
      window.confirm = vi.fn().mockReturnValue(false);

      render(() => <History />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        expect(deleteButtons.length).toBeGreaterThan(0);
      });

      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalled();
        expect(historyService.deleteEntry).not.toHaveBeenCalled();
      });
    });

    test('should export history', async () => {
      const mockJson = JSON.stringify(mockHistory);
      (historyService.exportHistory as any).mockResolvedValue(mockJson);

      // Mock URL and document methods
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:url');
      const mockRevokeObjectURL = vi.fn();
      const mockClick = vi.fn();
      const mockCreateElement = vi.fn().mockReturnValue({
        href: '',
        download: '',
        click: mockClick,
      });

      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;
      document.createElement = mockCreateElement as any;

      render(() => <History />);

      await waitFor(() => {
        const exportButton = screen.getByText('Export');
        expect(exportButton).toBeDefined();
      });

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(historyService.exportHistory).toHaveBeenCalled();
        expect(mockCreateObjectURL).toHaveBeenCalled();
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalled();
      });
    });

    test('should clear history with confirmation', async () => {
      window.confirm = vi.fn()
        .mockReturnValueOnce(true) // Keep favorites
        .mockReturnValueOnce(true); // Confirm action

      render(() => <History />);

      await waitFor(() => {
        const clearButton = screen.getByText('Clear');
        expect(clearButton).toBeDefined();
      });

      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledTimes(2);
        expect(historyService.clearHistory).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Edit Functionality', () => {
    test('should edit notes', async () => {
      render(() => <History />);

      await waitFor(() => {
        const editNotesButtons = screen.getAllByText('Edit Notes');
        expect(editNotesButtons.length).toBeGreaterThan(0);
      });

      // Click edit notes
      const editNotesButton = screen.getAllByText('Edit Notes')[0];
      fireEvent.click(editNotesButton);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Add notes...');
        expect(textarea).toBeDefined();
      });

      // Enter new notes
      const textarea = screen.getByPlaceholderText('Add notes...') as HTMLTextAreaElement;
      fireEvent.input(textarea, { target: { value: 'New notes' } });

      // Save notes
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(historyService.updateNotes).toHaveBeenCalledWith('1', 'New notes');
      });
    });

    test('should edit tags', async () => {
      render(() => <History />);

      await waitFor(() => {
        const editTagsButtons = screen.getAllByText('Edit Tags');
        expect(editTagsButtons.length).toBeGreaterThan(0);
      });

      // Click edit tags
      const editTagsButton = screen.getAllByText('Edit Tags')[0];
      fireEvent.click(editTagsButton);

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Enter tags separated by commas');
        expect(input).toBeDefined();
      });

      // Enter new tags
      const input = screen.getByPlaceholderText('Enter tags separated by commas') as HTMLInputElement;
      fireEvent.input(input, { target: { value: 'new, tags, here' } });

      // Save tags
      const saveButton = screen.getAllByText('Save')[0];
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(historyService.updateTags).toHaveBeenCalledWith('1', ['new', 'tags', 'here']);
      });
    });

    test('should cancel editing notes', async () => {
      render(() => <History />);

      await waitFor(() => {
        const editNotesButton = screen.getAllByText('Edit Notes')[0];
        expect(editNotesButton).toBeDefined();
      });

      // Click edit notes
      const editNotesButton = screen.getAllByText('Edit Notes')[0];
      fireEvent.click(editNotesButton);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        expect(cancelButton).toBeDefined();
      });

      // Click cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        // Should not show textarea anymore
        const textarea = screen.queryByPlaceholderText('Add notes...');
        expect(textarea).toBeNull();
        expect(historyService.updateNotes).not.toHaveBeenCalled();
      });
    });
  });

  describe('Import Functionality', () => {
    test('should show import dialog', async () => {
      render(() => <History />);

      await waitFor(() => {
        const importButton = screen.getByText('Import');
        expect(importButton).toBeDefined();
      });

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText('Import History')).toBeDefined();
        expect(screen.getByText('Cancel')).toBeDefined();
      });
    });

    test('should import file with merge option', async () => {
      window.confirm = vi.fn().mockReturnValue(true); // Merge

      render(() => <History />);

      await waitFor(() => {
        const importButton = screen.getByText('Import');
        expect(importButton).toBeDefined();
      });

      // Open import dialog
      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeDefined();
      });

      // Select file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['{"test": "data"}'], 'history.json', { type: 'application/json' });
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      });
      fireEvent.change(fileInput);

      // Click import
      const importConfirmButton = screen.getAllByText('Import')[1];
      fireEvent.click(importConfirmButton);

      await waitFor(() => {
        expect(historyService.importHistory).toHaveBeenCalledWith('{"test": "data"}', true);
      });
    });
  });
});