/**
 * History and favorites management service
 */

import type { ConversionRecord } from '~/types/storage';

export interface HistoryEntry extends ConversionRecord {
  isFavorite?: boolean;
  tags?: string[];
  notes?: string;
}

export interface HistoryFilter {
  searchTerm?: string;
  profileId?: string;
  startDate?: number;
  endDate?: number;
  onlyFavorites?: boolean;
  tags?: string[];
}

export interface HistoryStats {
  totalConversions: number;
  favoriteCount: number;
  successRate: number;
  averageDuration: number;
  mostUsedProfile: string | null;
  topDomains: Array<{ domain: string; count: number }>;
}

class HistoryService {
  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly HISTORY_KEY = 'conversion_history';
  private readonly FAVORITES_KEY = 'conversion_favorites';

  /**
   * Get all history entries
   */
  async getHistory(filter?: HistoryFilter): Promise<HistoryEntry[]> {
    const history = await this.loadHistory();


    if (!filter) {
      return history;
    }

    return history.filter((entry) => {
      // Search term filter
      if (filter.searchTerm) {
        const searchLower = filter.searchTerm.toLowerCase();
        if (
          !entry.title.toLowerCase().includes(searchLower) &&
          !entry.url.toLowerCase().includes(searchLower) &&
          !entry.notes?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Profile filter
      if (filter.profileId && entry.profileUsed !== filter.profileId) {
        return false;
      }

      // Date range filter
      if (filter.startDate && entry.timestamp < filter.startDate) {
        return false;
      }
      if (filter.endDate && entry.timestamp > filter.endDate) {
        return false;
      }

      // Favorites filter
      if (filter.onlyFavorites && !entry.isFavorite) {
        return false;
      }

      // Tags filter
      if (filter.tags && filter.tags.length > 0) {
        if (!entry.tags || !filter.tags.some((tag) => entry.tags?.includes(tag))) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Add a new history entry
   */
  async addEntry(entry: ConversionRecord): Promise<void> {
    try {
      const history = await this.loadHistory();

      // Create history entry - explicitly copy all fields to ensure markdown is preserved
      const historyEntry: HistoryEntry = {
        id: entry.id,
        url: entry.url,
        title: entry.title,
        timestamp: entry.timestamp,
        profileUsed: entry.profileUsed,
        sizeBytes: entry.sizeBytes,
        duration: entry.duration,
        success: entry.success,
        errorMessage: entry.errorMessage,
        markdown: entry.markdown, // Explicitly copy markdown field
        isFavorite: false,
        tags: [],
      };


      // Add to beginning of history
      history.unshift(historyEntry);

      // Trim history if too large
      if (history.length > this.MAX_HISTORY_SIZE) {
        history.splice(this.MAX_HISTORY_SIZE);
      }

      await this.saveHistory(history);
    } catch (error) {
      console.error('Failed to save history entry:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<boolean> {
    const history = await this.loadHistory();
    const entry = history.find((e) => e.id === id);

    if (!entry) {
      throw new Error('History entry not found');
    }

    entry.isFavorite = !entry.isFavorite;
    await this.saveHistory(history);

    return entry.isFavorite;
  }

  /**
   * Update entry notes
   */
  async updateNotes(id: string, notes: string): Promise<void> {
    const history = await this.loadHistory();
    const entry = history.find((e) => e.id === id);

    if (!entry) {
      throw new Error('History entry not found');
    }

    entry.notes = notes;
    await this.saveHistory(history);
  }

  /**
   * Update entry tags
   */
  async updateTags(id: string, tags: string[]): Promise<void> {
    const history = await this.loadHistory();
    const entry = history.find((e) => e.id === id);

    if (!entry) {
      throw new Error('History entry not found');
    }

    entry.tags = tags;
    await this.saveHistory(history);
  }

  /**
   * Delete a history entry
   */
  async deleteEntry(id: string): Promise<void> {
    const history = await this.loadHistory();
    const index = history.findIndex((e) => e.id === id);

    if (index === -1) {
      throw new Error('History entry not found');
    }

    history.splice(index, 1);
    await this.saveHistory(history);
  }

  /**
   * Clear all history
   */
  async clearHistory(keepFavorites = true): Promise<void> {
    if (keepFavorites) {
      const history = await this.loadHistory();
      const favorites = history.filter((e) => e.isFavorite);
      await this.saveHistory(favorites);
    } else {
      await this.saveHistory([]);
    }
  }

  /**
   * Get history statistics
   */
  async getStats(): Promise<HistoryStats> {
    const history = await this.loadHistory();

    if (history.length === 0) {
      return {
        totalConversions: 0,
        favoriteCount: 0,
        successRate: 0,
        averageDuration: 0,
        mostUsedProfile: null,
        topDomains: [],
      };
    }

    // Calculate stats
    const favoriteCount = history.filter((e) => e.isFavorite).length;
    const successCount = history.filter((e) => e.success).length;
    const successRate = (successCount / history.length) * 100;

    const totalDuration = history.reduce((sum, e) => sum + (e.duration || 0), 0);
    const averageDuration = totalDuration / history.length;

    // Find most used profile
    const profileCounts = new Map<string, number>();
    history.forEach((e) => {
      profileCounts.set(e.profileUsed, (profileCounts.get(e.profileUsed) || 0) + 1);
    });
    const mostUsedProfile =
      Array.from(profileCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Get top domains
    const domainCounts = new Map<string, number>();
    history.forEach((e) => {
      try {
        const domain = new URL(e.url).hostname;
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      } catch {
        // Invalid URL
      }
    });
    const topDomains = Array.from(domainCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([domain, count]) => ({ domain, count }));

    return {
      totalConversions: history.length,
      favoriteCount,
      successRate,
      averageDuration,
      mostUsedProfile,
      topDomains,
    };
  }

  /**
   * Get suggested tags based on history
   */
  async getSuggestedTags(): Promise<string[]> {
    const history = await this.loadHistory();
    const tagCounts = new Map<string, number>();

    history.forEach((entry) => {
      entry.tags?.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);
  }

  /**
   * Export history as JSON
   */
  async exportHistory(): Promise<string> {
    const history = await this.loadHistory();
    return JSON.stringify(history, null, 2);
  }

  /**
   * Import history from JSON
   */
  async importHistory(jsonData: string, merge = false): Promise<void> {
    const importedHistory = JSON.parse(jsonData) as HistoryEntry[];

    if (!Array.isArray(importedHistory)) {
      throw new Error('Invalid history data');
    }

    if (merge) {
      const currentHistory = await this.loadHistory();
      const mergedHistory = [...importedHistory, ...currentHistory];

      // Remove duplicates based on ID
      const uniqueHistory = Array.from(new Map(mergedHistory.map((e) => [e.id, e])).values());

      // Sort by timestamp
      uniqueHistory.sort((a, b) => b.timestamp - a.timestamp);

      // Trim to max size
      if (uniqueHistory.length > this.MAX_HISTORY_SIZE) {
        uniqueHistory.splice(this.MAX_HISTORY_SIZE);
      }

      await this.saveHistory(uniqueHistory);
    } else {
      await this.saveHistory(importedHistory);
    }
  }

  /**
   * Load history from storage
   */
  private async loadHistory(): Promise<HistoryEntry[]> {
    const result = await browser.storage.local.get(this.HISTORY_KEY);
    const entries = result[this.HISTORY_KEY] || [];


    return entries;
  }

  /**
   * Save history to storage
   */
  private async saveHistory(history: HistoryEntry[]): Promise<void> {
    await browser.storage.local.set({
      [this.HISTORY_KEY]: history,
    });
  }
}

// Export singleton instance
export const historyService = new HistoryService();
