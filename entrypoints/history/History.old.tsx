/**
 * History and favorites management component
 */

import { Component, createSignal, createEffect, For, Show, onMount } from 'solid-js';
import { historyService, type HistoryEntry, type HistoryFilter, type HistoryStats } from '~/services/history';
import { storage } from '~/services/storage';
import type { ConversionProfile } from '~/types/storage';

export const History: Component = () => {
  const [history, setHistory] = createSignal<HistoryEntry[]>([]);
  const [profiles, setProfiles] = createSignal<ConversionProfile[]>([]);
  const [stats, setStats] = createSignal<HistoryStats | null>(null);
  const [filter, setFilter] = createSignal<HistoryFilter>({});
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedProfile, setSelectedProfile] = createSignal<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = createSignal(false);
  const [loading, setLoading] = createSignal(true);
  const [selectedEntry, setSelectedEntry] = createSignal<HistoryEntry | null>(null);

  onMount(async () => {
    await loadHistory();
    await loadProfiles();
    await loadStats();
    setLoading(false);
  });

  // Update filter when search/filter options change
  createEffect(() => {
    const newFilter: HistoryFilter = {};

    const term = searchTerm();
    if (term) {
      newFilter.searchTerm = term;
    }

    const profile = selectedProfile();
    if (profile) {
      newFilter.profileId = profile;
    }

    if (showFavoritesOnly()) {
      newFilter.onlyFavorites = true;
    }

    setFilter(newFilter);
    loadHistory();
  });

  const loadHistory = async () => {
    const entries = await historyService.getHistory(filter());
    setHistory(entries);
  };

  const loadProfiles = async () => {
    const profs = await storage.getProfiles();
    setProfiles(profs);
  };

  const loadStats = async () => {
    const s = await historyService.getStats();
    setStats(s);
  };

  const toggleFavorite = async (entry: HistoryEntry) => {
    const newStatus = await historyService.toggleFavorite(entry.id);
    entry.isFavorite = newStatus;
    setHistory([...history()]);
    await loadStats();
  };

  const deleteEntry = async (id: string) => {
    if (confirm('Delete this history entry?')) {
      await historyService.deleteEntry(id);
      await loadHistory();
      await loadStats();
    }
  };

  const clearHistory = async () => {
    if (confirm('Clear all history? (Favorites will be kept)')) {
      await historyService.clearHistory(true);
      await loadHistory();
      await loadStats();
    }
  };

  const exportHistory = async () => {
    const json = await historyService.exportHistory();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markdown-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div class="space-y-6">
      {/* Statistics */}
      <Show when={stats()}>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Statistics</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Total Conversions</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats()!.totalConversions}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Favorites</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats()!.favoriteCount}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats()!.successRate.toFixed(1)}%</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Avg Duration</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats()!.averageDuration.toFixed(0)}ms</p>
            </div>
          </div>

          <Show when={stats()!.topDomains.length > 0}>
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Domains</p>
              <div class="flex flex-wrap gap-2">
                <For each={stats()!.topDomains}>
                  {(domain) => (
                    <span class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      {domain.domain} ({domain.count})
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Filters */}
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              placeholder="Search by title or URL..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div class="min-w-[150px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Profile
            </label>
            <select
              value={selectedProfile()}
              onChange={(e) => setSelectedProfile(e.currentTarget.value)}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Profiles</option>
              <For each={profiles()}>
                {(profile) => (
                  <option value={profile.id}>{profile.name}</option>
                )}
              </For>
            </select>
          </div>

          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFavoritesOnly()}
              onChange={(e) => setShowFavoritesOnly(e.currentTarget.checked)}
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Favorites Only</span>
          </label>

          <div class="flex gap-2">
            <button
              onClick={exportHistory}
              class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Export
            </button>
            <button
              onClick={clearHistory}
              class="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>
      </div>

      {/* History List */}
      <div class="space-y-2">
        <Show when={loading()}>
          <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading history...
          </div>
        </Show>

        <Show when={!loading() && history().length === 0}>
          <div class="text-center py-8 text-gray-500 dark:text-gray-400">
            No history entries found
          </div>
        </Show>

        <Show when={!loading() && history().length > 0}>
          <For each={history()}>
            {(entry) => (
              <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium text-gray-900 dark:text-gray-100">
                        {entry.title}
                      </h4>
                      <Show when={entry.isFavorite}>
                        <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </Show>
                      <Show when={!entry.success}>
                        <span class="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                          Failed
                        </span>
                      </Show>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {getDomain(entry.url)} • {formatDate(entry.timestamp)} • {formatSize(entry.sizeBytes || 0)}
                    </p>
                    <div class="flex items-center gap-2 mt-2">
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        View Original
                      </a>
                      <span class="text-gray-300 dark:text-gray-600">•</span>
                      <button
                        onClick={() => toggleFavorite(entry)}
                        class="text-sm text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400"
                      >
                        {entry.isFavorite ? 'Unfavorite' : 'Favorite'}
                      </button>
                      <span class="text-gray-300 dark:text-gray-600">•</span>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                    <Show when={entry.tags && entry.tags.length > 0}>
                      <div class="flex flex-wrap gap-1 mt-2">
                        <For each={entry.tags}>
                          {(tag) => (
                            <span class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                              {tag}
                            </span>
                          )}
                        </For>
                      </div>
                    </Show>
                    <Show when={entry.notes}>
                      <p class="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                        {entry.notes}
                      </p>
                    </Show>
                  </div>
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
};