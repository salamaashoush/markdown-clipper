import { Component, createSignal, onMount, createEffect, Show, For, createMemo } from 'solid-js';
import type { UserPreferences } from '~/types/preferences';
import { storage } from '~/services/storage';
import { Button } from '~/components/Button';

interface AdvancedSettingsProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export const AdvancedSettings: Component<AdvancedSettingsProps> = (props) => {
  const [localPrefs, setLocalPrefs] = createSignal(props.preferences);
  const [activeSection, setActiveSection] = createSignal<string>('data');
  const [importStatus, setImportStatus] = createSignal<string>('');
  const [storageInfo, setStorageInfo] = createSignal<any>(null);

  // Update local preferences when props change
  createEffect(() => {
    setLocalPrefs(props.preferences);
  });

  // Load storage info on mount and when storage section is active
  const loadStorageInfo = async () => {
    try {
      const info = await storage.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  };

  onMount(loadStorageInfo);

  // Refresh storage info when storage section is viewed
  createEffect(() => {
    if (activeSection() === 'storage') {
      loadStorageInfo();
    }
  });

  const handleChange = async (key: keyof UserPreferences, value: any) => {
    const updated = { ...localPrefs(), [key]: value };
    setLocalPrefs(updated);
    props.onUpdate({ [key]: value });
  };

  const handleExportData = async () => {
    try {
      const data = await storage.exportData();
      const json = JSON.stringify(data, null, 2);

      // Create download link
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `copy-as-markdown-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setImportStatus('Export successful!');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      setImportStatus('Export failed');
    }
  };

  const handleImportData = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await storage.importData(data);
      setImportStatus('Import successful! Please refresh the page.');

      // Refresh storage info to reflect the changes
      setTimeout(loadStorageInfo, 500);
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus('Import failed. Please check the file format.');
    }
  };

  const handleClearData = async () => {
    if (!confirm('This will delete all your settings and profiles. Are you sure?')) {
      return;
    }

    try {
      await storage.clearRecentConversions();
      await storage.resetPreferences();
      setImportStatus('All data cleared. Please refresh the page.');

      // Refresh storage info to reflect the changes
      setTimeout(loadStorageInfo, 500);
    } catch (error) {
      console.error('Clear data failed:', error);
      setImportStatus('Failed to clear data');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const sections = createMemo(() => [
    { id: 'data', label: 'Data Management', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
    { id: 'storage', label: 'Storage Info', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
    { id: 'about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  ]);

  return (
    <div class="flex h-full bg-white dark:bg-gray-800">
      {/* Sidebar Navigation */}
      <div class="w-52 border-r border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
        <div class="space-y-1">
          <For each={sections()}>
            {(section) => (
              <button
                onClick={() => setActiveSection(section.id)}
                class={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeSection() === section.id
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={section.icon} />
                </svg>
                <span class="text-left">{section.label}</span>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Content Area */}
      <div class="flex-1 flex flex-col">
        {/* Header */}
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Advanced Settings</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your data and view extension information
          </p>
        </div>

        {/* Scrollable Content */}
        <div class="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {/* Data Management Section */}
          <Show when={activeSection() === 'data'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Export, import, or clear your extension data.</p>
                </div>
              </div>

              <div class="space-y-6">
                {/* Export Data */}
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Settings</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Download all your settings and profiles as a JSON file for backup or transfer
                  </p>
                  <Button
                    onClick={handleExportData}
                    variant="primary"
                    class="gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Data
                  </Button>
                </div>

                {/* Import Data */}
                <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Import Settings</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Restore settings from a previously exported backup file
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    class="block w-full text-sm text-gray-500 dark:text-gray-400
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-lg file:border-0
                           file:text-sm file:font-semibold
                           file:bg-primary-50 dark:file:bg-primary-900/30
                           file:text-primary-700 dark:file:text-primary-300
                           hover:file:bg-primary-100 dark:hover:file:bg-primary-800/30
                           file:transition-colors file:cursor-pointer"
                  />
                </div>

                {/* Clear Data */}
                <div class="bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800 p-4">
                  <h4 class="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                    Clear All Data
                  </h4>
                  <p class="text-xs text-red-700 dark:text-red-300 mb-4">
                    <strong>Warning:</strong> This will permanently remove all settings, profiles, and conversion history. This action cannot be undone.
                  </p>
                  <Button
                    onClick={handleClearData}
                    variant="danger"
                    class="gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Data
                  </Button>
                </div>

                {/* Import/Export Status */}
                <Show when={importStatus()}>
                  <div class={`p-4 rounded-lg flex items-start gap-3 ${
                    importStatus().includes('successful')
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                      : importStatus().includes('failed')
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  }`}>
                    <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d={importStatus().includes('successful')
                          ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          : importStatus().includes('failed')
                          ? "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        }
                      />
                    </svg>
                    <p class="text-sm">{importStatus()}</p>
                  </div>
                </Show>
              </div>
            </section>
          </Show>

          {/* Storage Information Section */}
          <Show when={activeSection() === 'storage'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Monitor your extension's storage usage across sync and local storage.</p>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100">Storage Usage</h4>
                  <Button
                    onClick={loadStorageInfo}
                    variant="ghost"
                    size="sm"
                    class="gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </Button>
                </div>

                <Show when={storageInfo()} fallback={
                  <div class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Loading storage information...
                  </div>
                }>
                  <div class="space-y-6">
                    {/* Sync Storage */}
                    <div>
                      <div class="flex justify-between items-center mb-2">
                        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Sync Storage</h4>
                        <span class="text-sm text-gray-900 dark:text-gray-100">
                          {formatBytes(storageInfo().sync.used)} / {formatBytes(storageInfo().sync.total)}
                        </span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          class="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${storageInfo().sync.percentage}%` }}
                        />
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatPercentage(storageInfo().sync.percentage)} used • Synced across all devices
                      </p>
                    </div>

