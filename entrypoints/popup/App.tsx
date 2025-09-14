/**
 * Popup UI for Chrome Extension
 */

import { Component, createSignal, onMount, Show, For } from 'solid-js';
import { Button } from '~/components/Button';
import { TabList } from '~/components/TabList';
import { MessageFactory, MessageType } from '~/types/messages';
import type { TabInfo, ConversionProfile } from '~/types/index';

const App: Component = () => {
  const [tabs, setTabs] = createSignal<TabInfo[]>([]);
  const [selectedTabs, setSelectedTabs] = createSignal<string[]>([]);
  const [activeProfile, setActiveProfile] = createSignal<ConversionProfile | null>(null);
  const [profiles, setProfiles] = createSignal<ConversionProfile[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  const [activeView, setActiveView] = createSignal<'current' | 'all'>('current');

  // Load tabs and profiles on mount
  onMount(async () => {
    await loadTabs();
    await loadProfiles();
  });

  const loadTabs = async () => {
    try {
      const message = MessageFactory.create(
        MessageType.GET_ALL_TABS,
        {},
        { context: 'popup' }
      );

      const response = await browser.runtime.sendMessage(message);
      if (response.success && response.data?.tabs) {
        setTabs(response.data.tabs);
        // Auto-select active tab
        const activeTab = response.data.tabs.find((t: TabInfo) => t.isActive);
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

  const convertCurrentPage = async (mode: 'copy' | 'download') => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const profile = activeProfile();
      if (!profile) {
        throw new Error('No profile selected');
      }

      const message = MessageFactory.create(
        MessageType.CONVERT_PAGE,
        {
          profileId: profile.id,
          mode,
          includeMetadata: true,
        },
        { context: 'popup' }
      );

      const response = await browser.runtime.sendMessage(message);
      if (response.success) {
        setSuccess(mode === 'copy' ? 'Copied to clipboard!' : 'Downloaded successfully!');
      } else {
        const errorMessage = response.error?.message || 'Conversion failed';
        // Show more user-friendly messages for common issues
        if (errorMessage.includes('Please navigate to a web page first')) {
          setError('Please open a web page to convert it to Markdown');
        } else if (errorMessage.includes('Cannot convert')) {
          setError(errorMessage);
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (err) {
      console.error('Conversion error:', err);
      const message = err instanceof Error ? err.message : 'Conversion failed';
      // Handle common error cases
      if (message.includes('Cannot convert') || message.includes('Please')) {
        setError(message);
      } else {
        setError(`Error: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const convertSelectedTabs = async (mode: 'copy' | 'download', batchMode: 'separate' | 'combined' = 'separate') => {
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
          mode,
          batchMode,
          includeMetadata: true,
        },
        { context: 'popup' }
      );

      const response = await browser.runtime.sendMessage(message);
      if (response.success) {
        const { successCount, failureCount } = response.data;
        setSuccess(`Converted ${successCount} tabs${failureCount > 0 ? ` (${failureCount} failed)` : ''}`);
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
      url: browser.runtime.getURL('options.html')
    });
  };

  return (
    <div class="w-96 p-4 bg-white dark:bg-gray-900">
      {/* Header */}
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Copy as Markdown</h1>
        <button
          onClick={openOptions}
          class="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Settings"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Profile Selector */}
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile</label>
        <select
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={activeProfile()?.id || ''}
          onChange={(e) => {
            const profile = profiles().find(p => p.id === e.currentTarget.value);
            if (profile) setActiveProfile(profile);
          }}
        >
          <For each={profiles()}>
            {(profile) => (
              <option value={profile.id}>{profile.name}</option>
            )}
          </For>
        </select>
      </div>

      {/* View Tabs */}
      <div class="flex mb-4 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <button
          class={`flex-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            activeView() === 'current'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveView('current')}
        >
          Current Tab
        </button>
        <button
          class={`flex-1 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
            activeView() === 'all'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          onClick={() => setActiveView('all')}
        >
          All Tabs
        </button>
      </div>

      {/* Content */}
      <Show when={activeView() === 'current'}>
        <div class="space-y-3">
          <Button
            variant="primary"
            fullWidth
            loading={loading()}
            onClick={() => convertCurrentPage('copy')}
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy as Markdown
          </Button>

          <Button
            variant="secondary"
            fullWidth
            loading={loading()}
            onClick={() => convertCurrentPage('download')}
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Download as Markdown
          </Button>
        </div>
      </Show>

      <Show when={activeView() === 'all'}>
        <div class="space-y-3">
          <TabList
            tabs={tabs()}
            onSelectionChange={setSelectedTabs}
          />

          <div class="flex space-x-2">
            <Button
              variant="primary"
              fullWidth
              loading={loading()}
              disabled={selectedTabs().length === 0}
              onClick={() => convertSelectedTabs('download', 'separate')}
            >
              Download Selected
            </Button>

            <Button
              variant="secondary"
              fullWidth
              loading={loading()}
              disabled={selectedTabs().length === 0}
              onClick={() => convertSelectedTabs('download', 'combined')}
            >
              Download Combined
            </Button>
          </div>
        </div>
      </Show>

      {/* Status Messages */}
      <Show when={error()}>
        <div class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-800 dark:text-red-300">{error()}</p>
        </div>
      </Show>

      <Show when={success()}>
        <div class="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p class="text-sm text-green-800 dark:text-green-300">{success()}</p>
        </div>
      </Show>
    </div>
  );
};

export default App;
