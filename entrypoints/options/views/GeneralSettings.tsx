import { Component, createSignal, Show, For, createMemo } from 'solid-js';
import type { UserPreferences } from '~/types/preferences';
import { TEMPLATE_VARIABLES } from '~/types/preferences';
import { NamingPattern, Theme } from '~/types/storage';
import { useTheme } from '~/components/ThemeProvider';
import { validateTemplate, processTemplate } from '~/services/file-naming';

interface GeneralSettingsProps {
  preferences: UserPreferences;
  onUpdate: (updates: Partial<UserPreferences>) => void;
}

export const GeneralSettings: Component<GeneralSettingsProps> = (props) => {
  const [localPrefs, setLocalPrefs] = createSignal(props.preferences);
  const { setTheme } = useTheme();

  // Validate custom template
  const templateValidation = createMemo(() => {
    if (localPrefs().fileNamingPattern === NamingPattern.CUSTOM_PREFIX) {
      return validateTemplate(localPrefs().customNamingTemplate || '');
    }
    return { valid: true, errors: [], usedVariables: [] };
  });

  // Preview file name
  const fileNamePreview = createMemo(() => {
    if (localPrefs().fileNamingPattern === NamingPattern.CUSTOM_PREFIX && localPrefs().customNamingTemplate) {
      return processTemplate(localPrefs().customNamingTemplate, {
        title: 'Example Page Title',
        url: 'https://example.com/page',
        domain: 'example.com'
      });
    }
    return '';
  });

  const handleChange = (key: keyof UserPreferences, value: any) => {
    const updated = { ...localPrefs(), [key]: value };
    setLocalPrefs(updated);
    props.onUpdate({ [key]: value });

    // If theme was changed, update it immediately
    if (key === 'theme') {
      setTheme(value as Theme);
    }
  };

  return (
    <div class="space-y-6">
      <section>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Settings</h2>

        <div class="space-y-4">
          {/* Default Profile */}
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Conversion Profile
            </label>
            <select
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={localPrefs().defaultProfile}
              onChange={(e) => handleChange('defaultProfile', e.currentTarget.value)}
            >
              <option value="default">Default</option>
              {/* Additional profiles would be loaded here */}
            </select>
          </div>

          {/* Auto Download */}
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto-download markdown files
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Automatically download files after conversion
              </p>
            </div>
            <input
              type="checkbox"
              class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              checked={localPrefs().autoDownload}
              onChange={(e) => handleChange('autoDownload', e.currentTarget.checked)}
            />
          </div>

          {/* File Naming Pattern */}
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              File Naming Pattern
            </label>
            <select
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={localPrefs().fileNamingPattern}
              onChange={(e) => handleChange('fileNamingPattern', e.currentTarget.value)}
            >
              <option value={NamingPattern.TAB_TITLE}>Tab Title</option>
              <option value={NamingPattern.DOMAIN_TITLE}>Domain + Title</option>
              <option value={NamingPattern.TIMESTAMP}>Timestamp + Title</option>
              <option value={NamingPattern.CUSTOM_PREFIX}>Custom Pattern</option>
            </select>
          </div>

          {/* Custom Pattern Template */}
          <Show when={localPrefs().fileNamingPattern === NamingPattern.CUSTOM_PREFIX}>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Naming Template
              </label>
              <input
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={localPrefs().customNamingTemplate || ''}
                onChange={(e) => handleChange('customNamingTemplate', e.currentTarget.value)}
                placeholder="e.g., {title}_{date}"
              />
              <div class="mt-2">
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Available variables:</p>
                <div class="flex flex-wrap gap-1">
                  <For each={Object.entries(TEMPLATE_VARIABLES)}>
                    {([variable, description]) => (
                      <button
                        type="button"
                        class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        onClick={() => {
                          const current = localPrefs().customNamingTemplate || '';
                          handleChange('customNamingTemplate', current + variable);
                        }}
                        title={description}
                      >
                        {variable}
                      </button>
                    )}
                  </For>
                </div>

                {/* Validation feedback */}
                <Show when={!templateValidation().valid && templateValidation().errors.length > 0}>
                  <div class="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p class="text-xs text-red-600 dark:text-red-400 font-medium">Template issues:</p>
                    <ul class="text-xs text-red-500 dark:text-red-400 mt-1 list-disc list-inside">
                      <For each={templateValidation().errors}>
                        {(error) => <li>{error}</li>}
                      </For>
                    </ul>
                  </div>
                </Show>

                {/* File name preview */}
                <Show when={fileNamePreview() && templateValidation().valid}>
                  <div class="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                    <p class="text-xs text-green-600 dark:text-green-400 font-medium">Preview:</p>
                    <p class="text-xs text-green-700 dark:text-green-300 mt-1 font-mono">
                      {fileNamePreview()}.md
                    </p>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* Show Notifications */}
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show notifications
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Display success/error notifications
              </p>
            </div>
            <input
              type="checkbox"
              class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              checked={localPrefs().showNotifications}
              onChange={(e) => handleChange('showNotifications', e.currentTarget.checked)}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>

        <div class="space-y-4">
          {/* Theme */}
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Theme
            </label>
            <select
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={localPrefs().theme}
              onChange={(e) => handleChange('theme', e.currentTarget.value)}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Smart Content Detection</h2>

        <div class="space-y-4">
          {/* Enable Smart Detection */}
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable Smart Detection
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Automatically detect and extract main content from web pages
              </p>
            </div>
            <input
              type="checkbox"
              class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
              checked={localPrefs().smartDetection?.enabled || false}
              onChange={(e) => handleChange('smartDetection', {
                ...localPrefs().smartDetection,
                enabled: e.currentTarget.checked
              })}
            />
          </div>

          {/* Smart Detection Options */}
          <Show when={localPrefs().smartDetection?.enabled}>
            <div class="ml-6 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600 dark:text-gray-400">
                  Auto-detect main content
                </label>
                <input
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={localPrefs().smartDetection?.autoDetectMainContent ?? true}
                  onChange={(e) => handleChange('smartDetection', {
                    ...localPrefs().smartDetection,
                    autoDetectMainContent: e.currentTarget.checked
                  })}
                />
              </div>

              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600 dark:text-gray-400">
                  Remove navigation menus
                </label>
                <input
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={localPrefs().smartDetection?.removeNavigation ?? true}
                  onChange={(e) => handleChange('smartDetection', {
                    ...localPrefs().smartDetection,
                    removeNavigation: e.currentTarget.checked
                  })}
                />
              </div>

              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600 dark:text-gray-400">
                  Remove footers
                </label>
                <input
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={localPrefs().smartDetection?.removeFooter ?? true}
                  onChange={(e) => handleChange('smartDetection', {
                    ...localPrefs().smartDetection,
                    removeFooter: e.currentTarget.checked
                  })}
                />
              </div>

              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600 dark:text-gray-400">
                  Remove sidebars
                </label>
                <input
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={localPrefs().smartDetection?.removeSidebars ?? true}
                  onChange={(e) => handleChange('smartDetection', {
                    ...localPrefs().smartDetection,
                    removeSidebars: e.currentTarget.checked
                  })}
                />
              </div>

              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600 dark:text-gray-400">
                  Remove advertisements
                </label>
                <input
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={localPrefs().smartDetection?.removeAds ?? true}
                  onChange={(e) => handleChange('smartDetection', {
                    ...localPrefs().smartDetection,
                    removeAds: e.currentTarget.checked
                  })}
                />
              </div>

              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600 dark:text-gray-400">
                  Remove comment sections
                </label>
                <input
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={localPrefs().smartDetection?.removeComments ?? true}
                  onChange={(e) => handleChange('smartDetection', {
                    ...localPrefs().smartDetection,
                    removeComments: e.currentTarget.checked
                  })}
                />
              </div>

              <div class="flex items-center justify-between">
                <label class="text-sm text-gray-600 dark:text-gray-400">
                  Remove cookie banners
                </label>
                <input
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  checked={localPrefs().smartDetection?.removeCookieBanners ?? true}
                  onChange={(e) => handleChange('smartDetection', {
                    ...localPrefs().smartDetection,
                    removeCookieBanners: e.currentTarget.checked
                  })}
                />
              </div>

              <div>
                <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Minimum confidence threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  class="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={localPrefs().smartDetection?.minConfidenceThreshold || 50}
                  onChange={(e) => handleChange('smartDetection', {
                    ...localPrefs().smartDetection,
                    minConfidenceThreshold: parseInt(e.currentTarget.value) || 50
                  })}
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only use smart detection if confidence is above this threshold
                </p>
              </div>
            </div>
          </Show>

          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p class="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Smart detection uses DOM analysis and heuristic algorithms to identify the main content area of web pages.
              It works best on article pages, blog posts, and documentation sites.            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Keyboard Shortcuts</h2>

        <div class="space-y-4">
          <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Copy Current Page</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Copy the entire page as markdown to clipboard</p>
                </div>
                <div class="flex items-center gap-1">
                  <kbd class="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded">
                    Ctrl+Shift+M
                  </kbd>
                  <span class="text-xs text-gray-500 dark:text-gray-400">or</span>
                  <kbd class="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded">
                    ⌘+Shift+M
                  </kbd>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Download Current Page</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Download the entire page as a markdown file</p>
                </div>
                <div class="flex items-center gap-1">
                  <kbd class="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded">
                    Ctrl+Shift+L
                  </kbd>
                  <span class="text-xs text-gray-500 dark:text-gray-400">or</span>
                  <kbd class="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded">
                    ⌘+Shift+L
                  </kbd>
                </div>
              </div>

            </div>

            <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                <svg class="inline-block w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Keyboard shortcuts can be customized in your browser's extension settings (chrome://extensions/shortcuts)
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
