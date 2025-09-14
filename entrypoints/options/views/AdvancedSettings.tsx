import { Component, createSignal, onMount, createEffect } from 'solid-js';
import type { UserPreferences } from '~/types/preferences';
import { storage } from '~/services/storage';

interface AdvancedSettingsProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export const AdvancedSettings: Component<AdvancedSettingsProps> = (props) => {
  const [localPrefs, setLocalPrefs] = createSignal(props.preferences);
  const [importStatus, setImportStatus] = createSignal<string>('');
  const [storageInfo, setStorageInfo] = createSignal<any>(null);

  // Update local preferences when props change
  createEffect(() => {
    setLocalPrefs(props.preferences);
  });

  // Load storage info on mount
  onMount(async () => {
    try {
      const info = await storage.getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to get storage info:', error);
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

  return (
    <div class="space-y-6">
      <section>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Data Management</h2>

        <div class="space-y-4">
          {/* Export Data */}
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Settings</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Download all your settings and profiles as a JSON file
            </p>
            <button
              onClick={handleExportData}
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Export Data
            </button>
          </div>

          {/* Import Data */}
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Import Settings</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Restore settings from a previously exported file
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 dark:file:bg-primary-900 file:text-primary-700 dark:file:text-primary-300 hover:file:bg-primary-100 dark:hover:file:bg-primary-800"
            />
          </div>

          {/* Clear Data */}
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Clear All Data</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Remove all settings, profiles, and conversion history
            </p>
            <button
              onClick={handleClearData}
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Clear All Data
            </button>
          </div>

          {/* Import/Export Status */}
          {importStatus() && (
            <div class={`p-3 rounded-lg ${
              importStatus().includes('successful')
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {importStatus()}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Storage Information</h2>

        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          {storageInfo() ? (
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-400">Sync Storage</span>
                  <span class="text-gray-900 dark:text-gray-100">
                    {formatBytes(storageInfo().sync.used)} / {formatBytes(storageInfo().sync.total)}
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${storageInfo().sync.percentage}%` }}
                  />
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatPercentage(storageInfo().sync.percentage)} used
                </p>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-400">Local Storage</span>
                  <span class="text-gray-900 dark:text-gray-100">
                    {formatBytes(storageInfo().local.used)} / {formatBytes(storageInfo().local.total)}
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${storageInfo().local.percentage}%` }}
                  />
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatPercentage(storageInfo().local.percentage)} used
                </p>
              </div>
            </div>
          ) : (
            <div class="text-sm text-gray-500 dark:text-gray-400">Loading storage info...</div>
          )}
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">About</h2>

        <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Version</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">1.0.0</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Author</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Salama Ashoush</span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">License</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">MIT</span>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <a
              href="https://github.com/salamaashoush/copy-as-markdown"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};