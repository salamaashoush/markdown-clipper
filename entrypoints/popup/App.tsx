/**
 * Popup UI for Chrome Extension
 */

import { Component, createSignal, onMount, Show, For, createMemo } from 'solid-js';
import { TabList } from '~/components/TabList';
import { MessageFactory, MessageType } from '~/types/messages';
import type { TabInfo, ConversionProfile } from '~/types/index';
import { storage } from '~/services/storage';
import { profileMatcher } from '~/services/profile-matcher';
import type { PageContext } from '~/services/profile-matcher';
import { BatchExportService } from '~/services/batch-export';

const App: Component = () => {
  const [tabs, setTabs] = createSignal<TabInfo[]>([]);
  const [selectedTabs, setSelectedTabs] = createSignal<string[]>([]);
  const [activeProfile, setActiveProfile] = createSignal<ConversionProfile | null>(null);
  const [profiles, setProfiles] = createSignal<ConversionProfile[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  const [matchedProfile, setMatchedProfile] = createSignal<ConversionProfile | null>(null);
  const [matchReason, setMatchReason] = createSignal<string[]>([]);

  // Load tabs and profiles on mount
  onMount(async () => {
    await loadTabs();
    await loadProfiles();
    await autoSelectProfile();
  });

  const autoSelectProfile = async () => {
    try {
      // Get current tab info
      const currentTab = tabs().find(t => t.isActive);
      if (!currentTab) return;

      // Create page context
      const context: PageContext = {
        url: currentTab.url,
        title: currentTab.title,
        domain: new URL(currentTab.url).hostname,
      };

      // Find matching profile
      const allProfiles = profiles();
      const matched = profileMatcher.findMatchingProfile(allProfiles, context);

      if (matched) {
        setActiveProfile(matched);
        setMatchedProfile(matched);

        // Get match reasons if not default
        if (!matched.isDefault) {
          const reasons = profileMatcher.getMatchReason(matched, context);
          setMatchReason(reasons);

          // Show notification if profile was auto-selected
          if (reasons.length > 0) {
            const prefs = await storage.getPreferences();
            if (prefs.showNotifications) {
              setSuccess(`Auto-selected "${matched.name}" profile`);
              setTimeout(() => setSuccess(null), 3000);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to auto-select profile:', error);
    }
  };

  const loadTabs = async () => {
    try {
      const message = MessageFactory.create(
        MessageType.GET_ALL_TABS,
        {},
        { context: 'popup' }
      );

      const response = await browser.runtime.sendMessage(message);
      if (response.success && response.data?.tabs) {
        // Sort tabs to put active tab first
        const sortedTabs = [...response.data.tabs].sort((a: TabInfo, b: TabInfo) => {
          if (a.isActive) return -1;
          if (b.isActive) return 1;
          return 0;
        });
        setTabs(sortedTabs);
        // Auto-select active tab
        const activeTab = sortedTabs.find((t: TabInfo) => t.isActive);
        if (activeTab) {
          setSelectedTabs([activeTab.id]);
        }
      }
    } catch (err) {
      console.error('Failed to load tabs:', err);
      setError('Failed to load tabs');
    }
  };

  const loadProfiles = async () => {
    try {
      const message = MessageFactory.create(
        MessageType.GET_PROFILES,
        {},
        { context: 'popup' }
      );

      const response = await browser.runtime.sendMessage(message);
      if (response.success && response.data?.profiles) {
        setProfiles(response.data.profiles);
        const defaultProfile = response.data.profiles.find((p: ConversionProfile) => p.isDefault);
        if (defaultProfile) {
          setActiveProfile(defaultProfile);
        }
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

  const convertSelectedTabs = async (mode: 'copy' | 'download' | 'zip', batchMode: 'separate' | 'combined' = 'separate') => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const profile = activeProfile();
      if (!profile) {
        throw new Error('No profile selected');
      }

      const tabIds = selectedTabs();
      if (tabIds.length === 0) {
        throw new Error('No tabs selected');
      }

      const message = MessageFactory.create(
        MessageType.CONVERT_TABS,
        {
          tabIds,
          profileId: profile.id,
          mode: mode === 'zip' ? 'download' : mode,
          batchMode,
          includeMetadata: true,
          returnResults: mode === 'zip',
        },
        { context: 'popup' }
      );

      const response = await browser.runtime.sendMessage(message);
      if (response.success) {
        const { successCount, failureCount, results } = response.data;

        if (mode === 'zip' && results && results.length > 0) {
          const prefs = await storage.getPreferences();
          const batchExporter = new BatchExportService({
            organizeBy: 'domain',
            includeIndex: true,
            indexFormat: 'markdown'
          });

          results.forEach((result: any) => {
            batchExporter.addConversion(result, prefs);
          });

          const { zipBlob, fileCount } = await batchExporter.generateZip();

          const url = URL.createObjectURL(zipBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `markdown-export-${new Date().toISOString().slice(0, 10)}.zip`;
          a.click();
          URL.revokeObjectURL(url);

          setSuccess(`Exported ${fileCount} files to ZIP`);
        } else if (mode === 'copy') {
          if (batchMode === 'combined') {
            setSuccess(`Copied ${successCount} tabs as combined markdown`);
          } else {
            setSuccess(`Copied ${successCount} tab${successCount > 1 ? 's' : ''}`);
          }
        } else {
          if (batchMode === 'combined') {
            setSuccess(`Downloaded ${successCount} tabs as combined file`);
          } else {
            setSuccess(`Downloaded ${successCount} file${successCount > 1 ? 's' : ''}`);
          }
        }
      } else {
        throw new Error(response.error?.message || 'Batch conversion failed');
      }
    } catch (err) {
      console.error('Batch conversion error:', err);
      setError(err instanceof Error ? err.message : 'Batch conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const openOptions = () => {
    // Open our custom options page in a new tab
    browser.tabs.create({
      url: browser.runtime.getURL('/options.html')
    });
  };

  const hasSelectedTabs = createMemo(() => selectedTabs().length > 0);
  const selectedTabsCount = createMemo(() => selectedTabs().length);
  const multipleTabsSelected = createMemo(() => selectedTabs().length > 1);

  return (
    <div class="w-[400px] h-[500px] bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
        <div class="flex items-center justify-between">
          {/* Profile Dropdown - Left side */}
          <select
            class="px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            value={activeProfile()?.id || ''}
            onChange={(e) => {
              const profile = profiles().find(p => p.id === e.currentTarget.value);
              if (profile) {
                setActiveProfile(profile);
                if (profile.id !== matchedProfile()?.id) {
                  setMatchedProfile(null);
                  setMatchReason([]);
                }
              }
            }}
          >
            <For each={profiles()}>
              {(profile) => (
                <option value={profile.id}>{profile.name}</option>
              )}
            </For>
          </select>

          {/* Right side buttons */}
          <div class="flex items-center gap-1">
            <button
              onClick={() => {
                browser.tabs.create({
                  url: browser.runtime.getURL('/history.html')
                });
              }}
              class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              title="History"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={openOptions}
              class="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              title="Settings"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tab List - Scrollable */}
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <TabList
          tabs={tabs()}
          initialSelection={selectedTabs()}
          onSelectionChange={setSelectedTabs}
        />
      </div>

      {/* Status Messages */}
      <Show when={error() || success()}>
        <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <Show when={error()}>
            <div class="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="truncate">{error()}</span>
            </div>
          </Show>
          <Show when={success()}>
            <div class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="truncate">{success()}</span>
            </div>
          </Show>
        </div>
      </Show>

      {/* Action Buttons - Fixed at bottom */}
      <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
        <div class="flex items-center justify-center gap-2">
          {/* Copy */}
          <button
            class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 dark:disabled:hover:bg-gray-800"
            onClick={() => convertSelectedTabs('copy', 'separate')}
            disabled={loading() || !hasSelectedTabs()}
            title={!hasSelectedTabs() ? "Select tabs to copy" : selectedTabsCount() === 1 ? "Copy to clipboard" : "Copy tabs separately"}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Download */}
          <button
            class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 dark:disabled:hover:bg-gray-800"
            onClick={() => convertSelectedTabs('download', 'separate')}
            disabled={loading() || !hasSelectedTabs()}
            title={!hasSelectedTabs() ? "Select tabs to download" : selectedTabsCount() === 1 ? "Download as file" : "Download tabs as separate files"}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </button>

          {/* Combine & Copy */}
          <button
            class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 dark:disabled:hover:bg-gray-800"
            onClick={() => convertSelectedTabs('copy', 'combined')}
            disabled={loading() || !multipleTabsSelected()}
            title={!multipleTabsSelected() ? "Select multiple tabs to combine" : "Combine tabs and copy to clipboard"}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6M12 9v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Combine & Download */}
          <button
            class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-50 dark:disabled:hover:bg-gray-800"
            onClick={() => convertSelectedTabs('download', 'combined')}
            disabled={loading() || !multipleTabsSelected()}
            title={!multipleTabsSelected() ? "Select multiple tabs to combine" : "Combine tabs and download as single file"}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>

          {/* Download ZIP */}
          <button
            class="p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
            onClick={() => convertSelectedTabs('zip')}
            disabled={loading() || !multipleTabsSelected()}
            title={!multipleTabsSelected() ? "Select multiple tabs for ZIP" : "Download all tabs as ZIP archive"}
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      <Show when={loading()}>
        <div class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div class="flex flex-col items-center gap-2">
            <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm text-gray-600 dark:text-gray-400">Converting...</span>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default App;