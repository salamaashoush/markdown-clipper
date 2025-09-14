/**
 * Enhanced History and favorites management component
 */

import { Component, createSignal, createEffect, For, Show, onMount, batch } from 'solid-js';
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
  const [editingNotes, setEditingNotes] = createSignal<string | null>(null);
  const [editingTags, setEditingTags] = createSignal<string | null>(null);
  const [noteText, setNoteText] = createSignal('');
  const [tagText, setTagText] = createSignal('');
  const [importFile, setImportFile] = createSignal<File | null>(null);
  const [showImportDialog, setShowImportDialog] = createSignal(false);

  onMount(async () => {
    await loadData();
  });

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadHistory(),
      loadProfiles(),
      loadStats()
    ]);
    setLoading(false);
  };

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
    batch(() => {
      const updatedHistory = history().map(e =>
        e.id === entry.id ? { ...e, isFavorite: newStatus } : e
      );
      setHistory(updatedHistory);
    });
    await loadStats();
  };

  const deleteEntry = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      await historyService.deleteEntry(id);
      await loadHistory();
      await loadStats();
    }
  };

  const clearHistory = async () => {
    const keepFavorites = confirm('Keep favorites? Click OK to keep favorites, Cancel to delete everything.');
    if (confirm(`This will ${keepFavorites ? 'delete all entries except favorites' : 'delete ALL entries'}. Continue?`)) {
      await historyService.clearHistory(keepFavorites);
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

  const importHistory = async () => {
    const file = importFile();
    if (!file) return;

    try {
      const text = await file.text();
      const merge = confirm('Merge with existing history? Click OK to merge, Cancel to replace.');
      await historyService.importHistory(text, merge);
      await loadHistory();
      await loadStats();
      setShowImportDialog(false);
      setImportFile(null);
    } catch (error) {
      alert('Failed to import history: ' + (error as Error).message);
    }
  };

  const startEditingNotes = (entry: HistoryEntry) => {
    setEditingNotes(entry.id);
    setNoteText(entry.notes || '');
  };

  const saveNotes = async (id: string) => {
    await historyService.updateNotes(id, noteText());
    const updatedHistory = history().map(e =>
      e.id === id ? { ...e, notes: noteText() } : e
    );
    setHistory(updatedHistory);
    setEditingNotes(null);
    setNoteText('');
  };

  const startEditingTags = (entry: HistoryEntry) => {
    setEditingTags(entry.id);
    setTagText((entry.tags || []).join(', '));
  };

  const saveTags = async (id: string) => {
    const tags = tagText().split(',').map(t => t.trim()).filter(t => t);
    await historyService.updateTags(id, tags);
    const updatedHistory = history().map(e =>
      e.id === id ? { ...e, tags } : e
    );
    setHistory(updatedHistory);
    setEditingTags(null);
    setTagText('');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes === 0 ? 'Just now' : `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Unknown';
    }
  };

  const getProfileName = (profileId: string) => {
    const profile = profiles().find(p => p.id === profileId);
    return profile?.name || 'Unknown Profile';
  };

  return (
    <div class="space-y-6">
      {/* Statistics */}
      <Show when={stats()}>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Statistics</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="text-center">
              <p class="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats()!.totalConversions}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Conversions</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats()!.favoriteCount}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Favorites</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-green-600 dark:text-green-400">{stats()!.successRate.toFixed(0)}%</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Success Rate</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats()!.averageDuration.toFixed(0)}ms</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Duration</p>
            </div>
          </div>

          <Show when={stats()!.topDomains.length > 0}>
            <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Most Converted Domains</p>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
                <For each={stats()!.topDomains}>
                  {(domain) => (
                    <div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{domain.domain}</span>
                      <span class="ml-2 px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                        {domain.count}
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Filters and Actions */}
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[250px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div class="relative">
              <input
                type="text"
                value={searchTerm()}
                onInput={(e) => setSearchTerm(e.currentTarget.value)}
                placeholder="Search by title, URL, or notes..."
                class="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <svg class="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div class="min-w-[180px]">
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

          <label class="flex items-center space-x-2 cursor-pointer px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="checkbox"
              checked={showFavoritesOnly()}
              onChange={(e) => setShowFavoritesOnly(e.currentTarget.checked)}
              class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">
              <svg class="inline-block w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Favorites
            </span>
          </label>

          <div class="flex gap-2">
            <button
              onClick={exportHistory}
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Export
            </button>
            <button
              onClick={() => setShowImportDialog(true)}
              class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import
            </button>
            <button
              onClick={clearHistory}
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <Show when={showImportDialog()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Import History</h3>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.currentTarget.files?.[0] || null)}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg"
            />
            <div class="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                }}
                class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={importHistory}
                disabled={!importFile()}
                class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* History List */}
      <div class="space-y-3">
        <Show when={loading()}>
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </Show>

        <Show when={!loading() && history().length === 0}>
          <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="mt-4 text-gray-500 dark:text-gray-400">No history entries found</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Start converting pages to see them here</p>
          </div>
        </Show>

        <Show when={!loading() && history().length > 0}>
          <For each={history()}>
            {(entry) => (
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                <div class="p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                          {entry.title}
                        </h4>
                        <Show when={entry.isFavorite}>
                          <svg class="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </Show>
                        <Show when={!entry.success}>
                          <span class="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                            Failed
                          </span>
                        </Show>
                      </div>

                      <div class="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          {getDomain(entry.url)}
                        </span>
                        <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(entry.timestamp)}
                        </span>
                        <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {getProfileName(entry.profileUsed)}
                        </span>
                        <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                          </svg>
                          {formatSize(entry.sizeBytes || 0)}
                        </span>
                      </div>

                      {/* Tags */}
                      <Show when={editingTags() === entry.id}>
                        <div class="mt-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={tagText()}
                            onInput={(e) => setTagText(e.currentTarget.value)}
                            placeholder="Enter tags separated by commas"
                            class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onKeyPress={(e) => e.key === 'Enter' && saveTags(entry.id)}
                          />
                          <button
                            onClick={() => saveTags(entry.id)}
                            class="px-2 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTags(null)}
                            class="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </Show>
                      <Show when={editingTags() !== entry.id && (entry.tags?.length || 0) > 0}>
                        <div class="flex flex-wrap gap-1 mt-2">
                          <For each={entry.tags}>
                            {(tag) => (
                              <span class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                {tag}
                              </span>
                            )}
                          </For>
                        </div>
                      </Show>

                      {/* Notes */}
                      <Show when={editingNotes() === entry.id}>
                        <div class="mt-3">
                          <textarea
                            value={noteText()}
                            onInput={(e) => setNoteText(e.currentTarget.value)}
                            placeholder="Add notes..."
                            class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                            rows="2"
                          />
                          <div class="flex gap-2 mt-2">
                            <button
                              onClick={() => saveNotes(entry.id)}
                              class="px-2 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNotes(null)}
                              class="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </Show>
                      <Show when={editingNotes() !== entry.id && entry.notes}>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                          {entry.notes}
                        </p>
                      </Show>

                      {/* Actions */}
                      <div class="flex items-center gap-3 mt-3">
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View Original
                        </a>
                        <button
                          onClick={() => toggleFavorite(entry)}
                          class="text-sm text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 flex items-center gap-1"
                        >
                          <svg class="w-4 h-4" fill={entry.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.614-1.04 1.563-1.04 2.182 0l1.211 2.08a1 1 0 00.798.493l2.387.206c1.248.108 1.704.914.989 1.747l-1.355 1.58a1 1 0 00-.227.849l.245 2.378c.128 1.246-.718 1.834-1.823 1.268l-2.106-1.081a1 1 0 00-.912 0l-2.106 1.081c-1.105.566-1.951-.022-1.823-1.268l.245-2.378a1 1 0 00-.227-.849l-1.355-1.58c-.715-.833-.259-1.639.989-1.747l2.387-.206a1 1 0 00.798-.493l1.211-2.08z" />
                          </svg>
                          {entry.isFavorite ? 'Unfavorite' : 'Favorite'}
                        </button>
                        <button
                          onClick={() => startEditingNotes(entry)}
                          class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {entry.notes ? 'Edit Notes' : 'Add Notes'}
                        </button>
                        <button
                          onClick={() => startEditingTags(entry)}
                          class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {entry.tags?.length ? 'Edit Tags' : 'Add Tags'}
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
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