                    {/* Local Storage */}
                    <div>
                      <div class="flex justify-between items-center mb-2">
                        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Local Storage</h4>
                        <span class="text-sm text-gray-900 dark:text-gray-100">
                          {formatBytes(storageInfo().local.used)} / {formatBytes(storageInfo().local.total)}
                        </span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          class="bg-primary-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${storageInfo().local.percentage}%` }}
                        />
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatPercentage(storageInfo().local.percentage)} used • This device only
                      </p>
                    </div>

                    {/* Storage Details */}
                    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h5 class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Storage Breakdown
                      </h5>
                      <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">Profiles</span>
                          <p class="font-medium text-gray-900 dark:text-gray-100">
                            {storageInfo().breakdown?.profiles || 0} items
                          </p>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">History</span>
                          <p class="font-medium text-gray-900 dark:text-gray-100">
                            {storageInfo().breakdown?.history || 0} items
                          </p>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">Preferences</span>
                          <p class="font-medium text-gray-900 dark:text-gray-100">
                            {formatBytes(storageInfo().breakdown?.preferencesSize || 0)}
                          </p>
                        </div>
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">Cache</span>
                          <p class="font-medium text-gray-900 dark:text-gray-100">
                            {formatBytes(storageInfo().breakdown?.cacheSize || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Show>
              </div>
            </section>
          </Show>

          {/* About Section */}
          <Show when={activeSection() === 'about'}>
            <section class="space-y-6 profile-section-enter">
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Information about the Copy as Markdown extension.</p>
                </div>
              </div>

              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                <div class="flex items-center gap-4 mb-6">
                  <div class="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <svg class="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Copy as Markdown</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Convert web pages to markdown format</p>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Version</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Author</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Salama Ashoush</span>
                  </div>
                  <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                    <span class="text-sm text-gray-600 dark:text-gray-400">License</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">MIT</span>
                  </div>
                  <div class="flex justify-between py-2">
                    <span class="text-sm text-gray-600 dark:text-gray-400">Build</span>
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Chrome Manifest V3</span>
                  </div>
                </div>

                <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                  <a
                    href="https://github.com/salamaashoush/copy-as-markdown"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 text-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <svg class="w-4 h-4 inline-block mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                  <a
                    href="https://github.com/salamaashoush/copy-as-markdown/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex-1 text-center px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800/30 transition-colors text-sm font-medium"
                  >
                    Report Issue
                  </a>
                </div>
              </div>

              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div class="flex gap-3">
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <p class="text-sm text-blue-700 dark:text-blue-300 font-medium">Tips & Updates</p>
                    <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Check the GitHub repository for the latest updates, feature requests, and documentation.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </Show>
        </div>
      </div>
    </div>
  );
};